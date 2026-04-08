using QLK.Domain.Entities;

namespace QLK.Infrastructure.Security;

public interface IJwtService
{
    string GenerateToken(User user);
    Guid? ValidateToken(string token);
    Guid? GetUserIdFromToken(string token);
}
