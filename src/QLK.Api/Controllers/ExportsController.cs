using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Export;
using QLK.Application.Services;
using QLK.Domain.Constants;
using System.Security.Claims;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExportsController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportsController(IExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Exports.View)]
    public async Task<ActionResult<IEnumerable<ExportReceiptDto>>> GetExports([FromQuery] ExportFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _exportService.GetExportsAsync(filter, ct);
        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Exports.View)]
    public async Task<ActionResult<ExportReceiptDto>> GetExport(Guid id, CancellationToken ct)
    {
        var export = await _exportService.GetExportByIdAsync(id, ct);
        if (export == null) return NotFound();
        return Ok(export);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Exports.Create)]
    public async Task<ActionResult<ExportReceiptDto>> CreateExport([FromBody] CreateExportReceiptDto dto, CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var export = await _exportService.CreateExportAsync(dto, userId, ct);
        return CreatedAtAction(nameof(GetExport), new { id = export.Id }, export);
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Exports.Delete)]
    public async Task<IActionResult> DeleteExport(Guid id, CancellationToken ct)
    {
        await _exportService.DeleteExportAsync(id, ct);
        return NoContent();
    }
}
