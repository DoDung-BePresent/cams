# Log.AI-CAMS API Documentation

Tài liệu API đầy đủ cho hệ thống Log.AI-CAMS CMS.

## 📦 Postman Collection

### Import Collection

**File:** [`Postman_Collection_LogAI_CAMS_API.json`](Postman_Collection_LogAI_CAMS_API.json)

**Cấu trúc:**
```
LogAI_CAMS_API/
├── Auth/
│   ├── Login
│   ├── Logout
│   ├── Get Profile
│   ├── Refresh Token
│   └── Change Password
└── Brand/
    ├── Get Brands (Paged List)
    ├── Get Brand By Id
    ├── Create Brand
    ├── Update Brand (Partial)
    └── Delete Brand
```

**Các bước:**
1. Mở Postman → **Import** → **File**
2. Chọn `Postman_Collection_LogAI_CAMS_API.json`
3. Collection **LogAI_CAMS_API** sẽ xuất hiện với 2 folders: **Auth** & **Brand**

### Collection Variables

| Variable       | Giá trị mặc định          | Mô tả                                            |
|----------------|---------------------------|--------------------------------------------------|
| `baseUrl`      | `https://localhost:7001`  | API base URL (thay đổi theo môi trường)          |
| `accessToken`  | `""`                      | Bearer token (tự động lưu sau khi Login thành công) |

**Lưu ý:** Token được tự động lưu vào collection variable sau khi Login hoặc Refresh Token thành công (xem tab **Tests** của các request đó).

---

## 📚 API Documentation

### Auth Module

**Path:** [`auth/API_Auth.md`](auth/API_Auth.md)

Bao gồm:
- Login, Logout, Get Profile, Refresh Token, Change Password
- DTOs: `LoginRequest`, `AuthResponse`, `ProfileResponse`, `ChangePasswordRequest`
- Enums: `RoleEnum` (SystemAdmin, BrandManager, StoreManager)
- TypeScript & Dart types

### Brand Module

**Path:** [`brands/API_Brands.md`](brands/API_Brands.md)

Bao gồm:
- GET /api/brands (paged list), GET by ID, POST (create), PATCH (partial update), DELETE
- Authorization matrix theo role
- DTOs: `BrandRequest`, `BrandFilter`, `BrandListItem`, `BrandDetailResponse`
- TypeScript & Dart types

---

## 🔐 Authentication Flow

1. **Login** (`POST /api/auth/login`) → Nhận `accessToken` (tự động lưu vào collection variable)
2. **Sử dụng token** → Tất cả các request khác dùng `Authorization: Bearer {{accessToken}}`
3. **Refresh Token** (`POST /api/auth/refresh-token`) → Làm mới token khi hết hạn (dùng HttpOnly cookie)
4. **Logout** (`POST /api/auth/logout`) → Xóa refresh token và session

**Token expiry:** Nếu nhận `401 Unauthorized`, gọi Refresh Token để lấy token mới.

---

## 🛠️ Môi trường phát triển

Thay đổi `baseUrl` trong collection variables để phù hợp với môi trường:

| Môi trường  | Base URL                          |
|-------------|-----------------------------------|
| Local       | `https://localhost:7001`          |
| Development | `https://dev.logaicams.com`       |
| Staging     | `https://staging.logaicams.com`   |
| Production  | `https://api.logaicams.com`       |

---

## 📝 Notes

- **Multipart/form-data:** Brand create/update endpoints dùng form-data (có file upload cho logo)
- **403 Forbidden:** Mỗi endpoint có role restrictions khác nhau — xem Authorization Matrix trong docs
- **Own brand access:** BrandManager/StoreManager chỉ truy cập được brand của mình (checked ở handler)
- **Saved responses:** Mỗi request có example responses (200, 400, 403, 404, 422) để tham khảo

---

## 🔗 Legacy Collections (sẽ deprecated)

Nếu cần tách riêng:
- [`auth/Postman_Collection_Auth.json`](auth/Postman_Collection_Auth.json) — Auth module only
- [`brands/Postman_Collection_Brands.json`](brands/Postman_Collection_Brands.json) — Brand module only

**Khuyến nghị:** Sử dụng collection tổng hợp [`Postman_Collection_LogAI_CAMS_API.json`](Postman_Collection_LogAI_CAMS_API.json) để quản lý dễ dàng hơn.
