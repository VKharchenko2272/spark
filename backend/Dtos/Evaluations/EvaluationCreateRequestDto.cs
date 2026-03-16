namespace spark.Dtos.Evaluations;

public sealed class EvaluationCreateRequestDto
{
    public int userId { get; init; }
    public List<EvaluationOptionCreateDto> evaluationOptions { get; init; } = [];
    public List<CategoryCommentCreateDto> categoryComments { get; init; } = [];
}
