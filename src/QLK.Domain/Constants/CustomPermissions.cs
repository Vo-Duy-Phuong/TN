namespace QLK.Domain.Constants;

/// <summary>
/// Định nghĩa mã quyền cho hệ thống quản lý kho
/// </summary>
public static class CustomPermissions
{
    public static class Products
    {
        public const string View = "Products.View";
        public const string Create = "Products.Create";
        public const string Edit = "Products.Edit";
        public const string Delete = "Products.Delete";
    }

    public static class Categories
    {
        public const string View = "Categories.View";
        public const string Create = "Categories.Create";
        public const string Edit = "Categories.Edit";
        public const string Delete = "Categories.Delete";
    }

    public static class Brands
    {
        public const string View = "Brands.View";
        public const string Create = "Brands.Create";
        public const string Edit = "Brands.Edit";
        public const string Delete = "Brands.Delete";
    }

    public static class Warehouses
    {
        public const string View = "Warehouses.View";
        public const string Create = "Warehouses.Create";
        public const string Edit = "Warehouses.Edit";
        public const string Delete = "Warehouses.Delete";
    }

    public static class Imports
    {
        public const string View = "Imports.View";
        public const string Create = "Imports.Create";
        public const string Edit = "Imports.Edit";
        public const string Delete = "Imports.Delete";
    }

    public static class Exports
    {
        public const string View = "Exports.View";
        public const string Create = "Exports.Create";
        public const string Edit = "Exports.Edit";
        public const string Delete = "Exports.Delete";
    }

    public static class Repairs
    {
        public const string View = "Repairs.View";
        public const string Create = "Repairs.Create";
        public const string Edit = "Repairs.Edit";
        public const string Delete = "Repairs.Delete";
    }

    public static class Reports
    {
        public const string View = "Reports.View";
        public const string Create = "Reports.Create";
        public const string Delete = "Reports.Delete";
    }

    public static class Users
    {
        public const string View = "Users.View";
        public const string Create = "Users.Create";
        public const string Edit = "Users.Edit";
        public const string Delete = "Users.Delete";
    }

    public static class Roles
    {
        public const string View = "Roles.View";
        public const string Create = "Roles.Create";
        public const string Edit = "Roles.Edit";
        public const string Delete = "Roles.Delete";
        public const string AssignPermissions = "Roles.AssignPermissions";
    }

    public static class Permissions
    {
        public const string View = "Permissions.View";
        public const string Create = "Permissions.Create";
        public const string Edit = "Permissions.Edit";
        public const string Delete = "Permissions.Delete";
    }

    public static class Dashboard
    {
        public const string View = "Dashboard.View";
    }

    public static class InventoryLogs
    {
        public const string View = "InventoryLogs.View";
    }

    public static class Notifications
    {
        public const string View = "Notifications.View";
        public const string Delete = "Notifications.Delete";
    }
}
