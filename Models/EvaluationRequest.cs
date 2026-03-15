using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace spark.Models
{
    public class EvaluationRequest
    {
        public int UserId { get; set; }  // Matches 'userId' in the payload
        public int DepartmentId { get; set; }  // Matches 'departmentId' in the payload
        public int ManagerId { get; set; }  // Matches 'managerId' in the payload

        public List<EvaluationOptionDto>? EvaluationOptions { get; set; }  // Matches 'EvaluationOptions' in the payload
        public List<CategoryCommentDto>? CategoryComments { get; set; }  // Matches 'categoryComments' in the payload

        // public ICollection<EvaluationOptionDto>? EvaluationOptions { get; set; } = new List<EvaluationOptionDto>();
        // public ICollection<CategoryCommentDto>? CategoryComments { get; set; } = new List<CategoryCommentDto>();
    }


    public class EvaluationOptionDto
    {
        public int TopicId { get; set; }
        public string? Comment { get; set; }
        public int Score { get; set; }
        public int FormId { get; set; }
    }

    public class CategoryCommentDto
    {
        public int CategoryId { get; set; }
        public string? Comment { get; set; }
        public int FormId { get; set; }
    }

}