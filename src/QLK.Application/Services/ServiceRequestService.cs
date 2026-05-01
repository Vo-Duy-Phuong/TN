using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Service;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;
using QLK.Infrastructure.Email;
using QLK.Application.DTOs.Notifications;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace QLK.Application.Services;

public interface IServiceRequestService
{
    Task<(IEnumerable<ServiceRequestDto> Items, int TotalCount)> GetRequestsAsync(ServiceRequestFilterDto filter, CancellationToken ct = default);
    Task<ServiceRequestDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ServiceRequestDto> CreateAsync(CreateServiceRequestDto dto, CancellationToken ct = default);
    Task UpdateStatusAsync(Guid id, ProcessServiceRequestDto dto, Guid userId, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task AssignTechnicianAsync(Guid id, Guid technicianId, CancellationToken ct = default);
}

public class ServiceRequestService : IServiceRequestService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly IGeocodingService _geocodingService;

    public ServiceRequestService(
        ApplicationDbContext context, 
        IAuditService auditService,
        INotificationService notificationService,
        IEmailService emailService,
        IGeocodingService geocodingService)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
        _emailService = emailService;
        _geocodingService = geocodingService;
    }

    public async Task<(IEnumerable<ServiceRequestDto> Items, int TotalCount)> GetRequestsAsync(ServiceRequestFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.ServiceRequests
            .Include(x => x.AssignedTechnician)
            .Include(x => x.ProcessedBy)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(x => x.CustomerName.ToLower().Contains(search) 
                || x.PhoneNumber.Contains(search)
                || x.Address.ToLower().Contains(search));
        }

        if (filter.Status.HasValue)
            query = query.Where(x => x.Status == filter.Status.Value);

        if (filter.AssignedTechnicianId.HasValue)
            query = query.Where(x => x.AssignedTechnicianId == filter.AssignedTechnicianId.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapToDto);
        return (dtos, totalCount);
    }

    public async Task<ServiceRequestDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var item = await _context.ServiceRequests
            .Include(x => x.AssignedTechnician)
            .Include(x => x.ProcessedBy)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        return item == null ? null : MapToDto(item);
    }

    public async Task<ServiceRequestDto> CreateAsync(CreateServiceRequestDto dto, CancellationToken ct = default)
    {
        var request = new ServiceRequest
        {
            Id = Guid.NewGuid(),
            CustomerName = dto.CustomerName,
            PhoneNumber = dto.PhoneNumber,
            Address = dto.Address,
            ServiceType = dto.ServiceType,
            SelectedPackage = dto.SelectedPackage,
            Description = dto.Description,
            Status = ServiceStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        // Manual or Automatic Geocoding
        if (dto.Latitude.HasValue && dto.Longitude.HasValue)
        {
            request.Latitude = dto.Latitude.Value;
            request.Longitude = dto.Longitude.Value;
        }
        else
        {
            var (lat, lng) = await _geocodingService.GeocodeAddressAsync(dto.Address, ct);
            
            // Smart Fallback: If geocoding returns (0,0), put it near city center with jitter 
            // so dispatcher can see it and manually adjust later
            if (lat == 0 && lng == 0)
            {
                lat = 10.4578 + (new Random().NextDouble() - 0.5) * 0.02;
                lng = 105.6324 + (new Random().NextDouble() - 0.5) * 0.02;
            }
            
            request.Latitude = lat;
            request.Longitude = lng;
        }

        await _context.ServiceRequests.AddAsync(request, ct);
        await _context.SaveChangesAsync(ct);
        
        await _auditService.LogAsync("Gửi yêu cầu", "ServiceRequest", request.Id.ToString(), $"Khách hàng {dto.CustomerName} đăng ký dịch vụ {dto.ServiceType}", ct);
        
        // Notify Admins and Warehouse Managers about the new request
        try
        {
            var staffRoles = new[] { DbInitializer.AdminRoleId, DbInitializer.WarehouseManagerRoleId };
            var staffUsers = await _context.Users
                .Where(u => staffRoles.Contains(u.RoleId) && u.IsActive)
                .ToListAsync(ct);

            foreach (var staff in staffUsers)
            {
                await _notificationService.CreateAndSendAsync(new CreateNotificationDto(
                    staff.Id,
                    "Yêu cầu dịch vụ mới",
                    $"Khách hàng {dto.CustomerName} vừa đăng ký dịch vụ {dto.ServiceType}",
                    NotificationType.System,
                    "/service-requests",
                    request.Id,
                    "ServiceRequest"
                ), ct);
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail the registration
            Console.WriteLine($"Failed to send new request notifications: {ex.Message}");
        }

        return MapToDto(request);
    }

    public async Task UpdateStatusAsync(Guid id, ProcessServiceRequestDto dto, Guid userId, CancellationToken ct = default)
    {
        var request = await _context.ServiceRequests.FindAsync(new object[] { id }, ct);
        if (request == null) throw new ArgumentException("Không tìm thấy yêu cầu dịch vụ.");

        var oldTechnicianId = request.AssignedTechnicianId;
        var oldStatus = request.Status;
        request.Status = dto.Status;
        request.AdminNote = dto.AdminNote;
        request.ProcessedById = userId;
        request.UpdatedAt = DateTime.UtcNow;

        if (dto.AssignedTechnicianId.HasValue)
        {
            request.AssignedTechnicianId = dto.AssignedTechnicianId.Value;
        }

        await _context.SaveChangesAsync(ct);

        // Send notification if:
        // 1. Technician ID changed (newly assigned)
        // 2. Status just changed to "Assigned" (triển khai) and we have a technician
        bool techChanged = request.AssignedTechnicianId.HasValue && request.AssignedTechnicianId != oldTechnicianId;
        bool newlyDeployed = request.Status == ServiceStatus.Assigned && oldStatus != ServiceStatus.Assigned && request.AssignedTechnicianId.HasValue;

        if ((techChanged || newlyDeployed) && request.AssignedTechnicianId.HasValue)
        {
            var tech = await _context.Users.FindAsync(new object[] { request.AssignedTechnicianId.Value }, ct);
            if (tech != null)
            {
                // Send notification asynchronously to avoid blocking the UI
                _ = _notificationService.CreateAndSendAsync(new DTOs.Notifications.CreateNotificationDto(
                    tech.Id,
                    "Phân công công việc mới",
                    $"Bạn đã được phân công hỗ trợ khách hàng {request.CustomerName} ({request.ServiceType})",
                    NotificationType.System,
                    $"/service-requests",
                    request.Id,
                    "ServiceRequest"
                ), ct);

                // Email notification - Run in background
                if (!string.IsNullOrEmpty(tech.Email))
                {
                    var emailMessage = $"Bạn có một yêu cầu dịch vụ mới:<br/>" +
                                     $"<b>Khách hàng:</b> {request.CustomerName}<br/>" +
                                     $"<b>Dịch vụ:</b> {request.ServiceType}<br/>" +
                                     $"<b>Địa chỉ:</b> {request.Address}<br/>" +
                                     $"<b>Mô tả:</b> {request.Description ?? "Không có"}<br/><br/>" +
                                     $"Vui lòng kiểm tra hệ thống để biết thêm chi tiết.";
                    
                    _ = _emailService.SendNotificationEmailAsync(tech.Email, tech.FullName, "Thông báo phân công công việc", emailMessage, ct);
                }
            }
        }

        await _auditService.LogAsync("Cập nhật trạng thái", "ServiceRequest", id.ToString(), $"Cập nhật trạng thái yêu cầu sang {dto.Status}", ct);

        // AUTO-RECONCILIATION TRIGGER: When status changes to Completed
        if (dto.Status == ServiceStatus.Completed && oldStatus != ServiceStatus.Completed)
        {
            await HandleAutoReconciliationAsync(id, ct);
        }
    }

    private async Task HandleAutoReconciliationAsync(Guid requestId, CancellationToken ct)
    {
        // 1. Get all materials exported for this specific request
        var exports = await _context.ExportReceipts
            .Include(x => x.ExportDetails)
            .Where(x => x.ServiceRequestId == requestId && x.Status == ReceiptStatus.Completed)
            .ToListAsync(ct);

        var exportedTotals = exports.SelectMany(x => x.ExportDetails)
            .GroupBy(d => d.ProductId)
            .Select(g => new { ProductId = g.Key, Total = g.Sum(d => d.Quantity) })
            .ToList();

        // 2. Get all materials reported as USED by technician
        var usedMaterials = await _context.ServiceRequestEquipments
            .Where(x => x.ServiceRequestId == requestId)
            .ToListAsync(ct);

        // 3. Process each product to create Reconciliation record
        foreach (var export in exportedTotals)
        {
            var used = usedMaterials.FirstOrDefault(u => u.ProductId == export.ProductId)?.Quantity ?? 0;
            
            var recon = new MaterialReconciliation
            {
                Id = Guid.NewGuid(),
                ServiceRequestId = requestId,
                ProductId = export.ProductId,
                ExportedQuantity = export.Total,
                UsedQuantity = used,
                Status = (export.Total == used) ? 1 : 0, // 1: Auto-matched, 0: Discrepancy
                CreatedAt = DateTime.UtcNow
            };

            await _context.MaterialReconciliations.AddAsync(recon, ct);

            // Notify if mismatch
            if (recon.Discrepancy != 0)
            {
                var request = await _context.ServiceRequests.FindAsync(new object[] { requestId }, ct);
                if (request?.AssignedTechnicianId != null)
                {
                    await _notificationService.CreateAndSendAsync(new CreateNotificationDto(
                        request.AssignedTechnicianId.Value,
                        "Cảnh báo chênh lệch vật tư",
                        $"Phát hiện chênh lệch {recon.Discrepancy} đơn vị vật tư tại yêu cầu {request.CustomerName}. Vui lòng giải trình ngay.",
                        NotificationType.System,
                        "/reconciliation",
                        recon.Id,
                        "MaterialReconciliation"
                    ), ct);
                }
            }
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var request = await _context.ServiceRequests.FindAsync(new object[] { id }, ct);
        if (request == null) throw new ArgumentException("Không tìm thấy yêu cầu.");

        _context.ServiceRequests.Remove(request);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AssignTechnicianAsync(Guid id, Guid technicianId, CancellationToken ct = default)
    {
        var request = await _context.ServiceRequests.FindAsync(new object[] { id }, ct);
        if (request == null) throw new ArgumentException("Yêu cầu không tồn tại.");

        var tech = await _context.Users.FindAsync(new object[] { technicianId }, ct);
        if (tech == null) throw new ArgumentException("Kỹ thuật viên không tồn tại.");

        request.AssignedTechnicianId = technicianId;
        request.Status = ServiceStatus.Assigned;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        // Notification logic - Non-blocking
        _ = _notificationService.CreateAndSendAsync(new CreateNotificationDto(
            technicianId,
            "Phân công điều phối GIS",
            $"Bạn đã được điều phối xử lý yêu cầu của {request.CustomerName} qua hệ thống bản đồ",
            NotificationType.System,
            "/service-requests",
            request.Id,
            "ServiceRequest"
        ), ct);

        await _auditService.LogAsync("Điều phối GIS", "ServiceRequest", id.ToString(), $"Điều phối kỹ thuật viên {tech.FullName} qua bản đồ nhiệt", ct);
    }

    private ServiceRequestDto MapToDto(ServiceRequest x) => new ServiceRequestDto(
        x.Id,
        x.CustomerName,
        x.PhoneNumber,
        x.Address,
        x.ServiceType,
        x.SelectedPackage,
        x.Description,
        x.Status,
        x.AdminNote,
        x.AssignedTechnicianId,
        x.AssignedTechnician?.FullName,
        x.ProcessedById,
        x.ProcessedBy?.FullName,
        x.CreatedAt,
        x.UpdatedAt,
        x.Latitude,
        x.Longitude
    );
}
