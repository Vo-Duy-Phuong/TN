namespace QLK.Domain.Interfaces;

/// <summary>
/// Interface for file storage operations (MinIO implementation)
/// </summary>
public interface IStorageService
{
    /// <summary>
    /// Uploads a file to storage and returns the filename/path
    /// </summary>
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
    
    /// <summary>
    /// Deletes a file from storage
    /// </summary>
    Task DeleteFileAsync(string fileName);
    
    /// <summary>
    /// Gets a pre-signed URL for downloading/viewing the file
    /// </summary>
    Task<string> GetFileUrlAsync(string fileName);

    /// <summary>
    /// Ensures that the configured bucket exists in storage
    /// </summary>
    Task EnsureBucketExistsAsync();
}
