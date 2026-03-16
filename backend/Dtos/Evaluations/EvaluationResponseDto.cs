namespace spark.Dtos.Evaluations;

public sealed record EvaluationResponseDto(
    int? id,
    int user_id,
    int? department_id,
    int? manager_id,
    EvaluationManagerSummaryDto? manager,
    DateTime? created,
    bool is_ready,
    List<EvaluationOptionDto> evaluationOptions,
    List<EvaluationCategoryCommentDto> categoryComments
);
