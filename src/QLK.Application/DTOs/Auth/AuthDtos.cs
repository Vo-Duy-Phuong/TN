namespace QLK.Application.DTOs.Auth;

public class LoginRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Avatar { get; set; }
    public Guid RoleId { get; set; }
    public string RoleCode { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string ResetCode { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class SetSecurityQuestionDto
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

public class VerifySecurityQuestionDto
{
    public string Username { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

public class ResetPasswordByQuestionDto
{
    public string Username { get; set; } = string.Empty;
    public string SecurityAnswer { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class AdminResetPasswordDto
{
    public Guid UserId { get; set; }
    public string NewPassword { get; set; } = string.Empty;
}
