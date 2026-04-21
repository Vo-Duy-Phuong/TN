using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using QLK.Domain.Interfaces;

namespace QLK.Infrastructure.Storage;

public class LocalStorageService : IStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string FolderName = "uploads";

    public LocalStorageService(IWebHostEnvironment environment, IHttpContextAccessor httpContextAccessor)
    {
        _environment = environment;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        try
        {
            var uploadsFolder = Path.Combine(_environment.WebRootPath, FolderName);
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var file = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(file);
            }

            // Return the relative path for the database
            return $"/{FolderName}/{uniqueFileName}";
        }
        catch (Exception ex)
        {
            throw new Exception($"Error uploading file to local storage: {ex.Message}", ex);
        }
    }

    public Task DeleteFileAsync(string fileName)
    {
        try
        {
            var filePath = Path.Combine(_environment.WebRootPath, fileName.TrimStart('/'));
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warn: Could not delete local file: {ex.Message}");
        }
        return Task.CompletedTask;
    }

    public Task<string> GetFileUrlAsync(string fileName)
    {
        // If it's already a URL, return it
        if (fileName.StartsWith("http")) return Task.FromResult(fileName);

        // Otherwise generate a URL based on current request
        var request = _httpContextAccessor.HttpContext?.Request;
        if (request == null) return Task.FromResult(fileName);

        var baseUrl = $"{request.Scheme}://{request.Host}";
        return Task.FromResult($"{baseUrl}{fileName}");
    }

    public Task EnsureBucketExistsAsync()
    {
        var uploadsFolder = Path.Combine(_environment.WebRootPath, FolderName);
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }
        return Task.CompletedTask;
    }
}
