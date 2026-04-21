using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.GIS;
using QLK.Application.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GISController : ControllerBase
{
    private readonly IGISService _gisService;

    public GISController(IGISService gisService)
    {
        _gisService = gisService;
    }

    [HttpGet("markers")]
    public async Task<ActionResult<List<MapMarkerDto>>> GetMarkers()
    {
        return await _gisService.GetMapMarkersAsync();
    }

    [HttpGet("heatmap")]
    public async Task<ActionResult<List<HeatmapPointDto>>> GetHeatmap()
    {
        return await _gisService.GetHeatmapDataAsync();
    }

    [HttpGet("recommendations/{requestId}")]
    public async Task<ActionResult<List<DispatchRecommendationDto>>> GetRecommendations(Guid requestId)
    {
        return await _gisService.GetRecommendationsAsync(requestId);
    }

    [HttpPost("location")]
    public async Task<IActionResult> UpdateLocation([FromBody] LocationUpdateRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _gisService.UpdateTechnicianLocationAsync(Guid.Parse(userId), request.Latitude, request.Longitude);
        return Ok();
    }

    [HttpPost("seed-demo")]
    public async Task<IActionResult> SeedDemo()
    {
        // This is a helper to force-update coordinates if DB was already existing
        await _gisService.SeedDemoCoordinatesAsync();
        return Ok("Demo data seeded for Cao Lãnh.");
    }

    [HttpPost("refresh-geocoding")]
    public async Task<IActionResult> RefreshGeocoding()
    {
        await _gisService.RefreshAllGeocodingAsync();
        return Ok("Cập nhật lại toàn bộ tọa độ thành công.");
    }
}

public class LocationUpdateRequest
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}
