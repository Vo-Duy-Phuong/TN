namespace QLK.Domain.Enums;

/// <summary>
/// Trạng thái sửa chữa sản phẩm
/// </summary>
public enum RepairStatus
{
    /// <summary>Chờ xử lý</summary>
    Pending = 0,

    /// <summary>Đang sửa</summary>
    Repairing = 1,

    /// <summary>Hoàn thành</summary>
    Completed = 2,

    /// <summary>Không sửa được</summary>
    Unrepairable = 3
}
