using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs;
using QLK.Application.DTOs.Retrieval;
using QLK.Application.Services;
using QLK.Domain.Constants;
using System.Security.Claims;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RetrievalsController : ControllerBase
{
    private readonly IRetrievalService _retrievalService;

    public RetrievalsController(IRetrievalService retrievalService)
    {
        _retrievalService = retrievalService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Retrievals.View)]
    public async Task<ActionResult<PagedResult<RetrievalReceiptDto>>> GetRetrievals([FromQuery] RetrievalFilterDto filter, CancellationToken ct)
    {
        var (items, totalCount) = await _retrievalService.GetRetrievalsAsync(filter, ct);
        return Ok(new PagedResult<RetrievalReceiptDto>(items, totalCount));
    }

    [HttpGet("{id}")]
    [Authorize(CustomPermissions.Retrievals.View)]
    public async Task<ActionResult<RetrievalReceiptDto>> GetRetrieval(Guid id, CancellationToken ct)
    {
        var retrieval = await _retrievalService.GetRetrievalByIdAsync(id, ct);
        if (retrieval == null) return NotFound();
        return Ok(retrieval);
    }

    [HttpPost]
    [Authorize(CustomPermissions.Retrievals.Create)]
    public async Task<ActionResult<RetrievalReceiptDto>> CreateRetrieval([FromBody] CreateRetrievalDto dto, CancellationToken ct)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var retrieval = await _retrievalService.CreateRetrievalAsync(dto, userId, ct);
        return CreatedAtAction(nameof(GetRetrieval), new { id = retrieval.Id }, retrieval);
    }

    [HttpDelete("{id}")]
    [Authorize(CustomPermissions.Retrievals.Delete)]
    public async Task<IActionResult> DeleteRetrieval(Guid id, CancellationToken ct)
    {
        await _retrievalService.DeleteRetrievalAsync(id, ct);
        return NoContent();
    }
}
