using spark.Infrastructure;
using spark.Services;

namespace spark.Endpoints;

/// <summary>
/// Maps endpoints that expose aggregated manager and department metrics for dashboard views.
/// </summary>
public static class MetricsEndpoints
{
    /// <summary>
    /// Registers the authorized metrics API surface under <c>/api/metrics</c>.
    /// </summary>
    /// <param name="endpoints">The endpoint builder for the current application.</param>
    /// <returns>The same endpoint builder so endpoint registration can continue fluently.</returns>
    public static IEndpointRouteBuilder MapSparkMetricsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/metrics").RequireAuthorization();

        group.MapGet("/department", async Task<IResult> (
            MetricsService metricsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await metricsService.GetDepartmentMetricsAsync(actor, cancellationToken));
        });

        group.MapGet("/users", async Task<IResult> (
            MetricsService metricsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await metricsService.GetUserMetricsAsync(actor, cancellationToken));
        });

        return endpoints;
    }
}
