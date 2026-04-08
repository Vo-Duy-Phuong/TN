using QLK.Domain.Constants;

namespace QLK.Infrastructure.Security;

public static class PermissionProvider
{
    public static IEnumerable<string> GetPermissionsForRole(string roleCode)
    {
        return roleCode.ToUpper() switch
        {
            "ADMIN" => GetAllPermissions(),
            "WAREHOUSE_MANAGER" => GetManagerPermissions(),
            "TECHNICIAN" => GetStaffPermissions(),
            _ => Enumerable.Empty<string>()
        };
    }

    private static IEnumerable<string> GetAllPermissions()
    {
        return new List<string>
        {
            CustomPermissions.Products.View,
            CustomPermissions.Products.Create,
            CustomPermissions.Products.Edit,
            CustomPermissions.Products.Delete,
            CustomPermissions.Categories.View,
            CustomPermissions.Categories.Create,
            CustomPermissions.Categories.Edit,
            CustomPermissions.Categories.Delete,
            CustomPermissions.Brands.View,
            CustomPermissions.Brands.Create,
            CustomPermissions.Brands.Edit,
            CustomPermissions.Brands.Delete,
            CustomPermissions.Warehouses.View,
            CustomPermissions.Warehouses.Create,
            CustomPermissions.Warehouses.Edit,
            CustomPermissions.Warehouses.Delete,
            CustomPermissions.Imports.View,
            CustomPermissions.Imports.Create,
            CustomPermissions.Imports.Edit,
            CustomPermissions.Imports.Delete,
            CustomPermissions.Exports.View,
            CustomPermissions.Exports.Create,
            CustomPermissions.Exports.Edit,
            CustomPermissions.Exports.Delete,
            CustomPermissions.Repairs.View,
            CustomPermissions.Repairs.Create,
            CustomPermissions.Repairs.Edit,
            CustomPermissions.Repairs.Delete,
            CustomPermissions.Users.View,
            CustomPermissions.Users.Create,
            CustomPermissions.Users.Edit,
            CustomPermissions.Users.Delete,
            CustomPermissions.Roles.View,
            CustomPermissions.Roles.Create,
            CustomPermissions.Roles.Edit,
            CustomPermissions.Roles.Delete,
            CustomPermissions.Roles.AssignPermissions,
            CustomPermissions.Permissions.View,
            CustomPermissions.Permissions.Create,
            CustomPermissions.Permissions.Edit,
            CustomPermissions.Permissions.Delete,
            CustomPermissions.Dashboard.View,
            CustomPermissions.InventoryLogs.View,
            CustomPermissions.Notifications.View
        };
    }

    private static IEnumerable<string> GetManagerPermissions()
    {
        return new List<string>
        {
            CustomPermissions.Products.View,
            CustomPermissions.Products.Create,
            CustomPermissions.Products.Edit,
            CustomPermissions.Categories.View,
            CustomPermissions.Brands.View,
            CustomPermissions.Warehouses.View,
            CustomPermissions.Imports.View,
            CustomPermissions.Imports.Create,
            CustomPermissions.Exports.View,
            CustomPermissions.Exports.Create,
            CustomPermissions.Repairs.View,
            CustomPermissions.Dashboard.View,
            CustomPermissions.Notifications.View
        };
    }

    private static IEnumerable<string> GetStaffPermissions()
    {
        return new List<string>
        {
            CustomPermissions.Products.View,
            CustomPermissions.Exports.View,
            CustomPermissions.Repairs.View,
            CustomPermissions.Repairs.Create,
            CustomPermissions.Dashboard.View,
            CustomPermissions.Notifications.View
        };
    }
}
