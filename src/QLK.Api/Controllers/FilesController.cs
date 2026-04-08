using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLK.Domain.Interfaces;

namespace QLK.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IStorageService _storageService;
    private readonly IConfiguration _configuration;

    public FilesController(IStorageService storageService, IConfiguration configuration)
    {
        _storageService = storageService;
        _configuration = configuration;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        // Validation from appsettings
        var maxFileSizeMb = _configuration.GetValue<int>("FileUpload:MaxFileSizeMB", 50);
        if (file.Length > maxFileSizeMb * 1024 * 1024)
            return BadRequest($"File size exceeds current limit of {maxFileSizeMb}MB.");

        var allowedExtensions = _configuration.GetSection("FileUpload:AllowedExtensions").Get<string[]>() ?? new[] { ".pdf", ".jpg", ".jpeg", ".png" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return BadRequest("File extension not allowed.");

        using var stream = file.OpenReadStream();
        var fileName = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType);

        return Ok(new { fileName });
    }

    [HttpGet("url/{fileName}")]
    public async Task<IActionResult> GetUrl(string fileName)
    {
        try
        {
            var url = await _storageService.GetFileUrlAsync(fileName);
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
