using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;

namespace QLK.Application.Services;

public interface IAuditService
{
    Task LogAsync(string action, string entityName, string entityId, string? changes = null, CancellationToken ct = default);
    Task<PagedResult<AuditLogDto>> GetLogsAsync(int pageNumber, int pageSize, CancellationToken ct = default);
}

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string? UserFullName,
    string Action,
    string EntityName,
    string EntityId,
    string? Changes,
    string? RemoteIpAddress,
    DateTime Timestamp
);

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string action, string entityName, string entityId, string? changes = null, CancellationToken ct = default)
    {
        var userIdString = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = string.IsNullOrEmpty(userIdString) ? null : Guid.Parse(userIdString);

        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Changes = changes,
            MachineName = Environment.MachineName,
            RemoteIpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
            Timestamp = DateTime.UtcNow
        };

        await _context.AuditLogs.AddAsync(log, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AuditLogDto>> GetLogsAsync(int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var totalCount = await _context.AuditLogs.CountAsync(ct);
        var logs = await _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.UserId,
                a.User != null ? a.User.FullName : "Hệ thống",
                a.Action,
                a.EntityName,
                a.EntityId,
                a.Changes,
                a.RemoteIpAddress,
                a.Timestamp
            ))
            .ToListAsync(ct);

        return new PagedResult<AuditLogDto>(logs, totalCount);
    }
}
