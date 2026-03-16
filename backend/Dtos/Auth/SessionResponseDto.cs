using spark.Dtos.Users;

namespace spark.Dtos.Auth;

public sealed record SessionResponseDto(bool authenticated, UserDto user);
