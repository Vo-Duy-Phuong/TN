using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs;
using QLK.Application.Services;
using QLK.Domain.Constants;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditLogsController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetLogs([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var result = await _auditService.GetLogsAsync(pageNumber, pageSize, ct);
        return Ok(result);
    }
}
