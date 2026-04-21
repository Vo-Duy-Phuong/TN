using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Application.DTOs.Dashboard;
using QLK.Application.Services;
using QLK.Domain.Constants;
using ClosedXML.Excel;
using System.IO;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    [Authorize(CustomPermissions.Dashboard.View)]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(CancellationToken ct)
    {
        try
        {
            var stats = await _dashboardService.GetStatsAsync(ct);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            Console.WriteLine("DASHBOARD ERROR: " + ex.ToString());
            return StatusCode(500, new { message = "Lỗi khi tính toán dữ liệu tổng quan", error = ex.Message });
        }
    }

    [HttpGet("monthly-stats")]
    [Authorize(CustomPermissions.Dashboard.View)]
    public async Task<ActionResult<IEnumerable<MonthlyImportExportDto>>> GetMonthlyStats([FromQuery] int months = 12, CancellationToken ct = default)
    {
        var stats = await _dashboardService.GetMonthlyStatsAsync(months, ct);
        return Ok(stats);
    }

    [HttpGet("export-stats")]
    [Authorize(CustomPermissions.Dashboard.View)]
    public async Task<IActionResult> ExportStats(CancellationToken ct)
    {
        var stats = await _dashboardService.GetStatsAsync(ct);
        
        var csv = new System.Text.StringBuilder();
        csv.AppendLine("BÁO CÁO TỔNG QUAN HỆ THỐNG");
        csv.AppendLine($"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}");
        csv.AppendLine();
        
        csv.AppendLine("THỐNG KÊ CHUNG");
        csv.AppendLine("Chỉ số,Giá trị");
        csv.AppendLine($"Tổng sản phẩm,{stats.TotalProducts}");
        csv.AppendLine($"Tổng kho hàng,{stats.TotalWarehouses}");
        csv.AppendLine($"Đang sửa chữa,{stats.PendingRepairs}");
        csv.AppendLine($"Tồn kho thấp,{stats.LowStockCount}");
        csv.AppendLine();
        
        csv.AppendLine("HOẠT ĐỘNG GẦN ĐÂY");
        csv.AppendLine("Thời gian,Nội dung");
        foreach (var activity in stats.RecentActivities)
        {
            csv.AppendLine($"{activity.CreatedAt:dd/MM/yyyy HH:mm},\"{activity.Message.Replace("\"", "\"\"")}\"");
        }
        
        var bytes = System.Text.Encoding.UTF8.GetPreamble().Concat(System.Text.Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
        return File(bytes, "text/csv", $"Bao_cao_tong_quan_{DateTime.Now:yyyyMMdd}.csv");
    }

    [HttpGet("export-excel")]
    [Authorize(CustomPermissions.Dashboard.View)]
    public async Task<IActionResult> ExportExcel(CancellationToken ct)
    {
        var stats = await _dashboardService.GetStatsAsync(ct);
        
        using var workbook = new XLWorkbook();
        
        // --- SHEET 1: TỔNG QUAN ---
        var ws = workbook.Worksheets.Add("Tổng quan");
        ws.Cell(1, 1).Value = "BÁO CÁO TỔNG QUAN HỆ THỐNG";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 18;
        ws.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml("#0066CC");
        ws.Range(1, 1, 1, 2).Merge();
        
        ws.Cell(2, 1).Value = $"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}";
        ws.Cell(2, 1).Style.Font.Italic = true;
        
        ws.Cell(4, 1).Value = "CHỈ SỐ QUAN TRỌNG";
        ws.Cell(4, 1).Style.Font.Bold = true;
        
        ws.Cell(5, 1).Value = "Tổng giá trị vật tư tồn kho";
        ws.Cell(5, 2).Value = stats.TotalInventoryValue;
        ws.Cell(5, 2).Style.NumberFormat.Format = "#,##0 \"VNĐ\"";
        ws.Cell(5, 2).Style.Font.Bold = true;

        ws.Cell(6, 1).Value = "Tổng số sản phẩm";
        ws.Cell(6, 2).Value = stats.TotalProducts;

        ws.Cell(7, 1).Value = "Sản phẩm tồn kho thấp";
        ws.Cell(7, 2).Value = stats.LowStockCount;
        if (stats.LowStockCount > 0) ws.Cell(7, 2).Style.Font.FontColor = XLColor.Red;

        ws.Cell(8, 1).Value = "Yêu cầu sửa chữa tồn đọng";
        ws.Cell(8, 2).Value = stats.PendingRepairs;

        ws.Range(5, 1, 8, 2).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        ws.Range(5, 1, 8, 2).Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        
        // --- SHEET 2: PHÂN BỔ DANH MỤC ---
        var ws2 = workbook.Worksheets.Add("Phân bổ danh mục");
        ws2.Cell(1, 1).Value = "PHÂN BỔ GIÁ TRỊ VÀ SỐ LƯỢNG THEO DANH MỤC";
        ws2.Cell(1, 1).Style.Font.Bold = true;
        
        ws2.Cell(3, 1).Value = "Tên danh mục";
        ws2.Cell(3, 2).Value = "Số loại SP";
        ws2.Cell(3, 3).Value = "Tổng giá trị (VNĐ)";
        ws2.Range(3, 1, 3, 3).Style.Font.Bold = true;
        ws2.Range(3, 1, 3, 3).Style.Fill.BackgroundColor = XLColor.LightBlue;

        int row = 4;
        foreach (var cat in stats.CategoryStats)
        {
            ws2.Cell(row, 1).Value = cat.Name;
            ws2.Cell(row, 2).Value = cat.Count;
            ws2.Cell(row, 3).Value = cat.Value;
            ws2.Cell(row, 3).Style.NumberFormat.Format = "#,##0";
            row++;
        }
        ws2.Columns().AdjustToContents();

        // --- SHEET 3: DỰ BÁO RỦI RO ---
        var ws3 = workbook.Worksheets.Add("Dự báo tồn kho");
        ws3.Cell(1, 1).Value = "DANH SÁCH SẢN PHẨM SẮP HẾT HÀNG (DỰA TRÊN TỐC ĐỘ TIÊU THỤ)";
        ws3.Cell(1, 1).Style.Font.Bold = true;

        ws3.Cell(3, 1).Value = "Sản phẩm";
        ws3.Cell(3, 2).Value = "Tồn kho";
        ws3.Cell(3, 3).Value = "Tốc độ dùng/ngày";
        ws3.Cell(3, 4).Value = "Số ngày còn lại (Dự kiến)";
        ws3.Range(3, 1, 3, 4).Style.Font.Bold = true;
        ws3.Range(3, 1, 3, 4).Style.Fill.BackgroundColor = XLColor.LightPink;

        row = 4;
        foreach (var rf in stats.RiskForecasts)
        {
            ws3.Cell(row, 1).Value = rf.ProductName;
            ws3.Cell(row, 2).Value = rf.Quantity;
            ws3.Cell(row, 3).Value = rf.ConsumptionRate;
            ws3.Cell(row, 4).Value = rf.DaysRemaining ?? 0;
            if (rf.DaysRemaining < 7) ws3.Cell(row, 4).Style.Font.FontColor = XLColor.Red;
            row++;
        }
        ws3.Columns().AdjustToContents();

        // --- SHEET 4: HOẠT ĐỘNG ---
        var ws4 = workbook.Worksheets.Add("Hoạt động gần đây");
        ws4.Cell(3, 1).Value = "Thời gian";
        ws4.Cell(3, 2).Value = "Nội dung";
        ws4.Range(3, 1, 3, 2).Style.Font.Bold = true;
        
        row = 4;
        foreach (var activity in stats.RecentActivities)
        {
            ws4.Cell(row, 1).Value = activity.CreatedAt.ToString("dd/MM/yyyy HH:mm");
            ws4.Cell(row, 2).Value = activity.Message;
            row++;
        }
        ws4.Columns().AdjustToContents();
        ws.Columns().AdjustToContents();
        
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();
        
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Bao_cao_tong_quan_{DateTime.Now:yyyyMMdd}.xlsx");
    }

    [HttpGet("export-pdf")]
    [Authorize(CustomPermissions.Dashboard.View)]
    public async Task<IActionResult> ExportPdf(CancellationToken ct)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var stats = await _dashboardService.GetStatsAsync(ct);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Verdana));

                // --- HEADER ---
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("HỆ THỐNG QUẢN LÝ KHO VNPT").FontSize(22).SemiBold().FontColor("#0066CC");
                        col.Item().Text("BÁO CÁO CÔNG TÁC QUẢN TRỊ KHO & VẬT TƯ").FontSize(14).SemiBold().FontColor(Colors.Grey.Medium);
                        col.Item().PaddingTop(5).Text(text => 
                        {
                            text.Span("Ngày trích xuất: ").Italic();
                            text.Span($"{DateTime.Now:dd/MM/yyyy HH:mm}").Italic().SemiBold();
                        });
                    });
                });

                page.Content().PaddingVertical(0.5f, Unit.Centimetre).Column(x =>
                {
                    x.Spacing(15);

                    // --- SECTION: THÔNG SỐ CỐT YẾU ---
                    x.Item().Background(Colors.Grey.Lighten4).Padding(10).Row(row => 
                    {
                        row.RelativeItem().Column(c => {
                            c.Item().Text("TỔNG GIÁ TRỊ TỒN KHO").FontSize(9).SemiBold().FontColor(Colors.Grey.Medium);
                            c.Item().Text(stats.TotalInventoryValue.ToString("N0") + " VNĐ").FontSize(16).Bold().FontColor("#0066CC");
                        });
                        row.RelativeItem().Column(c => {
                            c.Item().Text("SẢN PHẨM TỒN THẤP").FontSize(9).SemiBold().FontColor(Colors.Grey.Medium);
                            c.Item().Text(stats.LowStockCount.ToString()).FontSize(16).Bold().FontColor(stats.LowStockCount > 0 ? Colors.Red.Medium : Colors.Green.Medium);
                        });
                        row.RelativeItem().Column(c => {
                            c.Item().Text("YÊU CẦU SỬA CHỮA").FontSize(9).SemiBold().FontColor(Colors.Grey.Medium);
                            c.Item().Text(stats.PendingRepairs.ToString()).FontSize(16).Bold();
                        });
                    });

                    // --- SECTION: PHÂN BỔ DANH MỤC ---
                    x.Item().Column(c => {
                        c.Spacing(5);
                        c.Item().Text("1. PHÂN BỔ GIÁ TRỊ THEO DANH MỤC").FontSize(12).SemiBold();
                        c.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#0066CC").Padding(5).Text("DANH MỤC").FontColor(Colors.White).SemiBold();
                                header.Cell().Background("#0066CC").Padding(5).Text("SL").FontColor(Colors.White).SemiBold();
                                header.Cell().Background("#0066CC").Padding(5).Text("GIÁ TRỊ (VNĐ)").FontColor(Colors.White).SemiBold();
                            });

                            foreach (var cat in stats.CategoryStats.Take(8))
                            {
                                table.Cell().BorderBottom(0.5f).Padding(5).Text(cat.Name);
                                table.Cell().BorderBottom(0.5f).Padding(5).Text(cat.Count.ToString());
                                table.Cell().BorderBottom(0.5f).Padding(5).Text(cat.Value.ToString("N0"));
                            }
                        });
                    });

                    // --- SECTION: DỰ BÁO RỦI RO ---
                    if (stats.RiskForecasts != null && stats.RiskForecasts.Any())
                    {
                        x.Item().Column(c => {
                            c.Spacing(5);
                            c.Item().Text("2. DỰ BÁO CẠN KIỆT VẬT TƯ (DỰA TRÊN TỐC ĐỘ DÙNG)").FontSize(12).SemiBold().FontColor(Colors.Red.Medium);
                            c.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(3);
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(1);
                                });

                                table.Header(header =>
                                {
                                    header.Cell().Background(Colors.Red.Lighten4).Padding(5).Text("SẢN PHẨM").SemiBold();
                                    header.Cell().Background(Colors.Red.Lighten4).Padding(5).Text("TỒN").SemiBold();
                                    header.Cell().Background(Colors.Red.Lighten4).Padding(5).Text("RATE/NGÀY").SemiBold();
                                    header.Cell().Background(Colors.Red.Lighten4).Padding(5).Text("CÒN LẠI").SemiBold();
                                });

                                foreach (var rf in stats.RiskForecasts)
                                {
                                    table.Cell().BorderBottom(0.5f).Padding(5).Text(rf.ProductName);
                                    table.Cell().BorderBottom(0.5f).Padding(5).Text(rf.Quantity.ToString());
                                    table.Cell().BorderBottom(0.5f).Padding(5).Text(rf.ConsumptionRate.ToString("F2"));
                                    table.Cell().BorderBottom(0.5f).Padding(5).Text(text => {
                                        text.Span(rf.DaysRemaining.ToString()).SemiBold();
                                        text.Span(" ngày");
                                    });
                                }
                            });
                        });
                    }

                    // --- SECTION: THỐNG KÊ SỬA CHỮA ---
                    x.Item().Column(c => {
                        c.Spacing(5);
                        c.Item().Text("3. TÌNH TRẠNG SỬA CHỮA THIẾT BỊ").FontSize(12).SemiBold();
                        c.Item().Row(r => {
                            r.RelativeItem().Text($"Đang sửa: {stats.RepairStats.Repairing}").FontColor(Colors.Orange.Medium);
                            r.RelativeItem().Text($"Chờ xử lý: {stats.RepairStats.Pending}").FontColor(Colors.Blue.Medium);
                            r.RelativeItem().Text($"Đã xong: {stats.RepairStats.Completed}").FontColor(Colors.Green.Medium);
                            r.RelativeItem().Text($"Hỏng: {stats.RepairStats.Unrepairable}").FontColor(Colors.Red.Medium);
                        });
                    });

                    // --- SECTION: HOẠT ĐỘNG GẦN ĐÂY ---
                    x.Item().Column(c => {
                        c.Spacing(5);
                        c.Item().Text("4. CÁC HOẠT ĐỘNG PHÁT SINH GẦN ĐÂY").FontSize(12).SemiBold();
                        c.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns => {
                                columns.ConstantColumn(90);
                                columns.RelativeColumn();
                            });
                            foreach (var activity in stats.RecentActivities.Take(5))
                            {
                                table.Cell().BorderBottom(0.5f).PaddingVertical(3).Text(activity.CreatedAt.ToString("dd/MM HH:mm")).FontSize(9).FontColor(Colors.Grey.Medium);
                                table.Cell().BorderBottom(0.5f).PaddingVertical(3).Text(activity.Message).FontSize(10);
                            }
                        });
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Báo cáo hệ thống VNPT Ware - Trang ");
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        var content = stream.ToArray();

        return File(content, "application/pdf", $"Bao_cao_tong_quan_{DateTime.Now:yyyyMMdd}.pdf");
    }
}
