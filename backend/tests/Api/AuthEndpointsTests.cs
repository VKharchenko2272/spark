using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using spark.Dtos.Auth;
using spark.Infrastructure;
using spark.Models;
using spark.Tests.TestHelpers;
using Xunit;

namespace spark.Tests.Api;

public sealed class AuthEndpointsTests : IClassFixture<SparkApiFactory>
{
    private readonly SparkApiFactory _factory;

    public AuthEndpointsTests(SparkApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_IssuesCookie_And_SessionReturnsSanitizedUser()
    {
        await _factory.ResetDatabaseAsync(db =>
        {
            db.department.Add(new Department { id = 10, name = "Engineering" });
            db.user.Add(new User
            {
                id = 1,
                username = "admin",
                password = BCrypt.Net.BCrypt.HashPassword("secret"),
                firstname = "Ada",
                lastname = "Lovelace",
                email = "ada@example.com",
                role = SparkRoles.Admin,
                is_admin = true,
                department_id = 10,
            });
        });

        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        client.DefaultRequestHeaders.Add("X-Test-Client", Guid.NewGuid().ToString("N"));

        await BootstrapCsrfAsync(client);
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin", "secret"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.Contains(
            loginResponse.Headers.TryGetValues("Set-Cookie", out var cookies) ? cookies : [],
            cookie => cookie.Contains("spark.session", StringComparison.OrdinalIgnoreCase));

        var sessionResponse = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.OK, sessionResponse.StatusCode);

        var sessionJson = await sessionResponse.Content.ReadAsStringAsync();
        var session = JsonSerializer.Deserialize<SessionResponseDto>(
            sessionJson,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.NotNull(session);
        Assert.True(session!.authenticated);
        Assert.Equal(SparkRoles.Admin, session.user.role);
        Assert.DoesNotContain("password", sessionJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Session_WithoutCookie_ReturnsUnauthorized()
    {
        await _factory.ResetDatabaseAsync();

        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = false,
        });
        client.DefaultRequestHeaders.Add("X-Test-Client", Guid.NewGuid().ToString("N"));

        var response = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithoutCsrfToken_ReturnsBadRequest()
    {
        await _factory.ResetDatabaseAsync(db =>
        {
            db.user.Add(new User
            {
                id = 1,
                username = "admin",
                password = BCrypt.Net.BCrypt.HashPassword("secret"),
                role = SparkRoles.Admin,
                is_admin = true,
                auth_version = 1,
            });
        });

        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        client.DefaultRequestHeaders.Add("X-Test-Client", Guid.NewGuid().ToString("N"));

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin", "secret"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Session_BecomesUnauthorized_WhenAuthVersionChanges()
    {
        await _factory.ResetDatabaseAsync(db =>
        {
            db.user.Add(new User
            {
                id = 1,
                username = "admin",
                password = BCrypt.Net.BCrypt.HashPassword("secret"),
                role = SparkRoles.Admin,
                is_admin = true,
                auth_version = 1,
            });
        });

        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        client.DefaultRequestHeaders.Add("X-Test-Client", Guid.NewGuid().ToString("N"));

        await BootstrapCsrfAsync(client);
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin", "secret"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SparkDb>();
            var user = await db.user.FindAsync(1);
            Assert.NotNull(user);
            user!.auth_version = 2;
            await db.SaveChangesAsync();
        }

        var sessionResponse = await client.GetAsync("/api/auth/session");
        Assert.Equal(HttpStatusCode.Unauthorized, sessionResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ReturnsTooManyRequests_AfterRepeatedFailuresForSameUserAndIp()
    {
        await _factory.ResetDatabaseAsync(db =>
        {
            db.user.Add(new User
            {
                id = 1,
                username = "admin",
                password = BCrypt.Net.BCrypt.HashPassword("secret"),
                role = SparkRoles.Admin,
                is_admin = true,
                auth_version = 1,
            });
        });

        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        client.DefaultRequestHeaders.Add("X-Test-Client", Guid.NewGuid().ToString("N"));

        await BootstrapCsrfAsync(client);

        for (var attempt = 0; attempt < 5; attempt += 1)
        {
            var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin", "wrong-secret"));
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        var blockedResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin", "wrong-secret"));
        Assert.Equal(HttpStatusCode.TooManyRequests, blockedResponse.StatusCode);
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
