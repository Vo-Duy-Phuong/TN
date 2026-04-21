namespace QLK.Application.DTOs.Product;

public record EquipmentPublicLookupDto(
    string SerialNumber,
    string MacAddress,
    string ProductName,
    string? ProductCategory,
    string StatusLabel,
    bool IsActive,
    DateTime? WarrantyExpiry,
    bool IsUnderWarranty,
    string? EManualUrl,
    DateTime? InstallationDate
);
