using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using QLK.Application.DTOs.AI;

namespace QLK.Application.Services;

public class GeminiService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly List<string> _apiKeys;
    private readonly string _model;
    private readonly int _maxTokens;

    public GeminiService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        var rawKeys = (configuration["AISettings:ApiKey"] ?? throw new ArgumentNullException("AISettings:ApiKey is missing")).Trim();
        _apiKeys = rawKeys.Split(';', StringSplitOptions.RemoveEmptyEntries).Select(k => k.Trim()).ToList();
        _model = (configuration["AISettings:Model"] ?? "gemini-1.5-flash").Trim();
        _maxTokens = configuration.GetValue<int>("AISettings:MaxTokens", 2048);
    }

    public async Task<AIResponseDto> ProcessQueryAsync(string message, string? context = null)
    {
        var schemaContext = @"
Dưới đây là cấu trúc Database chi tiết của hệ thống Quản lý kho VNPT (PostgreSQL):
- Categories (Id, CategoryName, Description): Danh mục sản phẩm (Modem, STB, Switch, ...). [Không có IsDeleted]
- Brands (Id, BrandName, Logo): Thương hiệu sản phẩm. [Không có IsDeleted]
- Products (Id, ProductName, Code, Unit, Price, Quantity, CategoryId, BrandId, MinQuantity, FaultyQuantity, Description, IsDeleted): Dữ liệu sản phẩm.
  * Chú ý: Quantity là hàng tốt hiện có, FaultyQuantity là hàng hỏng.
- Warehouses (Id, WarehouseName, Location, ManagerId): Danh sách kho. [Không có IsDeleted]
- Users (Id, Username, FullName, Email, Phone, RoleId, IsActive, IsDeleted): Nhân viên.
- Roles (Id, Name, Code): RoleCode gồm 'ADMIN', 'MANAGER', 'TECHNICIAN'. [Có IsDeleted]
- ImportReceipts (Id, ReceiptCode, ImportDate, WarehouseId, CreatedBy, Status): Phiếu nhập.
- ImportDetails (Id, ImportId, ProductId, Quantity, Price): Chi tiết phiếu nhập.
- ExportReceipts (Id, ReceiptCode, ExportDate, WarehouseId, TechnicianId, Status): Phiếu xuất cho KTV.
- ExportDetails (Id, ExportId, ProductId, Quantity): Chi tiết phiếu xuất.
- RetrievalReceipts/RetrievalDetails: Phiếu thu hồi hàng từ KTV về kho.
- Repairs (Id, ProductId, TechnicianId, Problem, RepairNote, Status, Cost): Thông tin sửa chữa.
- ServiceRequests (Id, CustomerName, Address, Phone, Status, AssignedTechnicianId): Yêu cầu lắp đặt mới.
- IndividualEquipments (SerialNumber, MacAddress, ProductId, WarehouseId, Status): Thiết bị cụ thể.

LOGIC NGHIỆP VỤ:
1. 'Hàng tồn kho' = Sum(Products.Quantity).
2. 'Số lượng KTV đang giữ' = (Sum(ExportDetails.Quantity) - Sum(RetrievalDetails.Quantity)) của KTV đó.
3. Khi hỏi về 'KTV', join bảng Users với bảng Roles lọc RoleCode = 'TECHNICIAN'.
4. 'Hàng hỏng' = Sum(Products.FaultyQuantity).
";

        var contextPrompt = !string.IsNullOrEmpty(context) 
            ? $"LƯU Ý NGỮ CẢNH: Người dùng hiện đang ở trang: {context}. Nếu câu hỏi của người dùng không rõ đối tượng (ví dụ: 'có bao nhiêu?'), hãy ưu tiên trả lời dựa trên trang này. TUY NHIÊN, bạn vẫn có quyền truy cập và LUÔN LUÔN phải trả lời mọi câu hỏi về TOÀN BỘ hệ thống (sản phẩm, kho, nhân viên...) dù người dùng đang ở bất kỳ trang nào." 
            : "";

        var systemPrompt = $@"
Bạn là Trợ lý dữ liệu VNPT cao cấp. Nhiệm vụ của bạn là hỗ trợ người dùng truy vấn TOÀN BỘ thông tin từ hệ thống quản lý kho dựa trên cấu trúc Database.

{contextPrompt}

QUY TẮC PHẢN HỒI:
1. LUÔN LUÔN có quyền truy cập vào TOÀN BỘ các bảng trong Schema bên dưới, không bị giới hạn bởi trang hiện tại.
2. LUÔN LUÔN sử dụng dấu ngoặc kép ("" "") cho tên bảng và tên cột để tương thích PostgreSQL (Ví dụ: ""Users"", ""ProductName"", ""IsDeleted"").
3. CHỈ lọc ""IsDeleted"" = false ở các bảng có cột này (Products, Users, Roles). KHÔNG thêm vào bảng không có (Categories, Brands, Warehouses).
4. Trong trường ""text"": Phản hồi thân thiện, ngắn gọn bằng Tiếng Việt. KHÔNG ĐƯỢC để trống.
5. Trả về JSON theo cấu trúc:
{{
  ""text"": ""Câu trả lời của bạn"", 
  ""sqlQuery"": ""Câu lệnh SELECT PostgreSQL chuẩn"",
  ""explanation"": ""Giải thích ngắn gọn logic"",
  ""chart"": null hoặc {{ ""type"": ""bar"", ... }}
}}

DỮ LIỆU HỆ THỐNG: {schemaContext}

VÍ DỤ TRUY VẤN ĐÚNG:
Câu hỏi: Có bao nhiêu sản phẩm?
SQL: SELECT COUNT(*) FROM ""Products"" WHERE ""IsDeleted"" = false;

CÂU HỎI CỦA NGƯỜI DÙNG: {message}
";

        // Use system_instruction field (separate from user content) to reduce chain-of-thought leakage
        var requestBody = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new { role = "user", parts = new[] { new { text = $"CAU HOI: {message}" } } }
            },
            generationConfig = new
            {
                temperature = 0.1,
                maxOutputTokens = _maxTokens,
                responseMimeType = "application/json"
            }
        };

        HttpResponseMessage? response = null;
        
        foreach (var key in _apiKeys)
        {
            var keyDisplay = key.Length > 8 ? $"...{key.Substring(key.Length - 5)}" : "InvalidKey";
            
            // 1. Tự động lấy danh sách model khả dụng cho Key này
            List<string> availableModels = new();
            try {
                var listUrl = $"https://generativelanguage.googleapis.com/v1beta/models?key={key}";
                var listRes = await _httpClient.GetAsync(listUrl);
                if (listRes.IsSuccessStatusCode) {
                    var listDoc = JsonDocument.Parse(await listRes.Content.ReadAsStringAsync());
                    if (listDoc.RootElement.TryGetProperty("models", out var models)) {
                        foreach (var m in models.EnumerateArray()) {
                            var mName = m.GetProperty("name").GetString();
                            if (!string.IsNullOrEmpty(mName) && mName.Contains("gemini") && mName.Contains("generateContent"))
                                availableModels.Add(mName); // Note: name already contains "models/" prefix
                        }
                    }
                }
            } catch { /* skip list error */ }

            // Thêm các model mặc định nếu không list được
            if (!availableModels.Any()) {
                availableModels.Add($"models/{_model}");
                availableModels.Add("models/gemini-1.5-flash");
                availableModels.Add("models/gemini-1.5-pro");
            }

            // 2. Thử từng model khả dụng
            foreach (var fullModelName in availableModels.Distinct())
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/{fullModelName}:generateContent?key={key}";
                try
                {
                    Console.WriteLine($"[Gemini Assistant] Trying {fullModelName} with key: {keyDisplay}");
                    response = await _httpClient.PostAsJsonAsync(url, requestBody);

                    if (response.IsSuccessStatusCode) 
                    {
                        Console.WriteLine($"[Gemini Assistant] SUCCESS! Model: {fullModelName}");
                        break; 
                    }

                    var statusCode = (int)response.StatusCode;
                    Console.WriteLine($"[Gemini Warning] {fullModelName} failed (Status: {statusCode})");
                }
                catch (Exception ex) {
                    Console.WriteLine($"[Gemini Error] {fullModelName} Exception: {ex.Message}");
                }
            }

            if (response != null && response.IsSuccessStatusCode) break;
        }

        if (response == null || !response.IsSuccessStatusCode)
        {
            return new AIResponseDto { Text = "Hệ thống AI hiện đang bị quá tải hoặc đạt giới hạn truy cập. Vui lòng quay lại sau ít phút hoặc thêm API Key dự phòng để tiếp tục." };
        }




            var jsonStr = await response.Content.ReadAsStringAsync();
            try
            {
            using var doc = JsonDocument.Parse(jsonStr);
            
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(text))
                return new AIResponseDto { Text = "Tôi không nhận được phản hồi từ AI." };

            // Smart JSON extraction: handles plain JSON, markdown code blocks, and chain-of-thought responses
            var cleanedText = text.Trim();
            
            // Strip markdown code blocks first
            if (cleanedText.Contains("```json"))
            {
                var start = cleanedText.IndexOf("```json") + 7;
                var end = cleanedText.LastIndexOf("```");
                if (end > start) cleanedText = cleanedText.Substring(start, end - start).Trim();
            }
            else if (cleanedText.Contains("```"))
            {
                var start = cleanedText.IndexOf("```") + 3;
                var end = cleanedText.LastIndexOf("```");
                if (end > start) cleanedText = cleanedText.Substring(start, end - start).Trim();
            }
            
            // For chain-of-thought models: find the outermost JSON object using bracket matching
            if (!cleanedText.TrimStart().StartsWith("{"))
            {
                var firstBrace = cleanedText.IndexOf('{');
                if (firstBrace >= 0)
                {
                    int depth = 0;
                    int lastBrace = -1;
                    bool inString = false;
                    char prev = '\0';
                    
                    for (int i = firstBrace; i < cleanedText.Length; i++)
                    {
                        char c = cleanedText[i];
                        if (c == '"' && prev != '\\') inString = !inString;
                        if (!inString)
                        {
                            if (c == '{') depth++;
                            else if (c == '}') { depth--; if (depth == 0) { lastBrace = i; break; } }
                        }
                        prev = c;
                    }
                    
                    if (lastBrace > firstBrace)
                        cleanedText = cleanedText.Substring(firstBrace, lastBrace - firstBrace + 1);
                }
                var extracted = ExtractLastJsonObject(cleanedText);
                if (extracted != null) cleanedText = extracted;
            }

            try 
            {
                return JsonSerializer.Deserialize<AIResponseDto>(cleanedText, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) 
                       ?? new AIResponseDto { Text = "Loi xu ly dinh dang phan hoi AI." };
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[Gemini Service] JSON parse failed after all extraction attempts: {ex.Message}");
                // NEVER return raw 'text' here — it may contain chain-of-thought reasoning
                return new AIResponseDto 
                { 
                    Text = "Toi da nhan duoc cau hoi nhung gap loi dinh dang phan hoi. Vui long thu lai hoac dat cau hoi theo cach khac."
                };
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Gemini Service Exception] {ex.Message}");
            return new AIResponseDto { Text = $"Da co loi xay ra: {ex.Message}" };
        }
    }

    /// <summary>
    /// Extracts the last (largest) JSON object from a text blob.
    /// Chain-of-thought models output reasoning before the final JSON answer.
    /// We extract the largest JSON block which is typically the final structured answer.
    /// </summary>
    private static string? ExtractLastJsonObject(string text)
    {
        string? bestCandidate = null;
        int searchFrom = 0;
        while (searchFrom < text.Length)
        {
            var firstBrace = text.IndexOf('{', searchFrom);
            if (firstBrace < 0) break;
            int depth = 0, lastBrace = -1;
            bool inString = false;
            char prev = '\0';
            for (int i = firstBrace; i < text.Length; i++)
            {
                char c = text[i];
                if (c == '"' && prev != '\\') inString = !inString;
                if (!inString)
                {
                    if (c == '{') depth++;
                    else if (c == '}') { depth--; if (depth == 0) { lastBrace = i; break; } }
                }
                prev = c;
            }
            if (lastBrace > firstBrace)
            {
                var candidate = text.Substring(firstBrace, lastBrace - firstBrace + 1);
                if (bestCandidate == null || candidate.Length > bestCandidate.Length)
                    bestCandidate = candidate;
                searchFrom = lastBrace + 1;
            }
            else break;
        }
        return bestCandidate;
    }
}
