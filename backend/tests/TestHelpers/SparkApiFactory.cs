using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace spark.Tests.TestHelpers;

public sealed class SparkApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }

    public async Task ResetDatabaseAsync(Action<SparkDb>? seed = null)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SparkDb>();

        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();

        seed?.Invoke(db);
        await db.SaveChangesAsync();
    }
}
