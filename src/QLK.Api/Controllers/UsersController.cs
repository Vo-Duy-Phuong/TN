using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Auth;
using QLK.Application.DTOs.User;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Users.View)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery] UserFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _userService.GetUsersAsync(filter, ct);
        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Users.View)]
    public async Task<ActionResult<UserDto>> GetUser(Guid id, CancellationToken ct)
    {
        var user = await _userService.GetUserByIdAsync(id, ct);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Users.Create)]
    public async Task<ActionResult<UserDto>> CreateUser([FromForm] CreateUserDto dto, CancellationToken ct)
    {
        var user = await _userService.CreateUserAsync(dto, ct);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Users.Edit)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromForm] UpdateUserDto dto, CancellationToken ct)
    {
        await _userService.UpdateUserAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Users.Delete)]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        await _userService.DeleteUserAsync(id, ct);
        return NoContent();
    }

    [HttpPatch("{id}/password")]
    [Authorize(CustomPermissions.Users.Edit)]
    public async Task<IActionResult> UpdatePassword(Guid id, [FromBody] string newPassword, CancellationToken ct)
    {
        await _userService.UpdatePasswordAsync(id, newPassword, ct);
        return NoContent();
    }

    [HttpPatch("{id}/avatar")]
    [Authorize]
    public async Task<IActionResult> UpdateAvatar(Guid id, [FromBody] string? avatar, CancellationToken ct)
    {
        // Only admin or the user themselves can update avatar
        var currentUserId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        if (currentUserId != id && !User.IsInRole("ADMIN")) // Basic check, better to use permission
            return Forbid();

        await _userService.UpdateAvatarAsync(id, avatar, ct);
        return NoContent();
    }
}
