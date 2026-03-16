using Microsoft.EntityFrameworkCore;
using spark.Dtos.Common;
using spark.Dtos.Evaluations;
using spark.Infrastructure;
using spark.Models;

namespace spark.Services;

/// <summary>
/// Provides the query and command operations behind employee evaluations and score history.
/// </summary>
public sealed class EvaluationService
{
    private readonly SparkDb _db;

    public EvaluationService(SparkDb db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns the category lookup values used to build evaluation forms on the client.
    /// </summary>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The ordered list of evaluation categories.</returns>
    public async Task<IReadOnlyList<CategoryLookupDto>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        return await _db.category
            .OrderBy(category => category.id)
            .Select(category => new CategoryLookupDto(category.id))
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Returns the most recent annual rating breakdown that the actor is allowed to inspect.
    /// </summary>
    /// <param name="actor">The authenticated user requesting the rating.</param>
    /// <param name="userId">The identifier of the user being reviewed.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The latest rating response for the requested user.</returns>
    public async Task<RatingResponseDto> GetRatingAsync(CurrentSessionUser actor, int userId, CancellationToken cancellationToken)
    {
        var targetUser = await _db.user.FirstOrDefaultAsync(candidate => candidate.id == userId, cancellationToken)
            ?? throw ApiException.NotFound("User not found.");

        if (!UserAccessPolicy.CanView(actor, targetUser))
        {
            throw ApiException.Forbidden("You do not have access to these ratings.");
        }

        var oneYearAgo = DateTime.UtcNow.AddYears(-1);
        var evaluationForm = await _db.evaluation_form
            .Include(form => form.EvaluationOptions)
                .ThenInclude(option => option.Topic)
            .Where(form => form.user_id == userId && form.created >= oneYearAgo)
            .OrderByDescending(form => form.created)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ApiException.NotFound("Evaluation form not found or too old.");

        var categories = evaluationForm.EvaluationOptions
            .Where(option => option.Topic is not null)
            .GroupBy(option => option.Topic!.category_id)
            .Select(group => new RatingCategoryDto(
                group.Key,
                group.Select(option => new RatingTopicDto(option.Topic!.id, option.score)).ToList(),
                group.Sum(option => option.score)))
            .ToList();

        return new RatingResponseDto(
            evaluationForm.id,
            evaluationForm.user_id,
            evaluationForm.created,
            categories);
    }

    /// <summary>
    /// Returns the most recent annual evaluation form, including comments and reviewer summary.
    /// </summary>
    /// <param name="actor">The authenticated user requesting the evaluation.</param>
    /// <param name="userId">The identifier of the user whose evaluation is requested.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>The latest evaluation response visible to the caller.</returns>
    public async Task<EvaluationResponseDto> GetEvaluationAsync(CurrentSessionUser actor, int userId, CancellationToken cancellationToken)
    {
        var targetUser = await _db.user
            .Include(candidate => candidate.department)
            .FirstOrDefaultAsync(candidate => candidate.id == userId, cancellationToken)
            ?? throw ApiException.NotFound("User not found.");

        if (!UserAccessPolicy.CanView(actor, targetUser))
        {
            throw ApiException.Forbidden("You do not have access to this evaluation.");
        }

        var oneYearAgo = DateTime.UtcNow.AddYears(-1);
        var evaluationForm = await _db.evaluation_form
            .Include(form => form.EvaluationOptions)
                .ThenInclude(option => option.Topic)
            .Include(form => form.CategoryComments)
            .Include(form => form.Manager)
            .Where(form => form.user_id == userId && form.created >= oneYearAgo)
            .OrderByDescending(form => form.created)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ApiException.NotFound("Evaluation form not found or too old.");

        var manager = evaluationForm.Manager is null
            ? null
            : new EvaluationManagerSummaryDto(
                evaluationForm.Manager.id,
                evaluationForm.Manager.firstname,
                evaluationForm.Manager.lastname);

        return new EvaluationResponseDto(
            evaluationForm.id,
            evaluationForm.user_id,
            evaluationForm.department_id,
            evaluationForm.manager_id,
            manager,
            evaluationForm.created,
            evaluationForm.is_ready,
            evaluationForm.EvaluationOptions.Select(option => new EvaluationOptionDto(
                option.id,
                option.Topic == null ? null : new EvaluationTopicDto(option.Topic.id, option.Topic.category_id),
                option.comment,
                option.score)).ToList(),
            evaluationForm.CategoryComments?.Select(comment => new EvaluationCategoryCommentDto(
                comment.id,
                comment.category_id,
                comment.comment)).ToList() ?? []);
    }

    /// <summary>
    /// Returns whether the requested user already has a recent evaluation on file.
    /// </summary>
    /// <param name="actor">The authenticated user requesting the status.</param>
    /// <param name="userId">The identifier of the user whose status is requested.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>A lightweight status DTO used by the people directory.</returns>
    public async Task<EvaluationStatusDto> GetStatusAsync(CurrentSessionUser actor, int userId, CancellationToken cancellationToken)
    {
        var targetUser = await _db.user.FirstOrDefaultAsync(candidate => candidate.id == userId, cancellationToken)
            ?? throw ApiException.NotFound("User not found.");

        if (!UserAccessPolicy.CanView(actor, targetUser))
        {
            throw ApiException.Forbidden("You do not have access to this evaluation status.");
        }

        var oneYearAgo = DateTime.UtcNow.AddYears(-1);
        var exists = await _db.evaluation_form.AnyAsync(
            form => form.user_id == userId && form.created >= oneYearAgo,
            cancellationToken);

        return new EvaluationStatusDto(exists ? "Done" : "Not Done");
    }

    /// <summary>
    /// Persists a new evaluation form after validating management scope and annual submission rules.
    /// </summary>
    /// <param name="actor">The authenticated manager or admin submitting the evaluation.</param>
    /// <param name="request">The evaluation payload posted by the client.</param>
    /// <param name="cancellationToken">A token used to cancel the database work.</param>
    /// <returns>A generic API message confirming the result.</returns>
    public async Task<ApiMessageDto> CreateEvaluationAsync(CurrentSessionUser actor, EvaluationCreateRequestDto request, CancellationToken cancellationToken)
    {
        if (!actor.is_admin && !actor.is_manager)
        {
            throw ApiException.Forbidden("Only managers and admins can create evaluations.");
        }

        var targetUser = await _db.user.FirstOrDefaultAsync(candidate => candidate.id == request.userId, cancellationToken)
            ?? throw ApiException.NotFound("User not found.");

        if (!UserAccessPolicy.CanManage(actor, targetUser))
        {
            throw ApiException.Forbidden("You do not have permission to evaluate this user.");
        }

        if (actor.id == request.userId)
        {
            throw ApiException.BadRequest("You cannot evaluate yourself.");
        }

        if (!targetUser.department_id.HasValue)
        {
            throw ApiException.BadRequest("The selected user does not belong to a department.");
        }

        var oneYearAgo = DateTime.UtcNow.AddYears(-1);
        var alreadyExists = await _db.evaluation_form.AnyAsync(
            form => form.user_id == request.userId && form.created >= oneYearAgo,
            cancellationToken);

        if (alreadyExists)
        {
            throw ApiException.BadRequest("A recent evaluation already exists for this user.");
        }

        var evaluationForm = new EvaluationForm
        {
            user_id = request.userId,
            department_id = targetUser.department_id.Value,
            manager_id = actor.id,
            created = DateTime.UtcNow,
            is_ready = true,
        };

        _db.evaluation_form.Add(evaluationForm);
        await _db.SaveChangesAsync(cancellationToken);

        foreach (var option in request.evaluationOptions)
        {
            _db.option_evaluation.Add(new EvaluationOption
            {
                topic_id = option.topicId,
                comment = option.comment,
                score = option.score,
                form_id = evaluationForm.id,
            });
        }

        foreach (var comment in request.categoryComments)
        {
            _db.category_comment.Add(new CategoryComment
            {
                category_id = comment.categoryId,
                comment = comment.comment,
                form_id = evaluationForm.id,
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new ApiMessageDto("Evaluation form created successfully.");
    }
}
