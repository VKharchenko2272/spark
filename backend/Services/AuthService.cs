using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using spark.Dtos.Auth;
using spark.Infrastructure;
using spark.Models;

namespace spark.Services;

/// <summary>
/// Handles credential validation and session user lookups for the cookie-auth workflow.
/// </summary>
public sealed class AuthService
{
    private readonly SparkDb _db;
    private readonly ILogger<AuthService> _logger;

    public AuthService(SparkDb db, ILogger<AuthService>? logger = null)
    {
        _db = db;
        _logger = logger ?? NullLogger<AuthService>.Instance;
    }

    /// <summary>
    /// Validates the supplied credentials and returns the fully loaded user that should back the session.
    /// </summary>
    /// <param name="request">The login request payload sent by the client.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The authenticated user with a normalized role and security version.</returns>
    public async Task<User> AuthenticateAsync(LoginRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.username) || string.IsNullOrWhiteSpace(request.password))
        {
            throw ApiException.BadRequest("Username and password are required.");
        }

        var user = await _db.user
            .Include(candidate => candidate.department)
            .FirstOrDefaultAsync(candidate => candidate.username == request.username, cancellationToken);

        if (user is null)
        {
            throw ApiException.Unauthorized("Invalid username or password.");
        }

        try
        {
            if (!BCrypt.Net.BCrypt.Verify(request.password, user.password ?? string.Empty))
            {
                throw ApiException.Unauthorized("Invalid username or password.");
            }
        }
        catch (SaltParseException)
        {
            _logger.LogWarning("User {Username} has an invalid stored password hash.", request.username);
            throw ApiException.Unauthorized("Invalid username or password.");
        }

        user.role = await UserRoleResolver.ResolveAsync(user, _db, cancellationToken);
        user.is_admin = user.role == SparkRoles.Admin;
        user.auth_version = UserSecurityVersion.Normalize(user.auth_version);
        await _db.SaveChangesAsync(cancellationToken);

        return user;
    }

    /// <summary>
    /// Reloads the current session user from the database so the client sees the latest profile data.
    /// </summary>
    /// <param name="actor">The authenticated session principal resolved from the auth cookie.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The current persisted user record for the active session.</returns>
    public async Task<User> GetSessionUserAsync(CurrentSessionUser actor, CancellationToken cancellationToken)
    {
        var user = await _db.user
            .Include(candidate => candidate.department)
            .FirstOrDefaultAsync(candidate => candidate.id == actor.id, cancellationToken);

        return user ?? throw ApiException.Unauthorized("Session is no longer valid.");
    }
}
