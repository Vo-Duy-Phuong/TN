// QLK Warehouse API - Technician Zones Integration - 2026-05-01
using Microsoft.AspNetCore.Authentication.JwtBearer;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QLK.Api.Hubs;
using QLK.Api.Services;
using QLK.Application.Services;
using QLK.Infrastructure.Data;
using QLK.Infrastructure.Security;
using QLK.Infrastructure.Storage;
using QLK.Infrastructure.Email;
using QLK.Domain.Interfaces;
using Minio;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "QLK Warehouse API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyForDevelopmentPhaseOnly@123";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"] ?? "QLK.Warehouse",
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"] ?? "QLK.Warehouse.Users",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        
        // Allow SignalR to use JWT from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Authorization
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

// Register Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IBrandService, BrandService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IImportService, ImportService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<IRepairService, RepairService>();
builder.Services.AddScoped<IInventoryLogService, InventoryLogService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IServiceRequestService, ServiceRequestService>();
builder.Services.AddScoped<IIndividualEquipmentService, IndividualEquipmentService>();
builder.Services.AddScoped<IRetrievalService, RetrievalService>();
builder.Services.AddScoped<IGISService, GISService>();
builder.Services.AddScoped<ITechnicianZoneService, TechnicianZoneService>();
builder.Services.AddHttpClient<IGeocodingService, GeocodingService>();
builder.Services.AddScoped<IAIService, GeminiService>();

// Storage - Hierarchical Fallback: Cloudinary -> Minio (Local) -> LocalStorage (Prod Fallback)
if (!string.IsNullOrEmpty(builder.Configuration["Cloudinary:CloudName"]))
{
    builder.Services.AddScoped<IStorageService, CloudinaryService>();
    Console.WriteLine("Using Cloudinary for storage.");
}
else if (builder.Environment.IsDevelopment())
{
    // Local development usually has MinIO via Docker Compose
    builder.Services.AddScoped<IMinioClient>(sp =>
    {
        var minioSettings = builder.Configuration.GetSection("MinioSettings");
        return new MinioClient()
            .WithEndpoint(minioSettings["Endpoint"] ?? "localhost:9100")
            .WithCredentials(minioSettings["AccessKey"] ?? "minioadmin", minioSettings["SecretKey"] ?? "minioadmin123")
            .WithSSL(bool.Parse(minioSettings["UseSSL"] ?? "false"))
            .Build();
    });
    builder.Services.AddScoped<IStorageService, MinioService>();
    Console.WriteLine("Using MinIO for storage.");
}
else
{
    // Production fallback on Render when no Cloudinary is provided
    builder.Services.AddScoped<IStorageService, LocalStorageService>();
    Console.WriteLine("Using Local Storage for storage (Files will be ephemeral on Render).");
}

builder.Services.AddScoped<INotificationSender, SignalRNotificationSender>();
builder.Services.AddSingleton<IUserIdProvider, CustomUserIdProvider>();

builder.Services.AddScoped<IJwtService>(sp =>
{
    var context = sp.GetRequiredService<ApplicationDbContext>();
    return new JwtService(
        secretKey,
        jwtSettings["Issuer"] ?? "QLK.Warehouse",
        jwtSettings["Audience"] ?? "QLK.Warehouse.Users",
        context,
        int.Parse(jwtSettings["ExpirationHours"] ?? "8")
    );
});

// SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
}).AddJsonProtocol(options => {
    options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithExposedHeaders("X-Total-Count", "x-total-count");
    });
});

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Manual Patch for Auto-Reconciliation (Ensures DB is ready even if migration file is missing)
        try {
            await context.Database.ExecuteSqlRawAsync(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExportReceipts' AND column_name='ServiceRequestId') THEN
                        ALTER TABLE ""ExportReceipts"" ADD COLUMN ""ServiceRequestId"" uuid NULL;
                    END IF;

                    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='MaterialReconciliations') THEN
                        CREATE TABLE ""MaterialReconciliations"" (
                            ""Id"" uuid NOT NULL PRIMARY KEY,
                            ""ServiceRequestId"" uuid NOT NULL,
                            ""ProductId"" uuid NOT NULL,
                            ""ExportedQuantity"" integer NOT NULL,
                            ""UsedQuantity"" integer NOT NULL,
                            ""Explanation"" text NULL,
                            ""Status"" integer NOT NULL,
                            ""CreatedAt"" timestamp with time zone NOT NULL
                        );
                    END IF;
                END $$;");
            Console.WriteLine("Database schema patch applied successfully.");
        } catch (Exception ex) {
            Console.WriteLine($"Database patch warning: {ex.Message}");
        }

        // Auto-apply pending migrations on startup
        await context.Database.MigrateAsync();
        Console.WriteLine("Database migrations applied successfully.");
        await DbInitializer.SeedAsync(context);
        Console.WriteLine("Database initialization and seeding completed.");

        // Ensure Bucket exists (Only for MinIO)
        if (builder.Configuration["Cloudinary:CloudName"] == null)
        {
            var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();
            await storageService.EnsureBucketExistsAsync();
            Console.WriteLine("MinIO bucket initialization completed.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error during startup: {ex.Message}");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "QLK Warehouse API v1"));
}

app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseResponseCompression();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Configure dynamic port for Render
var port = Environment.GetEnvironmentVariable("PORT") ?? "5020";
app.Run($"http://0.0.0.0:{port}");
