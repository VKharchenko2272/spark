using spark.Infrastructure;
using spark.Dtos.Evaluations;
using spark.Services;

namespace spark.Endpoints;

/// <summary>
/// Maps endpoints for category lookup, evaluation retrieval, evaluation status, and review submission.
/// </summary>
public static class EvaluationEndpoints
{
    /// <summary>
    /// Registers the authorized evaluation API surface used by managers, admins, and employees.
    /// </summary>
    /// <param name="endpoints">The endpoint builder for the current application.</param>
    /// <returns>The same endpoint builder so endpoint registration can continue fluently.</returns>
    public static IEndpointRouteBuilder MapSparkEvaluationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var authGroup = endpoints.MapGroup("/api").RequireAuthorization();

        authGroup.MapGet("/categories", async Task<IResult> (EvaluationService evaluationService, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await evaluationService.GetCategoriesAsync(cancellationToken));
        });

        authGroup.MapGet("/ratings/users/{userId:int}", async Task<IResult> (
            int userId,
            EvaluationService evaluationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await evaluationService.GetRatingAsync(actor, userId, cancellationToken));
        });

        authGroup.MapGet("/evaluations/users/{userId:int}", async Task<IResult> (
            int userId,
            EvaluationService evaluationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await evaluationService.GetEvaluationAsync(actor, userId, cancellationToken));
        });

        authGroup.MapGet("/evaluations/users/{userId:int}/status", async Task<IResult> (
            int userId,
            EvaluationService evaluationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await evaluationService.GetStatusAsync(actor, userId, cancellationToken));
        });

        authGroup.MapPost("/evaluations", async Task<IResult> (
            EvaluationCreateRequestDto request,
            EvaluationService evaluationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            return Results.Ok(await evaluationService.CreateEvaluationAsync(actor, request, cancellationToken));
        });

        return endpoints;
    }
}
