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

            // 1. Danh sách từ dừng (Stop words) cần loại bỏ để lấy từ khóa chính
            string[] stopWords = { "có", "bao", "nhiêu", "tại", "toàn", "hệ", "thống", "hiện", "tại", "tổng", "của", "là", "cho", "tôi", "biết", "với", "hỏi", "về", "cái", "chiếc", "loại" };
            string searchKey = msg;
            foreach (var word in stopWords) {
                searchKey = Regex.Replace(searchKey, "\\b" + word + "\\b", "").Trim();
            }
            searchKey = Regex.Replace(searchKey, "\\s+", " "); // Làm sạch khoảng trắng

            try
            {
                // A. XỬ LÝ CÁC CÂU HỎI THỐNG KÊ TỔNG QUÁT (Keywords: tồn, yêu cầu, ktv, kho)
                
                // 1. Thống kê Kho hàng
                if (msg.Contains("kho") && !msg.Contains("tồn"))
                {
                    var warehouses = await _context.Warehouses.Select(w => w.WarehouseName).ToListAsync();
                    response = $"Hệ thống có **{warehouses.Count}** kho hàng: {string.Join(", ", warehouses)}.";
                }
                // 2. Thống kê Kỹ thuật viên
                else if (msg.Contains("kỹ thuật viên") || msg.Contains("nhân viên") || msg.Contains("ktv"))
                {
                    var totalTechs = await _context.Users.Include(u => u.Role).CountAsync(u => u.Role.Code == "TECHNICIAN" && !u.IsDeleted);
                    var busyTechs = await _context.ServiceRequests.Where(s => s.Status == ServiceStatus.Approved || s.Status == ServiceStatus.Assigned).Select(s => s.AssignedTechnicianId).Distinct().CountAsync();
                    response = $"Hiện có **{totalTechs}** kỹ thuật viên. Trong đó có **{busyTechs}** người đang bận xử lý yêu cầu.";
                }
                // 3. Thống kê Yêu cầu dịch vụ
                else if (msg.Contains("yêu cầu") || msg.Contains("đăng ký") || msg.Contains("khách hàng"))
                {
                    var pending = await _context.ServiceRequests.CountAsync(s => s.Status == ServiceStatus.Pending);
                    var processing = await _context.ServiceRequests.CountAsync(s => s.Status == ServiceStatus.Approved || s.Status == ServiceStatus.Assigned);
                    response = $"📊 **Yêu cầu dịch vụ:** Đang có **{pending}** yêu cầu mới và **{processing}** yêu cầu đang triển khai.";
                }
                // 4. Thống kê Tồn kho / Sản phẩm
                else if (msg.Contains("tồn") || msg.Contains("sản phẩm") || msg.Contains("hàng") || string.IsNullOrEmpty(searchKey))
                {
                    var totalProducts = await _context.Products.CountAsync(p => !p.IsDeleted);
                    var totalStock = await _context.Products.Where(p => !p.IsDeleted).SumAsync(p => p.Quantity);
                    response = $"Tổng tồn kho toàn hệ thống là **{totalStock}** đơn vị (thuộc **{totalProducts}** loại sản phẩm).";
                }

                // B. NẾU VẪN CHƯA CÓ CÂU TRẢ LỜI HOẶC CÓ TỪ KHÓA RIÊNG BIỆT -> TÌM KIẾM TOÀN CẦU
                if (string.IsNullOrEmpty(response) || (!string.IsNullOrEmpty(searchKey) && searchKey.Length > 1))
                {
                    // Tìm trong Sản phẩm
                    var products = await _context.Products
                        .Where(p => !p.IsDeleted && (p.ProductName.ToLower().Contains(searchKey) || p.Description.ToLower().Contains(searchKey)))
                        .ToListAsync();
                    
                    // Tìm trong Thương hiệu
                    var brandMatch = await _context.Brands.FirstOrDefaultAsync(b => b.BrandName.ToLower().Contains(searchKey));
                    
                    if (products.Any())
                    {
                        var totalQty = products.Sum(p => p.Quantity);
                        var detail = string.Join(", ", products.Take(5).Select(p => p.ProductName + " (" + p.Quantity + ")"));
                        response = $"Tìm thấy **{products.Count}** loại thiết bị liên quan đến '{searchKey}' với tổng tồn kho là **{totalQty}** chiếc. \n\nVí dụ: {detail}...";
                    }
                    else if (brandMatch != null)
                    {
                        var brandProducts = await _context.Products.Where(p => !p.IsDeleted && p.BrandId == brandMatch.Id).ToListAsync();
                        response = $"Thương hiệu **{brandMatch.BrandName}** hiện có **{brandProducts.Count}** loại sản phẩm trong kho với tổng số lượng là **{brandProducts.Sum(p => p.Quantity)}** chiếc.";
                    }
                }

                // C. CÂU TRẢ LỜI MẶC ĐỊNH (Nếu vẫn không tìm thấy gì)
                if (string.IsNullOrEmpty(response))
                {
                    response = $"Tôi không tìm thấy thông tin nào về '{searchKey}'. Bạn có thể thử hỏi về: tồn kho iGate, danh sách kỹ thuật viên, hay tổng số yêu cầu mới.";
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

