namespace QLK.Domain.Enums;

/// <summary>
/// Loại hành động thay đổi tồn kho
/// </summary>
public enum InventoryActionType
{
    /// <summary>Nhập kho</summary>
    Import = 1,

    /// <summary>Xuất kho</summary>
    Export = 2,

    /// <summary>Sửa chữa</summary>
    Repair = 3,

    /// <summary>Điều chỉnh thủ công</summary>
    Adjustment = 4
}
