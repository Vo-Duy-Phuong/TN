using QLK.Domain.Enums;
using Microsoft.AspNetCore.Http;
using QLK.Application.DTOs.Import;

namespace QLK.Application.DTOs.Export;

public record ExportReceiptDto(
    Guid Id,
    string ReceiptCode,
    Guid WarehouseId,
    string? WarehouseName,
    Guid TechnicianId,
    string? TechnicianFullName,
    DateTime ExportDate,
    string? ExportFile,
    string? Note,
    ReceiptStatus Status,
    string StatusLabel,
    List<ExportDetailDto> Details
);

public record ExportDetailDto(
    Guid Id,
    Guid ProductId,
    string? ProductName,
    string? Unit,
    int Quantity,
    List<IndividualEquipmentSummaryDto> Equipments
);

public class CreateExportReceiptDto
{
    public Guid WarehouseId { get; set; }
    public Guid TechnicianId { get; set; }
    public string? Note { get; set; }
    public IFormFile? ExportFileUpload { get; set; }
    public List<CreateExportDetailDto> Details { get; set; } = new();
}

public class CreateExportDetailDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    
    /// <summary>Danh sách Serial Numbers của các thiết bị cụ thể cần xuất</summary>
    public List<string> SerialNumbers { get; set; } = new();
}

public class UpdateExportReceiptDto
{
    public string? Note { get; set; }
    public IFormFile? ExportFileUpload { get; set; }
}

public record ExportFilterDto(
    Guid? WarehouseId,
    Guid? TechnicianId,
    string? Search,       // Tìm theo mã phiếu hoặc ghi chú
    ReceiptStatus? Status,
    DateTime? StartDate,
    DateTime? EndDate,
    int PageNumber = 1,
    int PageSize = 10
);
