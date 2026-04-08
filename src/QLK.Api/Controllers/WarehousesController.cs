using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Warehouse;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarehousesController : ControllerBase
{
    private readonly IWarehouseService _warehouseService;

    public WarehousesController(IWarehouseService warehouseService)
    {
        _warehouseService = warehouseService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Warehouses.View)]
    public async Task<ActionResult<IEnumerable<WarehouseDto>>> GetWarehouses(CancellationToken ct)
    {
        var items = await _warehouseService.GetWarehousesAsync(ct);
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Warehouses.View)]
    public async Task<ActionResult<WarehouseDto>> GetWarehouse(Guid id, CancellationToken ct)
    {
        var warehouse = await _warehouseService.GetWarehouseByIdAsync(id, ct);
        if (warehouse == null) return NotFound();
        return Ok(warehouse);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Warehouses.Create)]
    public async Task<ActionResult<WarehouseDto>> CreateWarehouse([FromBody] CreateWarehouseDto dto, CancellationToken ct)
    {
        var warehouse = await _warehouseService.CreateWarehouseAsync(dto, ct);
        return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
    }

    [HttpPut("{id}")]
    [Authorize(CustomPermissions.Warehouses.Edit)]
    public async Task<IActionResult> UpdateWarehouse(Guid id, [FromBody] UpdateWarehouseDto dto, CancellationToken ct)
    {
        await _warehouseService.UpdateWarehouseAsync(id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Warehouses.Delete)]
    public async Task<IActionResult> DeleteWarehouse(Guid id, CancellationToken ct)
    {
        await _warehouseService.DeleteWarehouseAsync(id, ct);
        return NoContent();
    }
}
