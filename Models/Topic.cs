using System.ComponentModel.DataAnnotations.Schema;
using spark.Models;

public class Topic
{
    public int id { get; set; }
    public int category_id { get; set; } // Foreign Key

    [ForeignKey("category_id")]
    public Category? category { get; set; }

    // This collection corresponds to the EvaluationOptions
    public ICollection<EvaluationOption>? EvaluationOptions { get; set; }

}
