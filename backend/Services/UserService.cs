using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using spark.Dtos.Common;
using spark.Dtos.Users;
using spark.Infrastructure;
using spark.Models;

namespace spark.Services;

/// <summary>
/// Encapsulates user directory queries, profile updates, admin-only account management, and image access.
/// </summary>
public sealed class UserService
{
    private readonly SparkDb _db;
    private readonly ILogger<UserService> _logger;

    public UserService(SparkDb db, ILogger<UserService>? logger = null)
    {
        _db = db;
        _logger = logger ?? NullLogger<UserService>.Instance;
    }

    /// <summary>
    /// Returns the list of users visible to the current actor according to role-based access rules.
    /// </summary>
    /// <param name="actor">The authenticated user making the request.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>A filtered list of safe user DTOs for the caller.</returns>
    public async Task<IReadOnlyList<UserDto>> GetVisibleUsersAsync(CurrentSessionUser actor, CancellationToken cancellationToken)
    {
        var users = await _db.user
            .Include(user => user.department)
            .ToListAsync(cancellationToken);

        return UserAccessPolicy.ScopeVisibleUsers(actor, users)
            .Select(UserPresenter.ToDto)
            .ToList();
    }

    /// <summary>
    /// Returns a single user when the current actor has permission to view that profile.
    /// </summary>
    /// <param name="actor">The authenticated user making the request.</param>
    /// <param name="id">The identifier of the user to load.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The requested user as a safe DTO.</returns>
    public async Task<UserDto> GetUserAsync(CurrentSessionUser actor, int id, CancellationToken cancellationToken)
    {
        var user = await FindUserAsync(id, cancellationToken);

        if (!UserAccessPolicy.CanView(actor, user))
        {
            throw ApiException.Forbidden("You do not have access to this user.");
        }

        return UserPresenter.ToDto(user);
    }

    /// <summary>
    /// Returns the raw profile image bytes for a visible user.
    /// </summary>
    /// <param name="actor">The authenticated user making the request.</param>
    /// <param name="id">The identifier of the user whose image is requested.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The stored image bytes for the requested user.</returns>
    public async Task<byte[]> GetUserImageAsync(CurrentSessionUser actor, int id, CancellationToken cancellationToken)
    {
        var user = await _db.user.FirstOrDefaultAsync(candidate => candidate.id == id, cancellationToken)
            ?? throw ApiException.NotFound("User image not found.");

        if (!UserAccessPolicy.CanView(actor, user))
        {
            throw ApiException.Forbidden("You do not have access to this user image.");
        }

        return user.img is { Length: > 0 }
            ? user.img
            : throw ApiException.NotFound("User image not found.");
    }

    /// <summary>
    /// Creates a new user from multipart form data, including optional manager, department, and profile image data.
    /// </summary>
    /// <param name="actor">The authenticated user creating the account.</param>
    /// <param name="request">The incoming multipart form request.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The newly created user as a safe DTO.</returns>
    public async Task<UserDto> CreateUserAsync(CurrentSessionUser actor, HttpRequest request, CancellationToken cancellationToken)
    {
        if (!actor.is_admin)
        {
            throw ApiException.Forbidden("Only admins can create users.");
        }

        if (!request.HasFormContentType)
        {
            throw ApiException.BadRequest("User creation requires multipart form data.");
        }

        var form = await request.ReadFormAsync(cancellationToken);
        var username = UserInputParser.ReadString(form, "username");
        var password = UserInputParser.ReadString(form, "password");
        var role = SparkRoles.Normalize(UserInputParser.ReadString(form, "role"));

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            throw ApiException.BadRequest("Username and password are required.");
        }

        if (await _db.user.AnyAsync(candidate => candidate.username == username, cancellationToken))
        {
            throw ApiException.Conflict("Username is already in use.");
        }

        var departmentId = UserInputParser.ReadInt(form, "department_id");
        if (departmentId.HasValue && !await _db.department.AnyAsync(department => department.id == departmentId, cancellationToken))
        {
            throw ApiException.BadRequest("Invalid department.");
        }

        var managerId = UserInputParser.ReadInt(form, "manager_id");
        if (managerId.HasValue && !await _db.user.AnyAsync(candidate => candidate.id == managerId, cancellationToken))
        {
            throw ApiException.BadRequest("Invalid manager.");
        }

        var user = new User
        {
            firstname = UserInputParser.ReadString(form, "firstname"),
            lastname = UserInputParser.ReadString(form, "lastname"),
            email = UserInputParser.ReadString(form, "email"),
            username = username,
            password = BCrypt.Net.BCrypt.HashPassword(password),
            company_role = UserInputParser.ReadString(form, "company_role"),
            role = role,
            auth_version = 1,
            is_admin = role == SparkRoles.Admin,
            hired_date = UserInputParser.ReadDate(form, "hired_date"),
            manager_id = managerId,
            department_id = departmentId,
            img = await UserInputParser.ReadImageAsync(form.Files["image"], cancellationToken),
        };

        _db.user.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        user = await FindUserAsync(user.id ?? 0, cancellationToken);
        return UserPresenter.ToDto(user);
    }

    /// <summary>
    /// Updates an existing user from either multipart form data or a JSON payload, depending on the caller flow.
    /// </summary>
    /// <param name="actor">The authenticated user applying the update.</param>
    /// <param name="id">The identifier of the user being updated.</param>
    /// <param name="request">The HTTP request containing form or JSON data.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The updated user as a safe DTO.</returns>
    public async Task<UserDto> UpdateUserAsync(CurrentSessionUser actor, int id, HttpRequest request, CancellationToken cancellationToken)
    {
        var user = await FindUserAsync(id, cancellationToken);

        if (!UserAccessPolicy.CanManage(actor, user))
        {
            throw ApiException.Forbidden("You do not have permission to update this user.");
        }

        if (request.HasFormContentType)
        {
            var form = await request.ReadFormAsync(cancellationToken);
            await ApplyFormUpdateAsync(actor, user, id, form, cancellationToken);
        }
        else
        {
            var payload = await request.ReadFromJsonAsync<UpdateUserRequestDto>(cancellationToken)
                ?? throw ApiException.BadRequest("Invalid update payload.");

            await ApplyJsonUpdateAsync(actor, user, id, payload, cancellationToken);
        }

        await _db.SaveChangesAsync(cancellationToken);

        user = await FindUserAsync(id, cancellationToken);
        return UserPresenter.ToDto(user);
    }

    /// <summary>
    /// Deletes a user account after enforcing admin-only access and report reassignment rules.
    /// </summary>
    /// <param name="actor">The authenticated user attempting the delete.</param>
    /// <param name="id">The identifier of the user to remove.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>A generic API message describing the result.</returns>
    public async Task<ApiMessageDto> DeleteUserAsync(CurrentSessionUser actor, int id, CancellationToken cancellationToken)
    {
        if (!actor.is_admin)
        {
            throw ApiException.Forbidden("Only admins can delete users.");
        }

        if (actor.id == id)
        {
            throw ApiException.BadRequest("You cannot delete your own account.");
        }

        var user = await _db.user.FirstOrDefaultAsync(candidate => candidate.id == id, cancellationToken)
            ?? throw ApiException.NotFound("User not found.");

        var hasReports = await _db.user.AnyAsync(candidate => candidate.manager_id == id, cancellationToken);
        if (hasReports)
        {
            throw ApiException.BadRequest("Reassign direct reports before deleting this user.");
        }

        try
        {
            _db.user.Remove(user);
            await _db.SaveChangesAsync(cancellationToken);
            return new ApiMessageDto("User deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unable to delete user {UserId}.", id);
            throw ApiException.Internal("Unable to delete this user.");
        }
    }

    private async Task<User> FindUserAsync(int id, CancellationToken cancellationToken)
    {
        return await _db.user
            .Include(candidate => candidate.department)
            .FirstOrDefaultAsync(candidate => candidate.id == id, cancellationToken)
            ?? throw ApiException.NotFound("User not found.");
    }

    private async Task ApplyFormUpdateAsync(
        CurrentSessionUser actor,
        User user,
        int id,
        IFormCollection form,
        CancellationToken cancellationToken)
    {
        var username = UserInputParser.ReadString(form, "username");
        var password = UserInputParser.ReadString(form, "password");
        var role = UserInputParser.ReadString(form, "role");

        if (!string.IsNullOrWhiteSpace(username) && actor.is_admin && !string.Equals(username, user.username, StringComparison.OrdinalIgnoreCase))
        {
            var usernameTaken = await _db.user.AnyAsync(candidate => candidate.username == username && candidate.id != id, cancellationToken);
            if (usernameTaken)
            {
                throw ApiException.Conflict("Username is already in use.");
            }

            user.username = username;
        }

        user.firstname = UserInputParser.ReadString(form, "firstname") ?? user.firstname;
        user.lastname = UserInputParser.ReadString(form, "lastname") ?? user.lastname;
        user.email = UserInputParser.ReadString(form, "email") ?? user.email;
        user.company_role = UserInputParser.ReadString(form, "company_role") ?? user.company_role;
        user.hired_date = UserInputParser.ReadDate(form, "hired_date") ?? user.hired_date;

        var departmentId = UserInputParser.ReadInt(form, "department_id");
        if (departmentId.HasValue)
        {
            var departmentExists = await _db.department.AnyAsync(department => department.id == departmentId, cancellationToken);
            if (!departmentExists)
            {
                throw ApiException.BadRequest("Invalid department.");
            }

            user.department_id = departmentId;
        }

        if (actor.is_admin)
        {
            var changedSensitiveFields = await ApplyAdminOnlyUpdatesAsync(
                user,
                id,
                role,
                password,
                UserInputParser.ReadInt(form, "manager_id"),
                form.Files["image"],
                cancellationToken);

            if (changedSensitiveFields)
            {
                UserSecurityVersion.Bump(user);
            }
        }
    }

    private async Task ApplyJsonUpdateAsync(
        CurrentSessionUser actor,
        User user,
        int id,
        UpdateUserRequestDto payload,
        CancellationToken cancellationToken)
    {
        user.firstname = payload.firstname ?? user.firstname;
        user.lastname = payload.lastname ?? user.lastname;
        user.email = payload.email ?? user.email;
        user.company_role = payload.company_role ?? user.company_role;
        user.hired_date = payload.hired_date ?? user.hired_date;

        if (payload.department_id.HasValue)
        {
            var departmentExists = await _db.department.AnyAsync(department => department.id == payload.department_id, cancellationToken);
            if (!departmentExists)
            {
                throw ApiException.BadRequest("Invalid department.");
            }

            user.department_id = payload.department_id;
        }

        if (actor.is_admin)
        {
            var changedSensitiveFields = await ApplyAdminOnlyUpdatesAsync(
                user,
                id,
                payload.role,
                payload.password,
                payload.manager_id,
                null,
                cancellationToken);

            if (changedSensitiveFields)
            {
                UserSecurityVersion.Bump(user);
            }
        }
    }

    private async Task<bool> ApplyAdminOnlyUpdatesAsync(
        User user,
        int id,
        string? role,
        string? password,
        int? managerId,
        IFormFile? imageFile,
        CancellationToken cancellationToken)
    {
        var changedSensitiveFields = false;

        if (!string.IsNullOrWhiteSpace(role))
        {
            var normalizedRole = SparkRoles.Normalize(role);
            if (normalizedRole == SparkRoles.Employee)
            {
                var hasReports = await _db.user.AnyAsync(candidate => candidate.manager_id == id, cancellationToken);
                if (hasReports)
                {
                    throw ApiException.BadRequest("Reassign direct reports before changing this user to employee.");
                }
            }

            if (!string.Equals(user.role, normalizedRole, StringComparison.Ordinal))
            {
                user.role = normalizedRole;
                user.is_admin = normalizedRole == SparkRoles.Admin;
                changedSensitiveFields = true;
            }
        }

        if (managerId.HasValue)
        {
            var managerExists = await _db.user.AnyAsync(candidate => candidate.id == managerId, cancellationToken);
            if (!managerExists)
            {
                throw ApiException.BadRequest("Invalid manager.");
            }

            user.manager_id = managerId;
        }

        if (!string.IsNullOrWhiteSpace(password))
        {
            user.password = BCrypt.Net.BCrypt.HashPassword(password);
            changedSensitiveFields = true;
        }

        var imageBytes = await UserInputParser.ReadImageAsync(imageFile, cancellationToken);
        if (imageBytes is not null)
        {
            user.img = imageBytes;
        }

        return changedSensitiveFields;
    }
}
