using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using spark.Dtos.Users;
using spark.Infrastructure;
using spark.Models;
using spark.Services;
using spark.Tests.TestHelpers;
using Xunit;

namespace spark.Tests.Services;

public sealed class UserServiceTests
{
    [Fact]
    public async Task UpdateUserAsync_DoesNotChangePassword_WhenPasswordIsOmitted()
    {
        await using var db = SparkDbTestFactory.CreateDbContext();
        db.department.Add(new Department { id = 1, name = "Engineering" });

        var originalPasswordHash = BCrypt.Net.BCrypt.HashPassword("old-secret");
        db.user.AddRange(
            new User
            {
                id = 1,
                username = "admin",
                password = BCrypt.Net.BCrypt.HashPassword("admin-secret"),
                role = SparkRoles.Admin,
                is_admin = true,
                department_id = 1,
            },
            new User
            {
                id = 2,
                username = "employee",
                password = originalPasswordHash,
                firstname = "Old",
                lastname = "Name",
                role = SparkRoles.Employee,
                department_id = 1,
            });
        await db.SaveChangesAsync();

        var service = new UserService(db);
        var request = CreateJsonRequest(new UpdateUserRequestDto
        {
            firstname = "Updated",
            lastname = "Employee",
            department_id = 1,
        });

        await service.UpdateUserAsync(
            new CurrentSessionUser(1, "admin", SparkRoles.Admin),
            2,
            request,
            CancellationToken.None);

        var savedUser = await db.user.FindAsync(2);
        Assert.NotNull(savedUser);
        Assert.Equal(originalPasswordHash, savedUser!.password);
        Assert.Equal("Updated", savedUser.firstname);
        Assert.Equal(1, savedUser.auth_version);
    }

    [Fact]
    public async Task UpdateUserAsync_ChangesPassword_WhenPasswordIsProvided()
    {
        await using var db = SparkDbTestFactory.CreateDbContext();
        db.department.Add(new Department { id = 1, name = "Engineering" });

        var originalPasswordHash = BCrypt.Net.BCrypt.HashPassword("old-secret");
        db.user.AddRange(
            new User
            {
                id = 1,
                username = "admin",
                password = BCrypt.Net.BCrypt.HashPassword("admin-secret"),
                role = SparkRoles.Admin,
                is_admin = true,
                department_id = 1,
            },
            new User
            {
                id = 2,
                username = "employee",
                password = originalPasswordHash,
                firstname = "Old",
                lastname = "Name",
                role = SparkRoles.Employee,
                department_id = 1,
            });
        await db.SaveChangesAsync();

        var service = new UserService(db);
        var request = CreateJsonRequest(new UpdateUserRequestDto
        {
            password = "new-secret",
            department_id = 1,
        });

        await service.UpdateUserAsync(
            new CurrentSessionUser(1, "admin", SparkRoles.Admin),
            2,
            request,
            CancellationToken.None);

        var savedUser = await db.user.FindAsync(2);
        Assert.NotNull(savedUser);
        Assert.NotEqual(originalPasswordHash, savedUser!.password);
        Assert.True(BCrypt.Net.BCrypt.Verify("new-secret", savedUser.password));
        Assert.Equal(2, savedUser.auth_version);
    }

    [Fact]
    public async Task GetVisibleUsersAsync_ForEmployee_ReturnsOnlySelf()
    {
        await using var db = SparkDbTestFactory.CreateDbContext();
        db.user.AddRange(
            new User { id = 1, username = "employee", password = "hash", role = SparkRoles.Employee, firstname = "Eva" },
            new User { id = 2, username = "other", password = "hash", role = SparkRoles.Employee, firstname = "Oleg" });
        await db.SaveChangesAsync();

        var service = new UserService(db);

        var users = await service.GetVisibleUsersAsync(
            new CurrentSessionUser(1, "employee", SparkRoles.Employee),
            CancellationToken.None);

        Assert.Single(users);
        Assert.Equal(1, users[0].id);
    }

    [Fact]
    public async Task UpdateUserAsync_ChangesAuthVersion_WhenRoleChanges()
    {
        await using var db = SparkDbTestFactory.CreateDbContext();
        db.department.Add(new Department { id = 1, name = "Engineering" });
        db.user.AddRange(
            new User
            {
                id = 1,
                username = "admin",
                password = BCrypt.Net.BCrypt.HashPassword("admin-secret"),
                role = SparkRoles.Admin,
                is_admin = true,
                department_id = 1,
                auth_version = 1,
            },
            new User
            {
                id = 2,
                username = "manager",
                password = BCrypt.Net.BCrypt.HashPassword("manager-secret"),
                role = SparkRoles.Manager,
                department_id = 1,
                auth_version = 1,
            });
        await db.SaveChangesAsync();

        var service = new UserService(db);
        var request = CreateJsonRequest(new UpdateUserRequestDto
        {
            role = SparkRoles.Employee,
            department_id = 1,
        });

        await service.UpdateUserAsync(
            new CurrentSessionUser(1, "admin", SparkRoles.Admin),
            2,
            request,
            CancellationToken.None);

        var savedUser = await db.user.FindAsync(2);
        Assert.NotNull(savedUser);
        Assert.Equal(SparkRoles.Employee, savedUser!.role);
        Assert.Equal(2, savedUser.auth_version);
    }

    private static HttpRequest CreateJsonRequest(object payload)
    {
        var context = new DefaultHttpContext();
        var json = JsonSerializer.Serialize(payload);
        context.Request.ContentType = "application/json";
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(json));
        context.Request.Body.Position = 0;
        return context.Request;
    }
}
