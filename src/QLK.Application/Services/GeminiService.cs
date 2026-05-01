using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.AI;
using QLK.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace QLK.Application.Services
{
    public interface IAIService
    {
        Task<AIResponseDto> ProcessQueryAsync(string message, string? context = null);
    }

    public class GeminiService : IAIService
    {
        private readonly ApplicationDbContext _context;

        public GeminiService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AIResponseDto> ProcessQueryAsync(string message, string? context = null)
        {
            string msg = message.ToLower();
            string response = "";

            try
            {
                // 1. Câu hỏi về Số lượng Sản phẩm / Tồn kho
                if ((msg.Contains("bao nhiêu") || msg.Contains("thống kê")) && (msg.Contains("sản phẩm") || msg.Contains("hàng")))
                {
                    var totalProducts = await _context.Products.CountAsync(p => !p.IsDeleted);
                    var totalStock = await _context.Products.Where(p => !p.IsDeleted).SumAsync(p => p.Quantity);
                    var lowStock = await _context.Products.CountAsync(p => !p.IsDeleted && p.Quantity <= p.MinQuantity);
                    
                    response = $"Hệ thống hiện đang quản lý **{totalProducts}** loại sản phẩm với tổng số lượng tồn kho là **{totalStock}** đơn vị. \n\n⚠️ Lưu ý: Có **{lowStock}** sản phẩm đang ở mức báo động (sắp hết hàng).";
                }
                // 2. Câu hỏi về Yêu cầu dịch vụ / Triage
                else if (msg.Contains("yêu cầu") || msg.Contains("đăng ký") || msg.Contains("khách hàng"))
                {
                    var pending = await _context.ServiceRequests.CountAsync(s => s.Status == 0);
                    var processing = await _context.ServiceRequests.CountAsync(s => s.Status == 1 || s.Status == 2);
                    var completedToday = await _context.ServiceRequests.CountAsync(s => s.Status == 3 && s.UpdatedAt >= DateTime.Today);

                    response = $"📊 **Thống kê yêu cầu dịch vụ:**\n- Chờ xử lý: **{pending}** yêu cầu mới.\n- Đang triển khai: **{processing}** yêu cầu.\n- Đã hoàn thành hôm nay: **{completedToday}** yêu cầu.\n\nBạn có muốn xem chi tiết danh sách yêu cầu mới nhất không?";
                }
                // 3. Câu hỏi về Kỹ thuật viên
                else if (msg.Contains("kỹ thuật viên") || msg.Contains("nhân viên") || msg.Contains("ktv"))
                {
                    var totalTechs = await _context.Users.Include(u => u.Role).CountAsync(u => u.Role.Code == "TECHNICIAN" && !u.IsDeleted);
                    var busyTechs = await _context.ServiceRequests.Where(s => s.Status == 1 || s.Status == 2).Select(s => s.AssignedTechnicianId).Distinct().CountAsync();
                    
                    response = $"Hiện có **{totalTechs}** kỹ thuật viên trong hệ thống. Trong đó có **{busyTechs}** người đang thực hiện nhiệm vụ tại hiện trường. Bạn có thể kiểm tra vị trí của họ trên Bản đồ GIS.";
                }
                // 4. Câu hỏi về Kho hàng
                else if (msg.Contains("kho"))
                {
                    var warehouses = await _context.Warehouses.Select(w => w.WarehouseName).ToListAsync();
                    response = $"Hệ thống có **{warehouses.Count}** kho chính: {string.Join(", ", warehouses)}. Mỗi kho đều được giám sát tồn kho thời gian thực.";
                }
                // 5. Câu hỏi về Sửa chữa / Bảo trì
                else if (msg.Contains("sửa chữa") || msg.Contains("bảo trì") || msg.Contains("hỏng"))
                {
                    var repairing = await _context.Repairs.CountAsync(r => r.Status == 0 || r.Status == 1);
                    response = $"Hiện có **{repairing}** thiết bị đang trong quá trình sửa chữa hoặc bảo trì định kỳ.";
                }
                // 6. Câu chào hỏi / Mặc định
                else if (msg.Contains("chào") || msg.Contains("hello") || msg.Contains("hi"))
                {
                    response = "Xin chào! Tôi là Trợ lý Thông minh VNPT. Tôi có thể giúp bạn thống kê kho hàng, kiểm tra yêu cầu dịch vụ hoặc theo dõi kỹ thuật viên. Bạn muốn biết thông tin gì ạ?";
                }
                else
                {
                    response = "Tôi hiểu bạn đang quan tâm đến hệ thống. Bạn có thể hỏi tôi về: \n- Số lượng tồn kho sản phẩm.\n- Tình trạng các yêu cầu dịch vụ.\n- Danh sách kỹ thuật viên.\n- Các thiết bị đang sửa chữa.\n\nTôi luôn sẵn sàng hỗ trợ!";
                }
            }
            catch (Exception ex)
            {
                response = $"Xin lỗi, tôi gặp chút trục trặc khi truy xuất dữ liệu: {ex.Message}";
            }

            return new AIResponseDto { Text = response };
        }
    }
}
