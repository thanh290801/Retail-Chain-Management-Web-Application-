

using System.ComponentModel.DataAnnotations;

namespace RCM.Backend.DTOs
{
    public class SupplierDto
    {
        public int SuppliersId { get; set; }
        [Required]
        public string? Name { get; set; }
        public string? TaxCode { get; set; }
        public string? Website { get; set; }
        [Required]
        [EmailAddress]
        public string? Email { get; set; }
        [Required]
        [Phone]
        public string? Phone { get; set; }

        public string? Fax { get; set; }

        [Required]
        public string? Address { get; set; }             
           
        
        [Required]
        public string? ContactPerson { get; set; }
        [Required]
        public string? R_Phone { get; set; }
        
    }
}
