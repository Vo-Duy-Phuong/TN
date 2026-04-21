using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Service;
using QLK.Application.Services;
using System.Security.Claims;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceRequestsController : ControllerBase
{
    private readonly IServiceRequestService _service;

    public ServiceRequestsController(IServiceRequestService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get([FromQuery] ServiceRequestFilterDto filter)
    {
        var result = await _service.GetRequestsAsync(filter);
        Response.Headers.Add("X-Total-Count", result.TotalCount.ToString());
        return Ok(result.Items);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _service.GetByIdAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [AllowAnonymous] // Cho phép khách hàng đăng ký không cần login
    public async Task<IActionResult> Create(CreateServiceRequestDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}/process")]
    [Authorize]
    public async Task<IActionResult> Process(Guid id, ProcessServiceRequestDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        await _service.UpdateStatusAsync(id, dto, Guid.Parse(userIdClaim));
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }

    [HttpPut("{id}/assign")]
    [Authorize]
    public async Task<IActionResult> Assign(Guid id, [FromBody] AssignTechnicianRequest request)
    {
        await _service.AssignTechnicianAsync(id, request.TechnicianId);
        return NoContent();
    }
}

public class AssignTechnicianRequest
{
    public Guid TechnicianId { get; set; }
}
