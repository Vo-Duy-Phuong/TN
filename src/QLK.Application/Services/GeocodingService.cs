using System;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace QLK.Application.Services;

public interface IGeocodingService
{
    Task<(double Latitude, double Longitude)> GeocodeAddressAsync(string address, CancellationToken ct = default);
}

public class GeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    
    // VNPT Cao Lãnh Center as fallback
    private const double DEFAULT_LAT = 10.4578;
    private const double DEFAULT_LNG = 105.6324;

    public GeocodingService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        // User-Agent is required by Nominatim
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "QLK-VNPT-App");
        }
    }

    public async Task<(double Latitude, double Longitude)> GeocodeAddressAsync(string address, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(address)) return (DEFAULT_LAT, DEFAULT_LNG);

        try
        {
            // OpenStreetMap Nominatim API - Bias towards Vietnam and specific region
            var query = address;
            if (!query.Contains("Vietnam", StringComparison.OrdinalIgnoreCase))
                query += ", Vietnam";

            // Bias towards Cao Lãnh city box to avoid matching same street names in other cities
            // Cao Lãnh bounding box roughly: 10.4, 105.5 to 10.5, 105.7
            var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(query)}&format=json&limit=1&viewbox=105.5,10.5,105.7,10.4&bounded=1";
            
            var response = await _httpClient.GetAsync(url, ct);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(ct);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                {
                    var first = root[0];
                    if (double.TryParse(first.GetProperty("lat").GetString(), CultureInfo.InvariantCulture, out double lat) &&
                        double.TryParse(first.GetProperty("lon").GetString(), CultureInfo.InvariantCulture, out double lon))
                    {
                        return (lat, lon);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Geocoding failed for address '{address}': {ex.Message}");
        }

        // Fallback for Cao Lãnh region if API fails or address not found
        // If address mentions Cao Lãnh, return variations slightly around center
        if (address.Contains("Cao Lãnh", StringComparison.OrdinalIgnoreCase))
        {
            var rand = new Random();
            return (DEFAULT_LAT + (rand.NextDouble() - 0.5) * 0.02, DEFAULT_LNG + (rand.NextDouble() - 0.5) * 0.02);
        }

        return (DEFAULT_LAT, DEFAULT_LNG);
    }
}
