using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace spark.Infrastructure;

public static class DatabaseBootstrap
{
    public static async Task EnsureRoleColumnAsync(IServiceProvider services, ILogger logger)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SparkDb>();

        try
        {
            var connectionString = db.Database.GetConnectionString();
            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                await using var connection = new MySqlConnection(connectionString);
                await connection.OpenAsync();

                await using var command = connection.CreateCommand();
                command.CommandText = """
                    SELECT COUNT(*)
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'user'
                      AND COLUMN_NAME = 'role';
                    """;

                var columnExists = Convert.ToInt32(await command.ExecuteScalarAsync()) > 0;
                if (!columnExists)
                {
                    await db.Database.ExecuteSqlRawAsync("""
                        ALTER TABLE `user`
                        ADD COLUMN `role` varchar(32) NULL;
                        """);
                }

                command.CommandText = """
                    SELECT COUNT(*)
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'user'
                      AND COLUMN_NAME = 'auth_version';
                    """;

                var authVersionExists = Convert.ToInt32(await command.ExecuteScalarAsync()) > 0;
                if (!authVersionExists)
                {
                    await db.Database.ExecuteSqlRawAsync("""
                        ALTER TABLE `user`
                        ADD COLUMN `auth_version` int NOT NULL DEFAULT 1;
                        """);
                }
            }

            await db.Database.ExecuteSqlRawAsync("""
                UPDATE `user` AS employee
                LEFT JOIN (
                    SELECT DISTINCT `manager_id`
                    FROM `user`
                    WHERE `manager_id` IS NOT NULL
                ) AS manager_reports ON manager_reports.`manager_id` = employee.`id`
                SET `role` = CASE
                    WHEN COALESCE(employee.`is_admin`, 0) = 1 THEN 'admin'
                    WHEN manager_reports.`manager_id` IS NOT NULL THEN 'manager'
                    ELSE 'employee'
                END
                WHERE employee.`role` IS NULL OR TRIM(employee.`role`) = '';
                """);

            await db.Database.ExecuteSqlRawAsync("""
                UPDATE `user`
                SET `auth_version` = 1
                WHERE `auth_version` IS NULL OR `auth_version` <= 0;
                """);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Unable to bootstrap the role column automatically. The application will continue with the existing schema.");
        }
    }
}
