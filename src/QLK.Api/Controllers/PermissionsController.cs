using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Permission;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;

    public PermissionsController(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Permissions.View)]
    public async Task<ActionResult<IEnumerable<PermissionDto>>> GetPermissions(CancellationToken ct)
    {
        var items = await _permissionService.GetPermissionsAsync(ct);
        return Ok(items);
    }

    [HttpGet("categories")]
    [Authorize(CustomPermissions.Permissions.View)]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories(CancellationToken ct)
    {
        var items = await _permissionService.GetCategoriesAsync(ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Permissions.View)]
    public async Task<ActionResult<PermissionDto>> GetPermission(Guid id, CancellationToken ct)
    {
        var p = await _permissionService.GetPermissionByIdAsync(id, ct);
        if (p == null) return NotFound();
        return Ok(p);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Permissions.Create)]
    public async Task<ActionResult<PermissionDto>> CreatePermission([FromBody] CreatePermissionDto dto, CancellationToken ct)
    {
        var p = await _permissionService.CreatePermissionAsync(dto, ct);
        return CreatedAtAction(nameof(GetPermission), new { id = p.Id }, p);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Permissions.Edit)]
    public async Task<IActionResult> UpdatePermission(Guid id, [FromBody] UpdatePermissionDto dto, CancellationToken ct)
    {
        await _permissionService.UpdatePermissionAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Permissions.Delete)]
    public async Task<IActionResult> DeletePermission(Guid id, CancellationToken ct)
    {
        await _permissionService.DeletePermissionAsync(id, ct);
        return NoContent();
    }
}
