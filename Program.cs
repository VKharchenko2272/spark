using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using spark.Endpoints;
using spark.Infrastructure;
using spark.Services;
using spark.Dtos.Common;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
var useRequestBasedSecureCookies = builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Testing");

if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<SparkDb>(options =>
    {
        options.UseInMemoryDatabase("spark-tests");
    });
}
else
{
    var connectionString = builder.Configuration.GetConnectionString("sparkdb")
        ?? builder.Configuration["SPARKDB_CONNECTION"]
        ?? throw new InvalidOperationException("Set the `sparkdb` connection string or the `SPARKDB_CONNECTION` environment variable.");

    builder.Services.AddDbContext<SparkDb>(options =>
    {
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));

        if (builder.Environment.IsDevelopment())
        {
            options.LogTo(Console.WriteLine, LogLevel.Information);
        }
    });
}

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Login";
        options.Cookie.Name = "spark.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = useRequestBasedSecureCookies
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.EventsType = typeof(SparkCookieAuthenticationEvents);
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminsOnly", policy => policy.RequireRole(SparkRoles.Admin));
    options.AddPolicy("ManagersOrAdmins", policy => policy.RequireRole(SparkRoles.Admin, SparkRoles.Manager));
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = ".spark.antiforgery";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = useRequestBasedSecureCookies
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DepartmentService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<EvaluationService>();
builder.Services.AddScoped<MetricsService>();
builder.Services.AddScoped<SparkCookieAuthenticationEvents>();
builder.Services.AddSingleton<LoginAttemptProtector>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new ApiMessageDto("Too many login attempts. Please try again later."),
            cancellationToken: cancellationToken);
    };
    options.AddPolicy("LoginIpPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey:
                builder.Environment.IsEnvironment("Testing") && httpContext.Request.Headers.TryGetValue("X-Test-Client", out var testClient)
                    ? testClient.ToString()
                    : httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true,
            }));
});

var app = builder.Build();

await DatabaseBootstrap.EnsureRoleColumnAsync(app.Services, app.Logger);

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (ApiException ex)
    {
        await context.WriteAsJsonAsync(ex);
    }
    catch (AntiforgeryValidationException)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsJsonAsync(new ApiMessageDto("Invalid or missing antiforgery token."));
    }
});

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.Use(async (context, next) =>
{
    var isApiMutation = context.Request.Path.StartsWithSegments("/api")
        && (HttpMethods.IsPost(context.Request.Method)
            || HttpMethods.IsPut(context.Request.Method)
            || HttpMethods.IsPatch(context.Request.Method)
            || HttpMethods.IsDelete(context.Request.Method));

    if (isApiMutation)
    {
        var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
        await antiforgery.ValidateRequestAsync(context);
    }

    await next();
});

app.MapSparkAuthEndpoints();
app.MapSparkDepartmentEndpoints();
app.MapSparkUserEndpoints();
app.MapSparkEvaluationEndpoints();
app.MapSparkMetricsEndpoints();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

var distPath = Path.Combine(app.Environment.ContentRootPath, "dist");
if (Directory.Exists(distPath))
{
    var fileProvider = new PhysicalFileProvider(distPath);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fileProvider });

    app.MapFallback(async context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(Path.Combine(distPath, "index.html"));
    });
}

app.Run();

public partial class Program
{
}
