namespace spark.Dtos.Evaluations;

public sealed record RatingResponseDto(int? id, int user_id, DateTime? created, List<RatingCategoryDto> categories);
