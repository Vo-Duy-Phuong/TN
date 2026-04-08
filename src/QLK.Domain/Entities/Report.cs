namespace QLK.Domain.Entities;

/// <summary>
/// Báo cáo hệ thống
/// </summary>
public class Report
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Tên báo cáo
    /// </summary>
    public string ReportName { get; set; } = string.Empty;
    
    /// <summary>
    /// Đường dẫn file báo cáo
    /// </summary>
    public string? ReportFile { get; set; }
    
    /// <summary>
    /// ID người tạo báo cáo (FK to User table)
    /// </summary>
    public Guid CreatedBy { get; set; }
    public User Creator { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
