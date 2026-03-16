using Microsoft.EntityFrameworkCore;

namespace spark.Tests.TestHelpers;

public static class SparkDbTestFactory
{
    public static SparkDb CreateDbContext(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<SparkDb>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString("N"))
            .Options;

        return new SparkDb(options);
    }
}
