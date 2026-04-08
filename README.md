# QLK Warehouse Management System

Hệ thống Quản lý Kho (QLK) - Giải pháp quản lý vật tư, thiết bị và quy trình nhập/xuất kho chuyên nghiệp cho bệnh viện.

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt và Chạy](#cài-đặt-và-chạy)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)
- [Tài khoản mặc định](#tài-khoản-mặc-định)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)

---

## Giới thiệu

Hệ thống QLK Warehouse Management là giải pháp quản lý kho toàn diện, giúp theo dõi vòng đời của vật tư thiết bị từ khi nhập kho, lưu trữ, xuất kho cho đến quá trình sửa chữa và bảo trì. Hệ thống được xây dựng trên nền tảng .NET 9 và React, mang lại hiệu năng cao và khả năng mở rộng tốt.

---

## Tính năng chính

### Quản lý Danh mục & Sản phẩm
- **Sản phẩm (Products)**: Theo dõi thông tin chi tiết, số lượng tồn kho, đơn giá.
- **Thương hiệu (Brands) & Danh mục (Categories)**: Phân loại sản phẩm khoa học.
- **Quản lý Kho (Warehouses)**: Quản lý nhiều kho bãi, vị trí lưu trữ.

### Quy trình Kho
- **Nhập kho (Imports)**: Tạo phiếu nhập, kiểm tra số lượng và cập nhật tồn kho tự động.
- **Xuất kho (Exports)**: Quy trình xuất kho cho kỹ thuật viên hoặc các khoa phòng.
- **Nhật ký tồn kho (Inventory Logs)**: Theo dõi mọi biến động tăng/giảm vật tư.

### Sửa chữa & Bảo trì
- **Quản lý sửa chữa (Repairs)**: Tiếp nhận thiết bị hỏng, phân công kỹ thuật viên xử lý và theo dõi trạng thái sửa chữa.

### Phân quyền & Bảo mật
- **RBAC (Role-Based Access Control)**: Phân quyền chi tiết đến từng hành động (View/Create/Edit/Delete).
- **JWT Authentication**: Bảo mật truy cập API với token.
- **Audit Logs**: Lưu vết mọi thao tác quan trọng trên hệ thống.

### Thông báo & Dashboard
- **SignalR Real-time**: Nhận thông báo tức thời khi có phiếu nhập mới, yêu cầu sửa chữa hoặc cảnh báo tồn kho.
- **Dashboard**: Biểu đồ thống kê trực quan về hoạt động của kho.

---

## Công nghệ sử dụng

### Backend
- **Framework**: ASP.NET Core 9.0
- **Database**: PostgreSQL với Entity Framework Core
- **Real-time**: SignalR Hubs
- **Security**: JWT Bearer, Identity Model

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State**: Redux Toolkit
- **Notifications**: React Hot Toast

---

## Cài đặt và Chạy

### Yêu cầu hệ thống
- .NET 9.0 SDK
- Node.js >= 18.x
- PostgreSQL
- Docker (Tùy chọn cho MinIO nếu có sử dụng đính kèm file)

### Bước 1: Cấu hình Backend
Cập nhật `appsettings.json` trong `src/QLK.Api/`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=QLK_DB;Username=postgres;Password=your_password"
  }
}
```

### Bước 2: Tạo Migration và Cập nhật Database
```bash
# Di chuyển vào folder API
cd src/QLK.Api

# Tạo migration (nếu chưa có)
dotnet ef migrations add InitialCreate --project ../QLK.Infrastructure --startup-project .

# Cập nhật database
dotnet ef database update --project ../QLK.Infrastructure --startup-project .
```
*(Hệ thống sẽ tự động seed dữ liệu mẫu thông qua DbInitializer khi chạy lần đầu)*

### Bước 3: Chạy Backend
```bash
dotnet run --project src/QLK.Api
```
API chạy tại: **http://localhost:5020**

---

## API Documentation

Hệ thống cung cấp Swagger UI để tra cứu toàn bộ API:
- **Auth**: `/api/auth/login`, `/api/auth/me`
- **Products**: `/api/products` (Full CRUD)
- **Warehouse Operations**: `/api/imports`, `/api/exports`, `/api/inventorylogs`
- **Repairs**: `/api/repairs`
- **Identity**: `/api/users`, `/api/roles`, `/api/permissions`

---

## Tài khoản mặc định

| Vai trò | Username | Password |
|---------|----------|----------|
| **Quản trị viên** | admin | Admin@123 |
| **Quản lý kho** | warehouse_manager | Manager@123 |
| **Kỹ thuật viên** | technician1 | Tech@123 |

---

## Kiến trúc hệ thống

Dự án áp dụng mô hình kiến trúc phân lớp (N-Tier/Clean Architecture Practical) giúp tách biệt rõ ràng giữa Business Logic và Infrastructure.

```
src/
├── QLK.Api/           # Presentation (Controllers, Hubs)
├── QLK.Application/   # Business Logic (Services, DTOs)
├── QLK.Infrastructure/# Data Access (EF Core, Security)
└── QLK.Domain/        # Core Entities & Constants
```

---

*Cập nhật lần cuối: 08/04/2026*
