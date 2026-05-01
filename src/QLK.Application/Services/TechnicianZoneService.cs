using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.TechnicianZone;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface ITechnicianZoneService
{
    /// <summary>Lấy toàn bộ phân công (Admin/Manager view)</summary>
    Task<IEnumerable<TechnicianZoneDto>> GetAllZonesAsync(CancellationToken ct = default);

    /// <summary>Lấy danh sách phường của 1 kỹ thuật viên</summary>
    Task<TechnicianZoneSummaryDto> GetZonesByTechnicianAsync(Guid technicianId, CancellationToken ct = default);

    /// <summary>
    /// Cập nhật toàn bộ phường của 1 kỹ thuật viên (replace strategy).
    /// Gửi mảng rỗng để xóa hết phân công.
    /// </summary>
    Task<TechnicianZoneSummaryDto> UpdateTechnicianZonesAsync(Guid technicianId, UpdateTechnicianZonesDto dto, CancellationToken ct = default);

    /// <summary>Lấy danh sách KTV phụ trách 1 phường cụ thể</summary>
    Task<IEnumerable<TechnicianZoneDto>> GetTechniciansByWardAsync(string wardName, CancellationToken ct = default);

    /// <summary>Lấy summary phân công cho nhiều KTV (dùng cho User Card list)</summary>
    Task<IEnumerable<TechnicianZoneSummaryDto>> GetZonesSummaryForTechniciansAsync(IEnumerable<Guid> technicianIds, CancellationToken ct = default);
}

public class TechnicianZoneService : ITechnicianZoneService
{
    private readonly ApplicationDbContext _context;

    public TechnicianZoneService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TechnicianZoneDto>> GetAllZonesAsync(CancellationToken ct = default)
    {
        var zones = await _context.TechnicianZones
            .Include(tz => tz.Technician)
            .OrderBy(tz => tz.Technician.FullName)
            .ThenBy(tz => tz.WardName)
            .ToListAsync(ct);

        return zones.Select(MapToDto);
    }

    public async Task<TechnicianZoneSummaryDto> GetZonesByTechnicianAsync(Guid technicianId, CancellationToken ct = default)
    {
        var zones = await _context.TechnicianZones
            .Where(tz => tz.TechnicianId == technicianId)
            .OrderBy(tz => tz.WardName)
            .ToListAsync(ct);

        return new TechnicianZoneSummaryDto
        {
            TechnicianId = technicianId,
            WardNames = zones.Select(tz => tz.WardName).ToList()
        };
    }

    public async Task<TechnicianZoneSummaryDto> UpdateTechnicianZonesAsync(Guid technicianId, UpdateTechnicianZonesDto dto, CancellationToken ct = default)
    {
        // Kiểm tra technician tồn tại
        var technician = await _context.Users.FindAsync(new object[] { technicianId }, ct);
        if (technician == null)
            throw new ArgumentException("Không tìm thấy kỹ thuật viên.");

        // Xóa toàn bộ phân công cũ của KTV này
        var existing = await _context.TechnicianZones
            .Where(tz => tz.TechnicianId == technicianId)
            .ToListAsync(ct);
        _context.TechnicianZones.RemoveRange(existing);

        // Thêm phân công mới (loại bỏ trùng lặp)
        var uniqueWards = dto.WardNames
            .Where(w => !string.IsNullOrWhiteSpace(w))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var newZones = uniqueWards.Select(ward => new TechnicianZone
        {
            Id = Guid.NewGuid(),
            TechnicianId = technicianId,
            WardName = ward.Trim(),
            District = "TP. Cao Lãnh",
            Province = "Đồng Tháp",
            AssignedAt = DateTime.UtcNow
        }).ToList();

        await _context.TechnicianZones.AddRangeAsync(newZones, ct);
        await _context.SaveChangesAsync(ct);

        return new TechnicianZoneSummaryDto
        {
            TechnicianId = technicianId,
            WardNames = newZones.Select(tz => tz.WardName).OrderBy(w => w).ToList()
        };
    }

    public async Task<IEnumerable<TechnicianZoneDto>> GetTechniciansByWardAsync(string wardName, CancellationToken ct = default)
    {
        var zones = await _context.TechnicianZones
            .Include(tz => tz.Technician)
            .Where(tz => tz.WardName.ToLower() == wardName.ToLower())
            .OrderBy(tz => tz.Technician.FullName)
            .ToListAsync(ct);

        return zones.Select(MapToDto);
    }

    public async Task<IEnumerable<TechnicianZoneSummaryDto>> GetZonesSummaryForTechniciansAsync(IEnumerable<Guid> technicianIds, CancellationToken ct = default)
    {
        var idList = technicianIds.ToList();
        var zones = await _context.TechnicianZones
            .Where(tz => idList.Contains(tz.TechnicianId))
            .ToListAsync(ct);

        return idList.Select(id => new TechnicianZoneSummaryDto
        {
            TechnicianId = id,
            WardNames = zones
                .Where(tz => tz.TechnicianId == id)
                .Select(tz => tz.WardName)
                .OrderBy(w => w)
                .ToList()
        });
    }

    private static TechnicianZoneDto MapToDto(TechnicianZone tz) => new()
    {
        Id = tz.Id,
        TechnicianId = tz.TechnicianId,
        TechnicianName = tz.Technician?.FullName ?? string.Empty,
        WardName = tz.WardName,
        District = tz.District,
        Province = tz.Province,
        AssignedAt = tz.AssignedAt
    };
}
