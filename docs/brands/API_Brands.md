# CMS Brand API Documentation

Tài liệu API Brand Management cho CMS (React TypeScript & Flutter). Base path: **`/api/brands`**.

> **Postman Collection:** Import [Postman_Collection_LogAI_CAMS_API.json](../Postman_Collection_LogAI_CAMS_API.json) → Các endpoint Brand nằm trong folder **Brand**.
> 
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md).

---

## 1. Authorization Matrix

| Endpoint                                   | SystemAdmin | BrandManager (own brand) | StoreManager (own brand) |
|-------------------------------------------|:-----------:|:------------------------:|:------------------------:|
| `GET /api/brands`                          | ✅          | ❌                       | ❌                       |
| `GET /api/brands/{id}`                     | ✅          | ✅                       | ✅                       |
| `POST /api/brands`                         | ✅          | ❌                       | ❌                       |
| `PATCH /api/brands/{id}`                   | ✅          | ✅                       | ❌                       |
| `DELETE /api/brands/{id}`                  | ✅          | ❌                       | ❌                       |
| `PUT /api/brands/{id}/transfer-ownership`  | ✅          | ❌                       | ❌                       |
| `PUT /api/brands/{id}/toggle-status`       | ✅          | ❌                       | ❌                       |

**"own brand"** = `user.BrandId == targetBrandId`.

---

## 2. Localization & Request Headers

### Content Negotiation: Accept-Language

Mọi request có thể kèm header **`Accept-Language`** để chỉ định ngôn ngữ cho validation messages và error responses.

```http
GET /api/brands?page=1
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

**Ví dụ:**
```json
// Request với Accept-Language: vi-VN
POST /api/brands
Accept-Language: vi-VN
Content-Type: multipart/form-data

name=  // empty

// Response 400
{
  "isSuccess": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "Name",
      "message": "Tên Brand là bắt buộc"  // Tiếng Việt
    }
  ],
  "errorCode": "ValidationFailed"
}
```

---

## 3. DTOs & Filter Model Architecture

### 3.1 Response Model Inheritance (BaseResponse)

Tất cả response models (BrandListItem, BrandDetailResponse, UserResponse, StoreResponse, v.v.) đều kế thừa từ **`BaseResponse`** để đảm bảo:
- **Consistency:** Mọi API response đều có chung metadata (audit trail, status)
- **Maintainability:** Frontend/Mobile chỉ cần biết một base pattern
- **Audit Trail:** Tất cả response tự động include: ai tạo/sửa, khi nào, trạng thái gì

**BaseResponse properties:**
```csharp
public abstract class BaseResponse
{
    public Guid Id { get; set; }                          // Resource ID
    public DateTime CreatedAt { get; set; }               // Thời điểm tạo (UTC)
    public DateTime? UpdatedAt { get; set; }              // Thời điểm cập nhật cuối (UTC, null nếu chưa sửa)
    public Guid? CreatedBy { get; set; }                  // User ID tạo resource
    public Guid? UpdatedBy { get; set; }                  // User ID sửa lần cuối (null nếu chưa sửa)
    public EntityStatusEnum Status { get; set; }          // Trạng thái (int): 0=Inactive | 1=Active | 2=Pending | 3=Rejected
}
```

**Response hierarchy (Brand example):**
```
BrandDetailResponse : BrandListItem : BaseResponse
↓
BrandListItem : BaseResponse  (mở rộng BaseResponse + add logoUrl, industry, contact info)
↓
BaseResponse                  (core: Id, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, Status)
```

**Pattern áp dụng cho tất cả resources:** 
- Mọi list item (UserListItem, StoreListItem, PlaylistListItem) đều extends BaseResponse
- Mọi detail response (UserDetailResponse, StoreDetailResponse) đều extends list item
- Frontend/Mobile chắc chắn mỗi response object sẽ có metadata: `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status`

### 3.2 Filter Model Inheritance (BasePaginationFilter)

Tất cả filter/query models (BrandFilter, UserFilter, StoreFilter, v.v.) đều kế thừa từ **`BasePaginationFilter`** để đảm bảo:
- **Consistency:** Mọi API đều có chung pagination, search, sort interface
- **Maintainability:** Frontend/Mobile chỉ cần biết một base pattern
- **Reusability:** Code borrow từ base class, giảm duplicate

**BasePaginationFilter properties:**
```csharp
public class BasePaginationFilter
{
    public const int DEFAULT_PAGE = 1;
    public const int DEFAULT_PAGE_SIZE = 10;
    public const int MAX_PAGE_SIZE = 500;

    public int Page { get; set; } = 1;                    // [query] page (default: 1)
    public int PageSize { get; set; } = 10;               // [query] pageSize (default: 10, capped at 500)
    public string? Search { get; set; }                   // [query] search (full-text search)
    public string? SortBy { get; set; }                   // [query] sortBy (model-specific sort fields)
    public bool? IsAscending { get; set; }                // [query] isAscending (default: true, tăng dần)
    public EntityStatusEnum? Status { get; set; }         // [query] status (filter by EntityStatusEnum)
}
```

**BrandFilter extends (thêm domain-specific filters):**
```csharp
public class BrandFilter : BasePaginationFilter
{
    public DateTime? CreatedFrom { get; set; }  // [query] createdFrom (date range filter start)
    public DateTime? CreatedTo { get; set; }    // [query] createdTo (date range filter end)
}
```

**Pattern áp dụng cho tất cả resources:** Store, Playlist, Sensor, v.v. đều follow pattern này → Frontend/Mobile dễ sử dụng chung logic.

---

## 4. DTOs

### 4.1 `BrandRequest` (Create / Update — `multipart/form-data`)


| Field                  | Type       | Required (Create) | Required (Update) | Validation                                                                                                      |
|------------------------|------------|:-----------------:|:-----------------:|-----------------------------------------------------------------------------------------------------------------|
| `name`                 | string     | ✅                | ❌ (partial)      | Not empty; max 200 chars                                                                                        |
| `logo`                 | File       | ❌                | ❌                | Allowed types: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`; max 5 MB; no invalid filename chars    |
| `description`          | string     | ❌                | ❌                | Max 2000 chars                                                                                                  |
| `website`              | string     | ❌                | ❌                | Valid absolute URL with `http` or `https` scheme                                                                |
| `industry`             | string     | ❌                | ❌                | Max 100 chars (e.g., "F&B", "Retail")                                                                           |
| `contactEmail`         | string     | ❌                | ❌                | Valid email format (RFC 5322)                                                                                   |
| `contactPhone`         | string     | ❌                | ❌                | Valid phone number: 7–15 digits total; supports `+`, `()`, `-`, spaces (e.g., `+84901234567`, `0901234567`)     |
| `primaryContactName`   | string     | ❌                | ❌                | Max 200 chars                                                                                                   |
| `technicalContactEmail`| string     | ❌                | ❌                | Valid email format (RFC 5322)                                                                                   |
| `legalName`            | string     | ❌                | ❌                | Max 250 chars (for B2B invoicing)                                                                               |
| `taxCode`              | string     | ❌                | ❌                | Max 50 chars (tax ID number)                                                                                    |
| `billingAddress`       | string     | ❌                | ❌                | Max 500 chars                                                                                                   |
| `defaultTimeZone`      | string     | ❌                | ❌                | Valid **Windows timezone ID** (e.g., `"SE Asia Standard Time"`, `"UTC"`, `"Pacific Standard Time"`); validated via `TimeZoneInfo.FindSystemTimeZoneById()` |

**Lưu ý Update (partial update):** chỉ các field được gửi lên (non-null) mới được áp dụng. Field bỏ qua hoặc null sẽ giữ nguyên giá trị cũ.

### 4.2 `BrandFilter` (Query params cho `GET /api/brands`)

**Kế thừa từ `BasePaginationFilter`** (xem § 3.2) — tất cả filter models đều kế thừa base class này cho Frontend/Mobile, cung cấp các tính năng:
- Pagination cơ bản (page, pageSize, với limit MAX_PAGE_SIZE=500)
- Search toàn text (search)
- Sorting (sortBy, isAscending)
- Status filtering (filter by EntityStatusEnum)

| Param         | Type              | Default | Mô tả                                              |
|---------------|-------------------|---------|----------------------------------------------------|
| `page`        | number            | 1       | Trang hiện tại                                     |
| `pageSize`    | number            | 10      | Số phần tử mỗi trang (max 500)                     |
| `search`      | string?           | —       | Tìm theo `name`, `website`, `industry`, `primaryContactName`, `legalName`, `email`, `phone`. Dùng search thay vì filter riêng theo industry |
| `sortBy`      | string?           | —       | `"name"` \| `"industry"` \| `"createdat"` \| `"updatedat"` |
| `isAscending` | boolean?          | true    | Chiều sắp xếp (default: true tăng dần)            |
| `status`      | EntityStatusEnum? (int?) | —       | Lọc theo trạng thái (int: 0=Inactive, 1=Active, 2=Pending, 3=Rejected)  |
| `createdFrom`    | datetime? (ISO 8601) | —    | (Optional) Lọc brands tạo từ ngày này              |
| `createdTo`      | datetime? (ISO 8601) | —    | (Optional) Lọc brands tạo đến ngày này             |
| `primaryOwnerId` | Guid?                | —    | (Optional) Lọc theo ID Primary Owner của brand     |

### 4.3 `BrandListItem` (trong `PaginationResult<BrandListItem>`)

**Kế thừa từ `BaseResponse`** (xem § 3.1) + thêm các field:

| Field       | Type       | Mô tả                                     |
|-------------|------------|-------------------------------------------|
| (inherited) | BaseResponse | `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status` |
| `name`      | string     | Tên brand                                 |
| `logoUrl`   | string?    | Full URL ảnh logo (null nếu chưa có logo) |
| `industry`  | string?    | Ngành (e.g., "F&B", "Retail")            |
| `primaryContactName` | string? | Người liên hệ chính              |
| `contactEmail`   | string? | Email liên hệ                                                                                      |
| `contactPhone`   | string? | SĐT liên hệ                                                                                        |
| `primaryOwnerId` | string? (Guid) | ID User của Primary Owner (người nắm quyền sở hữu brand). `null` nếu chưa được gán. |

### 4.4 `BrandDetailResponse` (trong `Result<BrandDetailResponse>`)

**Kế thừa từ `BrandListItem`** (→ kế thừa gián tiếp từ `BaseResponse`) + thêm:

| Field                   | Type           | Mô tả                              |
|-------------------------|----------------|------------------------------------|
| `description`           | string?        | Mô tả brand (max 2000 chars)       |
| `website`               | string?        | Website URL                        |
| `legalName`             | string?        | Tên pháp lý (dùng cho invoicing)   |
| `taxCode`               | string?        | Mã số thuế                         |
| `billingAddress`        | string?        | Địa chỉ thanh toán                 |
| `technicalContactEmail` | string?        | Email liên hệ kỹ thuật (IoT alerts)|
| `defaultTimeZone`       | string         | Múi giờ mặc định (default: "SE Asia Standard Time") |
| `currentSubscriptionId` | string? (Guid) | ID subscription hiện tại (nếu có) |

### 4.5 `EntityStatusEnum`

| Giá trị JSON | Số | Mô tả      |
|--------------|----|------------|
| `"Inactive"` | 0  | Không hoạt động |
| `"Active"`   | 1  | Đang hoạt động  |
| `"Pending"`  | 2  | Chờ duyệt       |
| `"Rejected"` | 3  | Bị từ chối      |

**TypeScript (React):**
```ts
export enum EntityStatusEnum {
  Inactive = 'Inactive',
  Active = 'Active',
  Pending = 'Pending',
  Rejected = 'Rejected',
}
```

**Dart (Flutter):**
```dart
enum EntityStatusEnum {
  inactive,   // JSON: "Inactive"
  active,     // JSON: "Active"
  pending,    // JSON: "Pending"
  rejected,   // JSON: "Rejected"
}
```

---

### 4.6 Validation Rules Detail (Backend — `SharedBrandRequestValidator`)

Tất cả rules được áp dụng bởi `SharedBrandRequestValidator` (FluentValidation). Frontend/Mobile nên validate client-side theo đúng rules này để UX nhất quán.

> **Quy tắc chung:**
> - **CREATE** (`isPartialUpdate = false`): `name` là bắt buộc; tất cả field khác là tùy chọn nhưng nếu cung cấp thì phải đúng format.
> - **UPDATE** (`isPartialUpdate = true`): tất cả field đều tùy chọn; chỉ field được gửi lên (non-null/non-empty) mới được validate và áp dụng.

| Field                   | Rule                  | Chi tiết                                                                                                              | Validator                                           |
|-------------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| `name`                  | Required (create)     | `NotEmpty()` — không được rỗng/null khi tạo mới                                                                       | `NotEmpty().When(!isPartialUpdate)`                 |
| `name`                  | MaxLength             | Tối đa 200 ký tự                                                                                                      | `MaximumLength(200).When(!IsNullOrWhiteSpace)`      |
| `logo`                  | File type             | Chỉ chấp nhận: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`                                               | `ValidImageFile(loc, maxSizeInMB: 5.0)`             |
| `logo`                  | File size             | Tối đa **5 MB**                                                                                                        | `ValidImageFile(loc, maxSizeInMB: 5.0)`             |
| `logo`                  | File name             | Tên file không được chứa ký tự không hợp lệ (`Path.GetInvalidFileNameChars()`)                                       | `ValidImageFile(loc, maxSizeInMB: 5.0)`             |
| `contactEmail`          | Email format          | RFC 5322 email format (FluentValidation `EmailAddress()`)                                                             | `EmailAddress().When(!IsNullOrWhiteSpace)`          |
| `technicalContactEmail` | Email format          | RFC 5322 email format                                                                                                 | `EmailAddress().When(!IsNullOrWhiteSpace)`          |
| `contactPhone`          | Phone format          | 7–15 chữ số; cho phép `+`, `(`, `)`, `-`, khoảng trắng. VD: `+84901234567`, `0901234567`, `+1 (800) 555-0100`        | `IsValidPhoneNumber()` (regex-based, 7–15 digits)   |
| `website`               | URL format            | Phải là URL tuyệt đối với scheme `http` hoặc `https` (`Uri.TryCreate` + `Absolute` kind)                              | `Must(IsValidUrl).When(!IsNullOrWhiteSpace)`        |
| `defaultTimeZone`       | Timezone ID           | Phải là **Windows timezone ID** hợp lệ. Dùng `TimeZoneInfo.FindSystemTimeZoneById()` để kiểm tra. Xem danh sách bên dưới | `Must(IsValidTimeZone).When(!IsNullOrWhiteSpace)` |
| `description`           | MaxLength             | Tối đa 2000 ký tự                                                                                                     | `MaximumLength(2000).When(!IsNullOrWhiteSpace)`     |
| `primaryContactName`    | MaxLength             | Tối đa 200 ký tự                                                                                                      | `MaximumLength(200).When(!IsNullOrWhiteSpace)`      |
| `industry`              | MaxLength             | Tối đa 100 ký tự                                                                                                      | `MaximumLength(100).When(!IsNullOrWhiteSpace)`      |
| `legalName`             | MaxLength             | Tối đa 250 ký tự                                                                                                      | `MaximumLength(250).When(!IsNullOrWhiteSpace)`      |
| `taxCode`               | MaxLength             | Tối đa 50 ký tự                                                                                                       | `MaximumLength(50).When(!IsNullOrWhiteSpace)`       |
| `billingAddress`        | MaxLength             | Tối đa 500 ký tự                                                                                                      | `MaximumLength(500).When(!IsNullOrWhiteSpace)`      |

#### Phone Number Format (`contactPhone`)

Backend dùng `CommonValidationExtensions.IsValidPhoneNumber()` — regex-based, hỗ trợ:

| Quốc gia   | Ví dụ hợp lệ            | Ghi chú                     |
|------------|-------------------------|-----------------------------|
| Việt Nam   | `0901234567`            | 10 chữ số, bắt đầu bằng 0  |
| Việt Nam   | `+84901234567`          | Quốc tế +84                 |
| Thái Lan   | `+66812345678`          | Quốc tế +66                 |
| Mỹ/Canada  | `+1 (800) 555-0100`     | Quốc tế +1                  |
| Anh        | `+447911123456`         | Quốc tế +44                 |
| Quốc tế    | `+XX...` (7–15 digits)  | Bất kỳ mã quốc gia nào      |

**Các format không hợp lệ:** ít hơn 7 chữ số, hơn 15 chữ số, chứa chữ cái.

#### Timezone ID (`defaultTimeZone`)

Backend dùng **Windows timezone IDs** (không phải IANA). Một số ID phổ biến cho Đông Nam Á:

| Windows Timezone ID          | IANA tương đương      | UTC Offset |
|------------------------------|-----------------------|------------|
| `SE Asia Standard Time`      | `Asia/Bangkok`        | UTC+7      |
| `Singapore Standard Time`    | `Asia/Singapore`      | UTC+8      |
| `China Standard Time`        | `Asia/Shanghai`       | UTC+8      |
| `Tokyo Standard Time`        | `Asia/Tokyo`          | UTC+9      |
| `India Standard Time`        | `Asia/Kolkata`        | UTC+5:30   |
| `UTC`                        | `UTC`                 | UTC+0      |
| `Pacific Standard Time`      | `America/Los_Angeles` | UTC-8      |

> **Lưu ý Frontend/Mobile:** Nếu bạn dùng IANA IDs (phổ biến trên web/mobile), cần convert sang Windows ID trước khi gửi lên API. Mặc định của hệ thống là `"SE Asia Standard Time"`.

#### Logo File Validation

| Rule              | Giá trị                                                   |
|-------------------|-----------------------------------------------------------|
| Allowed types     | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`  |
| Max size          | 5 MB (5 × 1024 × 1024 bytes)                             |
| Filename          | Tên file không được chứa ký tự đặc biệt hệ điều hành     |

**HTTP Response khi logo lỗi (400 ValidationFailed):**
```json
{
  "isSuccess": false,
  "message": "Validation failed",
  "errors": [
    { "field": "Logo", "message": "File must be an image (jpg, jpeg, png, gif, webp, bmp, svg)" },
    { "field": "Logo", "message": "File size must not exceed 5MB" }
  ],
  "errorCode": "ValidationFailed"
}
```

---

## 5. Endpoints

### 5.1 `GET /api/brands` — Danh sách brand (có phân trang)

- **Auth:** SystemAdmin
- **Query params:** `BrandFilter` (§4.2)
- **Response 200 (`PaginationResult<BrandListItem>`):**

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
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Tech Brand",
      "logoUrl": "https://localhost:7001/uploads/brands/tech-brand-abc123.png",
      "industry": "Retail",
      "primaryContactName": "John Doe",
      "contactEmail": "contact@techbrand.com",
      "contactPhone": "0123456789",
      "primaryOwnerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "createdAt": "2025-01-15T08:00:00Z",
      "updatedAt": "2025-02-01T10:30:00Z",
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "updatedBy": null,
      "status": 1
    }
  ],
  "isSuccess": true,
  "message": "Brand retrieved successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** Không phải SystemAdmin → `errorCode: "Forbidden"`

```json
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}
```

---

### 5.2 `GET /api/brands/{id}` — Chi tiết brand

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own brand)
- **Path param:** `id` (Guid)
- **Response 200 (`Result<BrandDetailResponse>`):**

```json
{
  "isSuccess": true,
  "message": "Brand retrieved successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Tech Brand",
    "logoUrl": "https://localhost:7001/uploads/brands/tech-brand-abc123.png",
    "contactEmail": "contact@techbrand.com",
    "contactPhone": "0123456789",
    "description": "Thương hiệu công nghệ hàng đầu",
    "currentSubscriptionId": "7b8a9c12-3456-7890-abcd-ef1234567890",
    "createdAt": "2025-01-15T08:00:00Z",
    "updatedAt": "2025-02-01T10:30:00Z",
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "updatedBy": null,
    "status": 1
  },
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** `errorCode: "Forbidden"` (đúng role nhưng khác brand)

```json
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}
```

- **Response 404:** Brand không tồn tại → `errorCode: "NotFound"`

---

### 5.3 `POST /api/brands` — Tạo brand mới

- **Auth:** SystemAdmin
- **Content-Type:** `multipart/form-data`
- **Body:** `BrandRequest` (§4.1)
- **Validation errors (400 `ValidationFailed`):**
  - `name` rỗng hoặc null → `"Brand Name is required"`
  - `name` > 200 ký tự → `"Brand Name cannot exceed 200 characters"`
  - `contactEmail` sai format → `"Contact Email is not a valid email address"`
  - `technicalContactEmail` sai format → `"Technical Contact Email is not a valid email address"`
  - `contactPhone` sai format (không đúng 7–15 chữ số) → `"Contact Phone is not a valid phone number"`
  - `website` không phải URL tuyệt đối http/https → `"Website is not a valid URL"`
  - `defaultTimeZone` không phải Windows timezone ID hợp lệ → `"Default Time Zone is not a valid timezone"`
  - `logo` sai loại file → `"File must be an image (jpg, jpeg, png, gif, webp, bmp, svg)"`
  - `logo` > 5 MB → `"File size must not exceed 5MB"`
  - `logo` có tên file chứa ký tự không hợp lệ → `"File name contains invalid characters"`

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Brand created successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại → `errorCode: "ValidationFailed"`, `errors: [...]`
- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không phải SystemAdmin → `errorCode: "Forbidden"`

```json
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}
```

- **Response 422:** Tên brand đã tồn tại → `errorCode: "BusinessRuleViolation"`, `message: "Brand already exists with Name"`

---

### 5.4 `PATCH /api/brands/{id}` — Cập nhật brand (partial update)

- **Auth:** SystemAdmin, BrandManager (own brand)
- **Content-Type:** `multipart/form-data`
- **Path param:** `id` (Guid)
- **Body:** `BrandRequest` (§4.1) — **partial update**: chỉ gửi field muốn thay đổi. Các field bỏ qua hoặc null sẽ giữ nguyên giá trị cũ.
- **Lưu ý logo:** nếu gửi file `logo` mới, file cũ sẽ bị xóa tự động sau khi DB commit thành công (background job).

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Brand updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại → `errorCode: "ValidationFailed"`
- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** Không có quyền (role không phù hợp hoặc không phải own brand) → `errorCode: "Forbidden"`

```json
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}
```

- **Response 404:** Brand không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Tên mới đã được dùng bởi brand khác → `errorCode: "BusinessRuleViolation"`

---

### 5.5 `DELETE /api/brands/{id}` — Xóa brand (soft delete)

- **Auth:** SystemAdmin
- **Path param:** `id` (Guid)
- **Điều kiện:** Brand không được có quan hệ với Stores, Subscriptions, Users, hoặc Tracks.

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Brand deleted successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400/422:** Tồn tại quan hệ ràng buộc:
  - Has stores → `"Brand cannot be deleted because it has stores"`
  - Has subscriptions → `"Brand cannot be deleted because it has subscriptions"`
  - Has users → `"Brand cannot be deleted because it has users"`
  - Has tracks → `"Brand cannot be deleted because it has tracks"`
- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** Không phải SystemAdmin → `errorCode: "Forbidden"`

```json
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}
```

- **Response 404:** Brand không tồn tại

---

### 5.6 `PUT /api/brands/{id}/transfer-ownership` — Chuyển Primary Owner

- **Auth:** SystemAdmin
- **Content-Type:** `application/json`
- **Path param:** `id` (Guid) — Brand ID
- **Body:**

| Field        | Type   | Required | Mô tả |
|-------------|--------|----------|-------|
| `newOwnerId` | Guid | ✅ | ID của BrandManager sẽ trở thành Primary Owner mới |

```json
{
  "newOwnerId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Điều kiện hợp lệ:**
- `newOwnerId` phải là user tồn tại, thuộc cùng brand, có role `BrandManager`
- `newOwnerId` không được là PrimaryOwner hiện tại (bảo vệ no-op)

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Brand ownership transferred successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** Không phải SystemAdmin → `errorCode: "Forbidden"`
- **Response 404:** Brand không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Vi phạm business rule (new owner không thuộc brand, không có role BrandManager, hoặc đã là PrimaryOwner) → `errorCode: "BusinessRuleViolation"`

```json
{
  "isSuccess": false,
  "message": "New owner must be an active BrandManager in the same brand",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.7 `PUT /api/brands/{id}/toggle-status` — Toggle trạng thái brand

- **Auth:** SystemAdmin
- **Content-Type:** không yêu cầu (no request body)
- **Path param:** `id` (Guid) — Brand ID

**Toggle logic:** Active ↔ Inactive

**Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Brand status has been updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** Không phải SystemAdmin → `errorCode: "Forbidden"`
- **Response 404:** Brand không tồn tại → `errorCode: "NotFound"`

```json
{
  "isSuccess": false,
  "message": "Brand not found",
  "errors": null,
  "errorCode": "NotFound"
}
```

---

## 4. TypeScript Types (React)

```ts
// ---- Enums ----
export enum EntityStatusEnum {
  Inactive = 0,
  Active = 1,
  Pending = 2,
  Rejected = 3,
}

// ---- Base Types (inherited by all response models) ----
export interface BaseResponse {
  id: string;
  createdAt: string;           // ISO 8601
  updatedAt: string | null;    // ISO 8601, null if never updated
  createdBy: string | null;    // User ID
  updatedBy: string | null;    // User ID
  status: EntityStatusEnum;           // int: 0=Inactive, 1=Active, 2=Pending, 3=Rejected
}

// ---- Request ----Log.AI-CAMS-v2/docs/brands/API_Brands.md
export interface BrandRequest {
  /** CREATE: required, not empty. Max 200 chars. */
  name?: string;
  /**
   * Image file upload via FormData.
   * Allowed types: .jpg .jpeg .png .gif .webp .bmp .svg
   * Max size: 5 MB. Filename must not contain invalid OS characters.
   */
  logo?: File;
  /** Max 2000 chars. */
  description?: string;
  /** Valid absolute URL with http or https scheme. */
  website?: string;
  /** Max 100 chars. e.g. "F&B", "Retail" */
  industry?: string;
  /** Valid RFC 5322 email format. */
  contactEmail?: string;
  /**
   * Valid phone number: 7–15 digits total.
   * Supports +, (), -, spaces.
   * Examples: "+84901234567", "0901234567", "+1 (800) 555-0100"
   */
  contactPhone?: string;
  /** Max 200 chars. */
  primaryContactName?: string;
  /** Valid RFC 5322 email format. */
  technicalContactEmail?: string;
  /** Max 250 chars. For B2B invoicing. */
  legalName?: string;
  /** Max 50 chars. Tax identification number. */
  taxCode?: string;
  /** Max 500 chars. */
  billingAddress?: string;
  /**
   * Windows timezone ID (NOT IANA).
   * Examples: "SE Asia Standard Time", "UTC", "Pacific Standard Time"
   * Default: "SE Asia Standard Time" (UTC+7, equivalent to Asia/Bangkok)
   */
  defaultTimeZone?: string;
}

// ---- Filters (inherit from BasePaginationFilter) ----
export interface BrandFilter {
  // Inherited from BasePaginationFilter
  page?: number;
  pageSize?: number;
  search?: string;                  // Search across: name, website, industry, primaryContactName, legalName, email, phone
  sortBy?: 'name' | 'industry' | 'createdat' | 'updatedat';
  isAscending?: boolean;
  status?: EntityStatusEnum;        // int: 0=Inactive, 1=Active, 2=Pending, 3=Rejected

  // Domain-specific filters (BrandFilter extends BasePaginationFilter)
  createdFrom?: Date;               // Filter by creation date start
  createdTo?: Date;                 // Filter by creation date end
  primaryOwnerId?: string;          // Filter by primary owner user ID (Guid)
}

// ---- Responses ----
export interface BrandListItem extends BaseResponse {
  // Inherited from BaseResponse: id, createdAt, updatedAt, createdBy, updatedBy, status
  name: string;
  logoUrl: string | null;
  industry: string | null;
  primaryContactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  /** User ID of the Primary Owner (contract holder). Null if not yet assigned. */
  primaryOwnerId: string | null;
}

export interface BrandDetailResponse extends BrandListItem {
  // Inherited from BrandListItem (→ BaseResponse): all previous fields + audit trail
  description: string | null;
  website: string | null;
  legalName: string | null;
  taxCode: string | null;
  billingAddress: string | null;
  technicalContactEmail: string | null;
  defaultTimeZone: string;
  currentSubscriptionId: string | null;
}

// ---- Transfer Ownership Request ----
export interface TransferOwnershipRequest {
  /** The user ID of the BrandManager who will become the new Primary Owner. */
  newOwnerId: string; // Guid
}

// ---- Usage example: create brand ----
const createBrand = async (data: BrandRequest): Promise<Result> => {
  const form = new FormData();
  if (data.name) form.append('name', data.name);
  if (data.logo) form.append('logo', data.logo);
  if (data.description) form.append('description', data.description);
  if (data.website) form.append('website', data.website);
  if (data.industry) form.append('industry', data.industry);
  if (data.contactEmail) form.append('contactEmail', data.contactEmail);
  if (data.contactPhone) form.append('contactPhone', data.contactPhone);
  if (data.primaryContactName) form.append('primaryContactName', data.primaryContactName);
  if (data.technicalContactEmail) form.append('technicalContactEmail', data.technicalContactEmail);
  if (data.legalName) form.append('legalName', data.legalName);
  if (data.taxCode) form.append('taxCode', data.taxCode);
  if (data.billingAddress) form.append('billingAddress', data.billingAddress);
  if (data.defaultTimeZone) form.append('defaultTimeZone', data.defaultTimeZone);

  const res = await fetch('/api/brands', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  return res.json();
};
```

---

## 5. Dart Types (Flutter)

```dart
// ---- Enums ----
enum EntityStatusEnum {
  inactive,   // JSON: 0
  active,     // JSON: 1
  pending,    // JSON: 2
  rejected,   // JSON: 3
}
// Parse: EntityStatusEnum.values[json['status'] as int]

// ---- Base Response Model ----
// All response models inherit these fields for audit trail & status tracking
abstract class BaseResponse {
  String get id;
  DateTime get createdAt;
  DateTime? get updatedAt;
  String? get createdBy;
  String? get updatedBy;
  EntityStatusEnum get status;
}

// ---- Request ----
// Use MultipartRequest or DioFormData for logo upload.
// Example with Dio:
//   FormData.fromMap({ 'name': name, 'logo': await MultipartFile.fromFile(path) })

// ---- Response models ----
class BrandListItem implements BaseResponse {
  @override
  final String id;
  final String name;
  final String? logoUrl;
  final String? industry;
  final String? primaryContactName;
  final String? contactEmail;
  final String? contactPhone;
  /// User ID of the Primary Owner (contract holder). Null if not yet assigned.
  final String? primaryOwnerId;
  @override
  final DateTime createdAt;
  @override
  final DateTime? updatedAt;
  @override
  final String? createdBy;
  @override
  final String? updatedBy;
  @override
  final EntityStatusEnum status;

  BrandListItem({
    required this.id,
    required this.name,
    this.logoUrl,
    this.industry,
    this.primaryContactName,
    this.contactEmail,
    this.contactPhone,
    this.primaryOwnerId,
    required this.createdAt,
    this.updatedAt,
    this.createdBy,
    this.updatedBy,
    required this.status,
  });

  BrandListItem.fromJson(Map<String, dynamic> json)
    : id = json['id'],
      name = json['name'],
      logoUrl = json['logoUrl'],
      industry = json['industry'],
      primaryContactName = json['primaryContactName'],
      contactEmail = json['contactEmail'],
      contactPhone = json['contactPhone'],
      primaryOwnerId = json['primaryOwnerId'],
      createdAt = DateTime.parse(json['createdAt']),
      updatedAt = json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      createdBy = json['createdBy'],
      updatedBy = json['updatedBy'],
      status = EntityStatusEnum.values[json['status'] as int];
}

class BrandDetailResponse extends BrandListItem {
  final String? description;
  final String? website;
  final String? legalName;
  final String? taxCode;
  final String? billingAddress;
  final String? technicalContactEmail;
  final String defaultTimeZone;
  final String? currentSubscriptionId;

  BrandDetailResponse.fromJson(Map<String, dynamic> json)
    : description = json['description'],
      website = json['website'],
      legalName = json['legalName'],
      taxCode = json['taxCode'],
      billingAddress = json['billingAddress'],
      technicalContactEmail = json['technicalContactEmail'],
      defaultTimeZone = json['defaultTimeZone'] ?? 'SE Asia Standard Time',
      currentSubscriptionId = json['currentSubscriptionId'],
      super.fromJson(json);
}
```
