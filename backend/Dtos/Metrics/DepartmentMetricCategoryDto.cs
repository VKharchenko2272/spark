namespace spark.Dtos.Metrics;

public sealed record DepartmentMetricCategoryDto(int category_id, List<DepartmentMetricTopicDto> topics, int total_score);
