# CMS Auth API Documentation

Tài liệu API Authentication cho CMS (React TypeScript & Flutter). Base path: **`/api/auth`**.

> **Postman Collection:** Import [Postman_Collection_LogAI_CAMS_API.json](../Postman_Collection_LogAI_CAMS_API.json) → Các endpoint Auth nằm trong folder **Auth**.

---

## 1. API Result Pattern (Backend wrapper)

Mọi response đều bọc trong **Result** hoặc **Result&lt;T&gt;** (hoặc **PaginationResult&lt;T&gt;** cho danh sách phân trang). Frontend cần parse theo đúng cấu trúc này.

### 1.1 `Result<T>` (có data)

Dùng cho Login, RefreshToken, GetProfile.

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": { ... },
  "errors": null,
  "errorCode": null
}
```

| Field       | Type     | Mô tả |
|------------|----------|--------|
| `isSuccess` | boolean  | Thành công hay thất bại |
| `message`   | string?  | Thông báo (success/error) |
| `data`      | T?       | Payload khi thành công; có thể vắng khi fail |
| `errors`    | string[]?| Danh sách lỗi chi tiết (validation, v.v.) |
| `errorCode` | string?  | Mã lỗi enum từ backend (xem ErrorCodeEnum) |

- **Success:** `isSuccess === true`, dùng `data`.
- **Failure:** `isSuccess === false`, dùng `message`, `errorCode`, (và `errors` nếu có). HTTP status có thể 400/401/403/404/422/500 tùy `errorCode`.

### 1.2 `Result` (không data)

Dùng cho Logout (chỉ success/fail).

```json
{
  "isSuccess": true,
  "message": "Logout successfully",
  "errors": null,
  "errorCode": null
}
```

Cấu trúc giống `Result<T>` nhưng không có `data`.

### 1.3 `PaginationResult<T>` (danh sách phân trang)

Dùng cho các API trả về danh sách có phân trang (Auth không dùng; ghi nhận để đồng bộ với API khác).

```json
{
  "currentPage": 1,
  "pageSize": 10,
  "totalItems": 100,
  "totalPages": 10,
  "hasPrevious": false,
  "hasNext": true,
  "items": [ ... ],
  "isSuccess": true,
  "message": "Retrieved successfully",
  "errors": null,
  "errorCode": null
}
```

| Field         | Type        | Mô tả |
|---------------|-------------|--------|
| `currentPage` | number      | Trang hiện tại |
| `pageSize`    | number      | Số phần tử mỗi trang |
| `totalItems`  | number      | Tổng số phần tử |
| `totalPages`  | number      | Tổng số trang |
| `hasPrevious` | boolean     | Có trang trước |
| `hasNext`     | boolean     | Có trang sau |
| `items`       | T[]         | Danh sách phần tử |
| `isSuccess`   | boolean     | Thành công / thất bại |
| `message`     | string?     | Thông báo |
| `errors`      | string[]?   | Lỗi chi tiết |
| `errorCode`   | string?     | Mã lỗi (ErrorCodeEnum) |

---

## 2. Enums map 1:1 với Backend

### 2.1 `RoleEnum` (Domain)

Dùng trong `AuthResponse.roles`, `ProfileResponse.roles`. Giá trị JSON là **tên enum** (string).

| Giá trị JSON (int) | Tên             | Mô tả |
|:-----------------:|-----------------|--------|
| `0`               | `SystemAdmin`   | Quản trị hệ thống |
| `1`               | `BrandManager`  | Quản lý thương hiệu |
| `2`               | `StoreManager`  | Quản lý cửa hàng |

**TypeScript (React):**

```ts
export enum RoleEnum {
  SystemAdmin = 0,
  BrandManager = 'BrandManager',
  BrandManager = 1,
  StoreManager = 2,
}
```

**Dart (Flutter):**

```dart
enum RoleEnum {
  systemAdmin,   // JSON: 0
  brandManager,  // JSON: "BrandManager"
  brandManager,  // JSON: 1
  storeManager,   // JSON: 2
}
// Parse: RoleEnum.values[json['roles'][i] as int]
// Hoặc: json['roles'].map<RoleEnum>((e) => RoleEnum.values[e as int]).toList()
```

**Lưu ý:** Backend trả giá trị **int** cho `roles` (0 = SystemAdmin, 1 = BrandManager, 2 = StoreManager). Dart dùng `RoleEnum.values[intValue]` để parse.

### 2.2 `ErrorCodeEnum` (Application – cho API response)

Dùng trong `Result.errorCode` / `PaginationResult.errorCode`. Frontend dùng để branch xử lý (refresh token, hiển thị lỗi, v.v.).

| Enum value           | Value | HTTP thường dùng |
|----------------------|-------|-------------------|
| `Success`            | 0     | 200 |
| `Unauthorized`       | 1001  | 401 |
| `Forbidden`          | 1002  | 403 |
| `InvalidCredentials`| 1003  | 401 |
| `TokenExpired`       | 1004  | 401 |
| `InvalidToken`       | 1005  | 401 |
| `ValidationFailed`   | 2001  | 400 |
| `InvalidInput`       | 2002  | 400 |
| `DuplicateEntry`     | 2003  | 400 |
| `InvalidOperation`   | 2004  | 400 |
| `TooManyRequests`    | 2005  | 429 |
| `NotFound`           | 3001  | 404 |
| `BusinessRuleViolation` | 4001 | 422 |
| `InsufficientPermissions` | 4002 | 403 |
| `ResourceConflict`   | 4003  | 422 |
| `InternalError`      | 5001  | 500 |
| `DatabaseError`      | 5002  | 500 |
| `ExternalServiceError` | 5003 | 500 |
| ... (File, AI, Email) | 6xxx, 7xxx, 8xxx | 400/403/500/502/503 |

Backend trả `errorCode` dạng **string** (tên enum), ví dụ: `"InvalidCredentials"`, `"Unauthorized"`.

**TypeScript:**

```ts
export enum ErrorCodeEnum {
  Success = 'Success',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  InvalidCredentials = 'InvalidCredentials',
  TokenExpired = 'TokenExpired',
  InvalidToken = 'InvalidToken',
  ValidationFailed = 'ValidationFailed',
  NotFound = 'NotFound',
  InternalError = 'InternalError',
  // ... thêm các code khác khi cần
}
```

---

## 3. DTOs dùng trong Auth

### 3.1 Request

#### `LoginRequest`

| Field       | Type    | Required | Mô tả |
|------------|---------|----------|--------|
| `email`    | string  | ✓        | Email đăng nhập |
| `password` | string  | ✓        | Mật khẩu |
| `rememberMe` | boolean | No (default: false) | True = refresh token dài hạn (vd 30 ngày) |

#### `ChangePasswordRequest`

| Field             | Type   | Required | Mô tả |
|-------------------|--------|----------|--------|
| `currentPassword` | string | ✓        | Mật khẩu hiện tại |
| `newPassword`     | string | ✓        | Mật khẩu mới (theo policy, vd min 6 ký tự) |
| `confirmPassword` | string | ✓        | Xác nhận mật khẩu mới (phải trùng newPassword) |

### 3.2 Response

#### `AuthResponse` (Login, RefreshToken)

| Field         | Type     | Mô tả |
|---------------|----------|--------|
| `accessToken` | string   | JWT access token |
| `expiresAt`   | string   | ISO 8601 (UTC) thời điểm hết hạn access token |
| `roles`       | RoleEnum[] (`number[]`) | Danh sách role (int: `0` = SystemAdmin, `1` = BrandManager, `2` = StoreManager) |

#### `ProfileResponse` (GetProfile)

| Field        | Type       | Mô tả |
|-------------|------------|--------|
| `email`     | string     | Email |
| `userId`    | string     | Guid user |
| `firstName` | string     | Tên |
| `lastName`  | string     | Họ |
| `phoneNumber` | string?  | SĐT (optional) |
| `avatarPath`  | string?  | Đường dẫn avatar (optional) |
| `roles`     | RoleEnum[] (`number[]`) | Danh sách role (int: `0` = SystemAdmin, `1` = BrandManager, `2` = StoreManager) |

---

## 4. Endpoints

### 4.1 Login

- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**

```json
{
  "email": "admin@example.com",
  "password": "Admin@123",
  "rememberMe": false
}
```

- **Response 200 (Result&lt;AuthResponse&gt;):**

```json
{
  "isSuccess": true,
  "message": "Success message from server",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-02-21T10:00:00Z",
    "roles": [0]
  }
}
```

- **Response 401:** Sai email/password → `errorCode`: `InvalidCredentials`.
- **Response 403:** User không thuộc CMS → `errorCode`: `Forbidden`.
- **Response 400:** Validation (body sai) → `errorCode`: có thể `ValidationFailed` / `InvalidInput`.

---

### 4.2 Logout

- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/logout`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response 200 (Result):**

```json
{
  "isSuccess": true,
  "message": "Logout successfully"
}
```

- **Response 401:** Thiếu/ sai token.
- **Response 403:** Không phải CMS member.

---

### 4.3 Get Profile

- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/auth/profile`
- **Headers:** `Authorization: Bearer <access_token>`

- **Response 200 (Result&lt;ProfileResponse&gt;):**

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": {
    "email": "admin@example.com",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "firstName": "Admin",
    "lastName": "User",
    "phoneNumber": null,
    "avatarUrl": null,
    "roles": [0]
  }
}
```

- **Response 401/403/500:** Theo `errorCode` trong body.

---

### 4.4 Refresh Token

- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/refresh-token`
- **Headers:** `Authorization: Bearer <access_token_or_expired_access_token>`
- **Cookie:** Refresh token (HttpOnly cookie) – backend đọc từ cookie, không gửi trong body.

Backend cho phép **access token hết hạn** khi gọi refresh (để client retry khi 401).

- **Response 200 (Result&lt;AuthResponse&gt;):**

```json
{
  "isSuccess": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-02-21T11:00:00Z",
    "roles": [0]
  }
}
```

- **Response 401:** Thiếu cookie refresh token / token hết hạn hoặc không khớp DB.
- **Response 500:** Lỗi server.

---

### 4.5 Change Password

- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/change-password`
- **Headers:** `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body (JSON):**

```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
```

- **Response 200 (Result):**

```json
{
  "isSuccess": true,
  "message": "Password changed successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation (newPassword/confirmPassword không khớp, hoặc quá ngắn) hoặc currentPassword sai → `errorCode`: `InvalidCredentials` / `ValidationFailed`.
- **Response 401:** Thiếu hoặc sai token.
- **Response 403:** Không phải CMS member.

---

## 5. Postman Collection

Import file **`Postman_Collection_Auth.json`** (cùng thư mục `docs/`) vào Postman. Collection có sẵn:

- Biến `baseUrl` (ví dụ `https://localhost:7xxx`).
- 5 request: Login, Logout, Get Profile, Refresh Token, Change Password.
- Login lưu `accessToken` vào collection variable để Logout / Get Profile / Refresh Token dùng `Authorization: Bearer {{accessToken}}`.

Sau khi Login (script trong collection tự lưu `accessToken` vào biến), chạy lần lượt Get Profile, Refresh Token, Change Password, Logout để kiểm tra. **Lưu ý:** Refresh Token API dùng cookie HttpOnly; trong Postman cần bật Cookies và gọi Login trước trong cùng session để cookie refresh token được lưu.

---

## 6. Tóm tắt cho Frontend

- Luôn kiểm tra `isSuccess` và **HTTP status**; khi fail dùng `message` + `errorCode` (+ `errors`) để hiển thị hoặc xử lý (vd: 401 → gọi refresh token rồi retry).
- Enum **RoleEnum** backend trả **int** (`0`=SystemAdmin, `1`=BrandManager, `2`=StoreManager); **ErrorCodeEnum** vẫn là string (đã `.ToString()`). TypeScript dùng numeric enum, Dart dùng `RoleEnum.values[intValue]`.
- **Result&lt;T&gt** / **Result** / **PaginationResult&lt;T&gt;** là chuẩn chung; các API khác (không auth) cũng dùng chung pattern này.
