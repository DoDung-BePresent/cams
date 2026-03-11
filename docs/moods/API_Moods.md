# CMS Mood API Documentation

Tài liệu API Mood Management cho CMS. Base path: **`/api/moods`**.

> **Postman Collection:** Import [Postman_Collection_Moods.json](Postman_Collection_Moods.json)
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md).

---

## 1. Authorization Matrix

| Endpoint          | SystemAdmin | BrandManager | StoreManager |
|-------------------|:-----------:|:------------:|:------------:|
| `GET /api/moods`  | ✅          | ✅           | ✅           |

> Moods là **dữ liệu tham chiếu toàn cục** — không bị phân tách theo Brand hay Store.
> Tất cả authenticated user đều đọc được cùng danh sách.

---

## 2. DTOs

### 2.1 `MoodListItem` (trong `Result<List<MoodListItem>>`)

Kế thừa từ **`BaseResponse`** (`id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `status`):

| Field         | Type             | Mô tả                                              |
|---------------|------------------|----------------------------------------------------|
| `id`          | Guid             | ID of the mood                                     |
| `moodType`    | MoodTypeEnum?    | Loại mood (integer — xem §3)                       |
| `name`        | string           | Tên hiển thị (ví dụ: "Chill", "Focus", "Energetic")|
| `minBpm`      | int?             | BPM tối thiểu gợi ý                               |
| `maxBpm`      | int?             | BPM tối đa gợi ý                                  |
| `genre`       | string?          | Thể loại nhạc gợi ý                                |
| `energyLevel` | decimal?         | Mức năng lượng (0.0–1.0)                           |
| `priority`    | int?             | Thứ tự hiển thị (null = cuối cùng)                 |
| `status`      | EntityStatusEnum | `0` = Inactive, `1` = Active                       |
| `createdAt`   | DateTime         | ISO 8601 UTC                                       |

**Thứ tự trả về:** `Priority ASC` (null xuống cuối), sau đó `Name ASC` — sort thực hiện ở DB level.

---

## 3. Enum Reference

### `MoodTypeEnum`

| Giá trị | Tên        | CamsMood mapping | BPM gợi ý | Mô tả                             |
|---------|------------|:----------------:|-----------|-----------------------------------|
| `1`     | Calm       | Chill (0)        | 60–80     | Lo-fi / ambient — thư giãn       |
| `2`     | Energetic  | Energetic (2)    | 120–140   | Upbeat / Electronic — năng lượng |
| `3`     | Focus      | Focus (1)        | 85–105    | Acoustic / Jazz — tập trung      |
| `4`     | Social     | _(không map)_    | 100–120   | Nhạc nền xã hội                  |
| `5`     | Romantic   | _(không map)_    | 65–90     | R&B / Ballad lãng mạn            |
| `6`     | Uplifting  | _(không map)_    | 110–140   | Pop / Gospel truyền cảm hứng     |

> **CAMS Engine** chỉ dùng 3 loại: `Calm`, `Focus`, `Energetic` (ánh xạ từ Fuzzy Logic output `CamsMood`).
> Priority seed data theo thứ tự CamsMood: Calm(1) → Focus(2) → Energetic(3).

### `EntityStatusEnum`

| Giá trị | Mô tả    |
|---------|----------|
| `0`     | Inactive |
| `1`     | Active   |

---

## 4. Endpoint

### `GET /api/moods` — Danh sách mood

- **Auth:** SystemAdmin, BrandManager, StoreManager
- **Không có query params** — trả toàn bộ active moods (dữ liệu ít, không cần phân trang)

**Response 200:**

```json
{
  "isSuccess": true,
  "message": "Mood retrieved successfully",
  "data": [
    {
      "id": "m0000000-0000-0000-0000-000000000001",
      "moodType": 0,
      "name": "Chill",
      "minBpm": 60,
      "maxBpm": 90,
      "genre": "Ambient",
      "energyLevel": 0.3,
      "priority": 1,
      "status": 1,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": null,
      "createdBy": null,
      "updatedBy": null
    },
    {
      "id": "m0000000-0000-0000-0000-000000000002",
      "moodType": 1,
      "name": "Focus",
      "minBpm": 90,
      "maxBpm": 110,
      "genre": "Lo-Fi",
      "energyLevel": 0.5,
      "priority": 2,
      "status": 1,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": null,
      "createdBy": null,
      "updatedBy": null
    },
    {
      "id": "m0000000-0000-0000-0000-000000000003",
      "moodType": 2,
      "name": "Energetic",
      "minBpm": 120,
      "maxBpm": 160,
      "genre": "Pop",
      "energyLevel": 0.85,
      "priority": 3,
      "status": 1,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": null,
      "createdBy": null,
      "updatedBy": null
    }
  ],
  "errors": null,
  "errorCode": null
}
```

**Response 401:**

```json
{
  "isSuccess": false,
  "message": "Unauthorized",
  "errors": null,
  "errorCode": "Unauthorized"
}
```

---

## 5. Notes

- Mood list thường được dùng để **populate dropdown** khi tạo Track hoặc Override Space.
- Khi override, FE nên lấy `id` từ đây để gửi vào field `moodId` của request override.
- Mood data được seed tự động khi start application (`DataSeeding:EnableSeeding = true`).
