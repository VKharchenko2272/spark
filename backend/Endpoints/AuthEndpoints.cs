using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using spark.Dtos.Auth;
using spark.Infrastructure;
using spark.Models;
using spark.Services;

namespace spark.Endpoints;

/// <summary>
/// Maps authentication endpoints used by the SPA login, logout, and session bootstrap flow.
/// </summary>
public static class AuthEndpoints
{
    private static readonly ClaimsPrincipal AnonymousPrincipal = new(new ClaimsIdentity());
    private const string LoginRateLimitMessage = "Too many login attempts. Please try again later.";

    private static void IssueSpaCsrfToken(HttpContext httpContext, IAntiforgery antiforgery)
    {
        var tokens = antiforgery.GetAndStoreTokens(httpContext);
        if (string.IsNullOrWhiteSpace(tokens.RequestToken))
        {
            return;
        }

        httpContext.Response.Cookies.Append(
            "XSRF-TOKEN",
            tokens.RequestToken,
            new CookieOptions
            {
                HttpOnly = false,
                SameSite = SameSiteMode.Lax,
                Secure = httpContext.Request.IsHttps,
                Path = "/",
            });
    }

    private static string ResolveClientAddress(HttpContext httpContext)
    {
        var environment = httpContext.RequestServices.GetRequiredService<IHostEnvironment>();
        if (environment.IsEnvironment("Testing") && httpContext.Request.Headers.TryGetValue("X-Test-Client", out var testClient))
        {
            return testClient.ToString();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    /// <summary>
    /// Registers the cookie-auth endpoints for CSRF bootstrap, login, logout, and session lookup.
    /// </summary>
    /// <param name="endpoints">The endpoint builder for the current application.</param>
    /// <returns>The same endpoint builder so other endpoint modules can continue chaining.</returns>
    public static IEndpointRouteBuilder MapSparkAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth");

        group.MapGet("/csrf", (HttpContext httpContext, IAntiforgery antiforgery) =>
        {
            IssueSpaCsrfToken(httpContext, antiforgery);
            return Results.NoContent();
        });

        group.MapPost("/login", async Task<IResult> (
            LoginRequestDto request,
            AuthService authService,
            HttpContext httpContext,
            IAntiforgery antiforgery,
            LoginAttemptProtector loginAttemptProtector,
            CancellationToken cancellationToken) =>
        {
            var username = request.username?.Trim() ?? string.Empty;
            var ipAddress = ResolveClientAddress(httpContext);

            if (loginAttemptProtector.IsBlocked(username, ipAddress))
            {
                throw ApiException.TooManyRequests(LoginRateLimitMessage);
            }

            User user;
            try
            {
                user = await authService.AuthenticateAsync(request, cancellationToken);
            }
            catch (ApiException ex) when (ex.StatusCode == StatusCodes.Status401Unauthorized)
            {
                loginAttemptProtector.RecordFailure(username, ipAddress);
                throw;
            }

            loginAttemptProtector.RecordSuccess(username, ipAddress);
            var resolvedRole = UserRoleResolver.Resolve(user);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.id?.ToString() ?? string.Empty),
                new(ClaimTypes.Name, user.username ?? string.Empty),
                new(ClaimTypes.Role, resolvedRole),
                new(SparkClaimTypes.AuthVersion, UserSecurityVersion.Normalize(user.auth_version).ToString()),
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await httpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties { IsPersistent = false });

            httpContext.User = principal;
            IssueSpaCsrfToken(httpContext, antiforgery);
            return Results.Ok(UserPresenter.ToSession(user));
        }).RequireRateLimiting("LoginIpPolicy");

        group.MapPost("/logout", async Task<IResult> (
            HttpContext httpContext,
            IAntiforgery antiforgery) =>
        {
            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            httpContext.User = AnonymousPrincipal;
            httpContext.Response.Cookies.Delete(".spark.antiforgery");
            httpContext.Response.Cookies.Delete("XSRF-TOKEN");
            IssueSpaCsrfToken(httpContext, antiforgery);
            return Results.NoContent();
        });

        group.MapGet("/session", async Task<IResult> (
            AuthService authService,
            HttpContext httpContext,
            IAntiforgery antiforgery,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            var user = await authService.GetSessionUserAsync(actor, cancellationToken);

            IssueSpaCsrfToken(httpContext, antiforgery);
            return Results.Ok(UserPresenter.ToSession(user));
        }).RequireAuthorization();

        return endpoints;
    }
}
