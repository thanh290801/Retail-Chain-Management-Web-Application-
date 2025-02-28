using RCM.Backend.Models;

namespace RCM.Backend.Services
{
    public interface IJwtService
    {
        string GenerateToken(Account user);
    }
}
