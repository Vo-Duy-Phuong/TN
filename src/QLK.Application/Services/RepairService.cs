using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Repair;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Domain.Interfaces;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IRepairService
{
    Task<(IEnumerable<RepairDto> Items, int TotalCount)> GetRepairsAsync(RepairFilterDto filter, CancellationToken ct = default);
    Task<RepairDto?> GetRepairByIdAsync(Guid id, CancellationToken ct = default);
    Task<RepairDto> CreateRepairAsync(CreateRepairDto dto, CancellationToken ct = default);
    Task UpdateRepairAsync(Guid id, UpdateRepairDto dto, CancellationToken ct = default);
    Task DeleteRepairAsync(Guid id, CancellationToken ct = default);
    Task<RepairStatsDto> GetStatsAsync(CancellationToken ct = default);
}

public class RepairService : IRepairService
{
    private readonly ApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public RepairService(ApplicationDbContext context, IStorageService storageService, INotificationService notificationService)
    {
        _context = context;
        _storageService = storageService;
        _notificationService = notificationService;
    }

    public async Task<(IEnumerable<RepairDto> Items, int TotalCount)> GetRepairsAsync(RepairFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Repairs
            .Include(r => r.Product)
            .Include(r => r.Technician)
            .AsQueryable();

        if (filter.ProductId.HasValue)
            query = query.Where(r => r.ProductId == filter.ProductId.Value);

        if (filter.TechnicianId.HasValue)
            query = query.Where(r => r.TechnicianId == filter.TechnicianId.Value);

        if (filter.Status.HasValue)
            query = query.Where(r => r.Status == filter.Status.Value);

        if (filter.StartDate.HasValue)
            query = query.Where(r => r.CreatedAt >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(r => r.CreatedAt <= filter.EndDate.Value);

        var totalCount = await query.CountAsync(ct);
        var repairs = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = new List<RepairDto>();
        foreach (var repair in repairs)
            dtos.Add(await MapToDtoAsync(repair));

        return (dtos, totalCount);
    }

    public async Task<RepairDto?> GetRepairByIdAsync(Guid id, CancellationToken ct = default)
    {
        var repair = await _context.Repairs
            .Include(r => r.Product)
            .Include(r => r.Technician)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        return repair == null ? null : await MapToDtoAsync(repair);
    }

    public async Task<RepairDto> CreateRepairAsync(CreateRepairDto dto, CancellationToken ct = default)
    {
        string? imageBeforePath = null;
        if (dto.ImageBeforeFile != null)
        {
            using var stream = dto.ImageBeforeFile.OpenReadStream();
            imageBeforePath = await _storageService.UploadFileAsync(
                stream, dto.ImageBeforeFile.FileName, dto.ImageBeforeFile.ContentType);
        }

        var repair = new Repair
        {
            Id = Guid.NewGuid(),
            ProductId = dto.ProductId,
            TechnicianId = dto.TechnicianId,
            Problem = dto.Problem,
            RepairNote = dto.RepairNote,
            ImageBefore = imageBeforePath,
            Status = RepairStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Repairs.AddAsync(repair, ct);
        await _context.SaveChangesAsync(ct);

        // Notify technician
        await _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto(
            dto.TechnicianId,
            "Bạn có thiết bị mới cần sửa chữa",
            $"Sản phẩm cần sửa: {dto.Problem ?? "Không có mô tả"}",
            Domain.Enums.NotificationType.System,
            $"/repairs/{repair.Id}",
            repair.Id,
            "Repair"
        ), ct);

        return await MapToDtoAsync(repair);
    }

    public async Task UpdateRepairAsync(Guid id, UpdateRepairDto dto, CancellationToken ct = default)
    {
        var repair = await _context.Repairs.FindAsync(new object[] { id }, ct);
        if (repair == null) throw new ArgumentException("Không tìm thấy thông tin sửa chữa.");

        var oldStatus = repair.Status;

        if (dto.ImageBeforeFile != null)
        {
            using var stream = dto.ImageBeforeFile.OpenReadStream();
            repair.ImageBefore = await _storageService.UploadFileAsync(
                stream, dto.ImageBeforeFile.FileName, dto.ImageBeforeFile.ContentType);
        }
        else if (dto.ImageBefore != null)
        {
            repair.ImageBefore = dto.ImageBefore;
        }

        if (dto.ImageAfterFile != null)
        {
            using var stream = dto.ImageAfterFile.OpenReadStream();
            repair.ImageAfter = await _storageService.UploadFileAsync(
                stream, dto.ImageAfterFile.FileName, dto.ImageAfterFile.ContentType);
        }
        else if (dto.ImageAfter != null)
        {
            repair.ImageAfter = dto.ImageAfter;
        }

        repair.Problem = dto.Problem ?? repair.Problem;
        repair.RepairNote = dto.RepairNote ?? repair.RepairNote;
        repair.Cost = dto.Cost ?? repair.Cost;
        repair.Status = dto.Status;
        repair.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        // Notify admin/manager when repair is completed
        if (oldStatus != RepairStatus.Completed && dto.Status == RepairStatus.Completed)
        {
            var repairWithProduct = await _context.Repairs
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.Id == id, ct);

            var managers = await _context.Users
                .Where(u => u.Role.Code == "ADMIN" || u.Role.Code == "WAREHOUSE_MANAGER")
                .Select(u => u.Id)
                .ToListAsync(ct);

            foreach (var managerId in managers)
            {
                await _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto(
                    managerId,
                    "Sửa chữa hoàn thành",
                    $"Sản phẩm '{repairWithProduct?.Product?.ProductName}' đã được sửa chữa xong.",
                    Domain.Enums.NotificationType.System,
                    $"/repairs/{id}",
                    id,
                    "Repair"
                ), ct);
            }
        }
    }

    public async Task DeleteRepairAsync(Guid id, CancellationToken ct = default)
    {
        var repair = await _context.Repairs.FindAsync(new object[] { id }, ct);
        if (repair == null) throw new ArgumentException("Không tìm thấy thông tin sửa chữa.");

        _context.Repairs.Remove(repair);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<RepairStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var stats = await _context.Repairs
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var totalCost = await _context.Repairs
            .Where(r => r.Cost.HasValue)
            .SumAsync(r => r.Cost!.Value, ct);

        return new RepairStatsDto(
            stats.FirstOrDefault(s => s.Status == RepairStatus.Pending)?.Count ?? 0,
            stats.FirstOrDefault(s => s.Status == RepairStatus.Repairing)?.Count ?? 0,
            stats.FirstOrDefault(s => s.Status == RepairStatus.Completed)?.Count ?? 0,
            stats.FirstOrDefault(s => s.Status == RepairStatus.Unrepairable)?.Count ?? 0,
            totalCost
        );
    }

    private async Task<RepairDto> MapToDtoAsync(Repair r)
    {
        var imageBeforeUrl = !string.IsNullOrEmpty(r.ImageBefore)
            ? await _storageService.GetFileUrlAsync(r.ImageBefore)
            : null;

        var imageAfterUrl = !string.IsNullOrEmpty(r.ImageAfter)
            ? await _storageService.GetFileUrlAsync(r.ImageAfter)
            : null;

        return new RepairDto(
            r.Id,
            r.ProductId,
            r.Product?.ProductName,
            r.TechnicianId,
            r.Technician?.FullName,
            r.Problem,
            r.RepairNote,
            r.Cost,
            imageBeforeUrl ?? r.ImageBefore,
            imageAfterUrl ?? r.ImageAfter,
            r.Status,
            GetStatusLabel(r.Status),
            r.CreatedAt,
            r.UpdatedAt
        );
    }

    private static string GetStatusLabel(RepairStatus status) => status switch
    {
        RepairStatus.Pending => "Chờ xử lý",
        RepairStatus.Repairing => "Đang sửa",
        RepairStatus.Completed => "Hoàn thành",
        RepairStatus.Unrepairable => "Không sửa được",
        _ => "Không xác định"
    };
}
