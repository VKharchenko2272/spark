namespace spark.Dtos.Metrics;

public sealed record UserMetricsEntryDto(
    int userId,
    string? userName,
    string? userLastName,
    List<UserMetricTopicDto> topics,
    int totalScore
);
