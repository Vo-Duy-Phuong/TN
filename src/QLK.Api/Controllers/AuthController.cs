using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Auth;
using QLK.Application.Services;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var response = await _authService.LoginAsync(request, ct);
        if (response == null)
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không chính xác." });

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetMe(CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId, ct);
        if (user == null) return NotFound();

        return Ok(user);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request, CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var result = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword, ct);
        if (!result)
            return BadRequest(new { message = "Mật khẩu hiện tại không chính xác hoặc không thể đổi mật khẩu." });

        return Ok(new { message = "Đổi mật khẩu thành công." });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Vui lòng nhập địa chỉ email." });

        await _authService.ForgotPasswordAsync(request.Email.Trim(), ct);
        // Luôn trả về OK để tránh lộ thông tin email có tồn tại không
        return Ok(new { message = "Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi. Vui lòng kiểm tra hộp thư." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.ResetCode) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { message = "Vui lòng điền đầy đủ thông tin." });

        try
        {
            var result = await _authService.ResetPasswordAsync(request.Email.Trim(), request.ResetCode.Trim(), request.NewPassword, ct);
            if (!result)
                return BadRequest(new { message = "Không tìm thấy tài khoản với email này." });

            return Ok(new { message = "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("security-question/{username}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSecurityQuestion(string username, CancellationToken ct)
    {
        var question = await _authService.GetSecurityQuestionAsync(username, ct);
        if (string.IsNullOrEmpty(question))
            return NotFound(new { message = "Người dùng chưa thiết lập câu hỏi bảo mật hoặc không tồn tại." });

        return Ok(new { question });
    }

    [HttpPost("set-security-question")]
    [Authorize]
    public async Task<IActionResult> SetSecurityQuestion([FromBody] SetSecurityQuestionDto request, CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var result = await _authService.SetSecurityQuestionAsync(userId, request.Question, request.Answer, ct);
        if (!result) return BadRequest(new { message = "Không thể thiết lập câu hỏi bảo mật." });

        return Ok(new { message = "Thiết lập câu hỏi bảo mật thành công." });
    }

    [HttpPost("reset-password-by-question")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPasswordByQuestion([FromBody] ResetPasswordByQuestionDto request, CancellationToken ct)
    {
        try
        {
            var result = await _authService.ResetPasswordBySecurityQuestionAsync(request, ct);
            return Ok(new { message = "Đặt lại mật khẩu thành công!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("admin/reset-password")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> AdminResetPassword([FromBody] AdminResetPasswordDto request, CancellationToken ct)
    {
        var result = await _authService.AdminResetPasswordAsync(request.UserId, request.NewPassword, ct);
        if (!result) return BadRequest(new { message = "Không thể đặt lại mật khẩu cho người dùng này." });

        return Ok(new { message = "Đặt lại mật khẩu thành công!" });
    }
}
