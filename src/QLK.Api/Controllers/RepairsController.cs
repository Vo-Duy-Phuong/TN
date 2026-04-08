using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Repair;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RepairsController : ControllerBase
{
    private readonly IRepairService _repairService;

    public RepairsController(IRepairService repairService)
    {
        _repairService = repairService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Repairs.View)]
    public async Task<ActionResult<IEnumerable<RepairDto>>> GetRepairs([FromQuery] RepairFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _repairService.GetRepairsAsync(filter, ct);
        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Repairs.View)]
    public async Task<ActionResult<RepairDto>> GetRepair(Guid id, CancellationToken ct)
    {
        var repair = await _repairService.GetRepairByIdAsync(id, ct);
        if (repair == null) return NotFound();
        return Ok(repair);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Repairs.Create)]
    public async Task<ActionResult<RepairDto>> CreateRepair([FromBody] CreateRepairDto dto, CancellationToken ct)
    {
        var repair = await _repairService.CreateRepairAsync(dto, ct);
        return CreatedAtAction(nameof(GetRepair), new { id = repair.Id }, repair);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Repairs.Edit)]
    public async Task<IActionResult> UpdateRepair(Guid id, [FromBody] UpdateRepairDto dto, CancellationToken ct)
    {
        await _repairService.UpdateRepairAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Repairs.Delete)]
    public async Task<IActionResult> DeleteRepair(Guid id, CancellationToken ct)
    {
        await _repairService.DeleteRepairAsync(id, ct);
        return NoContent();
    }
}
