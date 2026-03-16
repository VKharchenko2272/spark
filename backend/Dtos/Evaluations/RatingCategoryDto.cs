namespace spark.Dtos.Evaluations;

public sealed record RatingCategoryDto(int category_id, List<RatingTopicDto> topics, int total_score);
