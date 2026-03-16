using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace spark.Infrastructure;

/// <summary>
/// Revalidates cookie principals against the database so stale roles and auth versions are rejected.
/// </summary>
public sealed class SparkCookieAuthenticationEvents : CookieAuthenticationEvents
{
    private readonly SparkDb _db;
    private readonly ILogger<SparkCookieAuthenticationEvents> _logger;

    public SparkCookieAuthenticationEvents(SparkDb db, ILogger<SparkCookieAuthenticationEvents> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Rejects session cookies whose persisted user no longer exists or no longer matches the stored role/version.
    /// </summary>
    /// <param name="context">The validation context for the current cookie-auth request.</param>
    public override async Task ValidatePrincipal(CookieValidatePrincipalContext context)
    {
        var actor = context.Principal?.ToCurrentSessionUser();
        var claimedAuthVersion = context.Principal?.ReadAuthVersion();

        if (actor is null || !claimedAuthVersion.HasValue)
        {
            await RejectSessionAsync(context, "Session principal is missing required claims.");
            return;
        }

        var user = await _db.user.FirstOrDefaultAsync(
            candidate => candidate.id == actor.id,
            context.HttpContext.RequestAborted);

        if (user is null)
        {
            await RejectSessionAsync(context, "Session user no longer exists.");
            return;
        }

        var resolvedRole = await UserRoleResolver.ResolveAsync(user, _db, context.HttpContext.RequestAborted);
        var currentAuthVersion = UserSecurityVersion.Normalize(user.auth_version);

        if (!string.Equals(resolvedRole, actor.role, StringComparison.Ordinal) || currentAuthVersion != claimedAuthVersion.Value)
        {
            await RejectSessionAsync(context, "Session principal is stale.");
        }
    }

    /// <summary>
    /// Returns a bare <c>401</c> for API callers instead of redirecting to an HTML login page.
    /// </summary>
    /// <param name="context">The redirect context raised by cookie authentication.</param>
    public override Task RedirectToLogin(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    }

    /// <summary>
    /// Returns a bare <c>403</c> for API callers instead of redirecting to an HTML access denied page.
    /// </summary>
    /// <param name="context">The redirect context raised by cookie authentication.</param>
    public override Task RedirectToAccessDenied(RedirectContext<CookieAuthenticationOptions> context)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    }

    private async Task RejectSessionAsync(CookieValidatePrincipalContext context, string reason)
    {
        _logger.LogInformation("Rejecting stale session for request {Path}. Reason: {Reason}", context.HttpContext.Request.Path, reason);
        context.RejectPrincipal();
        await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    }
}
