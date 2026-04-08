using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.Import;
using QLK.Domain.Entities;
using QLK.Domain.Enums;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IImportService
{
    Task<(IEnumerable<ImportReceiptDto> Items, int TotalCount)> GetImportsAsync(ImportFilterDto filter, CancellationToken ct = default);
    Task<ImportReceiptDto?> GetImportByIdAsync(Guid id, CancellationToken ct = default);
    Task<ImportReceiptDto> CreateImportAsync(CreateImportReceiptDto dto, CancellationToken ct = default);
    Task DeleteImportAsync(Guid id, CancellationToken ct = default);
}

public class ImportService : IImportService
{
    private readonly ApplicationDbContext _context;

    public ImportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<ImportReceiptDto> Items, int TotalCount)> GetImportsAsync(ImportFilterDto filter, CancellationToken ct = default)
    {
        var query = _context.ImportReceipts
            .Include(i => i.Warehouse)
            .Include(i => i.Creator)
            .Include(i => i.ImportDetails)
                .ThenInclude(d => d.Product)
            .AsQueryable();

        if (filter.WarehouseId.HasValue)
            query = query.Where(i => i.WarehouseId == filter.WarehouseId.Value);

        if (filter.StartDate.HasValue)
            query = query.Where(i => i.ImportDate >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(i => i.ImportDate <= filter.EndDate.Value);

        var totalCount = await query.CountAsync(ct);
        var imports = await query
            .OrderByDescending(i => i.ImportDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (imports.Select(MapToDto), totalCount);
    }

    public async Task<ImportReceiptDto?> GetImportByIdAsync(Guid id, CancellationToken ct = default)
    {
        var import = await _context.ImportReceipts
            .Include(i => i.Warehouse)
            .Include(i => i.Creator)
            .Include(i => i.ImportDetails)
                .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        return import == null ? null : MapToDto(import);
    }

    public async Task<ImportReceiptDto> CreateImportAsync(CreateImportReceiptDto dto, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var import = new ImportReceipt
            {
                Id = Guid.NewGuid(),
                WarehouseId = dto.WarehouseId,
                CreatedBy = dto.CreatedBy,
                ImportDate = DateTime.UtcNow,
                InvoiceFile = dto.InvoiceFile,
                Note = dto.Note
            };

            await _context.ImportReceipts.AddAsync(import, ct);

            foreach (var detailDto in dto.Details)
            {
                var product = await _context.Products.FindAsync(new object[] { detailDto.ProductId }, ct);
                if (product == null) throw new ArgumentException($"Sản phẩm ID {detailDto.ProductId} không tồnate.");

                var detail = new ImportDetail
                {
                    Id = Guid.NewGuid(),
                    ImportId = import.Id,
                    ProductId = detailDto.ProductId,
                    Quantity = detailDto.Quantity,
                    Price = detailDto.Price
                };
                await _context.ImportDetails.AddAsync(detail, ct);

                // Cập nhật tồn kho
                product.Quantity += detailDto.Quantity;

                // Ghi nhật ký tồn kho
                var log = new InventoryLog
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ActionType = InventoryActionType.Import,
                    Quantity = detailDto.Quantity,
                    UserId = dto.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.InventoryLogs.AddAsync(log, ct);
            }

            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return MapToDto(import);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task DeleteImportAsync(Guid id, CancellationToken ct = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var import = await _context.ImportReceipts
                .Include(i => i.ImportDetails)
                .FirstOrDefaultAsync(i => i.Id == id, ct);

            if (import == null) throw new ArgumentException("Không tìm thấy phiếu nhập.");

            foreach (var detail in import.ImportDetails)
            {
                var product = await _context.Products.FindAsync(new object[] { detail.ProductId }, ct);
                if (product != null)
                {
                    product.Quantity -= detail.Quantity;
                    if (product.Quantity < 0)
                        throw new InvalidOperationException($"Không thể xóa phiếu nhập vì làm tồn kho sản phẩm '{product.ProductName}' âm.");
                }
            }

            _context.ImportReceipts.Remove(import);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    private static ImportReceiptDto MapToDto(ImportReceipt i) => new ImportReceiptDto(
        i.Id,
        i.WarehouseId,
        i.Warehouse?.WarehouseName,
        i.CreatedBy,
        i.Creator?.FullName,
        i.ImportDate,
        i.InvoiceFile,
        i.Note,
        i.ImportDetails.Select(d => new ImportDetailDto(
            d.Id,
            d.ProductId,
            d.Product?.ProductName,
            d.Quantity,
            d.Price
        )).ToList()
    );
}
