using System.Collections.Generic;
using System.Linq;
using RCM.Backend.Models;

namespace RCM.Backend.Services
{
    public class UserService : IUserService
    {
        private readonly RetailChainContext _context;

        public UserService(RetailChainContext context)
        {
            _context = context;
        }

        // ✅ Xác thực đăng nhập KHÔNG dùng hash
        public Account Authenticate(string username, string password)
        {
            var account = _context.Accounts.FirstOrDefault(u =>
                u.Username == username &&
                u.PasswordHash == password && // So sánh trực tiếp với dữ liệu trong DB
                u.IsActive == true);

            return account;
        }

        // ✅ Lấy tất cả tài khoản
        public IEnumerable<Account> GetAllAccounts()
        {
            return _context.Accounts.ToList();
        }

        // ✅ Lấy tài khoản theo ID
        public Account GetAccountById(int id)
        {
            return _context.Accounts.Find(id);
        }

        // ✅ Thêm tài khoản mới (KHÔNG mã hóa password)
        public bool AddAccount(Account account)
        {
            if (_context.Accounts.Any(u => u.Username == account.Username))
                return false; // Tên đăng nhập đã tồn tại

            _context.Accounts.Add(account);
            _context.SaveChanges();
            return true;
        }

        // ✅ Xóa tài khoản
        public bool DeleteAccount(int id)
        {
            var account = _context.Accounts.Find(id);
            if (account == null) return false;

            _context.Accounts.Remove(account);
            _context.SaveChanges();
            return true;
        }

        // ✅ Cập nhật tài khoản (KHÔNG mã hóa password)
        public bool UpdateAccount(Account account)
        {
            var existingAccount = _context.Accounts.Find(account.AccountId);
            if (existingAccount == null) return false;

            existingAccount.Username = account.Username;
            existingAccount.Role = account.Role;
            existingAccount.IsActive = account.IsActive;

            if (!string.IsNullOrEmpty(account.PasswordHash))
            {
                existingAccount.PasswordHash = account.PasswordHash; // Lưu password trực tiếp
            }

            _context.SaveChanges();
            return true;
        }
    }
}
