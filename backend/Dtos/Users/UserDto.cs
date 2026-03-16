using spark.Dtos.Departments;

namespace spark.Dtos.Users;

public sealed record UserDto(
    int? id,
    string? username,
    string? firstname,
    string? lastname,
    string? email,
    string? company_role,
    string role,
    DateTime? hired_date,
    int? manager_id,
    int? department_id,
    DepartmentDto? department,
    bool img
);
