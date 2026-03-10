# CMS Playlist API Documentation

Tài liệu API Playlist Management cho CMS (React TypeScript & Flutter). Base path: **`/api/playlists`**.

> **Postman Collection:** Import [Postman_Collection_Playlists.json](Postman_Collection_Playlists.json) → Các endpoint Playlist nằm trong folder **Playlists**.
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md).

---

## 1. Authorization Matrix

| Endpoint                                          | SystemAdmin | BrandManager (own brand) | StoreManager (own store) |
|--------------------------------------------------|:-----------:|:------------------------:|:------------------------:|
| `GET /api/playlists`                              | ✅          | ✅                       | ✅                       |
| `GET /api/playlists/{id}`                         | ✅          | ✅                       | ✅                       |
| `POST /api/playlists`                             | ❌          | ✅ ¹                     | ✅ ²                     |
| `PUT /api/playlists/{id}`                         | ❌          | ✅                       | ✅                       |
| `DELETE /api/playlists/{id}`                      | ❌          | ✅                       | ✅                       |
| `PUT /api/playlists/{id}/toggle-status`           | ❌          | ✅                       | ✅                       |
| `POST /api/playlists/{id}/tracks`                 | ❌          | ✅                       | ✅                       |
| `DELETE /api/playlists/{id}/tracks/{trackId}`     | ❌          | ✅                       | ✅                       |
| `POST /api/playlists/{id}/retranscode`            | ❌          | ✅                       | ✅                       |

> **¹ POST — BrandManager:** `storeId` **bắt buộc** — phải cung cấp và phải thuộc brand của BM.  
> **² POST — StoreManager:** `storeId` trong body **bị bỏ qua** — luôn dùng `user.StoreId`. StoreManager với `user.StoreId == null` → **403**.  
> **"own brand"** = `playlist.Store.BrandId == user.BrandId`.  
> **"own store"** = `playlist.StoreId == user.StoreId`.  
> ⚠️ **Playlist không có BrandId trực tiếp** — brand được xác định thông qua `playlist.Store.BrandId`.  
> ⚠️ **SystemAdmin** có quyền **read-only** — write operations giới hạn cho BrandManager và StoreManager.

---

## 2. Localization & Request Headers

### Content Negotiation: Accept-Language

Mọi request có thể kèm header **`Accept-Language`** để chỉ định ngôn ngữ cho validation messages và error responses.

```http
GET /api/playlists?page=1
Authorization: Bearer {{accessToken}}
Accept-Language: vi-VN
```

**Supported Languages:**
- `en-US` hoặc `en` — English (default)
- `vi-VN` hoặc `vi` — Tiếng Việt

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
    public EntityStatusEnum Status { get; set; }   // 0=Inactive | 1=Active
}
```

**Response hierarchy (Playlist):**
```
PlaylistDetailResponse : PlaylistListItem : BaseResponse
```

### 3.2 Filter Model Inheritance (BasePaginationFilter)

`PlaylistFilter` kế thừa từ `BasePaginationFilter`:

```csharp
public class BasePaginationFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;        // max 500
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool? IsAscending { get; set; }          // default: false (newest first)
    public EntityStatusEnum? Status { get; set; }
}
```

---

## 4. DTOs

### 4.1 `PlaylistRequest` (Create / Update — `application/json`)

| Field                  | Type        | Required (Create) | Required (Update) | Validation                                                      |
|------------------------|-------------|:-----------------:|:-----------------:|-----------------------------------------------------------------|
| `name`                 | string?     | ✅                | ❌ (partial)      | NotEmpty; max 255 chars; unique trong cùng store                |
| `storeId`              | Guid?       | ✅ (BM only) ³    | ❌                | BrandManager phải cung cấp; phải thuộc brand của BM             |
| `moodId`               | Guid?       | ❌                | ❌                | Tùy chọn; must exist nếu cung cấp                               |
| `description`          | string?     | ❌                | ❌                | Tùy chọn; max 2000 chars                                        |
| `isDynamic`            | bool?       | ❌                | ❌                | Playlist động hay tĩnh                                          |
| `isDefault`            | bool?       | ❌                | ❌                | Playlist mặc định của store                                     |
| `hlsUrl`               | string?     | ❌                | ❌                | Phải kết thúc bằng `.m3u8`; max 500 chars                       |
| `totalDurationSeconds` | int?        | ❌                | ❌                | > 0 nếu được cung cấp                                           |
| `trackIds`             | List<Guid>? | ❌                | ❌ ⁴              | Create: initial tracks; Update: full desired set (null = no-op) |

> **³ `storeId` theo role:**
> - **BrandManager:** `storeId` **bắt buộc** — phải cung cấp và phải là store thuộc brand của BM.
> - **StoreManager:** `storeId` trong body **bị bỏ qua** — luôn dùng `user.StoreId` từ session.
> - **Update:** `storeId` hoàn toàn bị bỏ qua (không thể đổi store của một playlist).
>
> **⁴ `trackIds` semantics trên UPDATE:**
> - `trackIds: null` → **không thay đổi** danh sách track.
> - `trackIds: []` → **xóa tất cả** track khỏi playlist.
> - `trackIds: [id1, id2]` → **sync** danh sách: xóa track không có trong list, thêm track mới.
> - Track IDs phải thuộc cùng brand (qua store) — track của brand khác bị bỏ qua.
> - Placeholder: track đang stream → **422** khi add/remove track riêng lẻ.

### 4.2 `AddTracksToPlaylistRequest` (cho `POST /api/playlists/{id}/tracks`)

| Field      | Type        | Required | Validation                                    |
|------------|-------------|:--------:|-----------------------------------------------|
| `trackIds` | List<Guid>  | ✅       | Duplicate IDs silently ignored                |

> Track đã có trong playlist → **skipped** (không duplicate). TrackIds không thuộc brand → bị loại.

### 4.3 `PlaylistFilter` (Query params cho `GET /api/playlists`)

**Kế thừa từ `BasePaginationFilter`** (§3.2) + thêm các filter riêng:

| Param          | Type              | Default | Mô tả                                                                                              |
|----------------|-------------------|---------|----------------------------------------------------------------------------------------------------|
| `page`         | number            | 1       | Trang hiện tại                                                                                     |
| `pageSize`     | number            | 10      | Số phần tử mỗi trang (max 500)                                                                     |
| `search`       | string?           | —       | Tìm kiếm (name, description)                                                                       |
| `sortBy`       | string?           | —       | Trường sắp xếp                                                                                     |
| `isAscending`  | boolean?          | `false` | Chiều sắp xếp (default: **false** = mới nhất trước)                                                |
| `status`       | EntityStatusEnum? | —       | Lọc theo trạng thái (0=Inactive, 1=Active)                                                         |
| `brandId`      | Guid?             | —       | ⚠️ BM/SM: luôn bị override. SA: lọc tự do                                                         |
| `storeId`      | Guid?             | —       | ⚠️ SM: luôn bị override. BM: lọc trong brand. SA: lọc tự do                                       |
| `moodId`       | Guid?             | —       | Lọc theo mood                                                                                      |
| `isDynamic`    | boolean?          | —       | `true` = chỉ dynamic playlist; `false` = chỉ static                                               |
| `isDefault`    | boolean?          | —       | `true` = chỉ default playlist                                                                      |
| `createdFrom`  | datetime? (ISO 8601) | —   | Lọc playlist tạo từ ngày này                                                                       |
| `createdTo`    | datetime? (ISO 8601) | —   | Lọc playlist tạo đến ngày này                                                                      |

### 4.4 `PlaylistListItem` (trong `PaginationResult<PlaylistListItem>`)

**Kế thừa từ `BaseResponse`** (§3.1) + thêm:

| Field                  | Type    | Mô tả                                                              |
|------------------------|---------|--------------------------------------------------------------------|
| (inherited)            | BaseResponse | `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status` |
| `brandId`              | Guid?   | ID brand (từ store.BrandId)                                        |
| `storeId`              | Guid?   | ID store chứa playlist                                             |
| `storeName`            | string? | Tên store (display)                                                |
| `moodId`               | Guid?   | ID mood                                                            |
| `moodName`             | string? | Tên mood (display)                                                 |
| `name`                 | string? | Tên playlist                                                       |
| `description`          | string? | Mô tả playlist                                                     |
| `isDynamic`            | bool?   | Playlist động (AI-managed) hay tĩnh                                |
| `isDefault`            | bool?   | Playlist mặc định của store                                        |
| `hlsUrl`               | string? | Master HLS manifest URL (.m3u8)                                    |
| `totalDurationSeconds` | int?    | Tổng thời lượng (giây)                                             |
| `trackCount`           | int     | Số track trong playlist                                            |

### 4.5 `PlaylistDetailResponse` (trong `Result<PlaylistDetailResponse>`)

**Kế thừa từ `PlaylistListItem`** (→ gián tiếp từ `BaseResponse`) + thêm:

| Field    | Type                    | Mô tả                                                                         |
|----------|-------------------------|-------------------------------------------------------------------------------|
| `tracks` | List<PlaylistTrackItem> | Danh sách track theo thứ tự (có `seekOffsetSeconds` được tính từ phía server) |

### 4.6 `PlaylistTrackItem` (trong `PlaylistDetailResponse.tracks`)

| Field               | Type    | Mô tả                                                                                        |
|---------------------|---------|----------------------------------------------------------------------------------------------|
| `trackId`           | Guid    | ID track                                                                                     |
| `title`             | string? | Tên track                                                                                    |
| `artist`            | string? | Nghệ sĩ                                                                                      |
| `durationSec`       | int?    | Thời lượng metadata (giây)                                                                   |
| `orderIndex`        | int?    | Thứ tự trong playlist                                                                        |
| `coverImageUrl`     | string? | URL ảnh bìa                                                                                  |
| `actualDurationSec` | int?    | Thời lượng thực từ MediaConvert (ưu tiên hơn `durationSec`); `null` nếu chưa transcode      |
| `seekOffsetSeconds` | int     | Vị trí bắt đầu (giây) trong HLS stream nối tiếp — dùng cho SkipToTrack                      |

> **`seekOffsetSeconds`:** được tính server-side bằng cách cộng dồn `actualDurationSec ?? durationSec` của từng track. Client dùng giá trị này để seek HLS player khi implement tính năng "chuyển bài".

### 4.7 `EntityStatusEnum`

| Số JSON | Mô tả           |
|---------|-----------------|
| `0`     | Inactive        |
| `1`     | Active          |
| `2`     | Pending         |
| `3`     | Rejected        |

---

### 4.8 Validation Rules Detail (Backend — `SharedPlaylistRequestValidator`)

> **Quy tắc chung:**
> - **CREATE** (`isPartialUpdate = false`): `name` là **bắt buộc**; các field khác tùy chọn.
> - **UPDATE** (`isPartialUpdate = true`): tất cả field đều tùy chọn; chỉ field non-null mới được validate và áp dụng.

| Field                  | Rule                       | Chi tiết                                                                              |
|------------------------|----------------------------|---------------------------------------------------------------------------------------|
| `name`                 | Required (create)          | NotEmpty() — không được rỗng/null khi tạo mới                                         |
| `name`                 | MaxLength(255)             | Tối đa 255 ký tự (khi được cung cấp)                                                  |
| `name`                 | Unique per store           | Không được trùng tên với playlist khác trong **cùng store** (handler check)            |
| `hlsUrl`               | EndsWith(".m3u8")          | Phải kết thúc bằng `.m3u8` nếu được cung cấp (case-insensitive)                       |
| `hlsUrl`               | MaxLength(500)             | Tối đa 500 ký tự                                                                      |
| `totalDurationSeconds` | GreaterThan(0)             | Phải > 0 nếu được cung cấp                                                            |
| `description`          | MaxLength(2000)            | Tối đa 2000 ký tự                                                                     |
| `moodId`               | Exists in DB               | Phải tồn tại nếu cung cấp (handler check)                                              |
| `storeId` (BM)         | Required (BrandManager)    | BrandManager phải cung cấp; phải thuộc brand của BM (handler check)                    |

---

## 5. Endpoints

### 5.1 `GET /api/playlists` — Danh sách playlist (có phân trang)

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own store)
- **Query params:** `PlaylistFilter` (§4.3)
- **Notes:**
  - **BrandManager:** `brandId` luôn bị override về brand của họ.
  - **StoreManager:** `storeId` bị override về store của họ; `brandId` bị override về brand của họ.
  - **SystemAdmin:** có thể truyền `storeId` hoặc `brandId` để lọc.
  - Includes: Mood, Store (tên display), PlaylistTracks (đếm track).

- **Response 200 (`PaginationResult<PlaylistListItem>`):**

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
      "id": "p1000000-0000-0000-0000-000000000001",
      "brandId": "b0000000-0000-0000-0000-000000000001",
      "storeId": "s0000000-0000-0000-0000-000000000001",
      "storeName": "Store Alpha",
      "moodId": "m0000000-0000-0000-0000-000000000001",
      "moodName": "Relaxing",
      "name": "Afternoon Chill",
      "description": "Soft background music for afternoon hours",
      "isDynamic": false,
      "isDefault": true,
      "hlsUrl": "https://cdn.example.com/hls/p1000000/master.m3u8",
      "totalDurationSeconds": 3600,
      "trackCount": 12,
      "createdAt": "2026-01-20T10:00:00Z",
      "updatedAt": null,
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "updatedBy": null,
      "status": 1
    }
  ],
  "isSuccess": true,
  "message": "Playlist retrieved successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập
- **Response 403:** No permission → `errorCode: "Forbidden"`

---

### 5.2 `GET /api/playlists/{id}` — Chi tiết playlist

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Includes:** PlaylistTracks → Track, Mood, Store
- **Authorization flow:**
  1. Playlist phải tồn tại và không bị xóa (`!IsDeleted`) → **404** nếu không thấy
  2. BrandManager: `playlist.Store.BrandId != user.BrandId` → **403**
  3. StoreManager: `playlist.StoreId != user.StoreId` → **403**
- **Notes:**
  - `seekOffsetSeconds` trong từng track được **tính server-side** (cumulative sum).
  - Client dùng `seekOffsetSeconds` để seek HLS player khi skip track.
  - Ưu tiên `actualDurationSec` (từ MediaConvert) hơn `durationSec` (metadata) để tính offset.

- **Response 200 (`Result<PlaylistDetailResponse>`):**

```json
{
  "isSuccess": true,
  "message": "Playlist retrieved successfully",
  "data": {
    "id": "p1000000-0000-0000-0000-000000000001",
    "brandId": "b0000000-0000-0000-0000-000000000001",
    "storeId": "s0000000-0000-0000-0000-000000000001",
    "storeName": "Store Alpha",
    "moodId": "m0000000-0000-0000-0000-000000000001",
    "moodName": "Relaxing",
    "name": "Afternoon Chill",
    "description": "Soft background music for afternoon hours",
    "isDynamic": false,
    "isDefault": true,
    "hlsUrl": "https://cdn.example.com/hls/p1000000/master.m3u8",
    "totalDurationSeconds": 3600,
    "trackCount": 2,
    "tracks": [
      {
        "trackId": "a1b2c3d4-0001-0000-0000-000000000001",
        "title": "Summer Vibes",
        "artist": "Studio One",
        "durationSec": 210,
        "orderIndex": 1,
        "coverImageUrl": "https://cdn.example.com/tracks/covers/summer-vibes.jpg",
        "actualDurationSec": 208,
        "seekOffsetSeconds": 0
      },
      {
        "trackId": "a1b2c3d4-0002-0000-0000-000000000002",
        "title": "Ocean Breeze",
        "artist": "Ambient Lab",
        "durationSec": 195,
        "orderIndex": 2,
        "coverImageUrl": "https://cdn.example.com/tracks/covers/ocean-breeze.jpg",
        "actualDurationSec": 193,
        "seekOffsetSeconds": 208
      }
    ],
    "createdAt": "2026-01-20T10:00:00Z",
    "updatedAt": null,
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "updatedBy": null,
    "status": 1
  },
  "errors": null,
  "errorCode": null
}
```

---

### 5.3 `POST /api/playlists` — Tạo playlist mới

- **Auth:** BrandManager, StoreManager
- **Content-Type:** `application/json`
- **Request body:** `PlaylistRequest` (§4.1)
- **Notes:**
  - **StoreManager:** `storeId` tự động lấy từ `user.StoreId`. Nếu SM không có `storeId` → **403**.
  - **BrandManager:** `storeId` bắt buộc và phải thuộc brand của BM.
  - `moodId` nếu cung cấp phải tồn tại trong DB.
  - `name` phải unique trong cùng store.
  - `trackIds` optional: track được validate thuộc cùng brand; track không hợp lệ bị bỏ qua.
  - Tất cả inserts (Playlist + PlaylistTrack) trong một transaction duy nhất.

- **Request body example:**

```json
{
  "name": "Afternoon Chill",
  "storeId": "s0000000-0000-0000-0000-000000000001",
  "moodId": "m0000000-0000-0000-0000-000000000001",
  "description": "Soft background music for afternoon hours",
  "isDynamic": false,
  "isDefault": true,
  "hlsUrl": null,
  "totalDurationSeconds": 3600,
  "trackIds": [
    "a1b2c3d4-0001-0000-0000-000000000001",
    "a1b2c3d4-0002-0000-0000-000000000002"
  ]
}
```

- **Response 201 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Playlist created successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại (name rỗng, hlsUrl sai format, …)
- **Response 404:** storeId không tồn tại hoặc moodId không tồn tại
- **Response 409/422:** Name trùng trong cùng store

---

### 5.4 `PUT /api/playlists/{id}` — Cập nhật playlist

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Content-Type:** `application/json`
- **Path param:** `id` (Guid)
- **Request body:** `PlaylistRequest` (§4.1) — **partial update semantics**
- **Notes:**
  - Ownership check theo role (§1).
  - `name` uniqueness chỉ kiểm tra nếu tên thực sự thay đổi.
  - `moodId` phải tồn tại nếu thay đổi.
  - `trackIds: null` → không thay đổi danh sách track.
  - `trackIds: []` → xóa tất cả track khỏi playlist.
  - `trackIds: [...]` → sync: xóa track không có trong list, thêm track mới (validate brand).
  - Mọi thay đổi trong playlist → **auto-reindex** `OrderIndex` trong background.
  - Scalar update + track sync trong một transaction duy nhất.

- **Request body example (chỉ đổi tên + description):**

```json
{
  "name": "Afternoon Chill (Extended)",
  "description": "Extended version with more tracks"
}
```

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Playlist updated successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

---

### 5.5 `DELETE /api/playlists/{id}` — Xóa playlist

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Notes:**
  - Ownership check theo role (§1).
  - **Business rule:** Không thể xóa playlist đang được streaming (có `SpaceMusicState.CurrentPlaylistId == id`) → **422 BusinessRuleViolation**.
  - **Soft delete:** playlist được đánh dấu `IsDeleted = true`.
  - Sau DB commit: enqueue **S3 folder cleanup** cho tất cả transcode outputs của playlist.

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Playlist deleted successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 422:** Playlist đang được streaming

```json
{
  "isSuccess": false,
  "message": "Cannot delete playlist that is currently streaming",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.6 `PUT /api/playlists/{id}/toggle-status` — Toggle trạng thái playlist

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **Notes:**
  - Toggle: `Active (1)` ↔ `Inactive (0)`
  - Ownership check theo role (§1).

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Playlist status toggled successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

---

### 5.7 `POST /api/playlists/{id}/tracks` — Thêm tracks vào playlist

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid) — playlist ID
- **Content-Type:** `application/json`
- **Request body:** `AddTracksToPlaylistRequest` (§4.2)
- **Notes:**
  - Ownership check theo role (§1).
  - Track IDs không thuộc brand (qua store) → bị **loại bỏ** (không báo lỗi).
  - Track đã có trong playlist → **skipped** (`skippedCount` trong audit log).
  - **Không thể thêm track vào playlist đang stream** → **422**.
  - Sau DB commit: auto-reindex `OrderIndex` trong background + trigger **auto-transcode** (debounced 5 min).

- **Request body example:**

```json
{
  "trackIds": [
    "a1b2c3d4-0003-0000-0000-000000000003",
    "a1b2c3d4-0004-0000-0000-000000000004"
  ]
}
```

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Playlist updated successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 422:** Playlist đang stream

```json
{
  "isSuccess": false,
  "message": "Cannot modify playlist while actively streaming",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.8 `DELETE /api/playlists/{id}/tracks/{trackId}` — Xóa track khỏi playlist

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path params:** `id` (Guid) — playlist ID; `trackId` (Guid) — track ID
- **Notes:**
  - Ownership check theo role (§1).
  - **Không thể xóa track khỏi playlist đang stream** → **422**.
  - Nếu track không có trong playlist → idempotent (không báo lỗi).
  - Sau DB commit: auto-reindex `OrderIndex` trong background + trigger **auto-transcode** (debounced 5 min).

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Playlist updated successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 422:** Playlist đang stream

```json
{
  "isSuccess": false,
  "message": "Cannot modify playlist while actively streaming",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.9 `POST /api/playlists/{id}/retranscode` — Force Re-transcode Playlist

- **Auth:** BrandManager (own brand), StoreManager (own store)
- **Path param:** `id` (Guid)
- **No request body**
- **Notes:**
  - Ownership check theo role (§1).
  - Xóa `HlsUrl` hiện tại, tăng `TranscodeVersion` lên 1, queue MediaConvert job mới vào Hangfire.
  - Dùng khi HLS cũ bị hỏng hoặc cần regenerate sau khi CloudFront/S3 config thay đổi.
  - Sau khi job hoàn tất, `HlsUrl` sẽ được cập nhật và SignalR push `PlayStream` đến tablet.

- **Response 202 Accepted (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Retranscode job queued successfully.",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 404 Not Found:** Playlist không tồn tại
- **Response 403 Forbidden:** Không có quyền

---

## 6. Error Response Reference

| HTTP Status | ErrorCode               | Khi nào xảy ra                                                        |
|-------------|-------------------------|-----------------------------------------------------------------------|
| 200 / 201   | `null`                  | Thành công                                                            |
| 400         | `ValidationFailed`      | Input không hợp lệ (format, required fields)                         |
| 401         | `Unauthorized`          | Chưa đăng nhập hoặc session không hợp lệ                             |
| 403         | `Forbidden`             | Không đủ quyền hoặc playlist không thuộc brand/store của user        |
| 404         | `NotFound`              | Playlist, Store, hoặc Mood không tồn tại                             |
| 409 / 422   | `BusinessRuleViolation` | Name trùng; playlist đang stream (delete/add/remove track)            |
| 500         | `InternalServerError`   | Lỗi server không mong đợi                                            |

---

## 7. Notes

1. **Playlist không có BrandId trực tiếp:** Brand được xác định qua `playlist.Store.BrandId`. Khi load playlist, luôn cần include `Store` navigation để kiểm tra ownership.

2. **ActiveStream guard:** Cả `AddTracksToPlaylist` và `RemoveTrackFromPlaylist` đều kiểm tra `PlaylistActiveStreamGuard.ThrowIfStreamingAsync` để bảo vệ khỏi race condition khi playlist đang phát live.

3. **Auto-transcode (debounced):** Mỗi khi thêm/xóa track, hệ thống tự động lên lịch MediaConvert job (debounced 5 phút) để concat HLS mới. Giá trị `actualDurationSec` và `hlsUrl` sẽ cập nhật sau khi transcode hoàn tất.

4. **OrderIndex reindex:** Sau mỗi thay đổi track, `OrderIndex` được reindex trong background (1, 2, 3, …) để tránh gaps. Client không nên rely vào OrderIndex trong thời gian ngắn sau khi thêm/xóa track.

5. **trackIds = null vs [] (Update):**
   - `"trackIds": null` → **không thay đổi gì** (patch semantics).
   - `"trackIds": []` → **xóa tất cả** track khỏi playlist.
   - Đây là điểm dễ nhầm lẫn — client phải gửi đúng ý định.

6. **StoreManager constraint:** StoreManager phải có `user.StoreId` hợp lệ. SM không có store → **403** ngay từ authorization step.

7. **seekOffsetSeconds:** Được tính server-side để tránh float precision lỗi ở client. Luôn lấy từ `PlaylistDetailResponse.tracks[].seekOffsetSeconds` thay vì tự tính ở client.
