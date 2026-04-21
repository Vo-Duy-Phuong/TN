using Microsoft.EntityFrameworkCore;
using QLK.Domain.Entities;
using QLK.Domain.Constants;
using QLK.Domain.Enums;
using QLK.Infrastructure.Security;

namespace QLK.Infrastructure.Data;

public static class DbInitializer
{
    // Guid cố định cho 3 role chính của hệ thống kho
    public static readonly Guid AdminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid WarehouseManagerRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid TechnicianRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await context.Database.MigrateAsync();

        // ==============================
        // 1. Seed Permissions
        // ==============================
        var existingPermissions = await context.Permissions.IgnoreQueryFilters().ToListAsync();
        var permissionsToSeed = BuildPermissionsList();

        foreach (var p in permissionsToSeed)
        {
            if (!existingPermissions.Any(x => x.Code == p.Code))
                await context.Permissions.AddAsync(p);
        }
        await context.SaveChangesAsync();
        existingPermissions = await context.Permissions.IgnoreQueryFilters().ToListAsync();

        // ==============================
        // 2. Seed Roles
        // ==============================
        var existingRoles = await context.Roles.IgnoreQueryFilters().ToListAsync();
        var rolesToSeed = new List<Role>
        {
            new Role
            {
                Id = AdminRoleId,
                Code = "ADMIN",
                Name = "Quản trị viên",
                Description = "Quản trị viên hệ thống - có toàn quyền",
                IsSystemRole = true,
                CreatedAt = DateTime.UtcNow
            },
            new Role
            {
                Id = WarehouseManagerRoleId,
                Code = "WAREHOUSE_MANAGER",
                Name = "Quản lý kho",
                Description = "Quản lý kho - quản lý nhập/xuất/hàng hóa",
                IsSystemRole = true,
                CreatedAt = DateTime.UtcNow
            },
            new Role
            {
                Id = TechnicianRoleId,
                Code = "TECHNICIAN",
                Name = "Kỹ thuật viên",
                Description = "Kỹ thuật viên - nhận hàng xuất và sửa chữa",
                IsSystemRole = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        foreach (var r in rolesToSeed)
        {
            if (!existingRoles.Any(x => x.Code == r.Code))
                await context.Roles.AddAsync(r);
        }
        await context.SaveChangesAsync();
        existingRoles = await context.Roles.IgnoreQueryFilters().ToListAsync();

        // ==============================
        // 3. Seed RolePermissions
        // ==============================

        // Admin có tất cả quyền
        var adminRole = existingRoles.FirstOrDefault(r => r.Code == "ADMIN");
        if (adminRole != null)
        {
            var currentAdminPermIds = await context.RolePermissions
                .Where(rp => rp.RoleId == adminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            foreach (var p in existingPermissions)
            {
                if (!currentAdminPermIds.Contains(p.Id))
                    await context.RolePermissions.AddAsync(new RolePermission { RoleId = adminRole.Id, PermissionId = p.Id });
            }
            await context.SaveChangesAsync();
        }

        // Warehouse Manager permissions  
        var managerRole = existingRoles.FirstOrDefault(r => r.Code == "WAREHOUSE_MANAGER");
        if (managerRole != null)
        {
            var managerCodes = new[]
            {
                CustomPermissions.Products.View, CustomPermissions.Products.Create, CustomPermissions.Products.Edit, CustomPermissions.Products.Delete,
                CustomPermissions.Categories.View, CustomPermissions.Categories.Create, CustomPermissions.Categories.Edit, CustomPermissions.Categories.Delete,
                CustomPermissions.Brands.View, CustomPermissions.Brands.Create, CustomPermissions.Brands.Edit, CustomPermissions.Brands.Delete,
                CustomPermissions.Warehouses.View, CustomPermissions.Warehouses.Create, CustomPermissions.Warehouses.Edit, CustomPermissions.Warehouses.Delete,
                CustomPermissions.Imports.View, CustomPermissions.Imports.Create, CustomPermissions.Imports.Edit, CustomPermissions.Imports.Delete,
                CustomPermissions.Exports.View, CustomPermissions.Exports.Create, CustomPermissions.Exports.Edit, CustomPermissions.Exports.Delete,
                CustomPermissions.Repairs.View,
                CustomPermissions.Reports.View, CustomPermissions.Reports.Create,
                CustomPermissions.Users.View,
                CustomPermissions.InventoryLogs.View,
                CustomPermissions.Dashboard.View,
                CustomPermissions.ServiceRequests.View, CustomPermissions.ServiceRequests.Create, CustomPermissions.ServiceRequests.Edit, CustomPermissions.ServiceRequests.Delete,
                CustomPermissions.Notifications.View, CustomPermissions.Notifications.Delete,
                CustomPermissions.Retrievals.View, CustomPermissions.Retrievals.Create, CustomPermissions.Retrievals.Delete
            };

            var currentManagerPermIds = await context.RolePermissions
                .Where(rp => rp.RoleId == managerRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            foreach (var code in managerCodes)
            {
                var p = existingPermissions.FirstOrDefault(x => x.Code == code);
                if (p != null && !currentManagerPermIds.Contains(p.Id))
                    await context.RolePermissions.AddAsync(new RolePermission { RoleId = managerRole.Id, PermissionId = p.Id });
            }
            await context.SaveChangesAsync();
        }

        // Technician permissions
        var techRole = existingRoles.FirstOrDefault(r => r.Code == "TECHNICIAN");
        if (techRole != null)
        {
            var techCodes = new[]
            {
                CustomPermissions.Products.View,
                CustomPermissions.Imports.View,
                CustomPermissions.Exports.View,
                CustomPermissions.Repairs.View, CustomPermissions.Repairs.Create, CustomPermissions.Repairs.Edit,
                CustomPermissions.Dashboard.View,
                CustomPermissions.ServiceRequests.View,
                CustomPermissions.Notifications.View,
                CustomPermissions.Notifications.Delete,
                CustomPermissions.Retrievals.View,
                CustomPermissions.Retrievals.Create,
                CustomPermissions.Warehouses.View,
                CustomPermissions.Users.View
            };

            var currentTechPermIds = await context.RolePermissions
                .Where(rp => rp.RoleId == techRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            foreach (var code in techCodes)
            {
                var p = existingPermissions.FirstOrDefault(x => x.Code == code);
                if (p != null && !currentTechPermIds.Contains(p.Id))
                    await context.RolePermissions.AddAsync(new RolePermission { RoleId = techRole.Id, PermissionId = p.Id });
            }
            await context.SaveChangesAsync();
        }

        // ==============================
        // 4. Seed Users
        // ==============================
        var userCount = await context.Users.IgnoreQueryFilters().CountAsync();
        List<User> seededUsers = new List<User>();
        if (userCount == 0)
        {
            Console.WriteLine("Seeding users...");
            seededUsers = new List<User>
            {
                new User
                {
                    Id = Guid.NewGuid(),
                    Username = "admin",
                    PasswordHash = PasswordHasher.HashPassword("Admin@123"),
                    FullName = "Quản trị viên",
                    Email = "voduyphuong26042004@gmail.com",
                    RoleId = adminRole?.Id ?? AdminRoleId,
                    IsActive = true,
                    IsEmailConfirmed = true,
                    SecurityQuestion = "Tên thành phố bạn sinh ra?",
                    SecurityAnswerHash = PasswordHasher.HashPassword("hanoi"),
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    Username = "warehouse_manager",
                    PasswordHash = PasswordHasher.HashPassword("Manager@123"),
                    FullName = "Nguyễn Văn Quản",
                    Email = "manager@qlk.com",
                    Phone = "0901234567",
                    RoleId = managerRole?.Id ?? WarehouseManagerRoleId,
                    IsActive = true,
                    IsEmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    Username = "technician1",
                    PasswordHash = PasswordHasher.HashPassword("Tech@123"),
                    FullName = "Trần Văn Kỹ",
                    Email = "tech1@qlk.com",
                    Phone = "0912345678",
                    RoleId = techRole?.Id ?? TechnicianRoleId,
                    IsActive = true,
                    IsEmailConfirmed = true,
                    LastLatitude = 10.4578,
                    LastLongitude = 105.6324,
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    Username = "technician2",
                    PasswordHash = PasswordHasher.HashPassword("Tech@123"),
                    FullName = "Lê Văn Hùng",
                    Email = "tech2@qlk.com",
                    Phone = "0922334455",
                    RoleId = techRole?.Id ?? TechnicianRoleId,
                    IsActive = true,
                    IsEmailConfirmed = true,
                    LastLatitude = 10.4610,
                    LastLongitude = 105.6410,
                    CreatedAt = DateTime.UtcNow
                }
            };
            await context.Users.AddRangeAsync(seededUsers);
            await context.SaveChangesAsync();
        }
        else
        {
            seededUsers = await context.Users.IgnoreQueryFilters().ToListAsync();
            Console.WriteLine($"Database already has {userCount} users. Skipping user seeding.");

            // Đảm bảo admin có câu hỏi bảo mật
            var adminUser = seededUsers.FirstOrDefault(u => u.Username == "admin");
            if (adminUser != null && string.IsNullOrWhiteSpace(adminUser.SecurityQuestion))
            {
                adminUser.SecurityQuestion = "Tên thành phố bạn sinh ra?";
                adminUser.SecurityAnswerHash = PasswordHasher.HashPassword("hanoi");
                adminUser.UpdatedAt = DateTime.UtcNow;
            }

            // Xóa câu hỏi bảo mật cho các tài khoản khác (Theo yêu cầu: chỉ Admin mới tự đổi được)
            foreach(var u in seededUsers.Where(x => x.Username != "admin"))
            {
                if (!string.IsNullOrEmpty(u.SecurityQuestion))
                {
                    u.SecurityQuestion = null;
                    u.SecurityAnswerHash = null;
                    u.UpdatedAt = DateTime.UtcNow;
                }
            }

            await context.SaveChangesAsync();
        }

        // ==============================
        // 5. Seed Sample Data
        // ==============================
        await SeedSampleDataAsync(context, seededUsers);

        Console.WriteLine("Database initialization and seeding completed.");
    }

    private static async Task SeedSampleDataAsync(ApplicationDbContext context, List<User> users)
    {
        // 1. Categories
        if (!await context.Categories.AnyAsync())
        {
            var categoryList = new List<Category>
            {
                new Category { Id = Guid.NewGuid(), CategoryName = "Thiết bị điện tử", Description = "Máy tính, màn hình, linh kiện điện tử" },
                new Category { Id = Guid.NewGuid(), CategoryName = "Dụng cụ y tế", Description = "Dụng cụ và thiết bị y tế" },
                new Category { Id = Guid.NewGuid(), CategoryName = "Văn phòng phẩm", Description = "Bút, giấy, mực in..." },
                new Category { Id = Guid.NewGuid(), CategoryName = "Thiết bị điện", Description = "Máy phát điện, UPS, ổn áp" }
            };
            await context.Categories.AddRangeAsync(categoryList);
            await context.SaveChangesAsync();
            Console.WriteLine("Categories seeded.");
        }

        // 2. Brands
        if (!await context.Brands.AnyAsync())
        {
            var brandList = new List<Brand>
            {
                new Brand { Id = Guid.NewGuid(), BrandName = "Dell" },
                new Brand { Id = Guid.NewGuid(), BrandName = "HP" },
                new Brand { Id = Guid.NewGuid(), BrandName = "Xiaomi" },
                new Brand { Id = Guid.NewGuid(), BrandName = "Thiết bị nội địa" }
            };
            await context.Brands.AddRangeAsync(brandList);
            await context.SaveChangesAsync();
            Console.WriteLine("Brands seeded.");
        }

        // 3. Warehouses
        if (!await context.Warehouses.AnyAsync())
        {
            var managerUser = users.FirstOrDefault(u => u.Username == "warehouse_manager") ?? users.FirstOrDefault();
            var adminUser = users.FirstOrDefault(u => u.Username == "admin") ?? users.FirstOrDefault();

            if (managerUser != null && adminUser != null)
            {
                var warehouseList = new List<Warehouse>
                {
                    new Warehouse { Id = Guid.NewGuid(), WarehouseName = "Kho Chính", Location = "Tầng 1, Tòa nhà A", ManagerId = managerUser.Id },
                    new Warehouse { Id = Guid.NewGuid(), WarehouseName = "Kho Vật Tư", Location = "Tầng hầm, Tòa nhà B", ManagerId = managerUser.Id },
                    new Warehouse { Id = Guid.NewGuid(), WarehouseName = "Kho Phụ 1", Location = "Tòa nhà C", ManagerId = adminUser.Id },
                    new Warehouse { Id = Guid.NewGuid(), WarehouseName = "Kho Trung Chuyển", Location = "Khu vực cổng số 2", ManagerId = managerUser.Id }
                };
                await context.Warehouses.AddRangeAsync(warehouseList);
                await context.SaveChangesAsync();
                Console.WriteLine("Warehouses seeded.");
            }
        }

        // 4. Products
        if (!await context.Products.AnyAsync())
        {
            var cats = await context.Categories.ToListAsync();
            var brs = await context.Brands.ToListAsync();

            if (cats.Any() && brs.Any())
            {
                var productList = new List<Product>
                {
                    new Product
                    {
                        Id = Guid.NewGuid(),
                        ProductName = "Máy tính xách tay Dell Latitude",
                        CategoryId = cats[0].Id,
                        BrandId = brs[0].Id,
                        Quantity = 10,
                        Price = 15000000,
                        Image = "/uploads/products/laptop.png",
                        Description = "Laptop văn phòng Dell Latitude 5420"
                    },
                    new Product
                    {
                        Id = Guid.NewGuid(),
                        ProductName = "Màn hình HP 24 inch",
                        CategoryId = cats[0].Id,
                        BrandId = brs[1].Id,
                        Quantity = 15,
                        Price = 4500000,
                        Image = "/uploads/products/monitor.png",
                        Description = "Màn hình HP V24i Full HD"
                    },
                    new Product
                    {
                        Id = Guid.NewGuid(),
                        ProductName = "UPS APC 1000VA",
                        CategoryId = cats.Last().Id,
                        BrandId = brs.Last().Id,
                        Quantity = 5,
                        Price = 3200000,
                        Image = "/uploads/products/ups.png",
                        Description = "Bộ lưu điện APC 1000VA"
                    }
                };
                await context.Products.AddRangeAsync(productList);
                await context.SaveChangesAsync();
                Console.WriteLine("Products seeded.");
            }
        }

        // 5. Service Requests
        if (!await context.ServiceRequests.AnyAsync())
        {
            var requests = new List<ServiceRequest>
            {
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Nguyễn Hữu Đa", PhoneNumber = "0987654321", Address = "123 Đường 30/4, Cao Lãnh", Latitude = 10.4550, Longitude = 105.6350, Status = ServiceStatus.Pending },
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Phạm Minh Hoàng", PhoneNumber = "0977123456", Address = "45 Lê Lợi, Cao Lãnh", Latitude = 10.4580, Longitude = 105.6300, Status = ServiceStatus.Pending },
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Võ Duy Phương", PhoneNumber = "0966112233", Address = "Tổ 12, P. Mỹ Phú, Cao Lãnh", Latitude = 10.4620, Longitude = 105.6450, Status = ServiceStatus.Pending },
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Lê Thị Hồng", PhoneNumber = "0955998877", Address = "Chợ Cao Lãnh", Latitude = 10.4570, Longitude = 105.6320, Status = ServiceStatus.Approved },
                new ServiceRequest { Id = Guid.NewGuid(), CustomerName = "Đặng Văn Tèo", PhoneNumber = "0944332211", Address = "Cầu Cao Lãnh", Latitude = 10.4450, Longitude = 105.6150, Status = ServiceStatus.Pending }
            };
            await context.ServiceRequests.AddRangeAsync(requests);
            await context.SaveChangesAsync();
            Console.WriteLine("ServiceRequests seeded.");
        }
    }

    private static List<Permission> BuildPermissionsList()
    {
        return new List<Permission>
        {
            // Products
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Products.View, Name = "Xem sản phẩm", Category = "Products" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Products.Create, Name = "Thêm sản phẩm", Category = "Products" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Products.Edit, Name = "Sửa sản phẩm", Category = "Products" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Products.Delete, Name = "Xóa sản phẩm", Category = "Products" },

            // Categories
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Categories.View, Name = "Xem danh mục", Category = "Categories" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Categories.Create, Name = "Thêm danh mục", Category = "Categories" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Categories.Edit, Name = "Sửa danh mục", Category = "Categories" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Categories.Delete, Name = "Xóa danh mục", Category = "Categories" },

            // Brands
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Brands.View, Name = "Xem thương hiệu", Category = "Brands" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Brands.Create, Name = "Thêm thương hiệu", Category = "Brands" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Brands.Edit, Name = "Sửa thương hiệu", Category = "Brands" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Brands.Delete, Name = "Xóa thương hiệu", Category = "Brands" },

            // Warehouses
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Warehouses.View, Name = "Xem kho", Category = "Warehouses" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Warehouses.Create, Name = "Thêm kho", Category = "Warehouses" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Warehouses.Edit, Name = "Sửa kho", Category = "Warehouses" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Warehouses.Delete, Name = "Xóa kho", Category = "Warehouses" },

            // Imports
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Imports.View, Name = "Xem phiếu nhập", Category = "Imports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Imports.Create, Name = "Tạo phiếu nhập", Category = "Imports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Imports.Edit, Name = "Sửa phiếu nhập", Category = "Imports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Imports.Delete, Name = "Xóa phiếu nhập", Category = "Imports" },

            // Exports
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Exports.View, Name = "Xem phiếu xuất", Category = "Exports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Exports.Create, Name = "Tạo phiếu xuất", Category = "Exports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Exports.Edit, Name = "Sửa phiếu xuất", Category = "Exports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Exports.Delete, Name = "Xóa phiếu xuất", Category = "Exports" },

            // Repairs
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Repairs.View, Name = "Xem sửa chữa", Category = "Repairs" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Repairs.Create, Name = "Tạo phiếu sửa chữa", Category = "Repairs" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Repairs.Edit, Name = "Cập nhật sửa chữa", Category = "Repairs" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Repairs.Delete, Name = "Xóa phiếu sửa chữa", Category = "Repairs" },

            // Reports
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Reports.View, Name = "Xem báo cáo", Category = "Reports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Reports.Create, Name = "Tạo báo cáo", Category = "Reports" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Reports.Delete, Name = "Xóa báo cáo", Category = "Reports" },

            // Users
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.View, Name = "Xem người dùng", Category = "Users" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.Create, Name = "Thêm người dùng", Category = "Users" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.Edit, Name = "Sửa người dùng", Category = "Users" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Users.Delete, Name = "Xóa người dùng", Category = "Users" },

            // Roles
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.View, Name = "Xem vai trò", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.Create, Name = "Thêm vai trò", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.Edit, Name = "Sửa vai trò", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.Delete, Name = "Xóa vai trò", Category = "Roles" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Roles.AssignPermissions, Name = "Gán quyền", Category = "Roles" },

            // Permissions
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.View, Name = "Xem quyền", Category = "Permissions" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.Create, Name = "Thêm quyền", Category = "Permissions" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.Edit, Name = "Sửa quyền", Category = "Permissions" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Permissions.Delete, Name = "Xóa quyền", Category = "Permissions" },

            // Others
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Dashboard.View, Name = "Xem dashboard", Category = "Dashboard" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.InventoryLogs.View, Name = "Xem nhật ký tồn kho", Category = "InventoryLogs" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Notifications.View, Name = "Xem thông báo", Category = "Notifications" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Notifications.Delete, Name = "Xóa thông báo", Category = "Notifications" },
            
            // Retrievals
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Retrievals.View, Name = "Xem phiếu thu hồi", Category = "Retrievals" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Retrievals.Create, Name = "Tạo phiếu thu hồi", Category = "Retrievals" },
            new Permission { Id = Guid.NewGuid(), Code = CustomPermissions.Retrievals.Delete, Name = "Xóa phiếu thu hồi", Category = "Retrievals" },
        };
    }
}
