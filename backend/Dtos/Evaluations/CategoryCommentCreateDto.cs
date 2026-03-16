namespace spark.Dtos.Evaluations;

public sealed class CategoryCommentCreateDto
{
    public int categoryId { get; init; }
    public string? comment { get; init; }
}
