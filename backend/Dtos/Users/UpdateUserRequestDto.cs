namespace spark.Dtos.Users;

public sealed class UpdateUserRequestDto
{
    public string? firstname { get; init; }
    public string? lastname { get; init; }
    public string? email { get; init; }
    public string? company_role { get; init; }
    public string? role { get; init; }
    public DateTime? hired_date { get; init; }
    public int? manager_id { get; init; }
    public int? department_id { get; init; }
    public string? password { get; init; }
}
