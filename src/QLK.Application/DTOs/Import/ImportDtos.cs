using QLK.Domain.Enums;
using Microsoft.AspNetCore.Http;
using QLK.Domain.Entities;

namespace QLK.Application.DTOs.Import;

public record ImportReceiptDto(
    Guid Id,
    string ReceiptCode,
    Guid WarehouseId,
    string? WarehouseName,
    Guid CreatedBy,
    string? CreatorFullName,
    DateTime ImportDate,
    string? InvoiceFile,
    string? Note,
    ReceiptStatus Status,
    string StatusLabel,
    decimal TotalAmount,
    List<ImportDetailDto> Details
);

public record ImportDetailDto(
    Guid Id,
    Guid ProductId,
    string? ProductName,
    string? Unit,
    int Quantity,
    decimal Price,
    decimal SubTotal,
    List<IndividualEquipmentSummaryDto> Equipments
);

public class CreateImportReceiptDto
{
    public Guid WarehouseId { get; set; }
    public Guid CreatedBy { get; set; }
    public string? Note { get; set; }
    public IFormFile? InvoiceFileUpload { get; set; }
    public List<CreateImportDetailDto> Details { get; set; } = new();
}

public class CreateImportDetailDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }

    /// <summary>Danh sách Serial Number của thiết bị được nhập (tuỳ chọn, tối đa = Quantity)</summary>
    public List<string> SerialNumbers { get; set; } = new();

    /// <summary>Danh sách MAC Address tương ứng (tuỳ chọn)</summary>
    public List<string> MacAddresses { get; set; } = new();

    /// <summary>Thời hạn bảo hành tính theo tháng (0 = không bảo hành)</summary>
    public int WarrantyMonths { get; set; } = 0;
}

public class UpdateImportReceiptDto
{
    public string? Note { get; set; }
    public IFormFile? InvoiceFileUpload { get; set; }
}

public record ImportFilterDto(
    Guid? WarehouseId,
    string? Search,       // Tìm theo mã phiếu hoặc ghi chú
    ReceiptStatus? Status,
    DateTime? StartDate,
    DateTime? EndDate,
    int PageNumber = 1,
    int PageSize = 10
);

public record ImportMonthlyStatsDto(
    int Year,
    int Month,
    int TotalReceipts,
    decimal TotalAmount,
    int TotalQuantity
);

// Shared summary DTO for IndividualEquipment (used across Import/Export/Retrieval)
public record IndividualEquipmentSummaryDto(
    Guid Id,
    string SerialNumber,
    string MacAddress,
    EquipmentStatus Status,
    string StatusLabel,
    DateTime? WarrantyExpiry,
    bool IsUnderWarranty
);
