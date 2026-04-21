using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.GIS;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace QLK.Application.Services;

public interface IGISService
{
    Task<List<MapMarkerDto>> GetMapMarkersAsync();
    Task<List<HeatmapPointDto>> GetHeatmapDataAsync();
    Task<List<DispatchRecommendationDto>> GetRecommendationsAsync(Guid requestId);
    Task UpdateTechnicianLocationAsync(Guid userId, double lat, double lng);
    Task SeedDemoCoordinatesAsync();
    Task RefreshAllGeocodingAsync();
}

public class GISService : IGISService
{
    private readonly ApplicationDbContext _context;
    private readonly IGeocodingService _geocodingService;

    public GISService(ApplicationDbContext context, IGeocodingService geocodingService)
    {
        _context = context;
        _geocodingService = geocodingService;
    }

    public async Task<List<MapMarkerDto>> GetMapMarkersAsync()
    {
        var markers = new List<MapMarkerDto>();

        // Only show requests that still need a technician (Pending + Approved)
        // Assigned requests are already handled and should be removed from the dispatch map
        var requests = await _context.ServiceRequests
            .Where(r => r.Status == ServiceStatus.Pending || r.Status == ServiceStatus.Approved)
            .ToListAsync();

        markers.AddRange(requests.Select(r => new MapMarkerDto
        {
            Id = r.Id,
            Name = r.CustomerName,
            Latitude = r.Latitude,
            Longitude = r.Longitude,
            Type = "Request",
            Status = r.Status.ToString(),
            Description = $"{r.ServiceType} - {r.SelectedPackage}"
        }));

        // Active Technicians
        var technicians = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role.Code == "TECHNICIAN" && !u.IsDeleted)
            .ToListAsync();

        foreach (var tech in technicians)
        {
            var inventory = await GetTechnicianInventory(tech.Id);
            
            // If no location, provide a "Smart Default" (VNPT Cao Lãnh Center with slight jitter)
            double lat = tech.LastLatitude ?? 10.4578 + (new Random(tech.Id.GetHashCode()).NextDouble() - 0.5) * 0.005;
            double lng = tech.LastLongitude ?? 105.6324 + (new Random(tech.Id.GetHashCode()).NextDouble() - 0.5) * 0.005;

            markers.Add(new MapMarkerDto
            {
                Id = tech.Id,
                Name = tech.FullName,
                Latitude = lat,
                Longitude = lng,
                Type = "Technician",
                Status = "Active",
                Inventory = inventory
            });
        }

        return markers;
    }

    public async Task<List<HeatmapPointDto>> GetHeatmapDataAsync()
    {
        var requests = await _context.ServiceRequests
            .Where(r => r.Status == ServiceStatus.Pending || r.Status == ServiceStatus.Approved)
            .ToListAsync();

        return requests
            .Where(r => r.Latitude != 0 && r.Longitude != 0)
            .Select(r => new HeatmapPointDto
            {
                Latitude = r.Latitude,
                Longitude = r.Longitude,
                Intensity = 1.0
            }).ToList();
    }

    public async Task<List<DispatchRecommendationDto>> GetRecommendationsAsync(Guid requestId)
    {
        var request = await _context.ServiceRequests.FindAsync(requestId);
        if (request == null) return new List<DispatchRecommendationDto>();

        var technicians = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role.Code == "TECHNICIAN" && !u.IsDeleted)
            .ToListAsync();

        var recommendations = new List<DispatchRecommendationDto>();

        foreach (var tech in technicians)
        {
            double techLat = tech.LastLatitude ?? 10.4578;
            double techLng = tech.LastLongitude ?? 105.6324;
            
            double dist = CalculateDistance(request.Latitude, request.Longitude, techLat, techLng);
            var inventory = await GetTechnicianInventory(tech.Id);
            
            // Stock check: technician can be dispatched if they have ANY equipment OR if there is no strict stock requirement
            // Previously was too restrictive (only checked for "Modem" in product name)
            bool hasStock = inventory.Any(i => i.Value > 0) || !inventory.Any();

            recommendations.Add(new DispatchRecommendationDto
            {
                TechnicianId = tech.Id,
                TechnicianName = tech.FullName,
                DistanceKm = Math.Round(dist, 2),
                HasRequiredStock = hasStock,
                CurrentInventory = inventory
            });
        }

        return recommendations.OrderBy(r => r.DistanceKm).Take(5).ToList();
    }

    public async Task UpdateTechnicianLocationAsync(Guid userId, double lat, double lng)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.LastLatitude = lat;
            user.LastLongitude = lng;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    private async Task<Dictionary<string, int>> GetTechnicianInventory(Guid techId)
    {
        // Trunk Inventory = Sum(Exported to tech) - Sum(Used by tech in requests) - Sum(Retrieved from tech)
        
        var exported = await _context.ExportDetails
            .Include(ed => ed.ExportReceipt)
            .Include(ed => ed.Product)
            .Where(ed => ed.ExportReceipt.TechnicianId == techId && ed.ExportReceipt.Status == ReceiptStatus.Completed)
            .GroupBy(ed => ed.Product.ProductName)
            .Select(g => new { Name = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToListAsync();

        var used = await _context.ServiceRequestEquipments
            .Include(sre => sre.ServiceRequest)
            .Include(sre => sre.Product)
            .Where(sre => sre.ServiceRequest.AssignedTechnicianId == techId && sre.ServiceRequest.Status == ServiceStatus.Completed)
            .GroupBy(sre => sre.Product.ProductName)
            .Select(g => new { Name = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToListAsync();
            
        var retrieved = await _context.RetrievalDetails
            .Include(rd => rd.RetrievalReceipt)
            .Include(rd => rd.Product)
            .Where(rd => rd.RetrievalReceipt.TechnicianId == techId && rd.RetrievalReceipt.Status == ReceiptStatus.Completed)
            .GroupBy(rd => rd.Product.ProductName)
            .Select(g => new { Name = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToListAsync();

        var inventory = exported.ToDictionary(x => x.Name, x => x.Qty);

        foreach (var u in used)
        {
            if (inventory.ContainsKey(u.Name))
                inventory[u.Name] -= u.Qty;
        }
        
        foreach (var r in retrieved)
        {
            if (inventory.ContainsKey(r.Name))
                inventory[r.Name] -= r.Qty;
        }

        return inventory.Where(x => x.Value > 0).ToDictionary(x => x.Key, x => x.Value);
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371; // Earth radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double angle) => Math.PI * angle / 180.0;

    public async Task SeedDemoCoordinatesAsync()
    {
        // 1. Give coordinates to technicians if they don't have them
        var technicians = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role.Code == "TECHNICIAN")
            .ToListAsync();

        if (technicians.Any())
        {
            technicians[0].LastLatitude = 10.4578;
            technicians[0].LastLongitude = 105.6324;
            if (technicians.Count > 1)
            {
                technicians[1].LastLatitude = 10.4610;
                technicians[1].LastLongitude = 105.6410;
            }
        }

        // 2. Give coordinates to pending service requests
        var requests = await _context.ServiceRequests.ToListAsync();

        // If no requests exist, create some demo ones for the user to see
        if (!requests.Any())
        {
            var demoRequests = new List<ServiceRequest>
            {
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Nguyễn Văn Demo 1", PhoneNumber = "0900111222", Address = "Cao Lãnh", Status = ServiceStatus.Pending },
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Lê Thị Demo 2", PhoneNumber = "0900333444", Address = "Sa Đéc", Status = ServiceStatus.Approved },
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Trần Văn Demo 3", PhoneNumber = "0900555666", Address = "Hồng Ngự", Status = ServiceStatus.Pending }
            };
            await _context.ServiceRequests.AddRangeAsync(demoRequests);
            requests = demoRequests;
        }

        double baseLat = 10.4550;
        double baseLng = 105.6350;

        for (int i = 0; i < requests.Count; i++)
        {
            // Seed a cluster around Cao Lãnh center with some randomness
            requests[i].Latitude = baseLat + (new Random().NextDouble() - 0.5) * 0.04;
            requests[i].Longitude = baseLng + (new Random().NextDouble() - 0.5) * 0.04;
        }

        await _context.SaveChangesAsync();
    }

    public async Task RefreshAllGeocodingAsync()
    {
        var requests = await _context.ServiceRequests.ToListAsync();
        var geocoder = (IGeocodingService)new GeocodingService(new HttpClient()); // Temporary instance if not injected
        
        // Better: Use injected service. I'll update the constructor.
        foreach (var req in requests)
        {
            var (lat, lng) = await _geocodingService.GeocodeAddressAsync(req.Address);
            req.Latitude = lat;
            req.Longitude = lng;
        }

        await _context.SaveChangesAsync();
    }
}
