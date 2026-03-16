namespace spark.Dtos.Evaluations;

public sealed record EvaluationOptionDto(int? id, EvaluationTopicDto? topic, string? comment, int score);
