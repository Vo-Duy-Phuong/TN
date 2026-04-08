using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Report;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IReportService
{
    Task<(IEnumerable<ReportDto> Items, int TotalCount)> GetReportsAsync(ReportFilterDto filter, CancellationToken ct = default);
    Task<ReportDto?> GetReportByIdAsync(Guid id, CancellationToken ct = default);
    Task<ReportDto> CreateReportAsync(CreateReportDto dto, CancellationToken ct = default);
    Task DeleteReportAsync(Guid id, CancellationToken ct = default);
}

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<ReportDto> Items, int TotalCount)> GetReportsAsync(ReportFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.Reports
            .Include(r => r.Creator)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(r => r.ReportName.ToLower().Contains(search));
        }

        if (filter.CreatedBy.HasValue)
            query = query.Where(r => r.CreatedBy == filter.CreatedBy.Value);

        var totalCount = await query.CountAsync(ct);
        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (reports.Select(MapToDto), totalCount);
    }

    public async Task<ReportDto?> GetReportByIdAsync(Guid id, CancellationToken ct = default)
    {
        var report = await _context.Reports
            .Include(r => r.Creator)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        return report == null ? null : MapToDto(report);
    }

    public async Task<ReportDto> CreateReportAsync(CreateReportDto dto, CancellationToken ct = default)
    {
        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReportName = dto.ReportName,
            ReportFile = dto.ReportFile,
            CreatedBy = dto.CreatedBy,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Reports.AddAsync(report, ct);
        await _context.SaveChangesAsync(ct);

        return MapToDto(report);
    }

    public async Task DeleteReportAsync(Guid id, CancellationToken ct = default)
    {
        var report = await _context.Reports.FindAsync(new object[] { id }, ct);
        if (report == null) throw new ArgumentException("Không tìm thấy thông tin báo cáo.");

        _context.Reports.Remove(report);
        await _context.SaveChangesAsync(ct);
    }

    private static ReportDto MapToDto(Report r) => new ReportDto(
        r.Id,
        r.ReportName,
        r.ReportFile,
        r.CreatedBy,
        r.Creator?.FullName,
        r.CreatedAt
    );
}
