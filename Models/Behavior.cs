using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace spark.Models
{
    public class Behavior
    {
        public int id { get; set; }
        public string? text { get; set; }
        public int form_id { get; set; }

        [ForeignKey("form_id")]
        public EvaluationForm? EvaluationForm { get; set; }
    }
}