using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace spark.Models
{
    public class CategoryComment
    {
        public int id { get; set; }
        public int category_id { get; set; } // Foreign Key
        public string? comment { get; set; }
        public int form_id { get; set; } // Foreign Key

        [ForeignKey("form_id")]
        public EvaluationForm? EvaluationForm { get; set; }
        [ForeignKey("category_id")]
        public Category? Category { get; set; }
    }
}