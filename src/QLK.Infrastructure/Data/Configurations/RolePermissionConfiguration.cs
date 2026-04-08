using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QLK.Domain.Entities;

namespace QLK.Infrastructure.Data.Configurations;

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("RolePermissions");
        // Composite key defined in ApplicationDbContext
        builder.Property(x => x.AssignedAt).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}
