# CMS Space API Documentation

Tài liệu API Space Management cho CMS (React TypeScript & Flutter). Base path: **`/api/spaces`**.

> **Postman Collection:** Import [Postman_Collection_Spaces.json](Postman_Collection_Spaces.json) → Các endpoint Space nằm trong folder **Spaces**.
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md).

---

## 1. Authorization Matrix

| Endpoint                                   | SystemAdmin | BrandManager (own brand) | StoreManager (own store) |
|-------------------------------------------|:-----------:|:------------------------:|:------------------------:|
| `GET /api/spaces`                          | ✅          | ✅                       | ✅ ¹                     |
| `GET /api/spaces/{id}`                     | ✅          | ✅                       | ✅                       |
| `POST /api/spaces`                         | ❌          | ✅                       | ✅ ²                     |
| `PUT /api/spaces/{id}`                     | ❌          | ✅                       | ✅                       |
| `DELETE /api/spaces/{id}`                  | ❌          | ✅                       | ✅                       |
| `PUT /api/spaces/{id}/toggle-status`       | ❌          | ✅                       | ✅                       |

> **¹ GET /api/spaces — StoreManager:** StoreManager với `user.StoreId == null` → **403 Forbidden**.  
> **² POST /api/spaces — StoreManager:** `storeId` trong body bị **bỏ qua** — luôn dùng `user.StoreId`. StoreManager với `user.StoreId == null` → **403**.  
> **"own brand"** = `store.BrandId == user.BrandId`.  
> **"own store"** = `space.StoreId == user.StoreId`.  
> ⚠️ **SystemAdmin** có quyền **read-only** đối với space data — write operations giới hạn cho BrandManager và StoreManager.

---

## 2. Localization & Request Headers

### Content Negotiation: Accept-Language

Mọi request có thể kèm header **`Accept-Language`** để chỉ định ngôn ngữ cho validation messages và error responses.

```http
GET /api/spaces?page=1
Authorization: Bearer {{accessToken}}
Accept-Language: vi-VN
```

**Supported Languages:**
- `en-US` hoặc `en` — English (default)
- `vi-VN` hoặc `vi` — Tiếng Việt

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

**Response hierarchy (Space):**
```
SpaceDetailResponse : SpaceListItem : BaseResponse
```

### 3.2 Filter Model Inheritance (BasePaginationFilter)

`SpaceFilter` kế thừa từ `BasePaginationFilter`:

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

### 4.1 `SpaceRequest` (Create / Update — `application/json`)

| Field                    | Type           | Required (Create) | Required (Update) | Validation                                          |
|--------------------------|----------------|:-----------------:|:-----------------:|-----------------------------------------------------|
| `storeId`                | Guid?          | ✅ (BM only) ³    | ❌                | BrandManager phải cung cấp; phải thuộc brand của BM |
| `name`                   | string?        | ✅                | ❌ (partial)      | Not empty; max 200 chars; unique trong cùng store   |
| `type`                   | SpaceTypeEnum? | ✅                | ❌ (partial)      | Required khi create; phải là giá trị hợp lệ         |
| `description`            | string?        | ❌                | ❌                | Tùy chọn                                            |
| `cameraId`               | string?        | ❌                | ❌                | ID camera gắn với space                             |
| `roiCoordinates`         | string?        | ❌                | ❌                | Tọa độ ROI cho camera (JSON string)                 |
| `maxOccupancy`           | int?           | ❌                | ❌                | Phải `> 0` nếu được cung cấp                        |
| `criticalQueueThreshold` | int?           | ❌                | ❌                | Phải `> 0` nếu được cung cấp                        |
| `wiFiSensorId`           | string?        | ❌                | ❌                | ID cảm biến Wi-Fi gắn với space                     |

> **³ `storeId` theo role:**
> - **BrandManager:** `storeId` **bắt buộc** — phải cung cấp và phải là store thuộc brand của BM.
> - **StoreManager:** `storeId` trong body **bị bỏ qua** — luôn dùng `user.StoreId` từ session.
> - **Update:** `storeId` hoàn toàn bị bỏ qua (không thể đổi store của một space).

### 4.2 `SpaceFilter` (Query params cho `GET /api/spaces`)

**Kế thừa từ `BasePaginationFilter`** (§3.2) + thêm các filter riêng:

| Param          | Type              | Default | Mô tả                                                                      |
|----------------|-------------------|---------|----------------------------------------------------------------------------|
| `page`         | number            | 1       | Trang hiện tại                                                             |
| `pageSize`     | number            | 10      | Số phần tử mỗi trang (max 500)                                             |
| `search`       | string?           | —       | Tìm kiếm (name, description)                                               |
| `sortBy`       | string?           | —       | Trường sắp xếp                                                             |
| `isAscending`  | boolean?          | true    | Chiều sắp xếp (default: true = tăng dần)                                  |
| `status`       | EntityStatusEnum? | —       | Lọc theo trạng thái (0=Inactive, 1=Active, 2=Pending, 3=Rejected)         |
| `storeId`      | Guid?             | —       | ⚠️ SM: luôn bị override. BM: không áp dụng (dùng brandId). SA: lọc tự do  |
| `brandId`      | Guid?             | —       | ⚠️ BM: luôn bị override về brand của mình. SA: lọc theo brand             |
| `type`         | SpaceTypeEnum?    | —       | Lọc theo loại không gian (xem §4.5)                                        |
| `createdFrom`  | datetime? (ISO 8601) | —   | Lọc space tạo từ ngày này                                                  |
| `createdTo`    | datetime? (ISO 8601) | —   | Lọc space tạo đến ngày này                                                 |

### 4.3 `SpaceListItem` (trong `PaginationResult<SpaceListItem>`)

**Kế thừa từ `BaseResponse`** (§3.1) + thêm:

| Field        | Type          | Mô tả                                                              |
|--------------|---------------|--------------------------------------------------------------------|
| (inherited)  | BaseResponse  | `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status` |
| `storeId`    | Guid          | ID store chứa space này                                            |
| `name`       | string        | Tên space                                                          |
| `type`       | SpaceTypeEnum | Loại không gian (xem §4.5)                                         |
| `description`| string?       | Mô tả space                                                        |

### 4.4 `SpaceDetailResponse` (trong `Result<SpaceDetailResponse>`)

**Kế thừa từ `SpaceListItem`** (→ kế thừa gián tiếp từ `BaseResponse`) + thêm:

| Field                    | Type           | Mô tả                                                              |
|--------------------------|----------------|--------------------------------------------------------------------|
| `cameraId`               | string?        | ID camera gắn với space                                            |
| `roiCoordinates`         | string?        | Tọa độ ROI cho camera (JSON string)                                |
| `maxOccupancy`           | int?           | Sức chứa tối đa (người)                                            |
| `criticalQueueThreshold` | int?           | Ngưỡng cảnh báo hàng đợi                                           |
| `wiFiSensorId`           | string?        | ID cảm biến Wi-Fi gắn với space                                    |
| `currentPlaylistId`      | Guid?          | 🔒 Read-only. Playlist đang phát tại space (set bởi AI pipeline)   |

### 4.5 `SpaceTypeEnum`

| Giá trị JSON | Số | Tên        | Mô tả              |
|--------------|----|------------|--------------------|
| `"Counter"`  | 1  | Counter    | Quầy phục vụ       |
| `"Hall"`     | 2  | Hall       | Sảnh / phòng lớn   |
| `"Entrance"` | 3  | Entrance   | Lối vào            |
| `"Outdoor"`  | 4  | Outdoor    | Khu ngoài trời     |
| `"Kitchen"`  | 5  | Kitchen    | Nhà bếp / bếp      |
| `"Restroom"` | 6  | Restroom   | Nhà vệ sinh        |

### 4.6 `EntityStatusEnum`

| Giá trị JSON | Số | Mô tả           |
|--------------|----|-----------------|
| `"Inactive"` | 0  | Không hoạt động |
| `"Active"`   | 1  | Đang hoạt động  |
| `"Pending"`  | 2  | Chờ duyệt       |
| `"Rejected"` | 3  | Bị từ chối      |

---

### 4.7 Validation Rules Detail (Backend — `SharedSpaceRequestValidator`)

> **Quy tắc chung:**
> - **CREATE** (`isPartialUpdate = false`): `name` và `type` là **bắt buộc**; các field khác tùy chọn, nếu cung cấp thì phải đúng format.
> - **UPDATE** (`isPartialUpdate = true`): tất cả field đều tùy chọn; chỉ field được gửi lên (non-null/non-empty) mới được validate và áp dụng.

| Field                    | Rule               | Chi tiết                                                           |
|--------------------------|--------------------|--------------------------------------------------------------------|
| `name`                   | Required (create)  | `NotEmpty()` — không được rỗng/null khi tạo mới                    |
| `name`                   | MaxLength          | Tối đa 200 ký tự (khi được cung cấp)                               |
| `name`                   | Unique             | Không được trùng tên với space khác trong **cùng store**            |
| `type`                   | Required (create)  | `NotNull()` — bắt buộc khi tạo mới                                 |
| `type`                   | IsInEnum           | Phải là giá trị hợp lệ trong `SpaceTypeEnum`                        |
| `maxOccupancy`           | GreaterThan(0)     | Phải `> 0` nếu được cung cấp                                       |
| `criticalQueueThreshold` | GreaterThan(0)     | Phải `> 0` nếu được cung cấp                                       |

---

## 5. Endpoints

### 5.1 `GET /api/spaces` — Danh sách space (có phân trang)

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own store ⚠️)
- **Query params:** `SpaceFilter` (§4.2)
- **Notes:**
  - **BrandManager:** `brandId` luôn bị override về brand của họ.
  - **StoreManager:** `storeId` luôn bị override về store của họ. StoreManager với `storeId == null` → 403.
  - **SystemAdmin:** có thể truyền `storeId` hoặc `brandId` để lọc.

- **Response 200 (`PaginationResult<SpaceListItem>`):**

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
      "id": "c1d2e3f4-a5b6-7890-cdef-012345678901",
      "storeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Counter Area A",
      "type": 1,
      "description": "Main counter serving area",
      "createdAt": "2025-03-01T08:00:00Z",
      "updatedAt": null,
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "updatedBy": null,
      "status": 1
    },
    {
      "id": "d2e3f4a5-b6c7-8901-defa-123456789012",
      "storeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Main Hall",
      "type": 2,
      "description": "Dining hall",
      "createdAt": "2025-03-01T08:30:00Z",
      "updatedAt": null,
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "updatedBy": null,
      "status": 1
    }
  ],
  "isSuccess": true,
  "message": "Space retrieved successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** SA không có quyền ghi. SM với null storeId → `errorCode: "Forbidden"`

```json
{
  "isSuccess": false,
  "message": "You do not have permission to access this resource",
  "errors": null,
  "errorCode": "Forbidden"
}
```

---

### 5.2 `GET /api/spaces/{id}` — Chi tiết space

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Authorization flow:**
  1. Space phải tồn tại → **404** nếu không tìm thấy (kiểm tra trước auth ownership)
  2. BrandManager: `store.BrandId != user.BrandId` → **403 Forbidden**
  3. StoreManager: `space.StoreId != user.StoreId` → **403 Forbidden**

- **Response 200 (`Result<SpaceDetailResponse>`):**

```json
{
  "isSuccess": true,
  "message": "Space retrieved successfully",
  "data": {
    "id": "c1d2e3f4-a5b6-7890-cdef-012345678901",
    "storeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Counter Area A",
    "type": 1,
    "description": "Main counter serving area",
    "cameraId": "CAM-001",
    "roiCoordinates": "[[100,200],[300,200],[300,400],[100,400]]",
    "maxOccupancy": 30,
    "criticalQueueThreshold": 20,
    "wiFiSensorId": "WIFI-001",
    "currentPlaylistId": null,
    "createdAt": "2025-03-01T08:00:00Z",
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
- **Response 403:** Đúng role nhưng khác brand/store → `errorCode: "Forbidden"`
- **Response 404:** Space không tồn tại → `errorCode: "NotFound"`

```json
{
  "isSuccess": false,
  "message": "Space not found",
  "data": null,
  "errors": null,
  "errorCode": "NotFound"
}
```

---

### 5.3 `POST /api/spaces` — Tạo space mới

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Content-Type:** `application/json`
- **Body:** `SpaceRequest` (§4.1)
- **Notes:**
  - **BrandManager:** `storeId` **bắt buộc** trong body; store phải thuộc brand của BM.
  - **StoreManager:** `storeId` bị bỏ qua — luôn dùng store của SM từ session.
  - `name` phải unique trong cùng store.
  - `type` bắt buộc.

- **Validation errors (400 `ValidationFailed`):**
  - `name` rỗng hoặc null → `"Space type is required"`
  - `name` > 200 ký tự → `"Name cannot exceed 200 characters"`
  - `type` null → `"Space type is required"`
  - `type` không hợp lệ → validation error
  - `maxOccupancy` ≤ 0 → `"'Max occupancy' must be greater than '0'."`
  - `criticalQueueThreshold` ≤ 0 → `"'Critical queue threshold' must be greater than '0'."`

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Space created successfully",
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
      "message": "Name is required"
    }
  ],
  "errorCode": "ValidationFailed"
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** SystemAdmin hoặc SM với null storeId → `errorCode: "Forbidden"`
- **Response 404:** Store không tìm thấy (BM case) → `errorCode: "NotFound"`

```json
{
  "isSuccess": false,
  "message": "Store not found",
  "errors": null,
  "errorCode": "NotFound"
}
```

- **Response 422:** Trùng Name trong store → `errorCode: "BusinessRuleViolation"`

```json
{
  "isSuccess": false,
  "message": "Space already exists with this Name.",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.4 `PUT /api/spaces/{id}` — Cập nhật space (partial update)

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Content-Type:** `application/json`
- **Body:** `SpaceRequest` (§4.1, partial — chỉ gửi field cần thay đổi)
- **Notes:**
  - Patch semantics: field null/bỏ qua → giữ nguyên.
  - `storeId` trong body bị bỏ qua — không thể đổi store của space.
  - Uniqueness check chỉ thực hiện nếu `name` thực sự thay đổi (tự trùng với chính mình được cho qua).

- **Response 200:**

```json
{
  "isSuccess": true,
  "message": "Space updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation failed → `errorCode: "ValidationFailed"`
- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** `errorCode: "Forbidden"`
- **Response 404:** Space không tồn tại → `errorCode: "NotFound"`
- **Response 422:** Trùng tên → `errorCode: "BusinessRuleViolation"`

---

### 5.5 `DELETE /api/spaces/{id}` — Xóa space (soft-delete)

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Notes:**
  - Soft-delete: `DeletedAt` được set, bản ghi vẫn còn trong DB.
  - BrandManager: `store.BrandId != user.BrandId` → 403.
  - StoreManager: `space.StoreId != user.StoreId` → 403.

- **Response 200:**

```json
{
  "isSuccess": true,
  "message": "Space deleted successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** `errorCode: "Forbidden"`
- **Response 404:** Space không tồn tại → `errorCode: "NotFound"`

---

### 5.6 `PUT /api/spaces/{id}/toggle-status` — Bật/tắt trạng thái space

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Body:** Không yêu cầu body
- **Notes:**
  - Toggle: `Active` → `Inactive`, `Inactive` → `Active`.
  - BrandManager: `store.BrandId != user.BrandId` → 403.
  - StoreManager: `space.StoreId != user.StoreId` → 403.

- **Response 200:**

```json
{
  "isSuccess": true,
  "message": "Space status has been updated successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** `errorCode: "Unauthorized"`
- **Response 403:** `errorCode: "Forbidden"`
- **Response 404:** Space không tồn tại → `errorCode: "NotFound"`

---

## 6. Error Response Patterns

Tất cả error responses tuân theo cấu trúc `Result`:

```json
{
  "isSuccess": false,
  "message": "Human-readable error message (localized)",
  "data": null,
  "errors": null,
  "errorCode": "ErrorCode_Value"
}
```

| HTTP Status | `errorCode`            | Khi nào                                                          |
|-------------|------------------------|------------------------------------------------------------------|
| 400         | `ValidationFailed`     | FluentValidation thất bại                                        |
| 401         | `Unauthorized`         | Chưa đăng nhập / token hết hạn                                   |
| 403         | `Forbidden`            | Đúng role nhưng không có quyền trên resource cụ thể              |
| 404         | `NotFound`             | Space / Store không tìm thấy                                     |
| 422         | `BusinessRuleViolation`| Vi phạm business rule (trùng tên, v.v.)                          |
| 500         | `InternalError`        | Lỗi server không mong đợi                                        |
