using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Import;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImportsController : ControllerBase
{
    private readonly IImportService _importService;

    public ImportsController(IImportService importService)
    {
        _importService = importService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Imports.View)]
    public async Task<ActionResult<IEnumerable<ImportReceiptDto>>> GetImports([FromQuery] ImportFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _importService.GetImportsAsync(filter, ct);
        Response.Headers.Add("X-Total-Count", totalCount.ToString());
        return Ok(items);
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Imports.View)]
    public async Task<ActionResult<ImportReceiptDto>> GetImport(Guid id, CancellationToken ct)
    {
        var import = await _importService.GetImportByIdAsync(id, ct);
        if (import == null) return NotFound();
        return Ok(import);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Imports.Create)]
    public async Task<ActionResult<ImportReceiptDto>> CreateImport([FromBody] CreateImportReceiptDto dto, CancellationToken ct)
    {
        var import = await _importService.CreateImportAsync(dto, ct);
        return CreatedAtAction(nameof(GetImport), new { id = import.Id }, import);
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Imports.Delete)]
    public async Task<IActionResult> DeleteImport(Guid id, CancellationToken ct)
    {
        await _importService.DeleteImportAsync(id, ct);
        return NoContent();
    }
}
