using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using spark.Dtos.Auth;
using spark.Dtos.Users;
using spark.Infrastructure;
using spark.Models;
using spark.Tests.TestHelpers;
using Xunit;

namespace spark.Tests.Api;

public sealed class UserEndpointsTests : IClassFixture<SparkApiFactory>
{
    private readonly SparkApiFactory _factory;

    public UserEndpointsTests(SparkApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Manager_ListUsers_ReturnsOnlySelfAndDirectReports()
    {
        await _factory.ResetDatabaseAsync(db =>
        {
            db.department.Add(new Department { id = 1, name = "Engineering" });
            db.user.AddRange(
                new User
                {
                    id = 1,
                    username = "manager",
                    password = BCrypt.Net.BCrypt.HashPassword("secret"),
                    firstname = "Mina",
                    lastname = "Manager",
                    role = SparkRoles.Manager,
                    department_id = 1,
                },
                new User
                {
                    id = 2,
                    username = "report",
                    password = BCrypt.Net.BCrypt.HashPassword("secret"),
                    firstname = "Rita",
                    lastname = "Report",
                    role = SparkRoles.Employee,
                    manager_id = 1,
                    department_id = 1,
                },
                new User
                {
                    id = 3,
                    username = "outsider",
                    password = BCrypt.Net.BCrypt.HashPassword("secret"),
                    firstname = "Owen",
                    lastname = "Outsider",
                    role = SparkRoles.Employee,
                    department_id = 1,
                });
        });

        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        client.DefaultRequestHeaders.Add("X-Test-Client", Guid.NewGuid().ToString("N"));

        await BootstrapCsrfAsync(client);
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("manager", "secret"));
        var response = await client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var users = await response.Content.ReadFromJsonAsync<List<UserDto>>();

        Assert.NotNull(users);
        Assert.Equal([1, 2], users!.Select(user => user.id).OrderBy(id => id).ToArray());
    }

    [Fact]
    public async Task Employee_RequestingAnotherUser_ReturnsForbidden()
    {
        await _factory.ResetDatabaseAsync(db =>
        {
            db.department.Add(new Department { id = 1, name = "Engineering" });
            db.user.AddRange(
                new User
                {
                    id = 1,
                    username = "employee",
                    password = BCrypt.Net.BCrypt.HashPassword("secret"),
                    firstname = "Eve",
                    lastname = "Employee",
                    role = SparkRoles.Employee,
                    department_id = 1,
                },
                new User
                {
                    id = 2,
                    username = "other",
                    password = BCrypt.Net.BCrypt.HashPassword("secret"),
                    firstname = "Olga",
                    lastname = "Other",
                    role = SparkRoles.Employee,
                    department_id = 1,
                });
        });

        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        client.DefaultRequestHeaders.Add("X-Test-Client", Guid.NewGuid().ToString("N"));

        await BootstrapCsrfAsync(client);
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("employee", "secret"));
        var response = await client.GetAsync("/api/users/2");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static async Task BootstrapCsrfAsync(HttpClient client)
    {
        var csrfResponse = await client.GetAsync("/api/auth/csrf");
        Assert.Equal(HttpStatusCode.NoContent, csrfResponse.StatusCode);

        var xsrfCookie = csrfResponse.Headers.TryGetValues("Set-Cookie", out var cookies)
            ? cookies.FirstOrDefault(cookie => cookie.StartsWith("XSRF-TOKEN=", StringComparison.OrdinalIgnoreCase))
            : null;

        Assert.False(string.IsNullOrWhiteSpace(xsrfCookie));

        var token = xsrfCookie!
            .Split(';', 2)[0]
            .Split('=', 2)[1];

        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", Uri.UnescapeDataString(token));
    }
}
