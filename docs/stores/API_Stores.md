# CMS Store API Documentation

Tài liệu API Store Management cho CMS (React TypeScript & Flutter). Base path: **`/api/stores`**.

> **Postman Collection:** Import [Postman_Collection_Stores.json](Postman_Collection_Stores.json) → Các endpoint Store nằm trong folder **Stores**.
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md).

---

## 1. Authorization Matrix

| Endpoint                                  | SystemAdmin | BrandManager (own brand) | StoreManager (own store) |
|------------------------------------------|:-----------:|:------------------------:|:------------------------:|
| `GET /api/stores`                         | ✅          | ✅                       | ❌                       |
| `GET /api/stores/{id}`                    | ✅          | ✅                       | ✅                       |
| `POST /api/stores`                        | ❌          | ✅                       | ❌                       |
| `PUT /api/stores/{id}`                    | ❌          | ✅                       | ❌                       |
| `DELETE /api/stores/{id}`                 | ❌          | ✅                       | ❌                       |
| `PUT /api/stores/{id}/toggle-status`      | ❌          | ✅                       | ❌                       |

> **"own brand"** = `store.BrandId == user.BrandId`.  
> **"own store"** = `store.Id == user.StoreId`.  
> ⚠️ **SystemAdmin** có quyền **read-only** đối với store data — write operations được giới hạn cho BrandManager.

---

## 2. Localization & Request Headers

### Content Negotiation: Accept-Language

Mọi request có thể kèm header **`Accept-Language`** để chỉ định ngôn ngữ cho validation messages và error responses.

```http
GET /api/stores?page=1
Authorization: Bearer {{accessToken}}
Accept-Language: vi-VN
```

**Supported Languages:**
- `en-US` hoặc `en` — English (default)
- `vi-VN` hoặc `vi` — Tiếng Việt
- Các ngôn ngữ khác nếu có cấu hình backend

**Cơ chế:**
1. Backend đọc `Accept-Language` header từ request
2. Nếu có, dùng ngôn ngữ được chỉ định; nếu không hỗ trợ → fallback sang English
3. Validation messages, error messages đều localize theo ngôn ngữ này
4. Response payload (data) vẫn giữ nguyên (không translate business data)

---

## 3. DTOs & Filter Model Architecture

### 3.1 Response Model Inheritance (BaseResponse)

Tất cả response models đều kế thừa từ **`BaseResponse`**:

```csharp
public abstract class BaseResponse
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
    public EntityStatusEnum Status { get; set; }   // 0=Inactive | 1=Active | 2=Pending | 3=Rejected
}
```

**Response hierarchy (Store):**
```
StoreDetailResponse : StoreListItem : BaseResponse
```

### 3.2 Filter Model Inheritance (BasePaginationFilter)

`StoreFilter` kế thừa từ `BasePaginationFilter`:

```csharp
public class BasePaginationFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;        // max 500
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool? IsAscending { get; set; }          // default: true
    public EntityStatusEnum? Status { get; set; }
}
```

---

## 4. DTOs

### 4.1 `StoreRequest` (Create / Update — `application/json`)

| Field               | Type     | Required (Create) | Required (Update) | Validation                                                    |
|---------------------|----------|:-----------------:|:-----------------:|---------------------------------------------------------------|
| `name`              | string   | ✅                | ❌ (partial)      | Not empty; max 200 chars                                      |
| `address`           | string   | ❌                | ❌                | Max 500 chars                                                 |
| `city`              | string   | ❌                | ❌                | Max 100 chars                                                 |
| `district`          | string   | ❌                | ❌                | Max 100 chars                                                 |
| `contactNumber`     | string   | ❌                | ❌                | Valid phone: 7–15 digits; supports `+`, `()`, `-`, spaces     |
| `latitude`          | float    | ❌                | ❌                | Range: `-90` đến `90`                                         |
| `longitude`         | float    | ❌                | ❌                | Range: `-180` đến `180`                                       |
| `mapUrl`            | string   | ❌                | ❌                | Valid absolute URL với scheme `http` hoặc `https`             |
| `timeZone`          | string   | ❌                | ❌                | IANA timezone ID hợp lệ (e.g. `"Asia/Ho_Chi_Minh"`)          |
| `areaSquareMeters`  | float    | ❌                | ❌                | Phải `> 0` nếu được cung cấp                                 |
| `maxCapacity`       | int      | ❌                | ❌                | Phải `> 0` nếu được cung cấp                                 |

> **Lưu ý quan trọng:**
> - **`brandId`** được **loại trừ khỏi request** — luôn lấy từ session BrandManager đang đăng nhập (chống cross-brand injection).
> - **`firestoreCollectionPath`** được **loại trừ khỏi request** — được quản lý độc quyền bởi AI/IoT pipeline.
> - **Update** dùng patch semantics: chỉ field được gửi lên (non-null) mới được áp dụng. Field bỏ qua hoặc null giữ nguyên.

### 4.2 `StoreFilter` (Query params cho `GET /api/stores`)

**Kế thừa từ `BasePaginationFilter`** (§3.2) + thêm các filter riêng:

| Param              | Type              | Default | Mô tả                                                                       |
|--------------------|-------------------|---------|-----------------------------------------------------------------------------|
| `page`             | number            | 1       | Trang hiện tại                                                              |
| `pageSize`         | number            | 10      | Số phần tử mỗi trang (max 500)                                              |
| `search`           | string?           | —       | Tìm kiếm toàn văn (name, address, city, district, contact number)           |
| `sortBy`           | string?           | —       | Trường sắp xếp (xem docs cụ thể)                                            |
| `isAscending`      | boolean?          | true    | Chiều sắp xếp (default: true = tăng dần)                                   |
| `status`           | EntityStatusEnum? | —       | Lọc theo trạng thái (0=Inactive, 1=Active, 2=Pending, 3=Rejected)          |
| `brandId`          | Guid?             | —       | ⚠️ SystemAdmin only — BrandManager luôn bị override bởi handler về brand của mình |
| `city`             | string?           | —       | Lọc theo thành phố                                                          |
| `district`         | string?           | —       | Lọc theo quận/huyện                                                         |
| `createdFrom`      | datetime? (ISO 8601) | —    | Lọc store tạo từ ngày này                                                   |
| `createdTo`        | datetime? (ISO 8601) | —    | Lọc store tạo đến ngày này                                                  |
| `storeManagerName` | string?           | —       | Tìm theo tên Store Manager (first name, last name, email — partial match)   |

### 4.3 `StoreListItem` (trong `PaginationResult<StoreListItem>`)

**Kế thừa từ `BaseResponse`** (§3.1) + thêm các field:

| Field           | Type       | Mô tả                                     |
|-----------------|------------|-------------------------------------------|
| (inherited)     | BaseResponse | `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status` |
| `brandId`       | Guid       | ID brand sở hữu store                     |
| `name`          | string     | Tên store                                 |
| `contactNumber` | string?    | SĐT liên hệ của store                    |
| `address`       | string?    | Địa chỉ đầy đủ                            |
| `city`          | string?    | Thành phố                                 |
| `district`      | string?    | Quận/huyện                                |

### 4.4 `StoreDetailResponse` (trong `Result<StoreDetailResponse>`)

**Kế thừa từ `StoreListItem`** (→ kế thừa gián tiếp từ `BaseResponse`) + thêm:

| Field                   | Type           | Mô tả                                                           |
|-------------------------|----------------|-----------------------------------------------------------------|
| `latitude`              | float?         | Vĩ độ (decimal degrees, -90 đến 90)                             |
| `longitude`             | float?         | Kinh độ (decimal degrees, -180 đến 180)                         |
| `mapUrl`                | string?        | URL Google Maps / embed                                         |
| `timeZone`              | string?        | IANA timezone ID (e.g. `"Asia/Ho_Chi_Minh"`)                    |
| `areaSquareMeters`      | float?         | Diện tích sàn (m²)                                              |
| `maxCapacity`           | int?           | Sức chứa tối đa (người)                                         |
| `firestoreCollectionPath` | string?      | 🔒 Read-only. Được set bởi AI/IoT pipeline, không ghi qua API   |
| `currentMood`           | MoodTypeEnum?  | 🔒 Read-only. Mood hiện tại (set bởi AI pipeline)               |
| `lastMoodUpdateAt`      | datetime?      | 🔒 Read-only. Thời điểm cập nhật mood lần cuối (UTC)            |

### 4.5 `EntityStatusEnum`

| Giá trị JSON | Số | Mô tả      |
|--------------|----|------------|
| `"Inactive"` | 0  | Không hoạt động |
| `"Active"`   | 1  | Đang hoạt động  |
| `"Pending"`  | 2  | Chờ duyệt       |
| `"Rejected"` | 3  | Bị từ chối      |

### 4.6 `MoodTypeEnum` (read-only, set bởi AI pipeline)

Giá trị cụ thể tùy theo cấu hình AI của hệ thống. Trường này chỉ để hiển thị, không được ghi qua Store API.

---

### 4.7 Validation Rules Detail (Backend — `SharedStoreRequestValidator`)

> **Quy tắc chung:**
> - **CREATE** (`isPartialUpdate = false`): `name` là bắt buộc; tất cả field khác tùy chọn, nếu cung cấp thì phải đúng format.
> - **UPDATE** (`isPartialUpdate = true`): tất cả field đều tùy chọn; chỉ field được gửi lên (non-null/non-empty) mới được validate và áp dụng.

| Field              | Rule                   | Chi tiết                                                                           |
|--------------------|------------------------|------------------------------------------------------------------------------------|
| `name`             | Required (create)      | `NotEmpty()` — không được rỗng/null khi tạo mới                                    |
| `name`             | MaxLength              | Tối đa 200 ký tự                                                                   |
| `address`          | MaxLength              | Tối đa 500 ký tự                                                                   |
| `city`             | MaxLength              | Tối đa 100 ký tự                                                                   |
| `district`         | MaxLength              | Tối đa 100 ký tự                                                                   |
| `contactNumber`    | Phone format           | 7–15 chữ số; cho phép `+`, `(`, `)`, `-`, khoảng trắng. VD: `+84901234567`        |
| `latitude`         | Range                  | Phải trong khoảng `[-90, 90]`                                                      |
| `longitude`        | Range                  | Phải trong khoảng `[-180, 180]`                                                    |
| `mapUrl`           | URL format             | Phải là URL tuyệt đối với scheme `http` hoặc `https`                               |
| `timeZone`         | Timezone ID            | IANA timezone ID hợp lệ (`TimeZoneInfo.FindSystemTimeZoneById()`)                  |
| `areaSquareMeters` | GreaterThan(0)         | Phải `> 0` nếu được cung cấp                                                      |
| `maxCapacity`      | GreaterThan(0)         | Phải `> 0` nếu được cung cấp                                                      |

#### Timezone ID (`timeZone`)

Backend dùng `TimeZoneInfo.FindSystemTimeZoneById()`. Hỗ trợ cả **IANA IDs** (Linux/macOS) và **Windows IDs** (Windows server). Ưu tiên dùng IANA IDs vì server thường chạy trên Linux (Docker).

| IANA ID                   | Windows tương đương           | UTC Offset |
|---------------------------|-------------------------------|------------|
| `Asia/Ho_Chi_Minh`        | `SE Asia Standard Time`       | UTC+7      |
| `Asia/Bangkok`            | `SE Asia Standard Time`       | UTC+7      |
| `Asia/Singapore`          | `Singapore Standard Time`     | UTC+8      |
| `Asia/Tokyo`              | `Tokyo Standard Time`         | UTC+9      |
| `Asia/Shanghai`           | `China Standard Time`         | UTC+8      |
| `Asia/Kolkata`            | `India Standard Time`         | UTC+5:30   |
| `UTC`                     | `UTC`                         | UTC+0      |

---

## 5. Endpoints

### 5.1 `GET /api/stores` — Danh sách store (có phân trang)

- **Auth:** SystemAdmin, BrandManager (own brand)
- **Query params:** `StoreFilter` (§4.2)
- **Notes:**
  - BrandManager: `brandId` luôn bị override về brand của họ — giá trị client gửi bị bỏ qua.
  - SystemAdmin: có thể truyền `brandId` để lọc theo brand cụ thể.

- **Response 200 (`PaginationResult<StoreListItem>`):**

```json
{
  "currentPage": 1,
  "pageSize": 10,
  "totalItems": 2,
  "totalPages": 1,
  "hasPrevious": false,
  "hasNext": false,
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "brandId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "DeerCoffee Nguyễn Huệ",
      "contactNumber": "0281234567",
      "address": "123 Nguyễn Huệ, Phường Bến Nghé",
      "city": "Hồ Chí Minh",
      "district": "Quận 1",
      "createdAt": "2025-01-15T08:00:00Z",
      "updatedAt": "2025-02-01T10:30:00Z",
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "updatedBy": null,
      "status": 1
    }
  ],
  "isSuccess": true,
  "message": "Store retrieved successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** StoreManager gọi endpoint này → `errorCode: "Forbidden"`

```json
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}
```

---

### 5.2 `GET /api/stores/{id}` — Chi tiết store

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Authorization flow:**
  1. BrandManager: `store.BrandId != user.BrandId` → 403 Forbidden
  2. StoreManager: `store.Id != user.StoreId` → 403 Forbidden

- **Response 200 (`Result<StoreDetailResponse>`):**

```json
{
  "isSuccess": true,
  "message": "Store retrieved successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "brandId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "DeerCoffee Nguyễn Huệ",
    "contactNumber": "0281234567",
    "address": "123 Nguyễn Huệ, Phường Bến Nghé",
    "city": "Hồ Chí Minh",
    "district": "Quận 1",
    "latitude": 10.7769,
    "longitude": 106.7009,
    "mapUrl": "https://maps.google.com/?q=10.7769,106.7009",
    "timeZone": "Asia/Ho_Chi_Minh",
    "areaSquareMeters": 120.5,
    "maxCapacity": 80,
    "firestoreCollectionPath": "stores/a1b2c3d4-e5f6-7890-abcd-ef1234567890/sensors",
    "currentMood": null,
    "lastMoodUpdateAt": null,
    "createdAt": "2025-01-15T08:00:00Z",
    "updatedAt": "2025-02-01T10:30:00Z",
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "updatedBy": "00000000-0000-0000-0000-000000000002",
    "status": 1
  },
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Đúng role nhưng khác brand/store → `errorCode: "Forbidden"`
- **Response 404:** Store không tồn tại → `errorCode: "NotFound"`

```json
{
  "isSuccess": false,
  "message": "Store not found",
  "data": null,
  "errors": null,
  "errorCode": "NotFound"
}
```

---

### 5.3 `POST /api/stores` — Tạo store mới

- **Auth:** BrandManager (own brand)
- **Content-Type:** `application/json`
- **Body:** `StoreRequest` (§4.1)
- **Notes:**
  - `brandId` **không** cần truyền — lấy từ session BrandManager.
  - Brand của BrandManager phải tồn tại.
  - `name` và `contactNumber` phải unique trong cùng brand.

- **Validation errors (400 `ValidationFailed`):**
  - `name` rỗng hoặc null → `"Store Name is required"`
  - `name` > 200 ký tự → `"Store Name cannot exceed 200 characters"`
  - `address` > 500 ký tự → `"Store Address cannot exceed 500 characters"`
  - `city` > 100 ký tự → `"Store City cannot exceed 100 characters"`
  - `district` > 100 ký tự → `"Store District cannot exceed 100 characters"`
  - `contactNumber` sai format → `"Store Contact Number is not a valid phone number"`
  - `latitude` ngoài khoảng [-90, 90] → validation error
  - `longitude` ngoài khoảng [-180, 180] → validation error
  - `mapUrl` không phải URL http/https → `"Store Map URL is not a valid URL"`
  - `timeZone` không phải timezone ID hợp lệ → `"Store Time Zone is not a valid timezone"`
  - `areaSquareMeters` ≤ 0 → validation error
  - `maxCapacity` ≤ 0 → validation error

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Store created successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại → `errorCode: "ValidationFailed"`, `errors: [...]`

```json
{
  "isSuccess": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "Name",
      "message": "Store Name is required"
    }
  ],
  "errorCode": "ValidationFailed"
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** Không phải BrandManager hoặc BrandId null → `errorCode: "Forbidden"`
- **Response 404:** Brand của BrandManager không tìm thấy → `errorCode: "NotFound"`
- **Response 422:** Trùng Name hoặc ContactNumber trong brand → `errorCode: "BusinessRuleViolation"`

```json
{
  "isSuccess": false,
  "message": "Store already exists with Name",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.4 `PUT /api/stores/{id}` — Cập nhật store (partial update)

- **Auth:** BrandManager (own brand)
- **Content-Type:** `application/json`
- **Path param:** `id` (Guid)
- **Body:** `StoreRequest` (§4.1) — **partial update**: chỉ gửi field muốn thay đổi. Các field bỏ qua hoặc null giữ nguyên giá trị cũ.
- **Notes:**
  - Handler kiểm tra `store.BrandId == user.BrandId` sau khi load store.
  - Chỉ kiểm tra uniqueness nếu giá trị field thực sự thay đổi (skip self-collision).

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Store updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại → `errorCode: "ValidationFailed"`
- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** Không phải BrandManager hoặc store không thuộc brand của user → `errorCode: "Forbidden"`
- **Response 404:** Store không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Name / ContactNumber mới đã được dùng bởi store khác trong cùng brand → `errorCode: "BusinessRuleViolation"`

```json
{
  "isSuccess": false,
  "message": "Store already exists with ContactNumber",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.5 `DELETE /api/stores/{id}` — Xóa store (soft delete)

- **Auth:** BrandManager (own brand)
- **Path param:** `id` (Guid)
- **Business rules:**
  - Store không được có **users đang được gán** (bất kỳ user nào có `StoreId == store.Id`).
  - Store không được có **không gian đang hoạt động** (Space với `StoreId == store.Id` và `Status == Active`).

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Store deleted successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không phải BrandManager hoặc store không thuộc brand → `errorCode: "Forbidden"`
- **Response 404:** Store không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Vi phạm business rule:
  - Còn users được gán → `"Cannot delete store with assigned users"`
  - Còn active spaces → `"Cannot delete store with active spaces"`

```json
{
  "isSuccess": false,
  "message": "Cannot delete store with assigned users",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.6 `PUT /api/stores/{id}/toggle-status` — Bật/tắt trạng thái store

- **Auth:** BrandManager (own brand)
- **Path param:** `id` (Guid)
- **Hành vi:** Flip `Active` ↔ `Inactive`. Nếu đang `Active` → chuyển thành `Inactive` và ngược lại.
- **Notes:**
  - BrandManager chỉ toggle được store thuộc brand của mình.
  - Không có body.

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Store status has been updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không phải BrandManager hoặc store không thuộc brand → `errorCode: "Forbidden"`
- **Response 404:** Store không tồn tại → `errorCode: "NotFound"`

---

## 6. TypeScript Types (React)

```ts
// ---- Enums ----
export enum EntityStatusEnum {
  Inactive = 0,
  Active = 1,
  Pending = 2,
  Rejected = 3,
}

// Giá trị cụ thể của MoodTypeEnum tùy theo cấu hình AI pipeline của hệ thống
export type MoodTypeEnum = string | number;

// ---- Base Types ----
export interface BaseResponse {
  id: string;
  createdAt: string;         // ISO 8601
  updatedAt: string | null;  // ISO 8601, null nếu chưa cập nhật
  createdBy: string | null;  // User ID (Guid)
  updatedBy: string | null;  // User ID (Guid)
  status: EntityStatusEnum;
}

// ---- Request ----
export interface StoreRequest {
  /** CREATE: required, not empty. Max 200 chars. */
  name?: string;
  /** Max 500 chars. */
  address?: string;
  /** Max 100 chars. e.g. "Hồ Chí Minh" */
  city?: string;
  /** Max 100 chars. e.g. "Quận 1" */
  district?: string;
  /**
   * Valid phone number: 7–15 digits total.
   * Supports +, (), -, spaces.
   * Examples: "+84901234567", "0281234567"
   */
  contactNumber?: string;
  /** Decimal degrees. Range: -90 to 90. */
  latitude?: number;
  /** Decimal degrees. Range: -180 to 180. */
  longitude?: number;
  /** Valid absolute URL with http or https scheme. */
  mapUrl?: string;
  /**
   * IANA timezone ID.
   * Examples: "Asia/Ho_Chi_Minh", "Asia/Singapore", "UTC"
   */
  timeZone?: string;
  /** Floor area in m². Must be > 0 if provided. */
  areaSquareMeters?: number;
  /** Maximum guest capacity. Must be > 0 if provided. */
  maxCapacity?: number;
  // NOTE: brandId is intentionally excluded — inferred from session
  // NOTE: firestoreCollectionPath is read-only — managed by AI/IoT pipeline
}

// ---- Filters ----
export interface StoreFilter {
  // Inherited from BasePaginationFilter
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  status?: EntityStatusEnum;

  // Domain-specific
  /** SystemAdmin only — BrandManager's value is always overridden by handler */
  brandId?: string;
  city?: string;
  district?: string;
  createdFrom?: string;        // ISO 8601
  createdTo?: string;          // ISO 8601
  storeManagerName?: string;   // Partial match on first/last name or email
}

// ---- Responses ----
export interface StoreListItem extends BaseResponse {
  brandId: string;
  name: string;
  contactNumber: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
}

export interface StoreDetailResponse extends StoreListItem {
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  timeZone: string | null;
  areaSquareMeters: number | null;
  maxCapacity: number | null;
  /** Read-only. Managed by AI/IoT pipeline. */
  firestoreCollectionPath: string | null;
  /** Read-only. Current mood set by AI pipeline. */
  currentMood: MoodTypeEnum | null;
  /** Read-only. UTC timestamp of last mood update. */
  lastMoodUpdateAt: string | null;
}

// ---- Pagination Result ----
export interface PaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  items: T[];
  isSuccess: boolean;
  message: string | null;
  errors: { field: string; message: string }[] | null;
  errorCode: string | null;
}

// ---- Result ----
export interface Result {
  isSuccess: boolean;
  message: string | null;
  errors: { field: string; message: string }[] | null;
  errorCode: string | null;
}

export interface ResultData<T> extends Result {
  data: T | null;
}

// ---- Usage examples ----

// Get stores list
const getStores = async (filter: StoreFilter): Promise<PaginationResult<StoreListItem>> => {
  const params = new URLSearchParams();
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));
  if (filter.search) params.set('search', filter.search);
  if (filter.brandId) params.set('brandId', filter.brandId);
  if (filter.city) params.set('city', filter.city);
  if (filter.district) params.set('district', filter.district);
  if (filter.status !== undefined) params.set('status', String(filter.status));

  const res = await fetch(`/api/stores?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
};

// Create store
const createStore = async (data: StoreRequest): Promise<Result> => {
  const res = await fetch('/api/stores', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Toggle store status
const toggleStoreStatus = async (id: string): Promise<Result> => {
  const res = await fetch(`/api/stores/${id}/toggle-status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
};
```

---

## 7. Dart Types (Flutter)

```dart
// ---- Enums ----
enum EntityStatusEnum {
  inactive,   // JSON: 0
  active,     // JSON: 1
  pending,    // JSON: 2
  rejected,   // JSON: 3
}
// Parse: EntityStatusEnum.values[json['status'] as int]

// ---- Request Model ----
// Serialize sang JSON: jsonEncode(storeRequest.toJson())
class StoreRequest {
  final String? name;           // Required on create, max 200 chars
  final String? address;        // Optional, max 500 chars
  final String? city;           // Optional, max 100 chars
  final String? district;       // Optional, max 100 chars
  final String? contactNumber;  // Optional, valid phone format
  final double? latitude;       // Optional, -90 to 90
  final double? longitude;      // Optional, -180 to 180
  final String? mapUrl;         // Optional, valid http/https URL
  final String? timeZone;       // Optional, IANA timezone ID
  final double? areaSquareMeters; // Optional, > 0
  final int? maxCapacity;       // Optional, > 0
  // NOTE: brandId excluded — always inferred from session
  // NOTE: firestoreCollectionPath excluded — read-only (AI/IoT pipeline)

  const StoreRequest({
    this.name,
    this.address,
    this.city,
    this.district,
    this.contactNumber,
    this.latitude,
    this.longitude,
    this.mapUrl,
    this.timeZone,
    this.areaSquareMeters,
    this.maxCapacity,
  });

  Map<String, dynamic> toJson() => {
    if (name != null) 'name': name,
    if (address != null) 'address': address,
    if (city != null) 'city': city,
    if (district != null) 'district': district,
    if (contactNumber != null) 'contactNumber': contactNumber,
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
    if (mapUrl != null) 'mapUrl': mapUrl,
    if (timeZone != null) 'timeZone': timeZone,
    if (areaSquareMeters != null) 'areaSquareMeters': areaSquareMeters,
    if (maxCapacity != null) 'maxCapacity': maxCapacity,
  };
}

// ---- Response Models ----
class StoreListItem {
  final String id;
  final String brandId;
  final String name;
  final String? contactNumber;
  final String? address;
  final String? city;
  final String? district;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? createdBy;
  final String? updatedBy;
  final EntityStatusEnum status;

  StoreListItem({
    required this.id,
    required this.brandId,
    required this.name,
    this.contactNumber,
    this.address,
    this.city,
    this.district,
    required this.createdAt,
    this.updatedAt,
    this.createdBy,
    this.updatedBy,
    required this.status,
  });

  factory StoreListItem.fromJson(Map<String, dynamic> json) => StoreListItem(
    id: json['id'],
    brandId: json['brandId'],
    name: json['name'],
    contactNumber: json['contactNumber'],
    address: json['address'],
    city: json['city'],
    district: json['district'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    createdBy: json['createdBy'],
    updatedBy: json['updatedBy'],
    status: EntityStatusEnum.values[json['status'] as int],
  );
}

class StoreDetailResponse extends StoreListItem {
  final double? latitude;
  final double? longitude;
  final String? mapUrl;
  final String? timeZone;
  final double? areaSquareMeters;
  final int? maxCapacity;
  /// Read-only. Managed by AI/IoT pipeline.
  final String? firestoreCollectionPath;
  /// Read-only. Current mood set by AI pipeline.
  final dynamic currentMood;
  /// Read-only. UTC timestamp of last mood update.
  final DateTime? lastMoodUpdateAt;

  StoreDetailResponse({
    required super.id,
    required super.brandId,
    required super.name,
    super.contactNumber,
    super.address,
    super.city,
    super.district,
    required super.createdAt,
    super.updatedAt,
    super.createdBy,
    super.updatedBy,
    required super.status,
    this.latitude,
    this.longitude,
    this.mapUrl,
    this.timeZone,
    this.areaSquareMeters,
    this.maxCapacity,
    this.firestoreCollectionPath,
    this.currentMood,
    this.lastMoodUpdateAt,
  });

  factory StoreDetailResponse.fromJson(Map<String, dynamic> json) =>
      StoreDetailResponse(
        id: json['id'],
        brandId: json['brandId'],
        name: json['name'],
        contactNumber: json['contactNumber'],
        address: json['address'],
        city: json['city'],
        district: json['district'],
        createdAt: DateTime.parse(json['createdAt']),
        updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
        createdBy: json['createdBy'],
        updatedBy: json['updatedBy'],
        status: EntityStatusEnum.values[json['status'] as int],
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        mapUrl: json['mapUrl'],
        timeZone: json['timeZone'],
        areaSquareMeters: (json['areaSquareMeters'] as num?)?.toDouble(),
        maxCapacity: json['maxCapacity'] as int?,
        firestoreCollectionPath: json['firestoreCollectionPath'],
        currentMood: json['currentMood'],
        lastMoodUpdateAt: json['lastMoodUpdateAt'] != null
            ? DateTime.parse(json['lastMoodUpdateAt'])
            : null,
      );
}

// ---- Usage example: create store ----
Future<void> createStore(StoreRequest request, String accessToken) async {
  final response = await http.post(
    Uri.parse('https://localhost:7001/api/stores'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode(request.toJson()),
  );
  final result = jsonDecode(response.body);
  if (result['isSuccess'] == true) {
    // Success
  } else {
    // Handle error: result['errorCode'], result['message']
  }
}

// ---- Usage example: toggle store status ----
Future<void> toggleStoreStatus(String storeId, String accessToken) async {
  final response = await http.put(
    Uri.parse('https://localhost:7001/api/stores/$storeId/toggle-status'),
    headers: { 'Authorization': 'Bearer $accessToken' },
  );
  final result = jsonDecode(response.body);
  // Handle result
}
```
