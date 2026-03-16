namespace spark.Dtos.Evaluations;

public sealed class EvaluationOptionCreateDto
{
    public int topicId { get; init; }
    public string? comment { get; init; }
    public int score { get; init; }
}
