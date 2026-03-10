# CMS User API Documentation

Tài liệu API User Management cho CMS (React TypeScript & Flutter). Base path: **`/api/users`**.

> **Postman Collection:** Import [Postman_Collection_Users.json](./Postman_Collection_Users.json) → Các endpoint User nằm trong folder **Users**.
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md).

---

## 1. Authorization Matrix

| Endpoint                                    | SystemAdmin | BrandManager (own brand) | StoreManager |
|--------------------------------------------|:-----------:|:------------------------:|:------------:|
| `GET /api/users`                            | ✅          | ✅ (filters to own brand)| ❌           |
| `GET /api/users/{id}`                       | ✅          | ✅ (own brand, non-SA)   | ❌           |
| `POST /api/users`                           | ✅          | ✅ (StoreManager only)   | ❌           |
| `PATCH /api/users/{id}`                     | ✅          | ✅ (own brand non-BM)    | ❌           |
| `PUT /api/users/{id}/status`                | ✅          | ✅ (own brand)           | ❌           |
| `PUT /api/users/{id}/reset-password`        | ✅          | ✅ (own brand, non-BM)   | ❌           |
| `PUT /api/users/{id}/brand`                 | ✅          | ❌                       | ❌           |
| `PUT /api/users/{id}/store`                 | ✅          | ✅ (own brand)           | ❌           |

**Ghi chú:**
- **BrandManager** bị tự động filter về brand của mình khi gọi `GET /api/users`.
- **BrandManager** không thể tự update chính mình qua `PATCH /api/users/{id}`.
- **PrimaryOwner** của brand không thể bị toggle, reassign brand, hay reset password bởi BrandManager thông thường. Cần gọi `PUT /api/brands/{id}/transfer-ownership` trước.
- **StoreManager** không có quyền truy cập bất kỳ endpoint nào trong nhóm này. Dùng `/api/auth/profile` để xem thông tin cá nhân.

---

## 2. Localization & Request Headers

Mọi request có thể kèm header **`Accept-Language`** để chỉ định ngôn ngữ cho validation messages.

```http
GET /api/users?page=1
Authorization: Bearer {{accessToken}}
Accept-Language: vi-VN
```

**Supported Languages:** `en-US` (default), `vi-VN`.

---

## 3. DTOs & Filter Models

### 3.1 `UserFilter` (Query params cho `GET /api/users`)

**Kế thừa từ `BasePaginationFilter`** (xem [docs/auth/API_Auth.md → §1.3](../auth/API_Auth.md)):

| Param           | Type                    | Default | Mô tả                                                       |
|-----------------|-------------------------|---------|-------------------------------------------------------------|
| `page`          | number                  | 1       | Trang hiện tại                                              |
| `pageSize`      | number                  | 10      | Số phần tử mỗi trang (max 500)                              |
| `search`        | string?                 | —       | Tìm theo email, tên, SĐT                                    |
| `sortBy`        | string?                 | —       | Tên field để sort                                           |
| `isAscending`   | boolean?                | true    | Chiều sắp xếp                                               |
| `status`        | EntityStatusEnum? (int?)| —       | Lọc theo trạng thái: 0=Inactive, 1=Active                   |
| `role`          | RoleEnum? (int?)        | —       | Lọc theo role: 0=SystemAdmin, 1=BrandManager, 2=StoreManager|
| `brandId`       | Guid?                   | —       | Lọc theo brand (SA only; BM bị bỏ qua, tự động dùng brand mình)|
| `storeId`       | Guid?                   | —       | Lọc theo store                                              |
| `joiningFrom`   | datetime? (ISO 8601)    | —       | Lọc users tạo từ ngày này (theo CreatedAt)                  |
| `joiningTo`     | datetime? (ISO 8601)    | —       | Lọc users tạo đến ngày này (theo CreatedAt)                 |
| `isPrimaryOwner`| boolean?                | —       | `true` = chỉ PrimaryOwner; `false` = chỉ non-PO; `null` = không filter |

### 3.2 `CreateUserRequest` (`multipart/form-data`)

| Field         | Type        | Required | Validation                                                              |
|---------------|-------------|:--------:|-------------------------------------------------------------------------|
| `firstName`   | string      | ✅       | Not empty; max 100 chars                                                |
| `lastName`    | string      | ✅       | Not empty; max 100 chars                                                |
| `email`       | string      | ✅       | Not empty; valid RFC 5322 email format                                  |
| `password`    | string      | ✅       | Not empty; min 6 chars                                                  |
| `phoneNumber` | string      | ❌       | Valid phone number (7–15 digits; supports `+`, `()`, `-`, spaces)       |
| `role`        | RoleEnum (int) | ✅    | 0=SystemAdmin, 1=BrandManager, 2=StoreManager                           |
| `brandId`     | Guid        | cond.    | Required for BrandManager/StoreManager; must be `null` for SystemAdmin  |
| `storeId`     | Guid        | cond.    | Required for StoreManager; must be `null` for SystemAdmin/BrandManager  |
| `avatar`      | File        | ❌       | Allowed: `.jpg .jpeg .png .gif .webp .bmp .svg`; max 5 MB              |

**Business rules:**
- `role = SystemAdmin`: `brandId` và `storeId` phải là `null`.
- `role = BrandManager`: `brandId` bắt buộc; `storeId` phải là `null`.
- `role = StoreManager`: cả `brandId` và `storeId` bắt buộc.
- Chỉ **PrimaryOwner** hoặc **SystemAdmin** được tạo user có role `BrandManager`.
- **BrandManager** chỉ được tạo `StoreManager` trong brand của mình.

### 3.3 `UpdateUserRequest` (`multipart/form-data` — partial update)

| Field         | Type   | Required | Validation                                                              |
|---------------|--------|:--------:|-------------------------------------------------------------------------|
| `firstName`   | string | ❌       | Max 100 chars (nếu cung cấp)                                            |
| `lastName`    | string | ❌       | Max 100 chars (nếu cung cấp)                                            |
| `email`       | string | ❌       | Valid RFC 5322 email (nếu cung cấp); phải duy nhất trong hệ thống      |
| `phoneNumber` | string | ❌       | Valid phone format (nếu cung cấp); phải duy nhất trong hệ thống        |
| `avatar`      | File   | ❌       | Allowed: `.jpg .jpeg .png .gif .webp .bmp .svg`; max 5 MB              |

**Partial update:** Chỉ gửi field muốn thay đổi. Field bỏ qua hoặc null giữ nguyên giá trị cũ.

### 3.4 `ResetUserPasswordRequest` (`application/json`)

| Field         | Type   | Required | Validation              |
|---------------|--------|:--------:|-------------------------|
| `newPassword` | string | ✅       | Not empty; min 6 chars  |

### 3.5 `AssignUserBrandRequest` (`application/json`)

| Field        | Type   | Required | Validation                                             |
|--------------|--------|:--------:|--------------------------------------------------------|
| `newBrandId` | Guid   | ✅       | Brand phải tồn tại; user chưa thuộc brand này         |

### 3.6 `AssignUserStoreRequest` (`application/json`)

| Field        | Type   | Required | Validation                                                                 |
|--------------|--------|:--------:|----------------------------------------------------------------------------|
| `newStoreId` | Guid?  | ❌       | `null` = gỡ store assignment; Guid = store phải thuộc cùng brand với user  |

### 3.7 `UserListItem` (trong `PaginationResult<UserListItem>`)

**Kế thừa từ `BaseResponse`** (`id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status`) + thêm:

| Field           | Type            | Mô tả                                                 |
|-----------------|-----------------|-------------------------------------------------------|
| `firstName`     | string          | Họ                                                    |
| `lastName`      | string          | Tên                                                   |
| `fullName`      | string          | Computed: `"{firstName} {lastName}".Trim()`           |
| `email`         | string          | Email (cũng là username)                              |
| `phoneNumber`   | string?         | Số điện thoại (null nếu chưa có)                      |
| `avatarUrl`     | string?         | Full URL ảnh đại diện (null nếu chưa có)              |
| `lastLoginAt`   | datetime?       | Thời điểm đăng nhập lần cuối (UTC, null nếu chưa đăng nhập) |
| `roles`         | RoleEnum[] (int[]) | Danh sách roles (int array): 0, 1, 2               |
| `brandId`       | Guid?           | Brand ID (null cho SystemAdmin)                       |
| `brandName`     | string?         | Tên brand (null cho SystemAdmin)                      |
| `storeId`       | Guid?           | Store ID (null nếu không thuộc store nào)             |
| `storeName`     | string?         | Tên store (null nếu không thuộc store nào)            |
| `isPrimaryOwner`| boolean         | `true` nếu user là PrimaryOwner của brand             |

### 3.8 `UserResponse` (trong `Result<UserResponse>`)

**Kế thừa từ `UserListItem`** + thêm:

| Field                  | Type    | Mô tả                              |
|------------------------|---------|------------------------------------|
| `emailConfirmed`       | boolean | Email đã được xác nhận             |
| `phoneNumberConfirmed` | boolean | SĐT đã được xác nhận               |
| `twoFactorEnabled`     | boolean | Xác thực hai yếu tố đã bật         |

### 3.9 `RoleEnum`

| Giá trị JSON (int) | Tên            | Mô tả                   |
|:-----------------:|----------------|--------------------------|
| `0`               | SystemAdmin    | Quản trị hệ thống        |
| `1`               | BrandManager   | Quản lý thương hiệu      |
| `2`               | StoreManager   | Quản lý cửa hàng         |

---

## 4. Endpoints

### 4.1 `GET /api/users` — Danh sách users (có phân trang)

- **Auth:** SystemAdmin, BrandManager
- **Query params:** `UserFilter` (§3.1)
- **BM behavior:**
  - `brandId` trong query params **luôn bị override** về brand của chính BM, bất kể giá trị client truyền vào.
  - Nếu BrandManager không có `brandId` (broken session state) → **403 Forbidden** (không trả về dữ liệu của toàn bộ brand).
  - BM chỉ thấy: chính mình, các BrandManager khác, và StoreManager trong cùng brand.

> **Security note:** Việc override `brandId` được thực hiện ở handler trước khi gọi DB, nên client không thể bypass bằng cách truyền `brandId` của brand khác.

**Response 200 (`PaginationResult<UserListItem>`):**

```json
{
  "currentPage": 1,
  "pageSize": 10,
  "totalItems": 3,
  "totalPages": 1,
  "hasPrevious": false,
  "hasNext": false,
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "firstName": "Nguyen",
      "lastName": "Van A",
      "fullName": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "phoneNumber": "0901234567",
      "avatarUrl": "https://localhost:7001/uploads/avatars/user-abc123.png",
      "lastLoginAt": "2026-02-25T08:30:00Z",
      "roles": [1],
      "brandId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "brandName": "Tech Brand",
      "storeId": null,
      "storeName": null,
      "isPrimaryOwner": true,
      "createdAt": "2025-06-01T00:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "updatedBy": null,
      "status": 1
    }
  ],
  "isSuccess": true,
  "message": "Users retrieved successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** StoreManager cố gọi → `errorCode: "Forbidden"`

---

### 4.2 `GET /api/users/{id}` — Chi tiết user

- **Auth:** SystemAdmin, BrandManager
- **Path param:** `id` (Guid) — User ID
- **BM restriction:** BM không được xem SystemAdmin.

**Response 200 (`Result<UserResponse>`):**

```json
{
  "isSuccess": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "firstName": "Nguyen",
    "lastName": "Van A",
    "fullName": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "phoneNumber": "0901234567",
    "avatarUrl": "https://localhost:7001/uploads/avatars/user-abc123.png",
    "lastLoginAt": "2026-02-25T08:30:00Z",
    "roles": [1],
    "brandId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "brandName": "Tech Brand",
    "storeId": null,
    "storeName": null,
    "isPrimaryOwner": true,
    "emailConfirmed": true,
    "phoneNumberConfirmed": false,
    "twoFactorEnabled": false,
    "createdAt": "2025-06-01T00:00:00Z",
    "updatedAt": null,
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "updatedBy": null,
    "status": 1
  },
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không có quyền (BM xem SA hoặc khác brand) → `errorCode: "Forbidden"`
- **Response 404:** User không tồn tại → `errorCode: "NotFound"`

---

### 4.3 `POST /api/users` — Tạo user mới

- **Auth:** SystemAdmin, BrandManager
- **Content-Type:** `multipart/form-data`
- **Body:** `CreateUserRequest` (§3.2)

**Validation errors (400) — field-level:**
- `firstName` rỗng → `"First Name is required"`
- `lastName` rỗng → `"Last Name is required"`
- `email` rỗng → `"Email is required"`
- `email` sai format → `"Email is not a valid email address"`
- `password` rỗng → `"Password is required"`
- `password` < 6 ký tự → `"Password must be at least 6 characters"`
- `phoneNumber` sai format → `"Phone Number must be a valid phone number"`
- `avatar` sai loại file → `"File must be an image (jpg, jpeg, png, gif, webp, bmp, svg)"`
- `avatar` > 5 MB → `"File size must not exceed 5MB"`

**Business rule errors (422):**
- `SystemAdmin` với `brandId` set → `"SystemAdmin cannot be assigned to a brand or store"`
- Non-SA role mà không có `brandId` → `"BrandId is required for this role"`
- `BrandManager` với `storeId` set → `"BrandManager cannot be assigned to a specific store"`
- Non-PrimaryOwner BM tạo BM → `"You do not have permission to create this role"`
- `brandId` không tồn tại → `NotFound`
- `storeId` không tồn tại → `NotFound`
- Email trùng → `"A user with this email already exists"`
- Phone trùng → `"A user with this phone number already exists"`
- `CreateUserAsync` lỗi Identity → `"Failed to create user: ..."`

**Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "User created successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại → `errorCode: "ValidationFailed"`, `errors: [...]`
- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không có quyền → `errorCode: "Forbidden"`
- **Response 404:** Brand hoặc Store không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Vi phạm business rule → `errorCode: "BusinessRuleViolation"`

---

### 4.4 `PATCH /api/users/{id}` — Cập nhật user (partial update)

- **Auth:** SystemAdmin, BrandManager
- **Content-Type:** `multipart/form-data`
- **Path param:** `id` (Guid) — User ID
- **Body:** `UpdateUserRequest` (§3.3) — chỉ gửi field muốn thay đổi.
- **Avatar behavior:** Nếu gửi avatar mới, avatar cũ tự động bị xóa background sau DB commit.
- **BM restriction:** BM không được tự cập nhật chính mình; BM chỉ được cập nhật user trong cùng brand.

**Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "User updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại → `errorCode: "ValidationFailed"`
- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** BM tự update mình / khác brand → `errorCode: "Forbidden"`
- **Response 404:** User không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Email/phone trùng → `errorCode: "BusinessRuleViolation"`

---

### 4.5 `PUT /api/users/{id}/status` — Toggle trạng thái user

- **Auth:** SystemAdmin, BrandManager
- **Path param:** `id` (Guid) — User ID
- **No body required.**
- **Behavior:** Active → Inactive, Inactive → Active. Không bao giờ xóa vĩnh viễn.

**Restrictions:**
- Không thể tự toggle chính mình → `"Cannot deactivate your own account"`
- Không thể toggle PrimaryOwner → `"Cannot toggle Primary Owner status"`
- Không thể toggle SystemAdmin (kể cả default admin) → `"Cannot deactivate a SystemAdmin account"`
- BM không toggle SA-managed users hoặc users khác brand.

**Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "User status updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Vi phạm restriction → `errorCode: "Forbidden"`
- **Response 404:** User không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Lỗi khi save → `errorCode: "BusinessRuleViolation"`

---

### 4.6 `PUT /api/users/{id}/reset-password` — Admin reset mật khẩu user

- **Auth:** SystemAdmin, BrandManager
- **Content-Type:** `application/json`
- **Path param:** `id` (Guid) — User ID
- **Body:** `ResetUserPasswordRequest` (§3.4)
- **Lưu ý:** Không cần biết mật khẩu hiện tại. Chỉ dành cho admin-initiated reset. User muốn đổi mật khẩu của chính mình → dùng `POST /api/auth/change-password`.

**Authorization rules:**
- SA reset bất kỳ user (kể cả tự reset mình).
- BM chỉ reset StoreManager trong cùng brand; không reset BrandManager khác hoặc SA.

**Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Password reset successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại (password rỗng / < 6 ký tự) → `errorCode: "ValidationFailed"`
- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không có quyền → `errorCode: "Forbidden"`
- **Response 404:** User không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Lỗi Identity khi reset → `errorCode: "BusinessRuleViolation"`

---

### 4.7 `PUT /api/users/{id}/brand` — Chuyển user sang brand khác

- **Auth:** SystemAdmin only
- **Content-Type:** `application/json`
- **Path param:** `id` (Guid) — User ID
- **Body:** `AssignUserBrandRequest` (§3.5)

**Lưu ý quan trọng:**
- Sau khi chuyển brand, `storeId` của user bị xóa (store cũ không thuộc brand mới).
- Mọi session đang hoạt động của user bị revoke ngay sau khi assign thành công → user phải đăng nhập lại.
- Nếu target user là PrimaryOwner: gọi `PUT /api/brands/{id}/transfer-ownership` trước.

**Business rule errors (422):**
- Tự assign mình → `"Cannot reassign yourself"`
- Target là SystemAdmin → `"Cannot reassign a SystemAdmin"`
- Target là PrimaryOwner → `"Cannot reassign the Primary Owner. Transfer ownership first."`
- Brand đích không tồn tại → `NotFound`
- User đã ở brand đó rồi → `"User already belongs to this brand"`

**Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "User assigned to brand successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không phải SA → `errorCode: "Forbidden"`
- **Response 404:** User hoặc Brand không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Vi phạm business rule → `errorCode: "BusinessRuleViolation"`

---

### 4.8 `PUT /api/users/{id}/store` — Gán / gỡ store assignment

- **Auth:** SystemAdmin, BrandManager
- **Content-Type:** `application/json`
- **Path param:** `id` (Guid) — User ID
- **Body:** `AssignUserStoreRequest` (§3.6)

**Lưu ý:**
- `newStoreId = null` → gỡ store assignment (unassign).
- Store phải thuộc cùng brand với user; để gán store ở brand khác, đổi brand của user trước.
- `BrandManager` role không thể được gán store.
- Mọi session đang hoạt động của user bị revoke sau khi assign thành công.

**Business rule errors (422):**
- Tự assign mình → `"Cannot reassign yourself"`
- Target là SystemAdmin → `"Cannot assign a store to SystemAdmin"`
- Target là BrandManager → `"BrandManager cannot be assigned to a specific store"`
- Target là PrimaryOwner → `"Cannot reassign the Primary Owner"`
- Store không tồn tại → `NotFound`
- Store thuộc brand khác → `"Store does not belong to the user's brand"`
- User đã ở store đó rồi → `"User is already assigned to this store"`

**Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "User store assignment updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không có quyền → `errorCode: "Forbidden"`
- **Response 404:** User hoặc Store không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Vi phạm business rule → `errorCode: "BusinessRuleViolation"`

---

## 5. TypeScript Types (React)

```ts
// ---- Enums ----
export enum RoleEnum {
  SystemAdmin = 0,
  BrandManager = 1,
  StoreManager = 2,
}

export enum EntityStatusEnum {
  Inactive = 0,
  Active = 1,
  Pending = 2,
  Rejected = 3,
}

// ---- Base Types ----
export interface BaseResponse {
  id: string;                    // Guid
  createdAt: string;             // ISO 8601 UTC
  updatedAt: string | null;      // ISO 8601 UTC, null if never updated
  createdBy: string | null;      // Guid of creator user
  updatedBy: string | null;      // Guid of last modifier user
  status: EntityStatusEnum;      // int: 0=Inactive, 1=Active
}

// ---- Filters ----
export interface UserFilter {
  // Inherited from BasePaginationFilter
  page?: number;                 // Default: 1
  pageSize?: number;             // Default: 10, max: 500
  search?: string;               // Search across email, name, phone
  sortBy?: string;               // Sort field
  isAscending?: boolean;         // Default: true
  status?: EntityStatusEnum;     // int: 0=Inactive, 1=Active

  // User-specific filters
  role?: RoleEnum;               // int: 0=SA, 1=BM, 2=SM
  brandId?: string;              // Guid — SA only (BM: auto-overridden to own brand)
  storeId?: string;              // Guid
  joiningFrom?: string;          // ISO 8601 — filter by CreatedAt
  joiningTo?: string;            // ISO 8601
  isPrimaryOwner?: boolean;      // true=only PO, false=only non-PO, null=all
}

// ---- Requests ----
export interface CreateUserRequest {
  firstName: string;             // Required, max 100 chars
  lastName: string;              // Required, max 100 chars
  email: string;                 // Required, valid email
  password: string;              // Required, min 6 chars
  phoneNumber?: string;          // Optional, valid phone format
  role: RoleEnum;                // Required: 0|1|2
  brandId?: string;              // Guid — Required for BM/SM; null for SA
  storeId?: string;              // Guid — Required for SM; null for SA/BM
  avatar?: File;                 // Optional image, max 5MB, jpg/png/gif/webp/bmp/svg
}

export interface UpdateUserRequest {
  firstName?: string;            // Optional, max 100 chars
  lastName?: string;             // Optional, max 100 chars
  email?: string;                // Optional, valid email, must be unique
  phoneNumber?: string;          // Optional, valid phone, must be unique
  avatar?: File;                 // Optional, replaces existing avatar
}

export interface ResetUserPasswordRequest {
  newPassword: string;           // Required, min 6 chars
}

export interface AssignUserBrandRequest {
  newBrandId: string;            // Guid — target brand ID
}

export interface AssignUserStoreRequest {
  newStoreId: string | null;     // Guid — null to unassign
}

// ---- Responses ----
export interface UserListItem extends BaseResponse {
  firstName: string;
  lastName: string;
  fullName: string;              // Computed: `${firstName} ${lastName}`.trim()
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;      // Full URL or null
  lastLoginAt: string | null;    // ISO 8601 UTC, null if never logged in
  roles: RoleEnum[];             // int array: [0], [1], [2], [1,2], etc.
  brandId: string | null;        // null for SystemAdmin
  brandName: string | null;      // null for SystemAdmin
  storeId: string | null;        // null if not in a store
  storeName: string | null;      // null if not in a store
  isPrimaryOwner: boolean;       // true if user is PrimaryOwner of their brand
}

export interface UserResponse extends UserListItem {
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
}

// ---- Result wrapper types ----
export interface Result {
  isSuccess: boolean;
  message: string | null;
  errors: Array<{ field: string; message: string }> | null;
  errorCode: string | null;
}

export interface ResultOf<T> extends Result {
  data: T | null;
}

export interface PaginationResult<T> extends Result {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  items: T[];
}

// ---- Usage examples ----

// GET /api/users
const getUsers = async (filter: UserFilter, token: string): Promise<PaginationResult<UserListItem>> => {
  const params = new URLSearchParams();
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
  if (filter.search) params.set('search', filter.search);
  if (filter.role !== undefined) params.set('role', String(filter.role));
  if (filter.brandId) params.set('brandId', filter.brandId);
  if (filter.storeId) params.set('storeId', filter.storeId);
  if (filter.joiningFrom) params.set('joiningFrom', filter.joiningFrom);
  if (filter.joiningTo) params.set('joiningTo', filter.joiningTo);
  if (filter.isPrimaryOwner !== undefined) params.set('isPrimaryOwner', String(filter.isPrimaryOwner));

  const res = await fetch(`/api/users?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// POST /api/users (multipart/form-data)
const createUser = async (data: CreateUserRequest, token: string): Promise<Result> => {
  const form = new FormData();
  form.append('firstName', data.firstName);
  form.append('lastName', data.lastName);
  form.append('email', data.email);
  form.append('password', data.password);
  form.append('role', String(data.role));
  if (data.phoneNumber) form.append('phoneNumber', data.phoneNumber);
  if (data.brandId) form.append('brandId', data.brandId);
  if (data.storeId) form.append('storeId', data.storeId);
  if (data.avatar) form.append('avatar', data.avatar);

  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return res.json();
};

// PATCH /api/users/{id} (partial update)
const updateUser = async (id: string, data: UpdateUserRequest, token: string): Promise<Result> => {
  const form = new FormData();
  if (data.firstName !== undefined) form.append('firstName', data.firstName ?? '');
  if (data.lastName !== undefined) form.append('lastName', data.lastName ?? '');
  if (data.email !== undefined) form.append('email', data.email ?? '');
  if (data.phoneNumber !== undefined) form.append('phoneNumber', data.phoneNumber ?? '');
  if (data.avatar) form.append('avatar', data.avatar);

  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return res.json();
};

// PUT /api/users/{id}/reset-password
const resetUserPassword = async (id: string, data: ResetUserPasswordRequest, token: string): Promise<Result> => {
  const res = await fetch(`/api/users/${id}/reset-password`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

// PUT /api/users/{id}/brand
const assignUserBrand = async (id: string, data: AssignUserBrandRequest, token: string): Promise<Result> => {
  const res = await fetch(`/api/users/${id}/brand`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

// PUT /api/users/{id}/store
const assignUserStore = async (id: string, data: AssignUserStoreRequest, token: string): Promise<Result> => {
  const res = await fetch(`/api/users/${id}/store`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return res.json();
};
```

---

## 6. Dart Types (Flutter)

```dart
// ---- Enums ----
enum RoleEnum {
  systemAdmin,   // JSON int: 0
  brandManager,  // JSON int: 1
  storeManager,  // JSON int: 2
}
// Parse: RoleEnum.values[intValue]

enum EntityStatusEnum {
  inactive,   // JSON int: 0
  active,     // JSON int: 1
  pending,    // JSON int: 2
  rejected,   // JSON int: 3
}
// Parse: EntityStatusEnum.values[intValue]

// ---- Request models ----
// CreateUser — multipart/form-data
// Use Dio + FormData or http.MultipartRequest

// ---- Response models ----
class UserListItem {
  final String id;
  final String firstName;
  final String lastName;
  final String fullName;         // Computed by backend: "$firstName $lastName".trim()
  final String email;
  final String? phoneNumber;
  final String? avatarUrl;
  final DateTime? lastLoginAt;
  final List<RoleEnum> roles;
  final String? brandId;
  final String? brandName;
  final String? storeId;
  final String? storeName;
  final bool isPrimaryOwner;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? createdBy;
  final String? updatedBy;
  final EntityStatusEnum status;

  UserListItem({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.email,
    this.phoneNumber,
    this.avatarUrl,
    this.lastLoginAt,
    required this.roles,
    this.brandId,
    this.brandName,
    this.storeId,
    this.storeName,
    required this.isPrimaryOwner,
    required this.createdAt,
    this.updatedAt,
    this.createdBy,
    this.updatedBy,
    required this.status,
  });

  factory UserListItem.fromJson(Map<String, dynamic> json) {
    return UserListItem(
      id: json['id'] as String,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      email: json['email'] as String,
      phoneNumber: json['phoneNumber'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.parse(json['lastLoginAt'] as String)
          : null,
      roles: (json['roles'] as List<dynamic>)
          .map((e) => RoleEnum.values[e as int])
          .toList(),
      brandId: json['brandId'] as String?,
      brandName: json['brandName'] as String?,
      storeId: json['storeId'] as String?,
      storeName: json['storeName'] as String?,
      isPrimaryOwner: json['isPrimaryOwner'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
      createdBy: json['createdBy'] as String?,
      updatedBy: json['updatedBy'] as String?,
      status: EntityStatusEnum.values[json['status'] as int],
    );
  }
}

class UserResponse extends UserListItem {
  final bool emailConfirmed;
  final bool phoneNumberConfirmed;
  final bool twoFactorEnabled;

  UserResponse({
    required super.id,
    required super.firstName,
    required super.lastName,
    required super.fullName,
    required super.email,
    super.phoneNumber,
    super.avatarUrl,
    super.lastLoginAt,
    required super.roles,
    super.brandId,
    super.brandName,
    super.storeId,
    super.storeName,
    required super.isPrimaryOwner,
    required super.createdAt,
    super.updatedAt,
    super.createdBy,
    super.updatedBy,
    required super.status,
    required this.emailConfirmed,
    required this.phoneNumberConfirmed,
    required this.twoFactorEnabled,
  });

  factory UserResponse.fromJson(Map<String, dynamic> json) {
    final base = UserListItem.fromJson(json);
    return UserResponse(
      id: base.id,
      firstName: base.firstName,
      lastName: base.lastName,
      fullName: base.fullName,
      email: base.email,
      phoneNumber: base.phoneNumber,
      avatarUrl: base.avatarUrl,
      lastLoginAt: base.lastLoginAt,
      roles: base.roles,
      brandId: base.brandId,
      brandName: base.brandName,
      storeId: base.storeId,
      storeName: base.storeName,
      isPrimaryOwner: base.isPrimaryOwner,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      createdBy: base.createdBy,
      updatedBy: base.updatedBy,
      status: base.status,
      emailConfirmed: json['emailConfirmed'] as bool? ?? false,
      phoneNumberConfirmed: json['phoneNumberConfirmed'] as bool? ?? false,
      twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? false,
    );
  }
}

// ---- Result wrapper ----
class ApiResult<T> {
  final bool isSuccess;
  final String? message;
  final T? data;
  final List<Map<String, String>>? errors;
  final String? errorCode;

  ApiResult({
    required this.isSuccess,
    this.message,
    this.data,
    this.errors,
    this.errorCode,
  });
}

class PaginationResult<T> {
  final int currentPage;
  final int pageSize;
  final int totalItems;
  final int totalPages;
  final bool hasPrevious;
  final bool hasNext;
  final List<T> items;
  final bool isSuccess;
  final String? message;
  final String? errorCode;

  PaginationResult({
    required this.currentPage,
    required this.pageSize,
    required this.totalItems,
    required this.totalPages,
    required this.hasPrevious,
    required this.hasNext,
    required this.items,
    required this.isSuccess,
    this.message,
    this.errorCode,
  });

  factory PaginationResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PaginationResult<T>(
      currentPage: json['currentPage'] as int,
      pageSize: json['pageSize'] as int,
      totalItems: json['totalItems'] as int,
      totalPages: json['totalPages'] as int,
      hasPrevious: json['hasPrevious'] as bool,
      hasNext: json['hasNext'] as bool,
      items: (json['items'] as List<dynamic>)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      isSuccess: json['isSuccess'] as bool,
      message: json['message'] as String?,
      errorCode: json['errorCode'] as String?,
    );
  }
}

// ---- Usage examples (Dio) ----

// GET /api/users
Future<PaginationResult<UserListItem>> getUsers(
  Map<String, dynamic> queryParams,
  String accessToken,
) async {
  final dio = Dio();
  final resp = await dio.get(
    '/api/users',
    queryParameters: queryParams,
    options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
  );
  return PaginationResult.fromJson(resp.data, UserListItem.fromJson);
}

// POST /api/users (multipart/form-data)
Future<bool> createUser({
  required String firstName,
  required String lastName,
  required String email,
  required String password,
  required int role,
  String? phoneNumber,
  String? brandId,
  String? storeId,
  String? avatarPath,
  required String accessToken,
}) async {
  final dio = Dio();
  final formData = FormData.fromMap({
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'password': password,
    'role': role.toString(),
    if (phoneNumber != null) 'phoneNumber': phoneNumber,
    if (brandId != null) 'brandId': brandId,
    if (storeId != null) 'storeId': storeId,
    if (avatarPath != null) 'avatar': await MultipartFile.fromFile(avatarPath),
  });

  final resp = await dio.post(
    '/api/users',
    data: formData,
    options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
  );
  return resp.data['isSuccess'] as bool;
}

// PUT /api/users/{id}/reset-password
Future<bool> resetUserPassword(
  String userId,
  String newPassword,
  String accessToken,
) async {
  final dio = Dio();
  final resp = await dio.put(
    '/api/users/$userId/reset-password',
    data: {'newPassword': newPassword},
    options: Options(headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    }),
  );
  return resp.data['isSuccess'] as bool;
}

// PUT /api/users/{id}/store (assign or unassign)
Future<bool> assignUserStore(
  String userId,
  String? newStoreId, // null = unassign
  String accessToken,
) async {
  final dio = Dio();
  final resp = await dio.put(
    '/api/users/$userId/store',
    data: {'newStoreId': newStoreId},
    options: Options(headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    }),
  );
  return resp.data['isSuccess'] as bool;
}
```

---

## 7. Common Error Responses

```json
// 401 Unauthorized
{
  "isSuccess": false,
  "message": "You are not authenticated",
  "errors": null,
  "errorCode": "Unauthorized"
}

// 403 Forbidden
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}

// 404 Not Found
{
  "isSuccess": false,
  "message": "User not found",
  "data": null,
  "errors": null,
  "errorCode": "NotFound"
}

// 400 Validation Failed
{
  "isSuccess": false,
  "message": "Validation failed",
  "errors": [
    { "field": "Email", "message": "Email is required" },
    { "field": "Password", "message": "Password must be at least 6 characters" }
  ],
  "errorCode": "ValidationFailed"
}

// 422 Business Rule Violation
{
  "isSuccess": false,
  "message": "A user with this email already exists",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```
