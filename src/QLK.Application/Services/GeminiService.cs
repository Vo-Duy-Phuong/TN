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
            string msg = message.ToLower().Trim();
            string response = "";

            try
            {
                // 1. Thống kê NHÂN VIÊN / NGƯỜI DÙNG
                if (msg.Contains("người dùng") || msg.Contains("nhân viên") || msg.Contains("tài khoản"))
                {
                    var count = await _context.Users.CountAsync(u => !u.IsDeleted);
                    var active = await _context.Users.CountAsync(u => !u.IsDeleted && u.IsActive);
                    response = $"Hệ thống hiện có **{count}** người dùng (nhân viên), trong đó có **{active}** tài khoản đang hoạt động.";
                }
                // 2. Thống kê KỸ THUẬT VIÊN
                else if (msg.Contains("kỹ thuật viên") || msg.Contains("ktv"))
                {
                    var total = await _context.Users.Include(u => u.Role).CountAsync(u => u.Role.Code == "TECHNICIAN" && !u.IsDeleted);
                    response = $"Hiện có **{total}** kỹ thuật viên chính thức trong hệ thống.";
                }
                // 3. Thống kê THƯƠNG HIỆU / HÃNG
                else if (msg.Contains("thương hiệu") || msg.Contains("hãng"))
                {
                    var count = await _context.Brands.CountAsync();
                    var names = await _context.Brands.Select(b => b.BrandName).ToListAsync();
                    response = $"Hệ thống quản lý **{count}** thương hiệu: {string.Join(", ", names)}.";
                }
                // 4. Thống kê DANH MỤC / LOẠI
                else if (msg.Contains("danh mục") || msg.Contains("loại sản phẩm"))
                {
                    var count = await _context.Categories.CountAsync();
                    var names = await _context.Categories.Select(c => c.CategoryName).ToListAsync();
                    response = $"Hệ thống có **{count}** danh mục sản phẩm: {string.Join(", ", names)}.";
                }
                // 5. Thống kê PHIẾU THU HỒI & QUYẾT TOÁN
                else if (msg.Contains("thu hồi"))
                {
                    var count = await _context.RetrievalReceipts.CountAsync();
                    var pending = await _context.RetrievalReceipts.CountAsync(r => r.Status == 0);
                    response = $"Tổng cộng có **{count}** phiếu thu hồi thiết bị, trong đó có **{pending}** phiếu đang chờ xử lý.";
                }
                else if (msg.Contains("quyết toán") || msg.Contains("lệch") || msg.Contains("hao hụt"))
                {
                    var errorCount = await _context.MaterialReconciliations.CountAsync(m => m.Status == 0);
                    var totalSettled = await _context.MaterialReconciliations.CountAsync();
                    response = $"Hệ thống tự động hóa quyết toán vật tư đã xử lý **{totalSettled}** mục. Hiện có **{errorCount}** trường hợp đang bị lệch vật tư (hao hụt) cần giải trình.";
                }
                // 6. Thống kê PHIẾU NHẬP / XUẤT
                else if (msg.Contains("nhập kho") || msg.Contains("phiếu nhập"))
                {
                    var count = await _context.ImportReceipts.CountAsync();
                    response = $"Hệ thống đã thực hiện **{count}** lượt nhập kho thành công.";
                }
                else if (msg.Contains("xuất kho") || msg.Contains("phiếu xuất"))
                {
                    var count = await _context.ExportReceipts.CountAsync();
                    response = $"Hệ thống đã thực hiện **{count}** lượt xuất kho cho kỹ thuật viên.";
                }
                // 7. Thống kê KHO HÀNG
                else if (msg.Contains("kho") && !msg.Contains("tồn"))
                {
                    var count = await _context.Warehouses.CountAsync();
                    var names = await _context.Warehouses.Select(w => w.WarehouseName).ToListAsync();
                    response = $"Hệ thống có **{count}** địa điểm kho: {string.Join(", ", names)}.";
                }
                // 8. Thống kê TỒN KHO / SẢN PHẨM (Mặc định nếu hỏi chung chung)
                else if (msg.Contains("tồn") || msg.Contains("sản phẩm") || msg.Contains("hàng") || msg.Contains("bao nhiêu"))
                {
                    // Thử tìm kiếm theo tên sản phẩm cụ thể trước
                    string searchKey = msg.Replace("có", "").Replace("bao", "").Replace("nhiêu", "").Replace("thiết", "").Replace("bị", "").Replace("tồn", "").Replace("kho", "").Trim();
                    
                    if (searchKey.Length > 1)
                    {
                        var products = await _context.Products.Where(p => !p.IsDeleted && p.ProductName.ToLower().Contains(searchKey)).ToListAsync();
                        if (products.Any()) {
                            response = $"Tìm thấy **{products.Count}** loại liên quan đến '{searchKey}', tổng tồn kho: **{products.Sum(p => p.Quantity)}** chiếc.";
                        }
                    }
                    
                    if (string.IsNullOrEmpty(response)) {
                        var totalStock = await _context.Products.Where(p => !p.IsDeleted).SumAsync(p => p.Quantity);
                        response = $"Tổng tồn kho thiết bị trên toàn hệ thống là **{totalStock}** chiếc.";
                    }
                }
                // 9. Câu chào / Mặc định
                else
                {
                    response = "Xin chào! Tôi có thể giúp bạn thống kê mọi thứ: Người dùng, Thương hiệu, Danh mục, Phiếu thu hồi, Tồn kho... Bạn muốn biết về thông tin nào?";
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

