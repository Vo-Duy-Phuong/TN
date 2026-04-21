using QLK.Application.DTOs.Auth;
using QLK.Infrastructure.Security;
using QLK.Infrastructure.Data;
using QLK.Infrastructure.Email;
using QLK.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace QLK.Application.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default);
    Task<bool> ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(string email, string resetCode, string newPassword, CancellationToken ct = default);
    
    // Security Questions
    Task<string?> GetSecurityQuestionAsync(string username, CancellationToken ct = default);
    Task<bool> SetSecurityQuestionAsync(Guid userId, string question, string answer, CancellationToken ct = default);
    Task<bool> ResetPasswordBySecurityQuestionAsync(ResetPasswordByQuestionDto request, CancellationToken ct = default);
    Task<bool> AdminResetPasswordAsync(Guid userId, string newPassword, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IStorageService _storageService;
    private readonly IEmailService _emailService;

    public AuthService(ApplicationDbContext context, IJwtService jwtService,
        IStorageService storageService, IEmailService emailService)
    {
        _context = context;
        _jwtService = jwtService;
        _storageService = storageService;
        _emailService = emailService;
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
            throw new UnauthorizedAccessException("Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.");

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

        if (newPassword.Length < 6)
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự.");

        user.PasswordHash = PasswordHasher.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted, ct);

        // Luôn trả về true để tránh lộ thông tin email có tồn tại không
        if (user == null) return true;

        // Tạo mã reset 6 chữ số
        var resetCode = new Random().Next(100000, 999999).ToString();
        user.PasswordResetCode = PasswordHasher.HashPassword(resetCode); // Lưu dạng hash
        user.PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync(ct);

        // Gửi email
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetCode, ct);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Không gửi được email reset password: {ex.Message}");
            // Vẫn trả về true để không lộ thông tin
        }

        return true;
    }

    public async Task<bool> ResetPasswordAsync(string email, string resetCode, string newPassword, CancellationToken ct = default)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted, ct);

        if (user == null) return false;

        if (string.IsNullOrEmpty(user.PasswordResetCode))
            throw new InvalidOperationException("Không có yêu cầu đặt lại mật khẩu nào đang chờ.");

        if (user.PasswordResetCodeExpiry == null || user.PasswordResetCodeExpiry < DateTime.UtcNow)
            throw new InvalidOperationException("Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.");

        if (!PasswordHasher.VerifyPassword(resetCode, user.PasswordResetCode))
            throw new ArgumentException("Mã đặt lại mật khẩu không chính xác.");

        if (newPassword.Length < 6)
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự.");

        user.PasswordHash = PasswordHasher.HashPassword(newPassword);
        user.PasswordResetCode = null;
        user.PasswordResetCodeExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        return true;
    }

    public async Task<string?> GetSecurityQuestionAsync(string username, CancellationToken ct = default)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Username == username && !u.IsDeleted, ct);
        
        return user?.SecurityQuestion;
    }

    public async Task<bool> SetSecurityQuestionAsync(Guid userId, string question, string answer, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return false;

        user.SecurityQuestion = question;
        user.SecurityAnswerHash = PasswordHasher.HashPassword(answer.Trim().ToLower());
        user.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ResetPasswordBySecurityQuestionAsync(ResetPasswordByQuestionDto request, CancellationToken ct = default)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Username == request.Username && !u.IsDeleted, ct);

        if (user == null || string.IsNullOrEmpty(user.SecurityAnswerHash))
            throw new InvalidOperationException("Người dùng chưa thiết lập câu hỏi bảo mật hoặc không tồn tại.");

        if (!PasswordHasher.VerifyPassword(request.SecurityAnswer.Trim().ToLower(), user.SecurityAnswerHash))
            throw new ArgumentException("Câu trả lời bảo mật không chính xác.");

        if (request.NewPassword.Length < 6)
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự.");

        user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> AdminResetPasswordAsync(Guid userId, string newPassword, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return false;

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
