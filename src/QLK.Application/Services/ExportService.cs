using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Export;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IExportService
{
    Task<(IEnumerable<ExportReceiptDto> Items, int TotalCount)> GetExportsAsync(ExportFilterDto filter, CancellationToken ct = default);
    Task<ExportReceiptDto?> GetExportByIdAsync(Guid id, CancellationToken ct = default);
    Task<ExportReceiptDto> CreateExportAsync(CreateExportReceiptDto dto, Guid currentUserId, CancellationToken ct = default);
    Task DeleteExportAsync(Guid id, CancellationToken ct = default);
}

public class ExportService : IExportService
{
    private readonly ApplicationDbContext _context;

    public ExportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<ExportReceiptDto> Items, int TotalCount)> GetExportsAsync(ExportFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.ExportReceipts
            .Include(e => e.Warehouse)
            .Include(e => e.Technician)
            .Include(e => e.ExportDetails)
                .ThenInclude(d => d.Product)
            .AsQueryable();

        if (filter.WarehouseId.HasValue)
            query = query.Where(e => e.WarehouseId == filter.WarehouseId.Value);

        if (filter.TechnicianId.HasValue)
            query = query.Where(e => e.TechnicianId == filter.TechnicianId.Value);

        if (filter.StartDate.HasValue)
            query = query.Where(e => e.ExportDate >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(e => e.ExportDate <= filter.EndDate.Value);

        var totalCount = await query.CountAsync(ct);
        var exports = await query
            .OrderByDescending(e => e.ExportDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (exports.Select(MapToDto), totalCount);
    }

    public async Task<ExportReceiptDto?> GetExportByIdAsync(Guid id, CancellationToken ct = default)
    {
        var export = await _context.ExportReceipts
            .Include(e => e.Warehouse)
            .Include(e => e.Technician)
            .Include(e => e.ExportDetails)
                .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

        return export == null ? null : MapToDto(export);
    }

    public async Task<ExportReceiptDto> CreateExportAsync(CreateExportReceiptDto dto, Guid currentUserId, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var export = new ExportReceipt
            {
                Id = Guid.NewGuid(),
                WarehouseId = dto.WarehouseId,
                TechnicianId = dto.TechnicianId,
                ExportDate = DateTime.UtcNow,
                ExportFile = dto.ExportFile,
                Note = dto.Note
            };

            await _context.ExportReceipts.AddAsync(export, ct);

            foreach (var detailDto in dto.Details)
            {
                var product = await _context.Products.FindAsync(new object[] { detailDto.ProductId }, ct);
                if (product == null) throw new ArgumentException($"Sản phẩm ID {detailDto.ProductId} không tồn tại.");

                if (product.Quantity < detailDto.Quantity)
                    throw new InvalidOperationException($"Sản phẩm '{product.ProductName}' không đủ tồn kho (Hiện có: {product.Quantity}, Yêu cầu: {detailDto.Quantity}).");

                var detail = new ExportDetail
                {
                    Id = Guid.NewGuid(),
                    ExportId = export.Id,
                    ProductId = detailDto.ProductId,
                    Quantity = detailDto.Quantity
                };
                await _context.ExportDetails.AddAsync(detail, ct);

                // Cập nhật tồn kho
                product.Quantity -= detailDto.Quantity;

                // Ghi nhật ký tồn kho
                var log = new InventoryLog
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ActionType = InventoryActionType.Export,
                    Quantity = -detailDto.Quantity, // Giá trị âm cho xuất kho
                    UserId = currentUserId,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.InventoryLogs.AddAsync(log, ct);
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return MapToDto(export);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task DeleteExportAsync(Guid id, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var export = await _context.ExportReceipts
                .Include(e => e.ExportDetails)
                .FirstOrDefaultAsync(e => e.Id == id, ct);

            if (export == null) throw new ArgumentException("Không tìm thấy phiếu xuất.");

            foreach (var detail in export.ExportDetails)
            {
                var product = await _context.Products.FindAsync(new object[] { detail.ProductId }, ct);
                if (product != null)
                {
                    product.Quantity += detail.Quantity;
                }
            }

            _context.ExportReceipts.Remove(export);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private static ExportReceiptDto MapToDto(ExportReceipt e) => new ExportReceiptDto(
        e.Id,
        e.WarehouseId,
        e.Warehouse?.WarehouseName,
        e.TechnicianId,
        e.Technician?.FullName,
        e.ExportDate,
        e.ExportFile,
        e.Note,
        e.ExportDetails.Select(d => new ExportDetailDto(
            d.Id,
            d.ProductId,
            d.Product?.ProductName,
            d.Quantity
        )).ToList()
    );
}
