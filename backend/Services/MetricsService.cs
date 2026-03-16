using Microsoft.EntityFrameworkCore;
using spark.Dtos.Metrics;
using spark.Infrastructure;

namespace spark.Services;

/// <summary>
/// Builds aggregated dashboard metrics for managers and admins over their visible employee scope.
/// </summary>
public sealed class MetricsService
{
    private readonly SparkDb _db;

    public MetricsService(SparkDb db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns category and topic rollups for the current manager scope.
    /// </summary>
    /// <param name="actor">The authenticated user requesting department metrics.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The aggregated department metrics for the caller's scope.</returns>
    public async Task<DepartmentMetricsResponseDto> GetDepartmentMetricsAsync(CurrentSessionUser actor, CancellationToken cancellationToken)
    {
        EnsureManagerScope(actor);

        var users = await _db.user
            .Include(user => user.department)
            .ToListAsync(cancellationToken);

        var scopedUsers = UserAccessPolicy.ScopeManagedUsers(actor, users);
        if (scopedUsers.Count == 0)
        {
            throw ApiException.NotFound("No users found for the current manager scope.");
        }

        var userIds = scopedUsers.Select(user => user.id ?? 0).Where(id => id > 0).ToList();
        var evaluations = await _db.evaluation_form
            .Include(form => form.EvaluationOptions)
                .ThenInclude(option => option.Topic)
            .Where(form => userIds.Contains(form.user_id))
            .ToListAsync(cancellationToken);

        if (evaluations.Count == 0)
        {
            throw ApiException.NotFound("No evaluations found for the current manager scope.");
        }

        var categories = evaluations
            .SelectMany(form => form.EvaluationOptions)
            .Where(option => option.Topic is not null)
            .GroupBy(option => option.Topic!.category_id)
            .Select(group => new DepartmentMetricCategoryDto(
                group.Key,
                group.GroupBy(option => option.Topic!.id)
                    .Select(topicGroup => new DepartmentMetricTopicDto(
                        topicGroup.Key,
                        topicGroup.Average(option => option.score)))
                    .ToList(),
                group.Sum(option => option.score)))
            .ToList();

        return new DepartmentMetricsResponseDto(actor.id, categories);
    }

    /// <summary>
    /// Returns user-level topic metrics for the current manager scope.
    /// </summary>
    /// <param name="actor">The authenticated user requesting per-user metrics.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The user metrics entries that feed the department dashboard detail views.</returns>
    public async Task<IReadOnlyList<UserMetricsEntryDto>> GetUserMetricsAsync(CurrentSessionUser actor, CancellationToken cancellationToken)
    {
        EnsureManagerScope(actor);

        var users = await _db.user.ToListAsync(cancellationToken);
        var scopedUsers = UserAccessPolicy.ScopeManagedUsers(actor, users);
        if (scopedUsers.Count == 0)
        {
            throw ApiException.NotFound("No users found for the current manager scope.");
        }

        var userIds = scopedUsers.Select(user => user.id ?? 0).Where(id => id > 0).ToList();
        var evaluations = await _db.evaluation_form
            .Include(form => form.EvaluationOptions)
                .ThenInclude(option => option.Topic)
            .Where(form => userIds.Contains(form.user_id))
            .ToListAsync(cancellationToken);

        if (evaluations.Count == 0)
        {
            throw ApiException.NotFound("No evaluations found for the current manager scope.");
        }

        return evaluations
            .SelectMany(
                form => form.EvaluationOptions,
                (form, option) => new
                {
                    UserId = form.user_id,
                    UserName = scopedUsers.First(user => user.id == form.user_id).firstname,
                    UserLastName = scopedUsers.First(user => user.id == form.user_id).lastname,
                    TopicId = option.Topic?.id ?? 0,
                    Score = option.score,
                })
            .Where(item => item.TopicId > 0)
            .GroupBy(item => new { item.UserId, item.UserName, item.UserLastName })
            .Select(group => new UserMetricsEntryDto(
                group.Key.UserId,
                group.Key.UserName,
                group.Key.UserLastName,
                group.Select(item => new UserMetricTopicDto(item.TopicId, item.Score)).ToList(),
                group.Sum(item => item.Score)))
            .ToList();
    }

    private static void EnsureManagerScope(CurrentSessionUser actor)
    {
        if (!actor.is_admin && !actor.is_manager)
        {
            throw ApiException.Forbidden("Only managers and admins can access department metrics.");
        }
    }
}
