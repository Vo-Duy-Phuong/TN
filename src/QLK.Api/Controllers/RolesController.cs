using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Auth;
using QLK.Application.DTOs.Role;
using QLK.Application.DTOs.Permission;
using QLK.Application.Services;
using QLK.Domain.Constants;
using QLK.Application.DTOs.User;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Roles.View)]
    public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles([FromQuery] RoleFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _roleService.GetRolesAsync(filter, ct);
        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Roles.View)]
    public async Task<ActionResult<RoleDto>> GetRole(Guid id, CancellationToken ct)
    {
        var role = await _roleService.GetRoleByIdAsync(id, ct);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Roles.Create)]
    public async Task<ActionResult<RoleDto>> CreateRole([FromBody] CreateRoleDto dto, CancellationToken ct)
    {
        var role = await _roleService.CreateRoleAsync(dto, ct);
        return CreatedAtAction(nameof(GetRole), new { id = role.Id }, role);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Roles.Edit)]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleDto dto, CancellationToken ct)
    {
        await _roleService.UpdateRoleAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Roles.Delete)]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken ct)
    {
        await _roleService.DeleteRoleAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/permissions")]
    [Authorize(CustomPermissions.Roles.AssignPermissions)]
    public async Task<IActionResult> AssignPermissions(Guid id, [FromBody] AssignPermissionsDto dto, CancellationToken ct)
    {
        await _roleService.AssignPermissionsToRoleAsync(id, dto, ct);
        return NoContent();
    }

    [HttpGet("{id}/users")]
    [Authorize(CustomPermissions.Roles.View)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetRoleUsers(Guid id, CancellationToken ct)
    {
        var users = await _roleService.GetRoleUsersAsync(id, ct);
        return Ok(users);
    }
}
