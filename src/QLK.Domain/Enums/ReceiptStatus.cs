namespace QLK.Domain.Enums;

/// <summary>
/// Trạng thái phiếu nhập/xuất kho
/// </summary>
public enum ReceiptStatus
{
    /// <summary>Chờ xử lý</summary>
    Pending = 0,
    
    /// <summary>Đã hoàn thành</summary>
    Completed = 1,
    
    /// <summary>Đã hủy</summary>
    Cancelled = 2
}
