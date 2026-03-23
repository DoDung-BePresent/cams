# CMS Track API Documentation

Tài liệu API Track Management cho CMS (React TypeScript & Flutter). Base path: **`/api/tracks`**.

> **Postman Collection:** Import [Postman_Collection_Tracks.json](Postman_Collection_Tracks.json) → Các endpoint Track nằm trong folder **Tracks**.
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md).

---

## 1. Authorization Matrix

| Endpoint                             | SystemAdmin | BrandManager (own brand) | StoreManager (own brand) | PlaybackDevice (scope = Brand của Store session) |
| ------------------------------------ | :---------: | :----------------------: | :----------------------: | :----------------------------------------------: |
| `GET /api/tracks`                    |     ✅      |            ✅            |            ✅            |  ✅ (chỉ tracks thuộc Brand của Store session)   |
| `GET /api/tracks/{id}`               |     ✅      |            ✅            |            ✅            |    ✅ (chỉ khi track.BrandId = Brand session)    |
| `POST /api/tracks`                   |     ❌      |            ✅            |            ❌            |                        ❌                        |
| `PUT /api/tracks/{id}`               |     ❌      |            ✅            |            ❌            |                        ❌                        |
| `DELETE /api/tracks/{id}`            |     ❌      |            ✅            |            ❌            |                        ❌                        |
| `PUT /api/tracks/{id}/toggle-status` |     ❌      |            ✅            |            ❌            |                        ❌                        |

> **GET — Ownership scoping:**
>
> - **BrandManager:** `filter.BrandId` luôn bị override về `user.BrandId`.
> - **StoreManager:** `filter.BrandId` luôn bị override về `user.BrandId` (track thuộc brand, không thuộc store).
> - **SystemAdmin:** lọc tự do; không có ownership filter.
> - **PlaybackDevice:** scope = BrandId của Store mà device session gắn với; chỉ được **đọc** (GET list, GET by id).
>
> **Write — BrandManager only:**
>
> - **Ownership check:** `track.BrandId == user.BrandId` → **403** nếu không thuộc brand.
>
> ⚠️ **StoreManager** có quyền **read-only** — không thể tạo, sửa, xóa track.

---

## 2. Localization & Request Headers

### Content Negotiation: Accept-Language

Mọi request có thể kèm header **`Accept-Language`** để chỉ định ngôn ngữ cho validation messages và error responses.

```http
GET /api/tracks?page=1
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

**Response hierarchy (Track):**

```
TrackDetailResponse : TrackListItem : BaseResponse
```

### 3.2 Filter Model Inheritance (BasePaginationFilter)

`TrackFilter` kế thừa từ `BasePaginationFilter`:

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

### 4.1 `TrackRequest` (Create / Update — `multipart/form-data`)

| Field            | Type               | Required (Create) | Required (Update)  | Validation                                                     |
| ---------------- | ------------------ | :---------------: | :----------------: | -------------------------------------------------------------- |
| `title`          | string?            |        ✅         |    ❌ (partial)    | NotEmpty; max 255 chars; unique per brand                      |
| `artist`         | string?            |        ❌         |         ❌         | max 255 chars                                                  |
| `moodId`         | Guid?              |        ❌         |         ❌         | Tùy chọn                                                       |
| `durationSec`    | int?               |        ❌         |         ❌         | > 0 nếu được cung cấp                                          |
| `bpm`            | int?               |        ❌         |         ❌         | Trong khoảng 20–300 nếu được cung cấp                          |
| `genre`          | string?            |        ❌         |         ❌         | Tùy chọn                                                       |
| `energyLevel`    | decimal?           |        ❌         |         ❌         | 0.0–1.0 nếu được cung cấp                                      |
| `valence`        | decimal?           |        ❌         |         ❌         | 0.0–1.0 nếu được cung cấp                                      |
| `provider`       | MusicProviderEnum? |        ❌         |         ❌         | Default: `Custom` khi create                                   |
| `audioFile`      | IFormFile?         |        ✅         | ❌ (keep existing) | `.mp3`, `.wav`, `.aac`, `.flac`, `.ogg`, `.m4a`; max **50 MB** |
| `coverImageFile` | IFormFile?         |        ❌         | ❌ (keep existing) | `.jpg`, `.jpeg`, `.png`, `.webp`; max **5 MB**                 |

> **Partial update semantics (UPDATE):** Chỉ field non-null mới được áp dụng. `audioFile = null` → giữ nguyên file cũ. Tương tự cho `coverImageFile`.

### 4.2 `TrackFilter` (Query params cho `GET /api/tracks`)

**Kế thừa từ `BasePaginationFilter`** (§3.2) + thêm các filter riêng:

| Param           | Type                 | Default | Mô tả                                                       |
| --------------- | -------------------- | ------- | ----------------------------------------------------------- |
| `page`          | number               | 1       | Trang hiện tại                                              |
| `pageSize`      | number               | 10      | Số phần tử mỗi trang (max 500)                              |
| `search`        | string?              | —       | Tìm kiếm (title, artist, genre)                             |
| `sortBy`        | string?              | —       | Trường sắp xếp                                              |
| `isAscending`   | boolean?             | `false` | Chiều sắp xếp (default: **false** = mới nhất trước)         |
| `status`        | EntityStatusEnum?    | —       | Lọc theo trạng thái (0=Inactive, 1=Active)                  |
| `brandId`       | Guid?                | —       | ⚠️ BM/SM: luôn bị override về brand của mình. SA: lọc tự do |
| `moodId`        | Guid?                | —       | Lọc theo mood                                               |
| `genre`         | string?              | —       | Lọc theo genre (partial match)                              |
| `provider`      | MusicProviderEnum?   | —       | Lọc theo nguồn nhạc (0=Custom, …)                           |
| `isAiGenerated` | boolean?             | —       | `true` = AI-generated; `false` = manual upload              |
| `createdFrom`   | datetime? (ISO 8601) | —       | Lọc track tạo từ ngày này                                   |
| `createdTo`     | datetime? (ISO 8601) | —       | Lọc track tạo đến ngày này                                  |

### 4.3 `TrackListItem` (trong `PaginationResult<TrackListItem>`)

**Kế thừa từ `BaseResponse`** (§3.1) + thêm:

| Field           | Type               | Mô tả                                                                            |
| --------------- | ------------------ | -------------------------------------------------------------------------------- |
| (inherited)     | BaseResponse       | `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status`               |
| `brandId`       | Guid?              | ID brand sở hữu track                                                            |
| `title`         | string             | Tên track                                                                        |
| `artist`        | string?            | Nghệ sĩ                                                                          |
| `moodId`        | Guid?              | ID mood                                                                          |
| `moodName`      | string?            | Tên mood (display)                                                               |
| `genre`         | string?            | Thể loại nhạc                                                                    |
| `provider`      | MusicProviderEnum? | Nguồn nhạc (integer)                                                             |
| `durationSec`   | int?               | Thời lượng (giây, từ metadata)                                                   |
| `hlsUrl`        | string?            | HLS manifest URL (.m3u8) for streaming; may be `null` if transcode not completed |
| `coverImageUrl` | string?            | S3 URL ảnh bìa                                                                   |
| `playCount`     | int                | Số lần phát                                                                      |
| `isAiGenerated` | bool?              | Track do AI tạo hay do người dùng upload                                         |

### 4.4 `TrackDetailResponse` (trong `Result<TrackDetailResponse>`)

**Kế thừa từ `TrackListItem`** (→ kế thừa gián tiếp từ `BaseResponse`) + thêm:

| Field              | Type      | Mô tả                                           |
| ------------------ | --------- | ----------------------------------------------- |
| `bpm`              | int?      | Beats per minute (20–300)                       |
| `energyLevel`      | decimal?  | Mức năng lượng (0.0–1.0)                        |
| `valence`          | decimal?  | Valence âm nhạc (0.0–1.0, từ buồn → vui)        |
| `sunoClipId`       | string?   | ID clip Suno (AI generation only)               |
| `generationPrompt` | string?   | Prompt đã dùng để generate (AI generation only) |
| `generatedAt`      | DateTime? | Thời điểm AI generate track                     |
| `lyricsUrl`        | string?   | URL file lời bài hát (AI generation only)       |
| `lastPlayedAt`     | DateTime? | Thời điểm phát gần nhất                         |

### 4.5 `MusicProviderEnum`

| Số JSON | Tên    | Mô tả                        |
| ------- | ------ | ---------------------------- |
| `0`     | Custom | Upload thủ công (mặc định)   |
| `1`     | Suno   | AI generate từ Suno          |
| _(...)_ | _..._  | Xem thêm tại enum definition |

### 4.6 `EntityStatusEnum`

| Số JSON | Mô tả    |
| ------- | -------- |
| `0`     | Inactive |
| `1`     | Active   |
| `2`     | Pending  |
| `3`     | Rejected |

---

### 4.7 Validation Rules Detail (Backend — `SharedTrackRequestValidator`)

> **Quy tắc chung:**
>
> - **CREATE** (`isPartialUpdate = false`): `title` và `audioFile` là **bắt buộc**; các field khác tùy chọn.
> - **UPDATE** (`isPartialUpdate = true`): tất cả field đều tùy chọn; chỉ field non-null mới được validate và áp dụng.

| Field            | Rule                       | Chi tiết                                                             |
| ---------------- | -------------------------- | -------------------------------------------------------------------- |
| `title`          | Required (create)          | NotEmpty() — không được rỗng/null khi tạo mới                        |
| `title`          | MaxLength(255)             | Tối đa 255 ký tự (khi được cung cấp)                                 |
| `title`          | Unique per brand           | Không được trùng title với track khác trong **cùng brand** (handler) |
| `artist`         | MaxLength(255)             | Tối đa 255 ký tự                                                     |
| `durationSec`    | GreaterThan(0)             | Phải > 0 nếu được cung cấp                                           |
| `bpm`            | InclusiveBetween(20, 300)  | Khoảng cho phép: 20–300                                              |
| `energyLevel`    | InclusiveBetween(0.0, 1.0) | Khoảng cho phép: 0.0–1.0                                             |
| `valence`        | InclusiveBetween(0.0, 1.0) | Khoảng cho phép: 0.0–1.0                                             |
| `audioFile`      | Required (create)          | NotNull() — bắt buộc khi tạo mới                                     |
| `audioFile`      | Extension                  | Phải là `.mp3`, `.wav`, `.aac`, `.flac`, `.ogg`, `.m4a`              |
| `audioFile`      | MaxSize(50 MB)             | Tối đa 50 MB                                                         |
| `coverImageFile` | Extension (khi có)         | Phải là `.jpg`, `.jpeg`, `.png`, `.webp`                             |
| `coverImageFile` | MaxSize(5 MB)              | Tối đa 5 MB                                                          |

---

## 5. Endpoints

### 5.1 `GET /api/tracks` — Danh sách track (có phân trang)

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own brand, read-only), PlaybackDevice (scope = Brand của Store session)
- **Query params:** `TrackFilter` (§4.2)
- **Notes:**
  - **BrandManager:** `brandId` luôn bị override về brand của họ.
  - **StoreManager:** `brandId` luôn bị override về brand của họ (track thuộc brand, không thuộc store).
  - **PlaybackDevice:** `brandId` lấy từ Store của device session — chỉ thấy tracks thuộc Brand đó.
  - **SystemAdmin:** có thể truyền `brandId` để lọc.
  - Default sort: **mới nhất trước** (`isAscending = false`).

- **Response 200 (`PaginationResult<TrackListItem>`):**

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
      "id": "a1b2c3d4-0001-0000-0000-000000000001",
      "brandId": "b0000000-0000-0000-0000-000000000001",
      "title": "Summer Vibes",
      "artist": "Studio One",
      "moodId": "m0000000-0000-0000-0000-000000000001",
      "moodName": "Energetic",
      "genre": "Pop",
      "provider": 0,
      "durationSec": 210,
      "hlsUrl": "https://cdn.example.com/tracks/audio/summer-vibes.m3u8",
      "coverImageUrl": "https://cdn.example.com/tracks/covers/summer-vibes.jpg",
      "playCount": 42,
      "isAiGenerated": false,
      "createdAt": "2026-01-15T09:00:00Z",
      "updatedAt": null,
      "createdBy": "00000000-0000-0000-0000-000000000001",
      "updatedBy": null,
      "status": 1
    }
  ],
  "isSuccess": true,
  "message": "Track retrieved successfully",
  "errors": null,
  "errorCode": null
}
```

- **Response 401:** Chưa đăng nhập → `errorCode: "Unauthorized"`
- **Response 403:** No permission → `errorCode: "Forbidden"`

---

### 5.2 `GET /api/tracks/{id}` — Chi tiết track

- **Auth:** SystemAdmin, BrandManager (own brand), StoreManager (own brand), PlaybackDevice (chỉ khi track.BrandId = Brand của Store session)
- **Path param:** `id` (Guid)
- **Includes:** Mood navigation (để lấy `moodName`)
- **Authorization flow:**
  1. Track phải tồn tại → **404** nếu không tìm thấy
  2. BrandManager / StoreManager: `track.BrandId != user.BrandId` → **403 Forbidden**
  3. PlaybackDevice: `track.BrandId != session.BrandId` (từ Store session) → **403 Forbidden**

- **Response 200 (`Result<TrackDetailResponse>`):**

```json
{
  "isSuccess": true,
  "message": "Track retrieved successfully",
  "data": {
    "id": "a1b2c3d4-0001-0000-0000-000000000001",
    "brandId": "b0000000-0000-0000-0000-000000000001",
    "title": "Summer Vibes",
    "artist": "Studio One",
    "moodId": "m0000000-0000-0000-0000-000000000001",
    "moodName": "Energetic",
    "genre": "Pop",
    "provider": 0,
    "durationSec": 210,
    "hlsUrl": "https://cdn.example.com/tracks/audio/summer-vibes.m3u8",
    "coverImageUrl": "https://cdn.example.com/tracks/covers/summer-vibes.jpg",
    "playCount": 42,
    "isAiGenerated": false,
    "bpm": 128,
    "energyLevel": 0.85,
    "valence": 0.72,
    "sunoClipId": null,
    "generationPrompt": null,
    "generatedAt": null,
    "lyricsUrl": null,
    "lastPlayedAt": "2026-03-10T14:30:00Z",
    "createdAt": "2026-01-15T09:00:00Z",
    "updatedAt": null,
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "updatedBy": null,
    "status": 1
  },
  "errors": null,
  "errorCode": null
}
```

- **Response 404:** Track không tồn tại

```json
{
  "isSuccess": false,
  "message": "Track not found",
  "errors": null,
  "errorCode": "NotFound"
}
```

---

### 5.3 `POST /api/tracks` — Tạo track mới

- **Auth:** BrandManager only
- **Content-Type:** `multipart/form-data`
- **Request body:** `TrackRequest` (§4.1)
- **Notes:**
  - `brandId` tự động lấy từ `user.BrandId` (không cần gửi trong request).
  - `isAiGenerated` luôn được set `false` (upload thủ công).
  - `provider` mặc định là `Custom` (0) nếu không cung cấp.
  - Audio upload: S3 path `tracks/audio/` — non-fatal, track được tạo với `audioUrl = null` nếu upload thất bại.
  - Cover upload: S3 path `tracks/covers/` — optional, non-fatal.
  - Nếu DB save thất bại: các file đã upload được xóa trong background.

- **Request example (`multipart/form-data`):**

```
title: Summer Vibes
artist: Studio One
moodId: m0000000-0000-0000-0000-000000000001
durationSec: 210
bpm: 128
genre: Pop
energyLevel: 0.85
valence: 0.72
audioFile: [binary .mp3 file]
coverImageFile: [binary .jpg file]
```

- **Response 201 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Track created successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 400:** Validation thất bại (title rỗng, audioFile thiếu, file quá lớn, …)

```json
{
  "isSuccess": false,
  "message": "Validation failed",
  "errors": ["Title is required", "AudioFile is required"],
  "errorCode": "ValidationFailed"
}
```

- **Response 409:** Title trùng trong cùng brand

```json
{

### 5.5 `POST /api/tracks/{id}/retranscode` — Force re-transcode a track

- **Auth:** BrandManager only
- **Path param:** `id` (Guid)
- **Description:** Force the background transcode pipeline to (re)generate HLS for a single track. This endpoint enqueues a background transcode request and returns an accepted/finalized result depending on current transcode state.

- **Preconditions & behavior:**
  - The track must have an existing uploaded source audio (`AudioUrl`); if `AudioUrl` is empty the request fails with `InvalidOperation`.
  - If the track TranscodeStatus is `Pending` or `Processing` the request is rejected with a business rule error (already in progress).
  - Retranscode is allowed when `TranscodeStatus == Failed` or when `HlsUrl` is empty/missing. The handler will enqueue an immediate transcode request.

- **Response 202 (Accepted):** request accepted and transcode enqueued.

- **Errors:**
  - `400/InvalidOperation` if source audio missing.
  - `409/BusinessRuleViolation` if transcode already in progress or other guard conditions.

  "isSuccess": false,
  "message": "Track with this title already exists",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.4 `PUT /api/tracks/{id}` — Cập nhật track

- **Auth:** BrandManager only
- **Content-Type:** `multipart/form-data`
- **Path param:** `id` (Guid)
- **Request body:** `TrackRequest` (§4.1) — **partial update semantics**
- **Notes:**
  - **Ownership:** `track.BrandId != user.BrandId` → **403**
  - **Title uniqueness:** chỉ kiểm tra nếu `title` thực sự thay đổi.
  - **File update:** old file URL được capture trước khi upload mới; old file chỉ bị xóa **sau khi DB commit thành công**. Nếu DB thất bại → new file bị xóa, old file được giữ nguyên.
  - `null` field → giữ nguyên giá trị cũ (patch semantics, qua AutoMapper null-skip).

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Track updated successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 404:** Track không tồn tại
- **Response 403:** Không thuộc brand của BM

---

### 5.5 `DELETE /api/tracks/{id}` — Xóa track

- **Auth:** BrandManager only
- **Path param:** `id` (Guid)
- **Notes:**
  - **Ownership:** `track.BrandId != user.BrandId` → **403**
  - **Business rule:** Không thể xóa track đang được dùng trong một hoặc nhiều playlists hoặc space queues → **422 BusinessRuleViolation**
  - **Soft delete:** track được đánh dấu `IsDeleted = true`, không xóa khỏi DB.
  - Files (audio + cover) chỉ bị xóa từ S3 **sau khi DB commit thành công**.

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Track deleted successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

- **Response 422:** Track đang được dùng trong playlist hoặc space queue

```json
{
  "isSuccess": false,
  "message": "Cannot delete Track because it is currently included in one or more playlists or space queues.",
  "errors": null,
  "errorCode": "BusinessRuleViolation"
}
```

---

### 5.6 `PUT /api/tracks/{id}/toggle-status` — Toggle trạng thái track

- **Auth:** BrandManager only
- **Path param:** `id` (Guid)
- **Notes:**
  - **Ownership:** `track.BrandId != user.BrandId` → **403**
  - Toggle: `Active (1)` ↔ `Inactive (0)`

- **Response 200 (`Result`):**

```json
{
  "isSuccess": true,
  "message": "Track status toggled successfully",
  "data": null,
  "errors": null,
  "errorCode": null
}
```

---

## 6. Error Response Reference

| HTTP Status | ErrorCode               | Khi nào xảy ra                                                     |
| ----------- | ----------------------- | ------------------------------------------------------------------ |
| 200 / 201   | `null`                  | Thành công                                                         |
| 400         | `ValidationFailed`      | Input không hợp lệ (format, required fields)                       |
| 401         | `Unauthorized`          | Chưa đăng nhập hoặc session không hợp lệ                           |
| 403         | `Forbidden`             | Không đủ quyền hoặc track không thuộc brand của user               |
| 404         | `NotFound`              | Track không tồn tại                                                |
| 409 / 422   | `BusinessRuleViolation` | Title trùng; hoặc track đang dùng trong playlist/space queue (xóa) |
| 500         | `InternalServerError`   | Lỗi server không mong đợi                                          |

---

## 7. Notes

1. **File upload non-fatal (Create):** Nếu S3 upload audio thất bại khi tạo mới, track vẫn được tạo với `audioUrl = null`. Client nên check `audioUrl` sau khi tạo.

2. **File cleanup ordering:** Khi update, old files chỉ bị xóa từ S3 **sau DB commit** — đảm bảo không mất data khi DB fail. Khi create và DB fail → new files bị xóa.

3. **Delete vs. Playlist / Space Queue:** Một track đang có trong bất kỳ playlist nào hoặc đang tồn tại trong space queue thì không thể xóa. Cần remove track ra khỏi tất cả playlist và space queue trước.

4. **BrandId implicit:** Write operations không cần gửi `brandId` — luôn lấy từ `user.BrandId` của JWT session.

5. **isAiGenerated:** Field này chỉ được set bởi hệ thống AI pipeline, không phải endpoint track thông thường. Endpoint này luôn tạo track với `isAiGenerated = false`.
