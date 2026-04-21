using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using QLK.Domain.Interfaces;

namespace QLK.Infrastructure.Storage;

public class CloudinaryService : IStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var account = new Account(
            configuration["Cloudinary:CloudName"],
            configuration["Cloudinary:ApiKey"],
            configuration["Cloudinary:ApiSecret"]
        );

        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        try
        {
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(fileName, fileStream),
                Folder = "qlk_vnpt",
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                throw new Exception(uploadResult.Error.Message);
            }

            // Return the SecureUrl as the "filename" to be stored in the DB
            return uploadResult.SecureUrl.ToString();
        }
        catch (Exception ex)
        {
            throw new Exception($"Error uploading file to Cloudinary: {ex.Message}", ex);
        }
    }

    public async Task DeleteFileAsync(string fileName)
    {
        try
        {
            // For Cloudinary, fileName might be the full URL. 
            // We need to extract the PublicId to delete it properly.
            // But if we store the full URL in the DB, we can just return.
            // A better way is to parse publicId from URL or just let it be.
            // For free tier simple impl, we can leave delete as optional or implement parse logic.
            
            var publicId = ExtractPublicId(fileName);
            if (!string.IsNullOrEmpty(publicId))
            {
                var delParams = new DeletionParams(publicId);
                await _cloudinary.DestroyAsync(delParams);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warn: Could not delete Cloudinary file: {ex.Message}");
        }
    }

    public async Task<string> GetFileUrlAsync(string fileName)
    {
        // If fileName is already a URL, return it
        if (fileName.StartsWith("http")) return fileName;
        return fileName;
    }

    public Task EnsureBucketExistsAsync()
    {
        // Not needed for Cloudinary
        return Task.CompletedTask;
    }

    private string ExtractPublicId(string url)
    {
        if (string.IsNullOrEmpty(url) || !url.Contains("res.cloudinary.com")) return null;
        
        try 
        {
            var uri = new Uri(url);
            var segments = uri.Segments;
            // Format: /cloud_name/image/upload/v12345/folder/public_id.jpg
            // We want everything after 'upload/v12345/' or 'upload/'
            
            var uploadIndex = Array.FindIndex(segments, s => s.Equals("upload/", StringComparison.OrdinalIgnoreCase));
            if (uploadIndex == -1) return null;

            var resultSegments = segments.Skip(uploadIndex + 1);
            // Skip version if present (vNNNNN)
            if (resultSegments.Any() && resultSegments.First().StartsWith("v") && char.IsDigit(resultSegments.First()[1]))
            {
                resultSegments = resultSegments.Skip(1);
            }

            var path = string.Join("", resultSegments);
            // Remove extension
            var lastDot = path.LastIndexOf('.');
            if (lastDot != -1) path = path.Substring(0, lastDot);
            
            return path;
        }
        catch 
        {
            return null;
        }
    }
}
