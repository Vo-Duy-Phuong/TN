using QLK.Application.DTOs.Auth;
using QLK.Infrastructure.Security;
using QLK.Infrastructure.Data;
using QLK.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

namespace QLK.Application.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IStorageService _storageService;

    public AuthService(ApplicationDbContext context, IJwtService jwtService, IStorageService storageService)
    {
        _context = context;
        _jwtService = jwtService;
        _storageService = storageService;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        var user = await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Username == request.Username, ct);

        if (user == null) return null;

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Tài khoản đang bị khóa.");

        if (user.IsDeleted)
            throw new UnauthorizedAccessException("Tài khoản không tồn tại.");

        if (!PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            return null;

        var token = _jwtService.GenerateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            User = await MapToUserDtoAsync(user)
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        return user == null ? null : await MapToUserDtoAsync(user);
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);
        if (user == null || !user.IsActive) return false;

        if (!PasswordHasher.VerifyPassword(currentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = PasswordHasher.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    private async Task<UserDto> MapToUserDtoAsync(Domain.Entities.User user)
    {
        var avatarUrl = !string.IsNullOrEmpty(user.Avatar) 
            ? await _storageService.GetFileUrlAsync(user.Avatar) 
            : null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Avatar = avatarUrl ?? user.Avatar,
            RoleId = user.RoleId,
            RoleCode = user.Role?.Code ?? "",
            RoleName = user.Role?.Name ?? "",
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Permissions = user.Role?.RolePermissions?
                .Where(rp => !rp.Permission.IsDeleted)
                .Select(rp => rp.Permission.Code)
                .ToList() ?? new List<string>()
        };
    }
}
