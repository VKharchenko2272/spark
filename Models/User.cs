using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace spark.Models
{
    public class User
    {
        public int? id { get; set; }
        public int? manager_id { get; set; }
        public string? email { get; set; }
        public DateTime? hired_date { get; set; }
        public string? company_role { get; set; }
        public string? username { get; set; }
        public string? password { get; set; }
        public bool is_admin { get; set; }
        public string? firstname { get; set; }
        public string? lastname { get; set; }

        public byte[]? img { get; set; }  // Storing image as byte array
        public int? department_id { get; set; } // Foreign Key

        [ForeignKey("department_id")]
        public Department? department { get; set; } //connection with department
    }
}