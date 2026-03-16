# CAMS — Manager Playback API Documentation

Tài liệu API cho các endpoint **CAMS (Context-Aware AI Music System)** dành cho Manager (BrandManager & StoreManager). Base path: **`/api/cams`**.

> **Postman Collection:** Import [Postman_Collection_CAMS.json](Postman_Collection_CAMS.json)
>
> **SignalR setup (Flutter & Web) + enum contract cho StoreHub events:** xem [SIGNALR_STOREHUB.md](SIGNALR_STOREHUB.md)
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md)

---

## 1. Authorization Matrix

| Endpoint                                                          | BrandManager (own brand/store) | StoreManager (own store) |                        PlaybackDevice (scope = Space của session)                        |
| ----------------------------------------------------------------- | :----------------------------: | :----------------------: | :--------------------------------------------------------------------------------------: |
| `POST /api/cams/spaces/override` / `/spaces/{spaceId}/override`   |               ✅               |            ✅            |    ✅ (không cần spaceId — server lấy từ session; nếu truyền phải = SpaceId session)     |
| `DELETE /api/cams/spaces/override` / `/spaces/{spaceId}/override` |               ✅               |            ✅            |    ✅ (không cần spaceId — server lấy từ session; nếu truyền phải = SpaceId session)     |
| `POST /api/cams/spaces/playback` / `/spaces/{spaceId}/playback`   |               ✅               |            ✅            |    ✅ (không cần spaceId — server lấy từ session; nếu truyền phải = SpaceId session)     |
| `GET /api/cams/spaces/state`                                      |               —                |            —             |                ✅ (không truyền spaceId; server dùng SpaceId của session)                |
| `GET /api/cams/spaces/{spaceId}/state`                            |               ✅               |            ✅            | ✅ (chỉ khi `spaceId` = SpaceId của device session; nếu không truyền thì gọi route trên) |
| `POST /api/cams/spaces/{spaceId}/pair-code`                       |               ✅               |            ✅            |                                 ❌ (chỉ manager tạo mã)                                  |
| `DELETE /api/cams/spaces/{spaceId}/pair-code`                     |               ✅               |            ✅            |                               ❌ (chỉ manager thu hồi mã)                                |
| `DELETE /api/cams/spaces/{spaceId}/unpair`                        |               ✅               |            ✅            |                           ✅ (unpair chính session của device)                           |

> **Ownership:**
>
> - **BrandManager** — `user.BrandId` phải khớp với `Space.Store.BrandId` → 403 nếu không chủ sở hữu.
> - **StoreManager** — `user.StoreId` phải khớp với `Space.StoreId` → 403 nếu không chủ sở hữu.
> - **PlaybackDevice** — tablet đã pair với **một Space duy nhất**; chỉ được truy cập đúng SpaceId của session. CAMS: có thể gọi `GET .../spaces/state` (không truyền spaceId) hoặc `GET .../spaces/{spaceId}/state` với `spaceId` = session; user (BM/SM) **bắt buộc** truyền `spaceId` khi gọi GET state. Ngoài CAMS, device được **GET** `/api/playlists`, `/api/playlists/{id}`, **GET** `/api/spaces/{id}` (chỉ đúng SpaceId của session; **không** được GET danh sách spaces), **GET** `/api/tracks`, `/api/tracks/{id}` (chỉ đọc, scope Brand của Store session); không được CUD playlists/tracks/spaces.

---

## 2. Enum Reference

### `OverrideModeEnum` — serialize bằng số nguyên

| Giá trị | Tên              | Mô tả                                               |
| ------- | ---------------- | --------------------------------------------------- |
| `1`     | `DirectPlaylist` | Manager chọn playlist cụ thể                        |
| `2`     | `MoodOverride`   | Manager ép mood; hệ thống tự chọn playlist tốt nhất |

### `TransitionTypeEnum` — serialize bằng số nguyên

| Giá trị | Tên         | Mô tả                                                   |
| ------- | ----------- | ------------------------------------------------------- |
| `1`     | `Immediate` | Hard switch ngay (DirectPlaylist)                       |
| `2`     | `Crossfade` | Fade mượt (MoodOverride — tablet xử lý)                 |
| `3`     | `Pending`   | Playlist đang transcode; stream tự bắt đầu khi hoàn tất |

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

> ⚠️ **FE phải khai báo TypeScript/Dart enum với giá trị tường minh** — xem [SIGNALR_STOREHUB.md](SIGNALR_STOREHUB.md) cho enum contract đầy đủ kèm ví dụ code.

---

## 3. Endpoints

---

### 3.1 POST `/api/cams/spaces/override` và POST `/api/cams/spaces/{spaceId}/override` — Override Space Music

Override nhạc đang chạy tại một Space. Có 2 mode, **chính xác 1 trong 2** phải được cung cấp.

**Auth:** `BrandManager`, `StoreManager`, `PlaybackDevice`

- **PlaybackDevice:** gọi `POST /api/cams/spaces/override` **không cần `spaceId`** — server dùng SpaceId từ device session; nếu gọi route có `{spaceId}` thì giá trị phải khớp với SpaceId của session.
- **Manager (BM/SM):** phải chỉ định `spaceId` (route `/spaces/{spaceId}/override`) và phải có quyền trên Space đó.

#### Request Body

```json
{
  "playlistId": "uuid-hoặc-null",
  "moodId": "uuid-hoặc-null",
  "reason": "string tùy chọn, tối đa 500 ký tự"
}
```

| Field        | Type      | Bắt buộc | Mô tả                                       |
| ------------ | --------- | :------: | ------------------------------------------- |
| `playlistId` | `Guid?`   |  Mode 1  | ID playlist cụ thể muốn stream ngay         |
| `moodId`     | `Guid?`   |  Mode 2  | ID mood; hệ thống tự chọn playlist tốt nhất |
| `reason`     | `string?` |    ❌    | Lý do override (audit trail + UI display)   |

> **Validation:** `playlistId` và `moodId` **không được cùng tồn tại và không được cùng thiếu** — phải cung cấp đúng 1 trong 2.

#### Response `200 OK` — Override thành công (HLS sẵn sàng)

```json
{
  "isSuccess": true,
  "message": "Override applied successfully.",
  "data": {
    "spaceId": "uuid",
    "playlistId": "uuid",
    "playlistName": "Evening Chill",
    "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
    "moodName": "Chill",
    "overrideMode": 1,
    "isManualOverride": true,
    "startedAtUtc": "2026-03-08T10:00:00Z",
    "expectedEndAtUtc": "2026-03-08T11:30:00Z",
    "transitionType": 1
  }
}
```

#### Response `202 Accepted` — Playlist đang transcode

Khi playlist chưa có HLS URL (chưa transcode hoặc đang process), hệ thống tự động queue transcode và trả 202. Tablet sẽ tự nhận `PlayStream` SignalR khi transcode hoàn tất — **manager không cần thao tác thêm**.

```json
{
  "isSuccess": true,
  "message": "Đang khởi tạo transcode. Streaming sẽ tự bắt đầu khi hoàn tất.",
  "data": {
    "spaceId": "uuid",
    "playlistId": "uuid",
    "playlistName": "Morning Beats",
    "hlsUrl": null,
    "overrideMode": 1,
    "isManualOverride": true,
    "startedAtUtc": "0001-01-01T00:00:00Z",
    "transitionType": 3
  }
}
```

#### Response `400 Bad Request` — Validation lỗi

```json
{
  "isSuccess": false,
  "message": "Validation failed.",
  "errors": [
    "Phải cung cấp đúng một trong hai: PlaylistId hoặc MoodId, không được cung cấp cả hai hoặc thiếu cả hai."
  ]
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

- Khi override active, **Hangfire `PlaylistTransitionJob` bỏ qua Space này** — không có AI scheduling.
- Mode 2 (`MoodOverride`): hệ thống dùng **sliding-window algorithm** để tránh lặp lại playlist vừa phát.
- Override được audit log vào bảng `audit_logs` với `action = 'Override'`.
- Sau override thành công (200): `playback_histories` ghi một bản ghi với `trigger_type = 0` (Manual).

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
  "message": "Override cancelled. AI scheduling resumed."
}
```

#### Response `422 Unprocessable Entity` — Không có override active

```json
{
  "isSuccess": false,
  "message": "Không có override nào đang active cho Space này.",
  "errorCode": "BusinessRuleViolation"
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

| Field                 | Type                        | Mô tả                                                                                  |
| --------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| `command`             | `int` (PlaybackCommandEnum) | Lệnh cần thực thi (xem bảng enum Section 2)                                            |
| `seekPositionSeconds` | `double?`                   | Giây — absolute cho Seek, delta cho SeekForward/Backward. Null với Pause/Resume/Skip\* |
| `targetTrackId`       | `Guid?`                     | **Bắt buộc** khi `command = 8` (SkipToTrack)                                           |

#### Xử lý server-side theo từng Command

| Command            | Server làm gì                                              | Relay tới SignalR                                            |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `Pause (1)`        | `IsPaused=true`, `PausePositionSeconds=(now−StartedAtUtc)` | `{ command:1 }`                                              |
| `Resume (2)`       | `StartedAtUtc=now−PausePos`, `IsPaused=false`              | `{ command:2 }`                                              |
| `Seek (3)`         | Cập nhật `StartedAtUtc` / `PausePositionSeconds`           | `{ command:3, seekPositionSeconds:N }`                       |
| `SeekForward (4)`  | `currentPos+delta` → tính absolute                         | `{ command:4, seekPositionSeconds:<absolute> }`              |
| `SeekBackward (5)` | `max(0, currentPos-delta)` → tính absolute                 | `{ command:5, seekPositionSeconds:<absolute> }`              |
| `SkipNext (6)`     | Tính offset track kế, loop về đầu nếu hết                  | `{ command:6, seekPositionSeconds:<offset>, targetTrackId }` |
| `SkipPrevious (7)` | > 5s: restart current; ≤ 5s: track trước                   | `{ command:7, seekPositionSeconds:<offset> }`                |
| `SkipToTrack (8)`  | Tính cumulative offset đến `TargetTrackId`                 | `{ command:3, seekPositionSeconds:<offset>, targetTrackId }` |

> **SkipToTrack relay:** Server relay lại với `command=3` (Seek) kèm absolute offset — tablet dùng `seekTo(seekPositionSeconds)` trực tiếp.

> **SkipToTrack fallback:** Nếu `ActualDurationSec = null` (chưa transcode), server fallback về `Track.DurationSec` (metadata). Seek là xấp xỉ.

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
- Command ngoài range `1–8` bị reject tại `StoreHub` **trước** khi đến handler.

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
  "message": "Success.",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentPlaylistId": "uuid",
    "currentPlaylistName": "Evening Chill",
    "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
    "moodName": "Chill",
    "isManualOverride": true,
    "overrideMode": 1,
    "startedAtUtc": "2026-03-08T10:00:00Z",
    "expectedEndAtUtc": "2026-03-08T11:30:00Z",
    "seekOffsetSeconds": 342.5,
    "isPaused": false,
    "pausePositionSeconds": null,
    "pendingPlaylistId": null,
    "pendingOverrideReason": null
  }
}
```

#### Response `200 OK` — Đang pause

```json
{
  "isSuccess": true,
  "message": "Success.",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentPlaylistId": "uuid",
    "currentPlaylistName": "Evening Chill",
    "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
    "moodName": "Chill",
    "isManualOverride": false,
    "overrideMode": null,
    "startedAtUtc": "2026-03-08T10:00:00Z",
    "expectedEndAtUtc": null,
    "seekOffsetSeconds": null,
    "isPaused": true,
    "pausePositionSeconds": 183,
    "pendingPlaylistId": null,
    "pendingOverrideReason": null
  }
}
```

> Khi `isPaused = true`: `seekOffsetSeconds = null`; tablet dùng `pausePositionSeconds` để hiển thị progress bar và seekTo khi resume.

#### Response `200 OK` — Override pending (đang transcode)

```json
{
  "isSuccess": true,
  "message": "Success.",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentPlaylistId": null,
    "currentPlaylistName": null,
    "hlsUrl": null,
    "moodName": null,
    "isManualOverride": true,
    "overrideMode": 1,
    "startedAtUtc": null,
    "expectedEndAtUtc": null,
    "seekOffsetSeconds": null,
    "isPaused": false,
    "pausePositionSeconds": null,
    "pendingPlaylistId": "uuid-playlist-dang-transcode",
    "pendingOverrideReason": "Manager override — chờ transcode hoàn tất"
  }
}
```

> Khi `pendingPlaylistId ≠ null`: UI hiển thị "⏳ Đang chuẩn bị..."; không cố load HLS. Khi transcode xong, server sẽ push `PlayStream` + `SpaceStateSync` với `pendingPlaylistId = null` và `hlsUrl` đầy đủ.

#### Response `200 OK` — Chưa có playlist nào chạy

```json
{
  "isSuccess": true,
  "message": "No playback state found for this Space.",
  "data": {
    "spaceId": "uuid",
    "storeId": "uuid",
    "brandId": "uuid",
    "currentPlaylistId": null,
    "currentPlaylistName": null,
    "hlsUrl": null,
    "moodName": null,
    "isManualOverride": false,
    "overrideMode": null,
    "startedAtUtc": null,
    "expectedEndAtUtc": null,
    "seekOffsetSeconds": null,
    "isPaused": false,
    "pausePositionSeconds": null,
    "pendingPlaylistId": null,
    "pendingOverrideReason": null
  }
}
```

#### `SpaceStateDto` Field Reference

| Field                   | Kiểu        | Null? | Mô tả                                                                                              |
| ----------------------- | ----------- | :---: | -------------------------------------------------------------------------------------------------- |
| `spaceId`               | `Guid`      |  ❌   | ID của Space                                                                                       |
| `storeId`               | `Guid`      |  ❌   | ID của Store chứa Space                                                                            |
| `brandId`               | `Guid`      |  ❌   | ID của Brand                                                                                       |
| `currentPlaylistId`     | `Guid?`     |  ✅   | Playlist đang phát                                                                                 |
| `currentPlaylistName`   | `string?`   |  ✅   | Tên playlist đang phát                                                                             |
| `hlsUrl`                | `string?`   |  ✅   | CloudFront HLS URL (`.m3u8`) — null khi không phát / pending                                       |
| `moodName`              | `string?`   |  ✅   | Tên mood hiện tại                                                                                  |
| `isManualOverride`      | `bool`      |  ❌   | `true` khi manager override; `false` khi AI scheduler                                              |
| `overrideMode`          | `int?`      |  ✅   | `1`=DirectPlaylist, `2`=MoodOverride; null khi AI-driven                                           |
| `startedAtUtc`          | `DateTime?` |  ✅   | Thời điểm playlist bắt đầu phát                                                                    |
| `expectedEndAtUtc`      | `DateTime?` |  ✅   | Thời điểm dự kiến kết thúc                                                                         |
| `seekOffsetSeconds`     | `double?`   |  ✅   | `(UtcNow − StartedAtUtc).TotalSeconds` — tính tại thời điểm REST call; **null trong SignalR push** |
| `isPaused`              | `bool`      |  ❌   | `true` khi playback đang pause                                                                     |
| `pausePositionSeconds`  | `int?`      |  ✅   | Vị trí (giây) khi pause — dùng cho seekTo + progress bar                                           |
| `pendingPlaylistId`     | `Guid?`     |  ✅   | Playlist đang chờ transcode; null khi không pending                                                |
| `pendingOverrideReason` | `string?`   |  ✅   | Lý do pending (hiển thị cho manager/tablet)                                                        |

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
  "message": "Success.",
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
  "message": "Success.",
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
  "message": "Pair code generated.",
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
  "message": "Pair code revoked."
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
  "message": "Device unpaired successfully."
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
