using System;
using System.Collections.Generic;

namespace QLK.Application.DTOs.AI;

public class AIRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? Context { get; set; }
}

public class AIResponseDto
{
    public string Text { get; set; } = string.Empty;
    public string? SqlQuery { get; set; }
    public AIChartData? Chart { get; set; }
    public IEnumerable<object>? Data { get; set; }
    public string? Explanation { get; set; }
}

public class AIChartData
{
    public string Type { get; set; } = "bar"; // bar, pie, line
    public string Title { get; set; } = string.Empty;
    public string[] Labels { get; set; } = Array.Empty<string>();
    public List<AIChartDataset> Datasets { get; set; } = new();
}

public class AIChartDataset
{
    public string Label { get; set; } = string.Empty;
    public double[] Data { get; set; } = Array.Empty<double>();
    public string? BackgroundColor { get; set; }
}
