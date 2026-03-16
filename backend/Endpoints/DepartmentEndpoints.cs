using spark.Dtos.Departments;
using spark.Infrastructure;
using spark.Services;

namespace spark.Endpoints;

/// <summary>
/// Maps department lookup and creation endpoints used by the admin UI.
/// </summary>
public static class DepartmentEndpoints
{
    /// <summary>
    /// Registers the authorized department API surface under <c>/api/departments</c>.
    /// </summary>
    /// <param name="endpoints">The endpoint builder for the current application.</param>
    /// <returns>The same endpoint builder so endpoint registration can continue fluently.</returns>
    public static IEndpointRouteBuilder MapSparkDepartmentEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/departments").RequireAuthorization();

        group.MapGet("", async Task<IResult> (DepartmentService departmentService, CancellationToken cancellationToken) =>
        {
            return Results.Ok(await departmentService.GetDepartmentsAsync(cancellationToken));
        });

        group.MapPost("", async Task<IResult> (
            DepartmentCreateRequestDto request,
            DepartmentService departmentService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var actor = httpContext.RequireCurrentSessionUser();
            var department = await departmentService.CreateDepartmentAsync(actor, request, cancellationToken);
            return Results.Created($"/api/departments/{department.id}", department);
        });

        return endpoints;
    }
}
