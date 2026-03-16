using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using spark.Dtos.Auth;
using spark.Dtos.Departments;
using spark.Dtos.Users;
using spark.Models;

namespace spark.Infrastructure;

/// <summary>
/// Defines the supported application roles and normalization helpers used across the auth layer.
/// </summary>
public static class SparkRoles
{
    public const string Admin = "admin";
    public const string Manager = "manager";
    public const string Employee = "employee";

    /// <summary>
    /// Normalizes arbitrary role input into one of the supported application role values.
    /// </summary>
    /// <param name="role">The incoming role value from storage or client input.</param>
    /// <returns>A normalized role string that always falls back to <c>employee</c>.</returns>
    public static string Normalize(string? role)
    {
        return role?.Trim().ToLowerInvariant() switch
        {
            Admin => Admin,
            Manager => Manager,
            Employee => Employee,
            _ => Employee,
        };
    }

    /// <summary>
    /// Returns whether the supplied role already matches one of the normalized application roles.
    /// </summary>
    /// <param name="role">The incoming role value to validate.</param>
    /// <returns><see langword="true"/> when the role is already normalized and supported.</returns>
    public static bool IsValid(string? role)
    {
        var normalized = Normalize(role);
        return normalized == role?.Trim().ToLowerInvariant();
    }
}

/// <summary>
/// Stores custom claim names used by the Spark cookie-auth session.
/// </summary>
public static class SparkClaimTypes
{
    public const string AuthVersion = "spark:auth_version";
}

/// <summary>
/// Represents the authenticated user information projected from the session cookie.
/// </summary>
public sealed record CurrentSessionUser(int id, string username, string role)
{
    public bool is_admin => role == SparkRoles.Admin;
    public bool is_manager => role == SparkRoles.Manager;
    public bool is_employee => role == SparkRoles.Employee;
}

/// <summary>
/// Provides helpers for converting the current HTTP principal into the application's session model.
/// </summary>
public static class SparkSecurityExtensions
{
    /// <summary>
    /// Converts the authenticated claims principal into a <see cref="CurrentSessionUser"/> when possible.
    /// </summary>
    /// <param name="principal">The claims principal attached to the current request.</param>
    /// <returns>The current session user, or <see langword="null"/> when the principal is anonymous or incomplete.</returns>
    public static CurrentSessionUser? ToCurrentSessionUser(this ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var rawId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var username = principal.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        var role = SparkRoles.Normalize(principal.FindFirstValue(ClaimTypes.Role));

        return int.TryParse(rawId, out var id)
            ? new CurrentSessionUser(id, username, role)
            : null;
    }

    /// <summary>
    /// Reads the session security version claim from the current principal.
    /// </summary>
    /// <param name="principal">The claims principal attached to the current request.</param>
    /// <returns>The parsed auth version when present; otherwise <see langword="null"/>.</returns>
    public static int? ReadAuthVersion(this ClaimsPrincipal principal)
    {
        var rawValue = principal.FindFirstValue(SparkClaimTypes.AuthVersion);
        return int.TryParse(rawValue, out var authVersion) ? authVersion : null;
    }

    /// <summary>
    /// Returns the current authenticated session user or throws a standardized unauthorized API exception.
    /// </summary>
    /// <param name="httpContext">The HTTP context for the active request.</param>
    /// <returns>The authenticated session user.</returns>
    public static CurrentSessionUser RequireCurrentSessionUser(this HttpContext httpContext)
    {
        return httpContext.User.ToCurrentSessionUser()
            ?? throw ApiException.Unauthorized("Authentication is required.");
    }
}

/// <summary>
/// Resolves the effective application role for a user, including legacy data backfill behavior.
/// </summary>
public static class UserRoleResolver
{
    /// <summary>
    /// Resolves a user's effective role from the currently loaded entity state.
    /// </summary>
    /// <param name="user">The user entity to inspect.</param>
    /// <returns>The effective normalized role.</returns>
    public static string Resolve(User user)
    {
        if (!string.IsNullOrWhiteSpace(user.role))
        {
            return SparkRoles.Normalize(user.role);
        }

        return user.is_admin ? SparkRoles.Admin : SparkRoles.Employee;
    }

    /// <summary>
    /// Resolves a user's effective role, querying direct reports when the persisted role is missing.
    /// </summary>
    /// <param name="user">The user entity to inspect.</param>
    /// <param name="db">The database context used for legacy manager inference.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The effective normalized role.</returns>
    public static async Task<string> ResolveAsync(User user, SparkDb db, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(user.role))
        {
            return SparkRoles.Normalize(user.role);
        }

        if (user.is_admin)
        {
            return SparkRoles.Admin;
        }

        var hasReports = user.id.HasValue
            && await db.user.AnyAsync(candidate => candidate.manager_id == user.id, cancellationToken);

        return hasReports ? SparkRoles.Manager : SparkRoles.Employee;
    }
}

/// <summary>
/// Manages the monotonic version used to invalidate stale cookie sessions after sensitive account changes.
/// </summary>
public static class UserSecurityVersion
{
    /// <summary>
    /// Normalizes stored auth version values so legacy or invalid data maps to version one.
    /// </summary>
    /// <param name="authVersion">The stored auth version value.</param>
    /// <returns>A valid positive auth version.</returns>
    public static int Normalize(int authVersion) => authVersion > 0 ? authVersion : 1;

    /// <summary>
    /// Increments the stored auth version for a user after a sensitive change such as role or password updates.
    /// </summary>
    /// <param name="user">The user whose session version should be advanced.</param>
    public static void Bump(User user)
    {
        user.auth_version = Normalize(user.auth_version) + 1;
    }
}

/// <summary>
/// Centralizes safe DTO projection for user and session payloads returned to the frontend.
/// </summary>
public static class UserPresenter
{
    /// <summary>
    /// Converts a user entity into the DTO shape exposed to the frontend.
    /// </summary>
    /// <param name="user">The user entity to project.</param>
    /// <returns>A user DTO that omits sensitive fields such as password hashes.</returns>
    public static UserDto ToDto(User user)
    {
        return new UserDto(
            user.id,
            user.username,
            user.firstname,
            user.lastname,
            user.email,
            user.company_role,
            UserRoleResolver.Resolve(user),
            user.hired_date,
            user.manager_id,
            user.department_id,
            user.department is null ? null : new DepartmentDto(user.department.id, user.department.name),
            user.img is { Length: > 0 }
        );
    }

    /// <summary>
    /// Converts a user entity into the session payload returned to the SPA auth context.
    /// </summary>
    /// <param name="user">The authenticated user entity.</param>
    /// <returns>The session response sent back to the client.</returns>
    public static SessionResponseDto ToSession(User user)
    {
        return new SessionResponseDto(true, ToDto(user));
    }
}

/// <summary>
/// Encodes role-based visibility and management rules for user- and metrics-related features.
/// </summary>
public static class UserAccessPolicy
{
    /// <summary>
    /// Returns whether the actor is allowed to view the supplied target user.
    /// </summary>
    /// <param name="actor">The authenticated actor making the request.</param>
    /// <param name="target">The target user entity.</param>
    /// <returns><see langword="true"/> when the actor can view the target.</returns>
    public static bool CanView(CurrentSessionUser actor, User target)
    {
        var targetId = target.id ?? 0;

        if (actor.is_admin)
        {
            return true;
        }

        if (actor.id == targetId)
        {
            return true;
        }

        return actor.is_manager && target.manager_id == actor.id;
    }

    /// <summary>
    /// Returns whether the actor is allowed to manage the supplied target user.
    /// </summary>
    /// <param name="actor">The authenticated actor making the request.</param>
    /// <param name="target">The target user entity.</param>
    /// <returns><see langword="true"/> when the actor can manage the target.</returns>
    public static bool CanManage(CurrentSessionUser actor, User target)
    {
        if (actor.is_admin)
        {
            return true;
        }

        var targetRole = UserRoleResolver.Resolve(target);
        return actor.is_manager
            && target.manager_id == actor.id
            && targetRole != SparkRoles.Admin;
    }

    /// <summary>
    /// Filters and orders users according to the directory visibility rules for the current actor.
    /// </summary>
    /// <param name="actor">The authenticated actor making the request.</param>
    /// <param name="users">The candidate users to filter.</param>
    /// <returns>The users that are visible to the caller.</returns>
    public static IReadOnlyList<User> ScopeVisibleUsers(CurrentSessionUser actor, IEnumerable<User> users)
    {
        return actor.role switch
        {
            SparkRoles.Admin => users.OrderBy(user => user.lastname).ThenBy(user => user.firstname).ToList(),
            SparkRoles.Manager => users
                .Where(user => user.manager_id == actor.id || user.id == actor.id)
                .OrderBy(user => user.lastname)
                .ThenBy(user => user.firstname)
                .ToList(),
            _ => users.Where(user => user.id == actor.id).ToList(),
        };
    }

    /// <summary>
    /// Filters and orders the users that contribute to manager-facing metrics for the current actor.
    /// </summary>
    /// <param name="actor">The authenticated actor making the request.</param>
    /// <param name="users">The candidate users to filter.</param>
    /// <returns>The users that belong to the caller's management scope.</returns>
    public static IReadOnlyList<User> ScopeManagedUsers(CurrentSessionUser actor, IEnumerable<User> users)
    {
        return actor.role switch
        {
            SparkRoles.Admin => users
                .Where(user => user.id != actor.id && UserRoleResolver.Resolve(user) != SparkRoles.Admin)
                .OrderBy(user => user.lastname)
                .ThenBy(user => user.firstname)
                .ToList(),
            SparkRoles.Manager => users
                .Where(user => user.manager_id == actor.id)
                .OrderBy(user => user.lastname)
                .ThenBy(user => user.firstname)
                .ToList(),
            _ => [],
        };
    }
}

/// <summary>
/// Parses multipart user form input and validates uploaded profile images before persistence.
/// </summary>
public static class UserInputParser
{
    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    private static readonly HashSet<string> AllowedDecodedFormats = new(StringComparer.OrdinalIgnoreCase)
    {
        "JPEG",
        "PNG",
        "WEBP",
    };

    /// <summary>
    /// Reads a trimmed string value from a multipart form field.
    /// </summary>
    /// <param name="form">The submitted form collection.</param>
    /// <param name="key">The field name to read.</param>
    /// <returns>The trimmed value, or <see langword="null"/> when the field is missing.</returns>
    public static string? ReadString(IFormCollection form, string key)
    {
        return form.TryGetValue(key, out var value) ? value.ToString().Trim() : null;
    }

    /// <summary>
    /// Reads an integer value from a multipart form field.
    /// </summary>
    /// <param name="form">The submitted form collection.</param>
    /// <param name="key">The field name to read.</param>
    /// <returns>The parsed integer value, or <see langword="null"/> when parsing fails.</returns>
    public static int? ReadInt(IFormCollection form, string key)
    {
        return int.TryParse(ReadString(form, key), out var value) ? value : null;
    }

    /// <summary>
    /// Reads a date value from a multipart form field.
    /// </summary>
    /// <param name="form">The submitted form collection.</param>
    /// <param name="key">The field name to read.</param>
    /// <returns>The parsed date, or <see langword="null"/> when parsing fails.</returns>
    public static DateTime? ReadDate(IFormCollection form, string key)
    {
        return DateTime.TryParse(ReadString(form, key), out var value) ? value : null;
    }

    /// <summary>
    /// Validates and reads an uploaded profile image, enforcing size, type, and decoded image constraints.
    /// </summary>
    /// <param name="file">The uploaded file to validate.</param>
    /// <param name="cancellationToken">A token used to cancel the file read.</param>
    /// <returns>The validated image bytes, or <see langword="null"/> when no file was supplied.</returns>
    public static async Task<byte[]?> ReadImageAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return null;
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            throw ApiException.BadRequest("Profile images must be 5 MB or smaller.");
        }

        if (!AllowedImageContentTypes.Contains(file.ContentType))
        {
            throw ApiException.BadRequest("Only JPEG, PNG, and WebP images are supported.");
        }

        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        var imageBytes = stream.ToArray();

        try
        {
            await using var validationStream = new MemoryStream(imageBytes);
            var imageInfo = await Image.IdentifyAsync(validationStream, cancellationToken)
                ?? throw ApiException.BadRequest("The uploaded file is not a valid image.");
            var decodedFormat = imageInfo.Metadata.DecodedImageFormat?.Name;

            if (string.IsNullOrWhiteSpace(decodedFormat) || !AllowedDecodedFormats.Contains(decodedFormat))
            {
                throw ApiException.BadRequest("Only JPEG, PNG, and WebP images are supported.");
            }

            if (imageInfo.Width > 4096 || imageInfo.Height > 4096)
            {
                throw ApiException.BadRequest("Profile images must be 4096x4096 or smaller.");
            }
        }
        catch (UnknownImageFormatException)
        {
            throw ApiException.BadRequest("The uploaded file is not a valid image.");
        }
        catch (InvalidImageContentException)
        {
            throw ApiException.BadRequest("The uploaded file is not a valid image.");
        }

        return imageBytes;
    }
}
