using RCM.Backend.Models;
using System.Collections.Generic;

namespace RCM.Backend.Services
{
    public interface IUserService
    {
        Account Authenticate(string username, string password);
        IEnumerable<Account> GetAllAccounts();
        Account GetAccountById(int id);
        bool AddAccount(Account account);
        bool DeleteAccount(int id);
        bool UpdateAccount(Account account);
    }
}
