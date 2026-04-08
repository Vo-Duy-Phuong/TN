using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Auth;
using QLK.Application.Services;
using System.Security.Claims;

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
}
