using spark.Infrastructure;
using spark.Services;

namespace spark.Endpoints;

/// <summary>
/// Maps user management endpoints for directory views, profile edits, image access, and admin actions.
/// </summary>
public static class UserEndpoints
{
    /// <summary>
    /// Registers the authorized user API surface under <c>/api/users</c>.
    /// </summary>
    /// <param name="endpoints">The endpoint builder for the current application.</param>
    /// <returns>The same endpoint builder so endpoint registration can continue fluently.</returns>
    public static IEndpointRouteBuilder MapSparkUserEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/users").RequireAuthorization();

        group.MapGet("", async Task<IResult> (
            UserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await userService.GetVisibleUsersAsync(actor, cancellationToken));
        });

        group.MapGet("/{id:int}", async Task<IResult> (
            int id,
            UserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await userService.GetUserAsync(actor, id, cancellationToken));
        });

        group.MapGet("/{id:int}/image", async Task<IResult> (
            int id,
            UserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.File(await userService.GetUserImageAsync(actor, id, cancellationToken), "image/jpeg");
        });

        group.MapPost("", async Task<IResult> (
            HttpRequest request,
            UserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            var user = await userService.CreateUserAsync(actor, request, cancellationToken);
            return Results.Created($"/api/users/{user.id}", user);
        });

        group.MapPut("/{id:int}", async Task<IResult> (
            int id,
            HttpRequest request,
            UserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await userService.UpdateUserAsync(actor, id, request, cancellationToken));
        });

        group.MapDelete("/{id:int}", async Task<IResult> (
            int id,
            UserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await userService.DeleteUserAsync(actor, id, cancellationToken));
        });

        return endpoints;
    }
}
