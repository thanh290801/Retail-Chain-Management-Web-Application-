using System.Collections.Generic;
using System.Linq;
using RCM.Backend.Models;

namespace RCM.Backend.Services
{
    public class UserService : IUserService
    {
        private readonly RCMDbContext _context;

        public UserService(RCMDbContext context)
        {
            _context = context;
        }

        // Xác thực đăng nhập
        public Account Authenticate(string username, string password)
        {
            var account = _context.Account.FirstOrDefault(u =>
                u.Username == username &&
                u.PasswordHash == password &&
                u.IsActive);

            return account;
        }

        // Lấy tất cả tài khoản
        public IEnumerable<Account> GetAllAccounts()
        {
            return _context.Account.ToList();
        }

        // Lấy tài khoản theo ID
        public Account GetAccountById(int id)
        {
            return _context.Account.Find(id);
        }

        // Thêm tài khoản mới
        public bool AddAccount(Account account)
        {
            if (_context.Account.Any(u => u.Username == account.Username))
                return false; // Tên đăng nhập đã tồn tại

            _context.Account.Add(account);
            _context.SaveChanges();
            return true;
        }

        // Xóa tài khoản
        public bool DeleteAccount(int id)
        {
            var account = _context.Account.Find(id);
            if (account == null) return false;

            _context.Account.Remove(account);
            _context.SaveChanges();
            return true;
        }

        // Cập nhật tài khoản
        public bool UpdateAccount(Account account)
        {
            var existingAccount = _context.Account.Find(account.AccountID);
            if (existingAccount == null) return false;

            existingAccount.Username = account.Username;
            existingAccount.PasswordHash = account.PasswordHash;
            existingAccount.Role = account.Role;
            existingAccount.IsActive = account.IsActive;

            _context.SaveChanges();
            return true;
        }
    }
}
