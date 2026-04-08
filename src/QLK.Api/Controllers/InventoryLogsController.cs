using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Inventory;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryLogsController : ControllerBase
{
    private readonly IInventoryLogService _inventoryLogService;

    public InventoryLogsController(IInventoryLogService inventoryLogService)
    {
        _inventoryLogService = inventoryLogService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.InventoryLogs.View)]
    public async Task<ActionResult<IEnumerable<InventoryLogDto>>> GetLogs([FromQuery] InventoryLogFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _inventoryLogService.GetLogsAsync(filter, ct);
        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(items);
    }
}
