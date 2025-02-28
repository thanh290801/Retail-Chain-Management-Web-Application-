
using System.ComponentModel.DataAnnotations;

    namespace RCM.Backend.Models
    {
    public class Account
    {
        public int AccountID { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; } // "Chủ" hoặc "Nhân viên"
        public bool IsActive { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }

}
