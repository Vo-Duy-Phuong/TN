using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.AI;
using QLK.Infrastructure.Data;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace QLK.Application.Services
{
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
                // 1. Câu hỏi về Thương hiệu (Brands)
                if (msg.Contains("thương hiệu") || msg.Contains("hãng"))
                {
                    var brands = await _context.Brands.Select(b => b.BrandName).ToListAsync();
                    response = $"Hệ thống hiện có **{brands.Count}** thương hiệu: {string.Join(", ", brands)}.";
                }
                // 2. Câu hỏi về một dòng thiết bị cụ thể (Ví dụ: iGate, ZTE, Modem...)
                else if (msg.Contains("thiết bị") || msg.Contains("máy") || msg.Contains("igate") || msg.Contains("zte") || msg.Contains("huawei"))
                {
                    // Trích xuất từ khóa tìm kiếm (bỏ chữ "có bao nhiêu thiết bị")
                    var searchKey = msg.Replace("có", "").Replace("bao", "").Replace("nhiêu", "").Replace("thiết", "").Replace("bị", "").Trim();
                    
                    var products = await _context.Products
                        .Where(p => !p.IsDeleted && (p.ProductName.ToLower().Contains(searchKey) || p.Description.ToLower().Contains(searchKey)))
                        .ToListAsync();
                    
                    if (products.Any())
                    {
                        var totalQty = products.Sum(p => p.Quantity);
                        response = $"Tìm thấy **{products.Count}** loại thiết bị liên quan đến '{searchKey}' với tổng tồn kho là **{totalQty}** chiếc. \n\nChi tiết: {string.Join(", ", products.Select(p => p.ProductName + " [" + p.Quantity + "]"))}";
                    }
                    else
                    {
                        response = $"Tôi không tìm thấy thiết bị nào có tên hoặc mô tả là '{searchKey}' trong kho hàng.";
                    }
                }
                // 3. Câu hỏi về Kho hàng (Tách biệt với sản phẩm)
                else if (msg.Contains("kho hàng") || msg.Contains("danh sách kho"))
                {
                    var warehouses = await _context.Warehouses.Select(w => w.WarehouseName).ToListAsync();
                    response = $"Hệ thống có **{warehouses.Count}** kho hàng: {string.Join(", ", warehouses)}.";
                }
                // 4. Câu hỏi về Tổng số lượng Sản phẩm / Tồn kho chung
                else if ((msg.Contains("bao nhiêu") || msg.Contains("thống kê")) && (msg.Contains("sản phẩm") || msg.Contains("hàng")))
                {
                    var totalProducts = await _context.Products.CountAsync(p => !p.IsDeleted);
                    var totalStock = await _context.Products.Where(p => !p.IsDeleted).SumAsync(p => p.Quantity);
                    var lowStock = await _context.Products.CountAsync(p => !p.IsDeleted && p.Quantity <= p.MinQuantity);
                    
                    response = $"Hệ thống hiện đang quản lý **{totalProducts}** loại sản phẩm với tổng số lượng tồn kho là **{totalStock}** đơn vị. \n\n⚠️ Lưu ý: Có **{lowStock}** sản phẩm đang ở mức báo động (sắp hết hàng).";
                }
                // 5. Câu hỏi về Yêu cầu dịch vụ
                else if (msg.Contains("yêu cầu") || msg.Contains("đăng ký") || msg.Contains("khách hàng"))
                {
                    var pending = await _context.ServiceRequests.CountAsync(s => s.Status == ServiceStatus.Pending);
                    var processing = await _context.ServiceRequests.CountAsync(s => s.Status == ServiceStatus.Approved || s.Status == ServiceStatus.Assigned);
                    var completedToday = await _context.ServiceRequests.CountAsync(s => s.Status == ServiceStatus.Completed && s.UpdatedAt >= DateTime.Today);

                    response = $"📊 **Thống kê yêu cầu dịch vụ:**\n- Chờ xử lý: **{pending}** yêu cầu mới.\n- Đang triển khai: **{processing}** yêu cầu.\n- Đã hoàn thành hôm nay: **{completedToday}** yêu cầu.";
                }
                // 6. Câu hỏi về Kỹ thuật viên
                else if (msg.Contains("kỹ thuật viên") || msg.Contains("nhân viên") || msg.Contains("ktv"))
                {
                    var totalTechs = await _context.Users.Include(u => u.Role).CountAsync(u => u.Role.Code == "TECHNICIAN" && !u.IsDeleted);
                    var busyTechs = await _context.ServiceRequests.Where(s => s.Status == ServiceStatus.Approved || s.Status == ServiceStatus.Assigned).Select(s => s.AssignedTechnicianId).Distinct().CountAsync();
                    
                    response = $"Hiện có **{totalTechs}** kỹ thuật viên. Trong đó có **{busyTechs}** người đang bận xử lý yêu cầu khách hàng.";
                }
                // 7. Câu chào / Mặc định
                else if (msg.Contains("chào") || msg.Contains("hello") || msg.Contains("hi"))
                {
                    response = "Xin chào! Tôi là Trợ lý Thông minh VNPT. Tôi có thể giúp bạn kiểm tra tồn kho (ví dụ: 'tồn kho iGate'), xem yêu cầu dịch vụ hoặc quản lý kỹ thuật viên. Bạn cần tôi hỗ trợ gì?";
                }
                else
                {
                    response = "Tôi hiểu bạn đang quan tâm đến hệ thống. Bạn có thể hỏi tôi về: \n- Tồn kho theo tên thiết bị (ví dụ: 'có bao nhiêu iGate').\n- Thống kê thương hiệu, kho hàng.\n- Tình trạng yêu cầu dịch vụ.\n- Kỹ thuật viên.\n\nTôi luôn sẵn sàng!";
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

