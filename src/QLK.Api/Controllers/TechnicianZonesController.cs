using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.TechnicianZone;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TechnicianZonesController : ControllerBase
{
    private readonly ITechnicianZoneService _zoneService;

    public TechnicianZonesController(ITechnicianZoneService zoneService)
    {
        _zoneService = zoneService;
    }

    /// <summary>
    /// Lấy toàn bộ phân công tuyến (Admin / Manager).
    /// </summary>
    [HttpGet]
    [Authorize(CustomPermissions.Users.View)]
    public async Task<ActionResult<IEnumerable<TechnicianZoneDto>>> GetAll(CancellationToken ct)
    {
        var zones = await _zoneService.GetAllZonesAsync(ct);
        return Ok(zones);
    }

    /// <summary>
    /// Lấy danh sách phường của 1 kỹ thuật viên theo ID.
    /// </summary>
    [HttpGet("{technicianId:guid}")]
    [Authorize(CustomPermissions.Users.View)]
    public async Task<ActionResult<TechnicianZoneSummaryDto>> GetByTechnician(Guid technicianId, CancellationToken ct)
    {
        var summary = await _zoneService.GetZonesByTechnicianAsync(technicianId, ct);
        return Ok(summary);
    }

    /// <summary>
    /// Cập nhật toàn bộ tuyến phường cho 1 kỹ thuật viên (replace strategy).
    /// Body: { "wardNames": ["Phường 1", "Mỹ Phú"] }
    /// </summary>
    [HttpPut("{technicianId:guid}")]
    [Authorize(CustomPermissions.Users.Edit)]
    public async Task<ActionResult<TechnicianZoneSummaryDto>> UpdateZones(
        Guid technicianId,
        [FromBody] UpdateTechnicianZonesDto dto,
        CancellationToken ct)
    {
        try
        {
            var result = await _zoneService.UpdateTechnicianZonesAsync(technicianId, dto, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách KTV phụ trách một phường cụ thể.
    /// Dùng để gợi ý khi Admin gán yêu cầu dịch vụ.
    /// </summary>
    [HttpGet("ward/{wardName}")]
    [Authorize(CustomPermissions.Users.View)]
    public async Task<ActionResult<IEnumerable<TechnicianZoneDto>>> GetByWard(string wardName, CancellationToken ct)
    {
        var zones = await _zoneService.GetTechniciansByWardAsync(wardName, ct);
        return Ok(zones);
    }

    /// <summary>
    /// Lấy summary phân công cho nhiều KTV (batch).
    /// Query: ?ids=guid1&amp;ids=guid2
    /// </summary>
    [HttpGet("summary")]
    [Authorize(CustomPermissions.Users.View)]
    public async Task<ActionResult<IEnumerable<TechnicianZoneSummaryDto>>> GetSummaryBatch(
        [FromQuery] List<Guid> ids,
        CancellationToken ct)
    {
        if (!ids.Any()) return Ok(Enumerable.Empty<TechnicianZoneSummaryDto>());
        var summaries = await _zoneService.GetZonesSummaryForTechniciansAsync(ids, ct);
        return Ok(summaries);
    }
}
