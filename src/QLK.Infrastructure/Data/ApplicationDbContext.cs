using Microsoft.EntityFrameworkCore;
using QLK.Domain.Entities;
using QLK.Infrastructure.Data.Configurations;

namespace QLK.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Auth / RBAC
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    // Kho hàng
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();

    // Phiếu nhập / xuất
    public DbSet<ImportReceipt> ImportReceipts => Set<ImportReceipt>();
    public DbSet<ImportDetail> ImportDetails => Set<ImportDetail>();
    public DbSet<ExportReceipt> ExportReceipts => Set<ExportReceipt>();
    public DbSet<ExportDetail> ExportDetails => Set<ExportDetail>();
    public DbSet<RetrievalReceipt> RetrievalReceipts => Set<RetrievalReceipt>();
    public DbSet<RetrievalDetail> RetrievalDetails => Set<RetrievalDetail>();

    // Sửa chữa & Báo cáo
    public DbSet<Repair> Repairs => Set<Repair>();
    public DbSet<InventoryLog> InventoryLogs => Set<InventoryLog>();
    public DbSet<Report> Reports => Set<Report>();

    // Thông báo
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<IndividualEquipment> IndividualEquipments => Set<IndividualEquipment>();
    
    // Dịch vụ khách hàng
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
    public DbSet<ServiceRequestEquipment> ServiceRequestEquipments => Set<ServiceRequestEquipment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RoleConfiguration());
        modelBuilder.ApplyConfiguration(new PermissionConfiguration());
        modelBuilder.ApplyConfiguration(new RolePermissionConfiguration());

        // User → Role
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasQueryFilter(u => !u.IsDeleted);
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Role query filter
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasQueryFilter(r => !r.IsDeleted);
        });

        // Permission query filter
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasQueryFilter(p => !p.IsDeleted);
        });

        // RolePermission — composite key
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });
            entity.HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(p => p.Brand)
                .WithMany(b => b.Products)
                .HasForeignKey(p => p.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Warehouse
        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasOne(w => w.Manager)
                .WithMany(u => u.ManagedWarehouses)
                .HasForeignKey(w => w.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ImportReceipt
        modelBuilder.Entity<ImportReceipt>(entity =>
        {
            entity.HasOne(ir => ir.Warehouse)
                .WithMany(w => w.ImportReceipts)
                .HasForeignKey(ir => ir.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(ir => ir.Creator)
                .WithMany(u => u.CreatedImportReceipts)
                .HasForeignKey(ir => ir.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ImportDetail
        modelBuilder.Entity<ImportDetail>(entity =>
        {
            entity.HasOne(id => id.ImportReceipt)
                .WithMany(ir => ir.ImportDetails)
                .HasForeignKey(id => id.ImportId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(id => id.Product)
                .WithMany(p => p.ImportDetails)
                .HasForeignKey(id => id.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ExportReceipt
        modelBuilder.Entity<ExportReceipt>(entity =>
        {
            entity.HasOne(er => er.Warehouse)
                .WithMany(w => w.ExportReceipts)
                .HasForeignKey(er => er.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(er => er.Technician)
                .WithMany(u => u.CreatedExportReceipts)
                .HasForeignKey(er => er.TechnicianId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ExportDetail
        modelBuilder.Entity<ExportDetail>(entity =>
        {
            entity.HasOne(ed => ed.ExportReceipt)
                .WithMany(er => er.ExportDetails)
                .HasForeignKey(ed => ed.ExportId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ed => ed.Product)
                .WithMany(p => p.ExportDetails)
                .HasForeignKey(ed => ed.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // RetrievalReceipt
        modelBuilder.Entity<RetrievalReceipt>(entity =>
        {
            entity.HasOne(rr => rr.Warehouse)
                .WithMany(w => w.RetrievalReceipts)
                .HasForeignKey(rr => rr.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(rr => rr.Technician)
                .WithMany(u => u.RetrievalReceipts)
                .HasForeignKey(rr => rr.TechnicianId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // RetrievalDetail
        modelBuilder.Entity<RetrievalDetail>(entity =>
        {
            entity.HasOne(rd => rd.RetrievalReceipt)
                .WithMany(rr => rr.RetrievalDetails)
                .HasForeignKey(rd => rd.RetrievalReceiptId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(rd => rd.Product)
                .WithMany(p => p.RetrievalDetails)
                .HasForeignKey(rd => rd.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Repair
        modelBuilder.Entity<Repair>(entity =>
        {
            entity.HasOne(r => r.Product)
                .WithMany(p => p.Repairs)
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(r => r.Technician)
                .WithMany(u => u.AssignedRepairs)
                .HasForeignKey(r => r.TechnicianId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // InventoryLog
        modelBuilder.Entity<InventoryLog>(entity =>
        {
            entity.HasOne(il => il.Product)
                .WithMany(p => p.InventoryLogs)
                .HasForeignKey(il => il.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(il => il.User)
                .WithMany(u => u.InventoryLogs)
                .HasForeignKey(il => il.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Report
        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasOne(r => r.Creator)
                .WithMany(u => u.CreatedReports)
                .HasForeignKey(r => r.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ServiceRequest
        modelBuilder.Entity<ServiceRequest>(entity =>
        {
            entity.HasOne(sr => sr.AssignedTechnician)
                .WithMany()
                .HasForeignKey(sr => sr.AssignedTechnicianId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(sr => sr.ProcessedBy)
                .WithMany()
                .HasForeignKey(sr => sr.ProcessedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ServiceRequestEquipment
        modelBuilder.Entity<ServiceRequestEquipment>(entity =>
        {
            entity.HasOne(sre => sre.ServiceRequest)
                .WithMany(sr => sr.EquipmentsUsed)
                .HasForeignKey(sre => sre.ServiceRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sre => sre.Product)
                .WithMany()
                .HasForeignKey(sre => sre.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // IndividualEquipment
        modelBuilder.Entity<IndividualEquipment>(entity =>
        {
            entity.HasOne(e => e.Product)
                .WithMany(p => p.IndividualEquipments)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Warehouse)
                .WithMany()
                .HasForeignKey(e => e.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ImportDetail)
                .WithMany(id => id.IndividualEquipments)
                .HasForeignKey(e => e.ImportDetailId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ExportDetail)
                .WithMany(ed => ed.IndividualEquipments)
                .HasForeignKey(e => e.ExportDetailId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.RetrievalDetail)
                .WithMany(rd => rd.IndividualEquipments)
                .HasForeignKey(e => e.RetrievalDetailId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ServiceRequest)
                .WithMany()
                .HasForeignKey(e => e.ServiceRequestId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
