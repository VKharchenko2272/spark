using spark.Dtos.Auth;
using spark.Infrastructure;
using spark.Models;
using spark.Services;
using spark.Tests.TestHelpers;
using Xunit;

namespace spark.Tests.Services;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task AuthenticateAsync_ResolvesManagerRole_WhenUserHasDirectReports()
    {
        await using var db = SparkDbTestFactory.CreateDbContext();
        db.user.AddRange(
            new User
            {
                id = 1,
                username = "manager",
                password = BCrypt.Net.BCrypt.HashPassword("secret"),
                firstname = "Mina",
                lastname = "Manager",
            },
            new User
            {
                id = 2,
                username = "report",
                password = BCrypt.Net.BCrypt.HashPassword("secret"),
                firstname = "Rita",
                lastname = "Report",
                manager_id = 1,
                role = SparkRoles.Employee,
            });
        await db.SaveChangesAsync();

        var service = new AuthService(db);

        var user = await service.AuthenticateAsync(new LoginRequestDto("manager", "secret"), CancellationToken.None);

        Assert.Equal(SparkRoles.Manager, user.role);
        Assert.False(user.is_admin);
    }
}
