using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using QLK.Domain.Interfaces;

namespace QLK.Infrastructure.Storage;

public class MinioService : IStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly string _bucketName;

    public MinioService(IMinioClient minioClient, IConfiguration configuration)
    {
        _minioClient = minioClient;
        _bucketName = configuration["MinioSettings:BucketName"] ?? "vnpt";
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        try
        {
            // Ensure bucket exists
            var beArgs = new BucketExistsArgs().WithBucket(_bucketName);
            bool found = await _minioClient.BucketExistsAsync(beArgs);
            if (!found)
            {
                var mbArgs = new MakeBucketArgs().WithBucket(_bucketName);
                await _minioClient.MakeBucketAsync(mbArgs);
            }

            // Generate unique filename to avoid collisions
            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(uniqueFileName)
                .WithStreamData(fileStream)
                .WithObjectSize(fileStream.Length)
                .WithContentType(contentType);

            await _minioClient.PutObjectAsync(putObjectArgs);

            return uniqueFileName;
        }
        catch (Exception ex)
        {
            throw new Exception($"Error uploading file to MinIO: {ex.Message}", ex);
        }
    }

    public async Task DeleteFileAsync(string fileName)
    {
        try
        {
            var args = new RemoveObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(fileName);
            await _minioClient.RemoveObjectAsync(args);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error deleting file from MinIO: {ex.Message}", ex);
        }
    }

    public async Task<string> GetFileUrlAsync(string fileName)
    {
        try
        {
            var args = new PresignedGetObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(fileName)
                .WithExpiry(3600); // 1 hour expiry
            
            return await _minioClient.PresignedGetObjectAsync(args);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error getting pre-signed URL from MinIO: {ex.Message}", ex);
        }
    }

    public async Task EnsureBucketExistsAsync()
    {
        try
        {
            var beArgs = new BucketExistsArgs().WithBucket(_bucketName);
            bool found = await _minioClient.BucketExistsAsync(beArgs);
            if (!found)
            {
                var mbArgs = new MakeBucketArgs().WithBucket(_bucketName);
                await _minioClient.MakeBucketAsync(mbArgs);
            }
        }
        catch (Exception ex)
        {
            throw new Exception($"Error ensuring MinIO bucket exists: {ex.Message}", ex);
        }
    }
}
