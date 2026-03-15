using Microsoft.EntityFrameworkCore;
using spark.Models;

public class SparkDb : DbContext
    {
        public SparkDb(DbContextOptions<SparkDb> options)
            : base(options)
        {
        }

        public DbSet<User> user => Set<User>();
        public DbSet<Department> department => Set<Department>();
        public DbSet<EvaluationForm> evaluation_form => Set<EvaluationForm>();
        public DbSet<Behavior> behavior => Set<Behavior>();
        public DbSet<Category> category => Set<Category>();
        public DbSet<Topic> topic => Set<Topic>();
        public DbSet<CategoryComment> category_comment => Set<CategoryComment>();
        public DbSet<EvaluationOption> option_evaluation => Set<EvaluationOption>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure the one-to-many relationship explicitly (optional)
            modelBuilder.Entity<Category>()
                .HasMany(c => c.topic)
                .WithOne(t => t.category)
                .HasForeignKey(t => t.category_id);
        }
    }