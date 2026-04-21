namespace QLK.Domain.Entities;

/// <summary>
/// Người dùng hệ thống
/// </summary>
public class User
{
    public Guid Id { get; set; }

    /// <summary>Tên đăng nhập (unique)</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Mật khẩu đã hash</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Họ tên đầy đủ</summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>Email</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Số điện thoại</summary>
    public string? Phone { get; set; }

    /// <summary>Ảnh đại diện</summary>
    public string? Avatar { get; set; }

    /// <summary>ID vai trò (FK to Role table)</summary>
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    /// <summary>Trạng thái tài khoản</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Email đã xác thực</summary>
    public bool IsEmailConfirmed { get; set; } = true;

    /// <summary>Mã reset password</summary>
    public string? PasswordResetCode { get; set; }

    /// <summary>Thời hạn mã reset</summary>
    public DateTime? PasswordResetCodeExpiry { get; set; }

    /// <summary>Câu hỏi bảo mật</summary>
    public string? SecurityQuestion { get; set; }

    /// <summary>Câu trả lời bảo mật (đã hash)</summary>
    public string? SecurityAnswerHash { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public double? LastLatitude { get; set; }
    public double? LastLongitude { get; set; }

    // Navigation properties
    public ICollection<Warehouse> ManagedWarehouses { get; set; } = new List<Warehouse>();
    public ICollection<ImportReceipt> CreatedImportReceipts { get; set; } = new List<ImportReceipt>();
    public ICollection<ExportReceipt> CreatedExportReceipts { get; set; } = new List<ExportReceipt>();
    public ICollection<RetrievalReceipt> RetrievalReceipts { get; set; } = new List<RetrievalReceipt>();
    public ICollection<Repair> AssignedRepairs { get; set; } = new List<Repair>();
    public ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
    public ICollection<Report> CreatedReports { get; set; } = new List<Report>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
