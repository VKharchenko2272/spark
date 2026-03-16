using Microsoft.EntityFrameworkCore;
using spark.Dtos.Departments;
using spark.Infrastructure;

namespace spark.Services;

/// <summary>
/// Provides department lookup and admin-only department creation operations.
/// </summary>
public sealed class DepartmentService
{
    private readonly SparkDb _db;

    public DepartmentService(SparkDb db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns departments ordered for UI selection controls.
    /// </summary>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The available departments as lightweight DTOs.</returns>
    public async Task<IReadOnlyList<DepartmentDto>> GetDepartmentsAsync(CancellationToken cancellationToken)
    {
        return await _db.department
            .OrderBy(department => department.name)
            .Select(department => new DepartmentDto(department.id, department.name))
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Creates a new department after validating the request and the caller's admin privileges.
    /// </summary>
    /// <param name="actor">The authenticated user attempting to create the department.</param>
    /// <param name="request">The incoming department creation payload.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The newly created department.</returns>
    public async Task<DepartmentDto> CreateDepartmentAsync(CurrentSessionUser actor, DepartmentCreateRequestDto request, CancellationToken cancellationToken)
    {
        if (!actor.is_admin)
        {
            throw ApiException.Forbidden("Only admins can create departments.");
        }

        if (string.IsNullOrWhiteSpace(request.name))
        {
            throw ApiException.BadRequest("Department name is required.");
        }

        var department = new spark.Models.Department
        {
            name = request.name.Trim(),
        };

        _db.department.Add(department);
        await _db.SaveChangesAsync(cancellationToken);

        return new DepartmentDto(department.id, department.name);
    }
}
