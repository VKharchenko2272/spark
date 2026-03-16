namespace spark.Dtos.Metrics;

public sealed record DepartmentMetricsResponseDto(int managerId, List<DepartmentMetricCategoryDto> categories);
