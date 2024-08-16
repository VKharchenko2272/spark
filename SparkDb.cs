using Microsoft.EntityFrameworkCore;
using spark;

    public class SparkDb : DbContext
    {
        public SparkDb(DbContextOptions<SparkDb> options)
            : base(options)
        {
        }

        public DbSet<User> user => Set<User>();
        // Add other DbSet properties for your tables
    }

    

