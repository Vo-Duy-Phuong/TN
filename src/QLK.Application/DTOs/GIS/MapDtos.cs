using System;
using System.Collections.Generic;

namespace QLK.Application.DTOs.GIS;

public class MapMarkerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Type { get; set; } = string.Empty; // "Request", "Technician"
    public string Status { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Dictionary<string, int>? Inventory { get; set; } // Only for Technicians
}

public class HeatmapPointDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Intensity { get; set; }
}

public class DispatchRecommendationDto
{
    public Guid TechnicianId { get; set; }
    public string TechnicianName { get; set; } = string.Empty;
    public double DistanceKm { get; set; }
    public bool HasRequiredStock { get; set; }
    public Dictionary<string, int> CurrentInventory { get; set; } = new();
}
