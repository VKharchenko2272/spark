using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace spark.Models
{
    public class Category
    {
        public int id { get; set; }
        public ICollection<Topic>? topic { get; set; } = new List<Topic>(); // Initialize the collection
        public ICollection<CategoryComment>? CategoryComments { get; set; }
    }
}