# CAMS — Manager Playback API Documentation

Tài liệu API cho các endpoint **CAMS (Context-Aware AI Music System)** dành cho Manager (BrandManager & StoreManager). Base path: **`/api/cams`**.

> **Postman Collection:** Import [Postman_Collection_CAMS.json](Postman_Collection_CAMS.json)
>
> **SignalR setup (Flutter & Web) + enum contract cho StoreHub events:** xem [SIGNALR_STOREHUB.md](SIGNALR_STOREHUB.md)
>
> **Tham khảo Result pattern, ErrorCodeEnum, RoleEnum:** xem [docs/auth/API_Auth.md](../auth/API_Auth.md)

---

## 1. Authorization Matrix

| Endpoint | BrandManager (own brand/store) | StoreManager (own store) | Tablet / Any Auth |
|---|:---:|:---:|:---:|
| `POST /api/cams/spaces/{spaceId}/override` | ✅ | ✅ | ❌ |
| `DELETE /api/cams/spaces/{spaceId}/override` | ✅ | ✅ | ❌ |
| `POST /api/cams/spaces/{spaceId}/playback` | ✅ | ✅ | ❌ |
| `GET /api/cams/spaces/{spaceId}/state` | ✅ | ✅ | ✅ |

> **Ownership:**
> - **BrandManager** — `user.BrandId` phải khớp với `Space.Store.BrandId` → 403 nếu không chủ sở hữu.
> - **StoreManager** — `user.StoreId` phải khớp với `Space.StoreId` → 403 nếu không chủ sở hữu.

---

## 2. Enum Reference

### `OverrideModeEnum` — serialize bằng số nguyên

| Giá trị | Tên | Mô tả |
|---|---|---|
| `1` | `DirectPlaylist` | Manager chọn playlist cụ thể |
| `2` | `MoodOverride` | Manager ép mood; hệ thống tự chọn playlist tốt nhất |

### `TransitionTypeEnum` — serialize bằng số nguyên

| Giá trị | Tên | Mô tả |
|---|---|---|
| `1` | `Immediate` | Hard switch ngay (DirectPlaylist) |
| `2` | `Crossfade` | Fade mượt (MoodOverride — tablet xử lý) |
| `3` | `Pending` | Playlist đang transcode; stream tự bắt đầu khi hoàn tất |

### `PlaybackCommandEnum` — serialize bằng số nguyên

| Giá trị | Tên | `SeekPositionSeconds` | `TargetTrackId` |
|---|---|---|---|
| `1` | `Pause` | Không dùng | Không dùng |
| `2` | `Resume` | Không dùng | Không dùng |
| `3` | `Seek` | Vị trí tuyệt đối (giây) | Không dùng |
| `4` | `SeekForward` | Delta tua tới (giây) | Không dùng |
| `5` | `SeekBackward` | Delta tua lùi (giây) | Không dùng |
| `6` | `SkipNext` | Server điền | Server điền |
| `7` | `SkipPrevious` | Server điền | Không dùng |
| `8` | `SkipToTrack` | Server điền | **Bắt buộc** |

> ⚠️ **FE phải khai báo TypeScript/Dart enum với giá trị tường minh** — xem [SIGNALR_STOREHUB.md](SIGNALR_STOREHUB.md) cho enum contract đầy đủ kèm ví dụ code.

---

## 3. Endpoints

---

### 3.1 POST `/api/cams/spaces/{spaceId}/override` — Override Space Music

Override nhạc đang chạy tại một Space. Có 2 mode, **chính xác 1 trong 2** phải được cung cấp.

**Auth:** `BrandManager`, `StoreManager` (ownership required)

#### Request Body

```json
{
  "playlistId": "uuid-hoặc-null",
  "moodId": "uuid-hoặc-null",
  "reason": "string tùy chọn, tối đa 500 ký tự"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|:---:|---|
| `playlistId` | `Guid?` | Mode 1 | ID playlist cụ thể muốn stream ngay |
| `moodId` | `Guid?` | Mode 2 | ID mood; hệ thống tự chọn playlist tốt nhất |
| `reason` | `string?` | ❌ | Lý do override (audit trail + UI display) |

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
  "errors": ["Phải cung cấp đúng một trong hai: PlaylistId hoặc MoodId, không được cung cấp cả hai hoặc thiếu cả hai."]
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

### 3.2 DELETE `/api/cams/spaces/{spaceId}/override` — Cancel Override

Hủy override thủ công. Hangfire AI scheduling tự động tiếp quản trong vòng ~60 giây.

**Auth:** `BrandManager`, `StoreManager` (ownership required)

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

### 3.3 POST `/api/cams/spaces/{spaceId}/playback` — Send Playback Command

Gửi lệnh điều khiển playback đến tablet và tất cả manager browser tabs đang xem Space đó (broadcast qua SignalR group).

**Auth:** `BrandManager`, `StoreManager` (ownership required)

#### Request Body

```json
{
  "command": 8,
  "seekPositionSeconds": null,
  "targetTrackId": "uuid-cua-track-can-nhay-den"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `command` | `int` (PlaybackCommandEnum) | Lệnh cần thực thi (xem bảng enum Section 2) |
| `seekPositionSeconds` | `double?` | Giây — absolute cho Seek, delta cho SeekForward/Backward. Null với Pause/Resume/Skip* |
| `targetTrackId` | `Guid?` | **Bắt buộc** khi `command = 8` (SkipToTrack) |

#### Xử lý server-side theo từng Command

| Command | Server làm gì | Relay tới SignalR |
|---|---|---|
| `Pause (1)` | `IsPaused=true`, `PausePositionSeconds=(now−StartedAtUtc)` | `{ command:1 }` |
| `Resume (2)` | `StartedAtUtc=now−PausePos`, `IsPaused=false` | `{ command:2 }` |
| `Seek (3)` | Cập nhật `StartedAtUtc` / `PausePositionSeconds` | `{ command:3, seekPositionSeconds:N }` |
| `SeekForward (4)` | `currentPos+delta` → tính absolute | `{ command:4, seekPositionSeconds:<absolute> }` |
| `SeekBackward (5)` | `max(0, currentPos-delta)` → tính absolute | `{ command:5, seekPositionSeconds:<absolute> }` |
| `SkipNext (6)` | Tính offset track kế, loop về đầu nếu hết | `{ command:6, seekPositionSeconds:<offset>, targetTrackId }` |
| `SkipPrevious (7)` | > 5s: restart current; ≤ 5s: track trước | `{ command:7, seekPositionSeconds:<offset> }` |
| `SkipToTrack (8)` | Tính cumulative offset đến `TargetTrackId` | `{ command:3, seekPositionSeconds:<offset>, targetTrackId }` |

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

### 3.4 GET `/api/cams/spaces/{spaceId}/state` — Get Space Playback State

Lấy snapshot trạng thái phát nhạc của một Space. Dùng cho:
- Tablet sau khi reconnect SignalR → `seekTo(SeekOffsetSeconds)` để không restart từ đầu.
- Manager dashboard khi load trang / re-focus tab.

**Auth:** Bất kỳ user đã xác thực (tablet, manager, admin)

#### No Request Body

#### Response `200 OK` — Đang streaming

```json
{
  "isSuccess": true,
  "message": "Success.",
  "data": {
    "spaceId": "uuid",
    "currentPlaylistId": "uuid",
    "currentPlaylistName": "Evening Chill",
    "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
    "moodName": "Chill",
    "isManualOverride": true,
    "overrideMode": 1,
    "startedAtUtc": "2026-03-08T10:00:00Z",
    "expectedEndAtUtc": "2026-03-08T11:30:00Z",
    "seekOffsetSeconds": 342.5
  }
}
```

#### Response `200 OK` — Chưa có playlist nào chạy

```json
{
  "isSuccess": true,
  "message": "No playback state found for this Space.",
  "data": {
    "spaceId": "uuid",
    "currentPlaylistId": null,
    "currentPlaylistName": null,
    "hlsUrl": null,
    "moodName": null,
    "isManualOverride": false,
    "overrideMode": null,
    "startedAtUtc": null,
    "expectedEndAtUtc": null,
    "seekOffsetSeconds": null
  }
}
```

#### Behavior Notes

- `SeekOffsetSeconds = (UtcNow − StartedAtUtc).TotalSeconds` — tính real-time tại thời điểm call.
- `hlsUrl` là CloudFront CDN URL (đã build, **không phải** S3 key thô).
- `overrideMode = null` khi AI-driven (không có manual override).

---

## 4. SignalR Events (để tham khảo)

Sau khi gọi các API trên, tablet và manager tabs nhận các events sau qua SignalR Hub `StoreHub`:

| Event | Trigger | Payload |
|---|---|---|
| `PlayStream` | Override thành công (200) | `{ spaceId, hlsUrl, transitionType, playlistId, startedAtUtc }` |
| `PlayStream` | Transcode COMPLETE (sau 202) | Giống trên |
| `PlaybackStateChanged` | Bất kỳ lệnh playback nào | `{ command, seekPositionSeconds?, targetTrackId? }` |
| `SpaceStateSync` | Cancel override | Full `SpaceStateDto` |
