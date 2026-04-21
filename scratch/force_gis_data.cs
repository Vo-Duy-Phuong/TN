using Microsoft.EntityFrameworkCore;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data;
using QLK.Domain.Enums;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=QLK_v1;Username=postgres;Password=123456");

using var context = new ApplicationDbContext(optionsBuilder.Options);

// 1. Update Technicians
var technicians = await context.Users
    .Where(u => u.Username.Contains("tech"))
    .ToListAsync();

if (technicians.Count >= 1) {
    technicians[0].LastLatitude = 10.4578;
    technicians[0].LastLongitude = 105.6324;
}
if (technicians.Count >= 2) {
    technicians[1].LastLatitude = 10.4610;
    technicians[1].LastLongitude = 105.6410;
}

// 2. Update Service Requests with coordinates in Cao Lãnh
var requests = await context.ServiceRequests.ToListAsync();
double baseLat = 10.4550;
double baseLng = 105.6350;

for (int i = 0; i < Math.Min(requests.Count, 10); i++)
{
    requests[i].Latitude = baseLat + (i * 0.002);
    requests[i].Longitude = baseLng + (i * 0.003 * (i % 2 == 0 ? 1 : -1));
}

await context.SaveChangesAsync();
Console.WriteLine("Force updated coordinates for GIS demo.");
