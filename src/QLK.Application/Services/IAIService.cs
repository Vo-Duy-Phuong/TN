using System;
using System.Threading.Tasks;
using QLK.Application.DTOs.AI;

namespace QLK.Application.Services;

public interface IAIService
{
    Task<AIResponseDto> ProcessQueryAsync(string message, string? context = null);
}
