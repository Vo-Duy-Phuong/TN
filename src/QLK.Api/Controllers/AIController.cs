using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLK.Application.DTOs.AI;
using QLK.Application.Services;
using QLK.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IAIService _aiService;
    private readonly ApplicationDbContext _context;

    public AIController(IAIService aiService, ApplicationDbContext context)
    {
        _aiService = aiService;
        _context = context;
    }

    [HttpPost("query")]
    public async Task<ActionResult<AIResponseDto>> ExecuteQuery([FromBody] AIRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest("Message cannot be empty.");

        try
        {
            var response = await _aiService.ProcessQueryAsync(request.Message, request.Context);

            if (!string.IsNullOrEmpty(response.SqlQuery))
            {
                if (IsSafeSql(response.SqlQuery))
                {
                    var queryData = await ExecuteQueryAsync(response.SqlQuery);
                    response.Data = queryData;
                    
                    // Nếu không có dữ liệu trả về từ SQL, báo cho AI biết để điều chỉnh Text
                    if (!queryData.Any() && response.Chart != null)
                    {
                        response.Text = "Tôi không tìm thấy dữ liệu nào phù hợp với yêu cầu của bạn hiện tại.";
                        response.Chart.Type = "none";
                    }
                }
                else
                {
                    response.Text = "Xin lỗi, câu truy vấn SQL được tạo ra không an toàn. Vui lòng thử lại với cách diễn đạt khác.";
                    response.SqlQuery = null;
                }
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AI Controller Error] Failed to execute SQL query: {ex.Message}");
            if (ex.InnerException != null) Console.WriteLine($"[Inner Exception] {ex.InnerException.Message}");
            
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    private bool IsSafeSql(string sql)
    {
        var trimmedSql = sql.Trim().ToUpperInvariant();
        
        // Cần bắt đầu bằng SELECT
        if (!trimmedSql.StartsWith("SELECT")) return false;

        // Chỉ cho phép tối đa 1 dấu chấm phẩy và nó phải ở cuối
        int semicolonCount = sql.Count(f => f == ';');
        if (semicolonCount > 1) return false;
        if (semicolonCount == 1 && !sql.TrimEnd().EndsWith(";")) return false;

        // Các từ khóa nguy hiểm (Dùng Regex để khớp nguyên từ)
        string[] forbiddenKeywords = { 
            "INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", 
            "ALTER", "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE"
        };

        foreach (var keyword in forbiddenKeywords)
        {
            var pattern = $@"\b{keyword}\b";
            if (System.Text.RegularExpressions.Regex.IsMatch(trimmedSql, pattern)) 
                return false;
        }

        return true;
    }

    private async Task<IEnumerable<IDictionary<string, object>>> ExecuteQueryAsync(string sql)
    {
        using var command = _context.Database.GetDbConnection().CreateCommand();
        command.CommandText = sql;
        command.CommandType = CommandType.Text;

        if (_context.Database.GetDbConnection().State != ConnectionState.Open)
        {
            await _context.Database.OpenConnectionAsync();
        }

        using var reader = await command.ExecuteReaderAsync();
        var results = new List<IDictionary<string, object>>();
        
        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                row[reader.GetName(i)] = reader.GetValue(i);
            }
            results.Add(row);
        }

        return results;
    }
}
