using System;
using QLK.Domain.Enums;

namespace QLK.Domain.Entities
{
    /// <summary>
    /// Bảng đối soát vật tư tự động (Auto-Reconciliation)
    /// </summary>
    public class MaterialReconciliation
    {
        public Guid Id { get; set; }

        public Guid ServiceRequestId { get; set; }
        public ServiceRequest ServiceRequest { get; set; } = null!;

        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;

        /// <summary>Số lượng đã xuất từ kho</summary>
        public int ExportedQuantity { get; set; }

        /// <summary>Số lượng thực tế đã lắp đặt</summary>
        public int UsedQuantity { get; set; }

        /// <summary>Chênh lệch (Exported - Used)</summary>
        public int Discrepancy => ExportedQuantity - UsedQuantity;

        /// <summary>Lý do giải trình (nếu chênh lệch != 0)</summary>
        public string? Explanation { get; set; }

        /// <summary>Trạng thái: 0: Chờ giải trình, 1: Đã duyệt quyết toán</summary>
        public int Status { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
