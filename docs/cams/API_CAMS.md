# CAMS — Manager Playback API Documentation

Tài liệu API cho các endpoint **CAMS (Context-Aware AI Music System)** dành cho Manager (BrandManager & StoreManager). Base path: **`/api/cams`**.

> **Postman Collection:** Import [Postman_Collection_CAMS.json](Postman_Collection_CAMS.json)
>
> **SignalR setup (Flutter & Web) + enum contract cho StoreHub events:** xem [SIGNALR_STOREHUB.md](SIGNALR_STOREHUB.md)
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md)

---

## 1. Authorization Matrix

| Endpoint                                                                    | BrandManager (own brand/store) | StoreManager (own store) |                        PlaybackDevice (scope = Space của session)                        |
| --------------------------------------------------------------------------- | :----------------------------: | :----------------------: | :--------------------------------------------------------------------------------------: |
| `POST /api/cams/spaces/override` / `/spaces/{spaceId}/override`             |               ✅               |            ✅            |    ✅ (không cần spaceId — server lấy từ session; nếu truyền phải = SpaceId session)     |
| `DELETE /api/cams/spaces/override` / `/spaces/{spaceId}/override`           |               ✅               |            ✅            |    ✅ (không cần spaceId — server lấy từ session; nếu truyền phải = SpaceId session)     |
| `POST /api/cams/spaces/playback` / `/spaces/{spaceId}/playback`             |               ✅               |            ✅            |    ✅ (không cần spaceId — server lấy từ session; nếu truyền phải = SpaceId session)     |
| `PATCH /api/cams/spaces/state/audio` / `/spaces/{spaceId}/state/audio`      |               ✅               |            ✅            |               ✅ (giống playback — spaceId từ session nếu bỏ route param)                |
| `POST /api/cams/spaces/queue/tracks` / `/spaces/{spaceId}/queue/tracks`     |               ✅               |            ✅            |                                            ✅                                            |
| `POST /api/cams/spaces/queue/playlist` / `/spaces/{spaceId}/queue/playlist` |               ✅               |            ✅            |                                            ✅                                            |
| `PATCH /api/cams/spaces/queue/reorder` / `/spaces/{spaceId}/queue/reorder`  |               ✅               |            ✅            |                                            ✅                                            |
| `DELETE /api/cams/spaces/queue` / `/spaces/{spaceId}/queue`                 |               ✅               |            ✅            |                                            ✅                                            |
| `DELETE /api/cams/spaces/queue/all` / `/spaces/{spaceId}/queue/all`         |               ✅               |            ✅            |                                            ✅                                            |
| `GET /api/cams/spaces/queue` / `/spaces/{spaceId}/queue`                    |               ✅               |            ✅            |                         ✅ (any authenticated — theo controller)                         |
| `GET /api/cams/spaces/state`                                                |               —                |            —             |                ✅ (không truyền spaceId; server dùng SpaceId của session)                |
| `GET /api/cams/spaces/{spaceId}/state`                                      |               ✅               |            ✅            | ✅ (chỉ khi `spaceId` = SpaceId của device session; nếu không truyền thì gọi route trên) |
| `POST /api/cams/spaces/{spaceId}/pair-code`                                 |               ✅               |            ✅            |                                 ❌ (chỉ manager tạo mã)                                  |
| `DELETE /api/cams/spaces/{spaceId}/pair-code`                               |               ✅               |            ✅            |                               ❌ (chỉ manager thu hồi mã)                                |
| `DELETE /api/cams/spaces/{spaceId}/unpair`                                  |               ✅               |            ✅            |                           ✅ (unpair chính session của device)                           |

> **Ownership:**
>
> - **BrandManager** — `user.BrandId` phải khớp với `Space.Store.BrandId` → 403 nếu không chủ sở hữu.
> - **StoreManager** — `user.StoreId` phải khớp với `Space.StoreId` → 403 nếu không chủ sở hữu.
> - **PlaybackDevice** — tablet đã pair với **một Space duy nhất**; chỉ được truy cập đúng SpaceId của session. CAMS: có thể gọi `GET .../spaces/state` (không truyền spaceId) hoặc `GET .../spaces/{spaceId}/state` với `spaceId` = session; user (BM/SM) **bắt buộc** truyền `spaceId` khi gọi GET state. Ngoài CAMS, device được **GET** `/api/playlists`, `/api/playlists/{id}`, **GET** `/api/spaces/{id}` (chỉ đúng SpaceId của session; **không** được GET danh sách spaces), **GET** `/api/tracks`, `/api/tracks/{id}` (chỉ đọc, scope Brand của Store session); không được CUD playlists/tracks/spaces.

---

## 2. Enum Reference

### `OverrideModeEnum` — serialize bằng số nguyên

| Giá trị | Tên                 | Mô tả                                                                                                                |
| ------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `1`     | `DirectPlaylist`    | Manager chọn nguồn playlist thủ công. Các bài hát thuộc playlist này sẽ được nạp vào làm danh sách bài hát chờ phát. |
| `2`     | `MoodOverride`      | Manager chọn nguồn mood. Backend tự động chọn danh sách bài hát phù hợp (limit 20) làm danh sách chờ phát.           |
| `3`     | `TrackListOverride` | Manager chọn từng track thủ công. Danh sách này được nạp vào làm danh sách bài hát chờ phát.                         |

### `TransitionTypeEnum` — serialize bằng số nguyên

| Giá trị | Tên         | Mô tả                                                                     |
| ------- | ----------- | ------------------------------------------------------------------------- |
| `1`     | `Immediate` | Chuyển bài ngay                                                           |
| `2`     | `Crossfade` | Chuyển mượt                                                               |
| `3`     | `Pending`   | Chờ resource sẵn sàng                                                     |
| `4`     | `Queued`    | Override được chấp nhận, track đã vào queue chờ bài hiện tại diễn ra xong |

### `PlaybackCommandEnum` — serialize bằng số nguyên

| Giá trị | Tên            | `SeekPositionSeconds`   | `TargetTrackId` |
| ------- | -------------- | ----------------------- | --------------- |
| `1`     | `Pause`        | Không dùng              | Không dùng      |
| `2`     | `Resume`       | Không dùng              | Không dùng      |
| `3`     | `Seek`         | Vị trí tuyệt đối (giây) | Không dùng      |
| `4`     | `SeekForward`  | Delta tua tới (giây)    | Không dùng      |
| `5`     | `SeekBackward` | Delta tua lùi (giây)    | Không dùng      |
| `6`     | `SkipNext`     | Server điền             | Server điền     |
| `7`     | `SkipPrevious` | Server điền             | Không dùng      |
| `8`     | `SkipToTrack`  | Server điền             | **Bắt buộc**    |
| `9`     | `TrackEnded`   | Không dùng              | Không dùng      |

> ⚠️ **FE phải khai báo TypeScript/Dart enum với giá trị tường minh** — xem [SIGNALR_STOREHUB.md](SIGNALR_STOREHUB.md) cho enum contract đầy đủ kèm ví dụ code.

---

## 3. Endpoints

---

### 3.1 POST `/api/cams/spaces/override` và POST `/api/cams/spaces/{spaceId}/override` — Override Space Music

Override queue tại một Space theo mô hình queue-first. Request phải chọn **chính xác 1 nguồn** trong `trackIds`, `playlistId`, `moodId`.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

- **PlaybackDevice:** gọi `POST /api/cams/spaces/override` **không cần `spaceId`** — server dùng SpaceId từ device session; nếu gọi route có `{spaceId}` thì giá trị phải khớp với SpaceId của session.
- **Manager (BM/SM):** phải chỉ định `spaceId` (route `/spaces/{spaceId}/override`) và phải có quyền trên Space đó.

#### Request Body

```json
{
  "trackIds": ["uuid-track-1", "uuid-track-2"],
  "playlistId": null,
  "moodId": null,
  "isClearManagerSelectedQueues": false,
  "reason": "string tùy chọn, tối đa 500 ký tự"
}
```

| Field                          | Type      | Bắt buộc | Mô tả                                                                 |
| ------------------------------ | --------- | :------: | --------------------------------------------------------------------- |
| `trackIds`                     | `Guid[]?` | Nguồn 1  | Danh sách track theo thứ tự caller truyền                             |
| `playlistId`                   | `Guid?`   | Nguồn 2  | Lấy track từ playlist theo order index                                |
| `moodId`                       | `Guid?`   | Nguồn 3  | Backend tự chọn track theo mood (limit 20)                            |
| `isClearManagerSelectedQueues` | `bool`    |    ❌    | `true`: clear toàn bộ pending queue; `false`: chỉ clear pending từ AI |
| `reason`                       | `string?` |    ❌    | Lý do override (audit trail + UI display)                             |

> **Validation:** phải cung cấp đúng 1 trong 3 nguồn: `trackIds` hoặc `playlistId` hoặc `moodId`.

#### Response `200 OK` — Override accepted

```json
{
  "isSuccess": true,
  "message": "Override applied successfully.",
  "data": "uuid"
}
```

#### Response `400 Bad Request` — Validation lỗi

```json
{
  "isSuccess": false,
  "message": "Validation failed.",
  "errors": [
    "Phải cung cấp đúng một nguồn: TrackIds hoặc PlaylistId hoặc MoodId."
  ]
}
```

#### Response `422 Unprocessable Entity` — Source hợp lệ nhưng không resolve được track khả dụng

```json
{
  "isSuccess": false,
  "message": "No valid override tracks found from the selected source.",
  "errorCode": "InvalidInput"
}
```

#### Response `404 Not Found`

```json
{
  "isSuccess": false,
  "message": "Space not found.",
  "errorCode": "NotFound"
}
```

#### Behavior Notes

- Hệ thống luôn prepend track override vào đầu queue.
- Hệ thống luôn chuyển bài ngay lập tức sang track kế tiếp trong queue (hard switch).
- `isClearManagerSelectedQueues=true`: clear toàn bộ pending queue trước khi inject.
- `isClearManagerSelectedQueues=false`: chỉ clear pending queue có source AI.
- Response chỉ trả ACK `spaceId`; client lấy trạng thái chi tiết qua `GET .../state` + SignalR.

---

### 3.2 DELETE `/api/cams/spaces/override` và DELETE `/api/cams/spaces/{spaceId}/override` — Cancel Override

Hủy override thủ công. Hangfire AI scheduling tự động tiếp quản trong vòng ~60 giây.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

- **PlaybackDevice:** gọi `DELETE /api/cams/spaces/override` **không cần `spaceId`** — server dùng SpaceId từ device session; nếu gọi route có `{spaceId}` thì giá trị phải khớp với SpaceId của session.
- **Manager (BM/SM):** phải chỉ định `spaceId` (route `/spaces/{spaceId}/override`) và phải có quyền trên Space đó.

#### No Request Body

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Manual override cancelled. AI scheduling resumes on the next Hangfire cycle."
}
```

#### Response `404 Not Found`

```json
{
  "isSuccess": false,
  "message": "Space not found.",
  "errorCode": "NotFound"
}
```

#### Behavior Notes

- Clear 4 fields: `IsManualOverride = false`, `OverrideMode = null`, `OverrideReason = null`, `OverriddenByUserId = null`.
- Trạng thái trước khi clear được capture vào audit log với `action = 'CancelOverride'`.
- Hangfire job tiếp theo sẽ chạy AI analysis và tự chuyển playlist.

---

### 3.3 POST `/api/cams/spaces/playback` và POST `/api/cams/spaces/{spaceId}/playback` — Send Playback Command

Gửi lệnh điều khiển playback đến tablet và tất cả manager browser tabs đang xem Space đó (broadcast qua SignalR group).

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

- **PlaybackDevice:** gọi `POST /api/cams/spaces/playback` **không cần `spaceId`** — server dùng SpaceId từ device session; nếu gọi route có `{spaceId}` thì giá trị phải khớp với SpaceId của session.
- **Manager (BM/SM):** phải chỉ định `spaceId` (route `/spaces/{spaceId}/playback`) và phải có quyền trên Space đó.

#### Request Body

```json
{
  "command": 8,
  "seekPositionSeconds": null,
  "targetTrackId": "uuid-cua-track-can-nhay-den"
}
```

Validator:

- `command` phải là một giá trị trong `PlaybackCommandEnum` (1..9).
- Với `Seek (3)`, `SeekForward (4)`, `SeekBackward (5)`: `seekPositionSeconds` phải được cung cấp và **> 0**.
- Với `SkipToTrack (8)`: `targetTrackId` là bắt buộc (không được `null`).

| Field                 | Type                        | Mô tả                                                                                  |
| --------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| `command`             | `int` (PlaybackCommandEnum) | Lệnh cần thực thi (xem bảng enum Section 2)                                            |
| `seekPositionSeconds` | `double?`                   | Giây — absolute cho Seek, delta cho SeekForward/Backward. Null với Pause/Resume/Skip\* |
| `targetTrackId`       | `Guid?`                     | **Bắt buộc** khi `command = 8` (SkipToTrack)                                           |

#### Xử lý server-side theo từng Command

| Command            | Server làm gì                                                                                                   | Relay tới SignalR                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Pause (1)`        | `IsPaused=true`, `PausePositionSeconds=(now−StartedAtUtc)`                                                      | `{ command:1 }`                                                                                               |
| `Resume (2)`       | `StartedAtUtc=now−PausePos`, `IsPaused=false`                                                                   | `{ command:2 }`                                                                                               |
| `Seek (3)`         | Cập nhật `StartedAtUtc` / `PausePositionSeconds`                                                                | `{ command:3, seekPositionSeconds:N }`                                                                        |
| `SeekForward (4)`  | `currentPos+delta` → tính absolute                                                                              | `{ command:4, seekPositionSeconds:<absolute> }`                                                               |
| `SeekBackward (5)` | `max(0, currentPos-delta)` → tính absolute                                                                      | `{ command:5, seekPositionSeconds:<absolute> }`                                                               |
| `SkipNext (6)`     | Chuyển sang successor tuần tự theo `Position` (không wrap). Nếu không có successor → **422** `InvalidOperation` | `{ command:6, seekPositionSeconds: 0 hoặc null, targetTrackId }`                                              |
| `SkipPrevious (7)` | > threshold: restart current; <= threshold: chuyển sang track trước (theo rule hiện có).                        | `{ command:7, seekPositionSeconds: 0 hoặc null, targetTrackId }`                                              |
| `SkipToTrack (8)`  | Jump tới hàng đợi có `TrackId` match (kể cả `Played/Skipped` để re-listen). Không tính cumulative offset        | `{ command:8, seekPositionSeconds: 0 hoặc null, targetTrackId }`                                              |
| `TrackEnded (9)`   | Natural end → advance theo successor tuần tự; áp dụng `queueEndBehavior` (Stop/RepeatAll/RepeatOne)             | `{ command:9, seekPositionSeconds: 0 hoặc null, targetTrackId }` (+ có thể `StopPlayback` khi không còn next) |

> **Skip\* relay:** `seekPositionSeconds` với Skip\* thường chỉ là tín hiệu (`0` hoặc null). Client chuyển track dựa trên `SpaceStateSync.hlsUrl/startedAtUtc` và `targetTrackId`.

> **SkipToTrack fallback:** Nếu track đích chưa stream-ready, server set pending (client chờ `SpaceStateSync` tiếp theo sau transcode).

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Playback command 'SkipToTrack' relayed to Space."
}
```

#### Response `400 Bad Request` — SkipToTrack thiếu TargetTrackId

```json
{
  "isSuccess": false,
  "message": "TargetTrackId is required for SkipToTrack command.",
  "errorCode": "InvalidInput"
}
```

#### Response `404 Not Found` — Space chưa stream playlist nào

```json
{
  "isSuccess": false,
  "message": "No active playback state found for this Space.",
  "errorCode": "NotFound"
}
```

#### Behavior Notes

- `SpaceMusicState.StartedAtUtc` luôn được cập nhật → late-joining client gọi `GET /state` sẽ nhận đúng `SeekOffsetSeconds`.
- Tất cả manager tabs mở Space này nhận SignalR event đồng thời → UI sync.
- Command ngoài range hợp lệ có thể bị reject tại `StoreHub` **trước** khi đến handler.
- **SkipNext:** bài kế là **tuần tự theo `Position`** trên toàn queue (kể cả `Played`/`Skipped`), **không** wrap về đầu; nếu không còn `Position` lớn hơn bài đang phát → **422** `InvalidOperation`.
- **TrackEnded / watchdog:** dùng `queueEndBehavior` trên state (Stop / RepeatAll / RepeatOne).

---

### 3.3.1 PATCH `/api/cams/spaces/state/audio` và PATCH `/api/cams/spaces/{spaceId}/state/audio` — Mixer & queue end

Cập nhật một phần: `volumePercent` (0–100), `isMuted`, `queueEndBehavior`. **Ít nhất một** field phải có trong body.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice` (cùng quy tắc `spaceId` như POST playback).

**Response:** `200 OK` + `Result` message. Sau commit chỉ **enqueue `SpaceStateSync`** (background job) — **không** reschedule watchdog.

#### Request body (ví dụ)

```json
{
  "volumePercent": 75,
  "isMuted": false,
  "queueEndBehavior": 1
}
```

---

### 3.3.2 POST `/api/cams/spaces/queue/tracks` và POST `/api/cams/spaces/{spaceId}/queue/tracks` — Add Tracks To Queue

Chèn danh sách track vào queue theo `mode`:

- `PlayNow` (1): chuyển ngay sang track đầu nếu stream-ready
- `PlayNext` (2): chèn vào đoạn sắp phát (sau item đang playing)
- `AddToQueue` (3): thêm vào cuối pending queue

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

#### Request body

```json
{
  "trackIds": ["{{trackId}}", "{{trackId2}}"],
  "mode": 1,
  "isClearExistingQueue": false,
  "reason": "PlayNow via CAMS API"
}
```

| Field                  | Type      |           Bắt buộc           | Mô tả                                                                                                    |
| ---------------------- | --------- | :--------------------------: | -------------------------------------------------------------------------------------------------------- |
| `trackIds`             | `Guid[]`  |              ✅              | Danh sách track theo thứ tự caller truyền                                                                |
| `mode`                 | `int`     |              ✅              | `QueueInsertModeEnum`: 1=PlayNow, 2=PlayNext, 3=AddToQueue                                               |
| `isClearExistingQueue` | `bool`    | ❌ (optional, default=false) | Khi true: clear toàn bộ queue (Pending/Played/Skipped) nhưng **giữ** item đang Playing để chuyển an toàn |
| `reason`               | `string?` |              ❌              | Lý do (audit trail + UI display, max 500 ký tự)                                                          |

Validator:

- `trackIds` không được rỗng và tất cả phần tử đều không được rỗng.
- `reason` tối đa 500 ký tự (nếu cung cấp).

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": "uuid"
}
```

---

### 3.3.3 POST `/api/cams/spaces/queue/playlist` và POST `/api/cams/spaces/{spaceId}/queue/playlist` — Add Playlist To Queue

Resolve tracks của playlist theo thứ tự playlist, sau đó chèn vào queue giống endpoint AddTracks.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

#### Request body

```json
{
  "playlistId": "{{playlistId}}",
  "mode": 1,
  "isClearExistingQueue": false,
  "reason": "Play playlist next"
}
```

Validator:

- `playlistId` không được rỗng (`Guid.Empty`) và phải là GUID hợp lệ.
- `reason` tối đa 500 ký tự (nếu cung cấp).
- `isClearExistingQueue` là optional, default `false`.

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": "uuid"
}
```

---

### 3.3.4 PATCH `/api/cams/spaces/queue/reorder` và PATCH `/api/cams/spaces/{spaceId}/queue/reorder` — Reorder Pending Queue

**Chỉ reorder** các item đang ở trạng thái `Pending`.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

#### Request body

```json
{
  "queueItemIds": ["{{queueItemId1}}", "{{queueItemId2}}"]
}
```

Validator:

- `queueItemIds` không được rỗng và tất cả phần tử đều không được rỗng.
- Danh sách phải **distinct** (không được trùng `queueItemId`).

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": "uuid"
}
```

---

### 3.3.5 DELETE `/api/cams/spaces/queue` và DELETE `/api/cams/spaces/{spaceId}/queue` — Remove Queue Items

Remove nhiều queue item theo danh sách `queueItemIds`.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

#### Request body

```json
{
  "queueItemIds": ["{{queueItemId1}}", "{{queueItemId2}}"]
}
```

Validator:

- `queueItemIds` không được rỗng và tất cả phần tử đều không được rỗng.
- Nếu queue không chứa các id được yêu cầu: endpoint vẫn trả `200 OK` (idempotent).

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": "uuid"
}
```

---

### 3.3.6 DELETE `/api/cams/spaces/queue/all` và DELETE `/api/cams/spaces/{spaceId}/queue/all` — Clear Space Queue

Xoá toàn bộ queue items của Space và dừng phát.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

#### No request body

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": "uuid"
}
```

---

### 3.3.7 GET `/api/cams/spaces/queue` và GET `/api/cams/spaces/{spaceId}/queue` — Get Space Queue

Trả về snapshot queue của Space (bao gồm `Playing/Pending/Played/Skipped`).

**Auth:** Bất kỳ user đã xác thực (theo controller)

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Success.",
  "data": [
    {
      "queueItemId": "uuid",
      "trackId": "uuid",
      "trackName": "string",
      "position": 1,
      "queueStatus": 0,
      "source": 1,
      "hlsUrl": null,
      "isReadyToStream": false
    }
  ]
}
```

| Field         | Kiểu  | Mô tả                                                            |
| ------------- | ----- | ---------------------------------------------------------------- |
| `queueStatus` | `int` | `QueueItemStatusEnum`: 0=Pending, 1=Playing, 2=Played, 3=Skipped |
| `source`      | `int` | `QueueItemSourceEnum`: 0=AI, 1=Manager                           |

---

### 3.4 GET `/api/cams/spaces/state` và GET `/api/cams/spaces/{spaceId}/state` — Get Space Playback State

Lấy snapshot trạng thái phát nhạc của một Space. Dùng cho:

- Tablet sau khi reconnect SignalR → `seekTo(SeekOffsetSeconds)` để không restart từ đầu.
- Manager dashboard khi load trang / re-focus tab.

**Auth:** Bất kỳ user đã xác thực (tablet, manager, admin)

| Caller             | Route                            | spaceId                                                        |
| ------------------ | -------------------------------- | -------------------------------------------------------------- |
| **User (BM/SM)**   | `GET .../spaces/{spaceId}/state` | **Bắt buộc** — thiếu → 401                                     |
| **PlaybackDevice** | `GET .../spaces/state`           | Không truyền — server dùng SpaceId của session                 |
| **PlaybackDevice** | `GET .../spaces/{spaceId}/state` | Tùy chọn; nếu truyền phải = SpaceId của session, không thì 403 |

#### No Request Body (path param `spaceId` chỉ có ở route thứ hai)

#### Response `200 OK` — Đang streaming (full `SpaceStateDto`)

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentQueueItemId": "uuid",
    "currentTrackName": "Evening Chill",
    "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
    "moodName": "Chill",
    "isManualOverride": true,
    "overrideMode": 1,
    "startedAtUtc": "2026-03-08T10:00:00Z",
    "expectedEndAtUtc": "2026-03-08T11:30:00Z",
    "seekOffsetSeconds": 342.5,
    "isPaused": false,
    "pausePositionSeconds": null,
    "pendingQueueItemId": null,
    "pendingOverrideReason": null,
    "volumePercent": 100,
    "isMuted": false,
    "queueEndBehavior": 0,
    "spaceQueueItems": [
      {
        "queueItemId": "uuid",
        "trackId": "uuid",
        "trackName": "Evening Chill",
        "position": 1,
        "queueStatus": 1,
        "source": 1,
        "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
        "isReadyToStream": true
      }
    ]
  }
}
```

#### Response `200 OK` — Đang pause

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentQueueItemId": "uuid",
    "currentTrackName": "Evening Chill",
    "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
    "moodName": "Chill",
    "isManualOverride": false,
    "overrideMode": null,
    "startedAtUtc": "2026-03-08T10:00:00Z",
    "expectedEndAtUtc": null,
    "seekOffsetSeconds": null,
    "isPaused": true,
    "pausePositionSeconds": 183,
    "pendingQueueItemId": null,
    "pendingOverrideReason": null,
    "volumePercent": 100,
    "isMuted": false,
    "queueEndBehavior": 0,
    "spaceQueueItems": [
      {
        "queueItemId": "uuid",
        "trackId": "uuid",
        "trackName": "Evening Chill",
        "position": 1,
        "queueStatus": 1,
        "source": 0,
        "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
        "isReadyToStream": true
      }
    ]
  }
}
```

> Khi `isPaused = true`: `seekOffsetSeconds = null`; tablet dùng `pausePositionSeconds` để hiển thị progress bar và seekTo khi resume.

#### Response `200 OK` — Override pending (đang transcode)

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentQueueItemId": null,
    "currentTrackName": null,
    "hlsUrl": null,
    "moodName": null,
    "isManualOverride": true,
    "overrideMode": 1,
    "startedAtUtc": null,
    "expectedEndAtUtc": null,
    "seekOffsetSeconds": null,
    "isPaused": false,
    "pausePositionSeconds": null,
    "pendingQueueItemId": "uuid-pending-queue-item",
    "pendingOverrideReason": "Manager override — chờ transcode hoàn tất",
    "volumePercent": 100,
    "isMuted": false,
    "queueEndBehavior": 0,
    "spaceQueueItems": []
  }
}
```

> Khi `pendingQueueItemId != null`: UI hiển thị "⏳ Đang chuẩn bị..."; không cố load HLS. Khi transcode xong, server sẽ push `PlayStream` + `SpaceStateSync` với `pendingQueueItemId = null` và `hlsUrl` đầy đủ.

#### Response `200 OK` — Chưa có playlist nào chạy

```json
{
  "isSuccess": true,
  "message": "No playback state found. The space has not started streaming yet.",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentQueueItemId": null,
    "currentTrackName": null,
    "hlsUrl": null,
    "moodName": null,
    "isManualOverride": false,
    "overrideMode": null,
    "startedAtUtc": null,
    "expectedEndAtUtc": null,
    "seekOffsetSeconds": null,
    "isPaused": false,
    "pausePositionSeconds": null,
    "pendingQueueItemId": null,
    "pendingOverrideReason": null,
    "volumePercent": 100,
    "isMuted": false,
    "queueEndBehavior": 0,
    "spaceQueueItems": []
  }
}
```

#### `SpaceStateDto` Field Reference

| Field                   | Kiểu                       | Null? | Mô tả                                                                                              |
| ----------------------- | -------------------------- | :---: | -------------------------------------------------------------------------------------------------- |
| `spaceId`               | `Guid`                     |  ❌   | ID của Space                                                                                       |
| `storeId`               | `Guid`                     |  ❌   | ID của Store chứa Space                                                                            |
| `brandId`               | `Guid`                     |  ❌   | ID của Brand                                                                                       |
| `currentQueueItemId`    | `Guid?`                    |  ✅   | Queue item hiện đang được phát                                                                     |
| `currentTrackName`      | `string?`                  |  ✅   | Tên track hiện đang phát                                                                           |
| `hlsUrl`                | `string?`                  |  ✅   | CloudFront HLS URL (`.m3u8`) — null khi không phát / pending                                       |
| `moodName`              | `string?`                  |  ✅   | Tên mood hiện tại                                                                                  |
| `isManualOverride`      | `bool`                     |  ❌   | `true` khi manager override; `false` khi AI scheduler                                              |
| `overrideMode`          | `int?`                     |  ✅   | `1`=DirectPlaylist, `2`=MoodOverride; null khi AI-driven                                           |
| `startedAtUtc`          | `DateTime?`                |  ✅   | Thời điểm track bắt đầu phát                                                                       |
| `expectedEndAtUtc`      | `DateTime?`                |  ✅   | Thời điểm dự kiến kết thúc                                                                         |
| `seekOffsetSeconds`     | `double?`                  |  ✅   | `(UtcNow − StartedAtUtc).TotalSeconds` — tính tại thời điểm REST call; **null trong SignalR push** |
| `isPaused`              | `bool`                     |  ❌   | `true` khi playback đang pause                                                                     |
| `pausePositionSeconds`  | `int?`                     |  ✅   | Vị trí (giây) khi pause — dùng cho seekTo + progress bar                                           |
| `pendingQueueItemId`    | `Guid?`                    |  ✅   | Queue item đang chờ track sẵn sàng để phát                                                         |
| `pendingOverrideReason` | `string?`                  |  ✅   | Lý do pending (hiển thị cho manager/tablet)                                                        |
| `volumePercent`         | `byte`                     |  ❌   | Gợi ý âm lượng 0-100                                                                               |
| `isMuted`               | `bool`                     |  ❌   | Khi `true` client nên mute output                                                                  |
| `queueEndBehavior`      | `int`                      |  ❌   | `0`=Stop, `1`=RepeatAll, `2`=RepeatOne                                                             |
| `spaceQueueItems`       | `SpaceQueueStateItemDto[]` |  ❌   | Toàn bộ queue items (có thể rỗng)                                                                  |

#### Behavior Notes

- `seekOffsetSeconds = (UtcNow − StartedAtUtc).TotalSeconds` — tính real-time tại thời điểm REST call. Trong **SignalR `SpaceStateSync`**, field này là `null` — client tự tính từ `startedAtUtc`.
- Khi `isPaused = true`: dùng `pausePositionSeconds` thay vì clock-based calculation.
- `hlsUrl` là CloudFront CDN URL (đã build, **không phải** S3 key thô).
- `overrideMode = null` khi AI-driven (không có manual override).
- Xem [SIGNALR_STOREHUB.md — Section 4 & 5](SIGNALR_STOREHUB.md) để biết cách client xử lý từng trạng thái.

---

### 3.5 GET `/api/cams/spaces/pair-device` và GET `/api/cams/spaces/{spaceId}/pair-device` — Get Pair Device Info

Lấy thông tin pair device (tablet) cho một Space, gồm cả info device session (nếu đang pair) và scope Brand/Store.

- **Playback device (role = PlaybackDevice)**:
  - Gọi: `GET /api/cams/spaces/pair-device` (không truyền `spaceId`)
  - Server đọc `SpaceId`, `DeviceSessionId` từ **device session** (claims `space_id`, `device_session_id`)
  - Không cho override SpaceId từ route
- **Manager (BrandManager / StoreManager)**:
  - Gọi: `GET /api/cams/spaces/{spaceId}/pair-device`
  - Chỉ xem được Space thuộc scope Brand/Store của mình

**Auth:**

| Caller                      | Route                                        | Ghi chú                                      |
| --------------------------- | -------------------------------------------- | -------------------------------------------- |
| PlaybackDevice              | `GET /api/cams/spaces/pair-device`           | Không cần `spaceId`, dùng session của device |
| BrandManager / StoreManager | `GET /api/cams/spaces/{spaceId}/pair-device` | Yêu cầu `spaceId` và kiểm tra ownership      |

#### No Request Body

#### Response `200 OK` — Có device đang pair

```json
{
  "isSuccess": true,
  "message": "Paired Device retrieved successfully",
  "data": {
    "spaceId": "00000000-0000-0000-0000-000000000001",
    "storeId": "00000000-0000-0000-0000-000000000010",
    "brandId": "00000000-0000-0000-0000-000000000020",
    "deviceSessionId": "11111111-1111-1111-1111-111111111111",
    "isPlaybackDeviceCaller": true,
    "manufacturer": "Samsung",
    "model": "SM-T510",
    "osVersion": "Android 14",
    "appVersion": "1.0.0",
    "deviceId": "android-id-from-device",
    "pairedAtUtc": "2026-03-13T10:00:00Z",
    "lastActiveAtUtc": "2026-03-13T10:15:30Z"
  }
}
```

#### Response `200 OK` — Chưa có device pair

```json
{
  "isSuccess": true,
  "message": "Paired Device retrieved successfully",
  "data": {
    "spaceId": "00000000-0000-0000-0000-000000000001",
    "storeId": "00000000-0000-0000-0000-000000000010",
    "brandId": "00000000-0000-0000-0000-000000000020",
    "deviceSessionId": null,
    "isPlaybackDeviceCaller": false,
    "manufacturer": null,
    "model": null,
    "osVersion": null,
    "appVersion": null,
    "deviceId": null,
    "pairedAtUtc": null,
    "lastActiveAtUtc": null
  }
}
```

#### Response `400 / 401 / 403 / 404`

- `400` (manager) — thiếu `spaceId` khi gọi route `/spaces/pair-device`.
- `401` — user không hợp lệ hoặc session hết hạn.
- `403` — BrandManager / StoreManager không có quyền trên Space (khác BrandId/StoreId).
- `404` — Space/Store/Brand không tồn tại hoặc đã inactive (mapping từ `EnsureSpaceStoreBrandActiveAsync`).

---

## 4. Pair device (mã pair & unpair)

### 4.1 POST `/api/cams/spaces/{spaceId}/pair-code` — Generate Pair Code

Tạo mã pair 6 ký tự cho Space. Manager hiển thị mã trên màn hình setup; người vận hành tablet nhập mã vào app và gọi **POST /api/auth/pair** để nhận device token.

**Auth:** BrandManager, StoreManager (ownership Space)

#### No Request Body

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Pairing code generated successfully.",
  "data": {
    "code": "ABC123",
    "displayCode": "ABC-123",
    "spaceId": "uuid",
    "spaceName": "Counter Area A",
    "expiresAt": "2026-03-13T10:15:00Z",
    "expiresInSeconds": 900
  }
}
```

| Field              | Mô tả                                                              |
| ------------------ | ------------------------------------------------------------------ |
| `code`             | Mã 6 ký tự (plain) — tablet gửi lên POST /api/auth/pair            |
| `displayCode`      | Mã có dấu gạch (hiển thị trên màn hình)                            |
| `expiresAt`        | UTC hết hạn (mặc định 15 phút, cấu hình PairCode\_\_ExpiryMinutes) |
| `expiresInSeconds` | Số giây còn lại đến lúc hết hạn                                    |

Mã cũ chưa dùng (nếu có) bị vô hiệu hóa. **403** nếu user không có quyền Space; **404** nếu Space không tồn tại.

---

### 4.2 DELETE `/api/cams/spaces/{spaceId}/pair-code` — Revoke Pair Code

Thu hồi mã pair đang active của Space (bảo mật: vô hiệu hóa trước khi hết hạn).

**Auth:** BrandManager, StoreManager

#### No Request Body

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Pairing code revoked successfully."
}
```

**404** nếu không có mã pair nào đang active cho Space.

---

### 4.3 DELETE `/api/cams/spaces/{spaceId}/unpair` — Unpair Device

Hủy pair tablet với Space. Hai cách gọi:

- **Manager (BM/SM):** revoke session của device tại Space — dùng Bearer user token.
- **Playback device:** unpair chính session của mình — dùng Bearer device token; `spaceId` phải = SpaceId của session.

Sau khi unpair, tablet gọi refresh token sẽ nhận **401** và hiện màn hình re-pair.

**Auth:** BrandManager, StoreManager, PlaybackDevice (device chỉ được unpair đúng Space của session)

#### No Request Body

#### Response `200 OK`

```json
{
  "isSuccess": true,
  "message": "Device un-paired successfully. The tablet will be disconnected on its next token refresh."
}
```

**403** — device gọi với `spaceId` khác SpaceId của session.  
**422** — Space không có device session nào active.

---

## 5. SignalR Events (để tham khảo)

Sau khi gọi các API trên, tablet và manager tabs nhận các events sau qua SignalR Hub `StoreHub` (hub URL: `/hubs/store`).

> **Tài liệu đầy đủ (setup code, TypeScript/Dart types, sequence diagrams):** [SIGNALR_STOREHUB.md](SIGNALR_STOREHUB.md)

| Event                  | Trigger                                            | Nhận bởi         | Payload tóm tắt                                                                    |
| ---------------------- | -------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `PlayStream`           | Override thành công (200)                          | Tablet + Manager | `{ spaceId, hlsUrl, transitionType, playlistId, isManualOverride, startedAtUtc }`  |
| `PlayStream`           | Transcode COMPLETE (sau 202)                       | Tablet + Manager | Giống trên; `transitionType=1`                                                     |
| `PlaybackStateChanged` | Bất kỳ lệnh Playback nào (Pause/Resume/Seek/Skip…) | Tablet + Manager | `{ spaceId, command, seekPositionSeconds?, targetTrackId? }`                       |
| `SpaceStateSync`       | **Override** (sau PlayStream)                      | Tablet + Manager | Full `SpaceStateDto` — `isManualOverride=true`, playlist/mood mới                  |
| `SpaceStateSync`       | **CancelOverride**                                 | Tablet + Manager | Full `SpaceStateDto` — `isManualOverride=false`                                    |
| `SpaceStateSync`       | **Bất kỳ lệnh Playback** thành công                | Tablet + Manager | Full `SpaceStateDto` — `isPaused`, `pausePositionSeconds`, `startedAtUtc` cập nhật |
| `StopPlayback`         | AI không tìm được playlist                         | Tablet + Manager | (no payload)                                                                       |

> **`SpaceStateSync` là nguồn sự thật.** Client nên rebuild toàn bộ UI state từ payload này sau mỗi trigger — không cần poll `GET /state`.  
> `PlaybackStateChanged` và `SpaceStateSync` đến gần như đồng thời sau mỗi lệnh: `PlaybackStateChanged` để tablet thực hiện action tức thì; `SpaceStateSync` để confirm DB state và sync manager dashboard.

### Lưu ý `seekOffsetSeconds` trong SignalR vs REST

|                         | `GET /state` (REST)              | `SpaceStateSync` (SignalR)          |
| ----------------------- | -------------------------------- | ----------------------------------- |
| `seekOffsetSeconds`     | ✅ Tính server-side tại lúc call | ❌ Luôn null                        |
| Cách client tính offset | Dùng trực tiếp                   | `(now − startedAtUtc).totalSeconds` |
| Khi `isPaused = true`   | Dùng `pausePositionSeconds`      | Dùng `pausePositionSeconds`         |
