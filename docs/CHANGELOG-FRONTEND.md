# API Changelog — Frontend & Mobile

> Các thay đổi API ảnh hưởng đến Frontend (React TypeScript) và Mobile (Flutter).  
> **Quy ước:** Mỗi section = 1 PR merge. Section đầu tiên là `[Unreleased]` = thay đổi chưa merge vào `develop`.  
> **So sánh nhanh:** `git log develop..HEAD --oneline`

---

## [2026-03-23] Commit fb68e92baa3 — Docs & API changes impacting Frontend

> Tóm tắt thay đổi quan trọng ảnh hưởng tới Frontend (React TypeScript) và Mobile (Flutter):

- **Tracks**: `audioUrl` → `hlsUrl` (.m3u8) trong response/examples; thêm endpoint per-track `POST /api/tracks/{id}/retranscode` (playlist-level retranscode đã chuyển sang track-level); cập nhật business rule: không thể xóa track nếu còn tồn tại trong playlists hoặc space queues.
- **Playlists**: loại bỏ các trường playlist-level không còn dùng (`isDynamic`, playlist `hlsUrl`, `totalDurationSeconds`); mỗi track trong playlist giờ chứa `hlsUrl` + `seekOffsetSeconds` (dùng để SkipToTrack); playlist-level retranscode bị loại bỏ.
- **CAMS API**: thay đổi lớn về queue model — thêm/chuẩn hoá endpoints quản lý queue (`POST /api/cams/spaces/queue/tracks`, `POST /api/cams/spaces/queue/playlist`, `PATCH /api/cams/spaces/queue/reorder`, `DELETE /api/cams/spaces/queue/all`, v.v.) và `PATCH /api/cams/spaces/state/audio` (volume/mute/queueEndBehavior); Override API hỗ trợ `trackIds` và cờ `isClearManagerSelectedQueues`.
- **SignalR / StoreHub**: `SpaceStateSync` thay đổi schema: `currentPlaylistId`/`currentPlaylistName` → `currentQueueItemId`/`currentTrackName`; thêm `pendingQueueItemId`, `volumePercent`, `isMuted`, `queueEndBehavior`, `spaceQueueItems[]` (new DTO); thêm enum `TrackEnded`; thay đổi semantics của Skip/Seek (SignalR push có thể có `seekOffsetSeconds = null` — frontend phải compute từ `startedAtUtc`).

**Hành động frontend (recommended):**

- Cập nhật TypeScript/Dart models và serializers theo tài liệu: [docs/tracks/API_Tracks.md](docs/tracks/API_Tracks.md), [docs/playlists/API_Playlists.md](docs/playlists/API_Playlists.md), [docs/cams/API_CAMS.md](docs/cams/API_CAMS.md), [docs/cams/SIGNALR_STOREHUB.md](docs/cams/SIGNALR_STOREHUB.md).
- Player logic: khi SignalR push có `seekOffsetSeconds = null` tính offset từ `startedAtUtc`; hiển thị trạng thái "⏳ Đang chuẩn bị" khi `pendingQueueItemId` ≠ null; áp dụng `volumePercent`/`isMuted` từ `SpaceStateSync`.
- Tích hợp lại flow retranscode: thay vì playlist-level, gọi `POST /api/tracks/{id}/retranscode` khi cần force re-transcode.
- Kiểm tra flows liên quan tới xóa track/playlist vì rules giờ tính cả space queues.

Commit tham khảo: `fb68e92baa3236600c6bba53f1ee40f5bf8a39e7` — xem diff đầy đủ trong git để chi tiết.

## [2026-03-16] PR #26 — Device pairing, PlaybackDevice access & SpaceState sync

> **Branch:** `feature/nam` → `develop`

**Tài liệu API liên quan:**

- 📄 Auth: [docs/auth/API_Auth.md](auth/API_Auth.md) — Section 4.6, 4.7, 4.8 (device pair/refresh/unpair)
- 📄 CAMS: [docs/cams/API_CAMS.md](cams/API_CAMS.md) — Section 3, 4, 5 (state/pair/signalR)
- 📄 Spaces: [docs/spaces/API_Spaces.md](spaces/API_Spaces.md) — Section 2.2 (PlaybackDevice optional id)
- 📄 Playlists: [docs/playlists/API_Playlists.md](playlists/API_Playlists.md) — Section 1 (auth matrix PlaybackDevice)
- 📄 Tracks: [docs/tracks/API_Tracks.md](tracks/API_Tracks.md) — Section 1 (auth matrix PlaybackDevice)
- 📄 SignalR: [docs/cams/SIGNALR_STOREHUB.md](cams/SIGNALR_STOREHUB.md) — Section 4 & 5 (SpaceStateDto schema + state sync lifecycle)

---

### 🆕 Role mới: `PlaybackDevice` (value = `3`)

`RoleEnum` được bổ sung thêm một role:

```
SystemAdmin    = 0
BrandManager   = 1
StoreManager   = 2
PlaybackDevice = 3  ← MỚI
```

Tablet sau khi pair thành công nhận JWT với role `PlaybackDevice`. Token này **khác hoàn toàn** với user JWT — không dùng chung flow refresh. Tất cả API có auth matrix cần cập nhật để nhận biết role này.

---

### 🆕 Auth API — Device token flow (chỉ dành cho PlaybackDevice)

> 📄 Tài liệu đầy đủ: [API_Auth.md — Section 4.6, 4.7, 4.8](auth/API_Auth.md)

> ⚠️ `POST /api/auth/devices/refresh` **chỉ dành cho role `PlaybackDevice`**. User thông thường (BM/SM/SA) vẫn dùng flow refresh cũ (`/api/auth/refresh-token` qua HTTP-only cookie). Hai flow này hoàn toàn tách biệt.

| Method   | Endpoint                    | Auth                           | Mô tả                                                                           |
| -------- | --------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `POST`   | `/api/auth/pair`            | Header `X-Pair-Code: <6-char>` | Pair tablet → nhận `deviceAccessToken` + `deviceRefreshToken`                   |
| `POST`   | `/api/auth/devices/refresh` | —                              | Làm mới `deviceAccessToken` bằng `deviceRefreshToken` (**PlaybackDevice only**) |
| `DELETE` | `/api/auth/devices/unpair`  | Bearer `deviceAccessToken`     | Hủy ghép đôi, revoke session                                                    |

#### `POST /api/auth/pair`

```json
// Request
{ "code": "ABC123", "manufacturer": "Samsung", "model": "Galaxy Tab A8", "osVersion": "Android 13", "appVersion": "1.0.0" }

// Response 200
{
  "data": {
    "deviceAccessToken": "<JWT — role=PlaybackDevice>",
    "deviceRefreshToken": "<opaque token>",
    "expiresAt": "2026-03-15T15:00:00Z",
    "deviceSessionId": "<Guid>",
    "spaceId": "<Guid>"
  }
}
```

#### `POST /api/auth/devices/refresh`

```json
// Request
{ "deviceRefreshToken": "<opaque token>" }

// Response 200
{ "data": { "deviceAccessToken": "<JWT mới>", "expiresAt": "..." } }
```

---

### 🆕 CAMS API — Pair Code & Device Info (Manager)

> 📄 Tài liệu đầy đủ: [API_CAMS.md — Section 4 (pair code), Section 3.5 (pair-device info)](cams/API_CAMS.md)

| Method   | Endpoint                               | Auth                                                       | Mô tả                            |
| -------- | -------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| `POST`   | `/api/cams/spaces/{spaceId}/pair-code` | BM, SM                                                     | Tạo mã 6 ký tự, hiệu lực 15 phút |
| `DELETE` | `/api/cams/spaces/{spaceId}/pair-code` | BM, SM                                                     | Thu hồi mã trước khi hết hạn     |
| `GET`    | `/api/cams/spaces/pair-device`         | BM, SM (truyền `?spaceId=`), PlaybackDevice (không truyền) | Thông tin device đang pair       |
| `DELETE` | `/api/cams/spaces/{spaceId}/unpair`    | BM, SM, PlaybackDevice                                     | Hủy session device               |

`POST /api/cams/spaces/{spaceId}/pair-code` → `{ "data": { "code": "A3F9K2", "displayCode": "A3F-9K2", "expiresAt": "...", "expiresInSeconds": 900 } }`

---

### 🔄 Dual route — PlaybackDevice không cần truyền `spaceId`

> 📄 Tài liệu đầy đủ: [API_CAMS.md — Section 1 (auth matrix), Section 3.1–3.4](cams/API_CAMS.md) | [API_Spaces.md — Section 2.2](spaces/API_Spaces.md)

PlaybackDevice lấy `spaceId` từ JWT session — không cần truyền trên route. Manager vẫn bắt buộc truyền `{spaceId}`.

| Endpoint        | PlaybackDevice                     | Manager (BM/SM)                              |
| --------------- | ---------------------------------- | -------------------------------------------- |
| Override        | `POST /api/cams/spaces/override`   | `POST /api/cams/spaces/{spaceId}/override`   |
| Cancel Override | `DELETE /api/cams/spaces/override` | `DELETE /api/cams/spaces/{spaceId}/override` |
| Playback        | `POST /api/cams/spaces/playback`   | `POST /api/cams/spaces/{spaceId}/playback`   |
| Get State       | `GET /api/cams/spaces/state`       | `GET /api/cams/spaces/{spaceId}/state`       |
| Get Space       | `GET /api/spaces` (no id)          | `GET /api/spaces/{id}`                       |

---

### 🔄 Tracks & Playlists — `+PlaybackDevice` read-only

> 📄 Tài liệu đầy đủ: [API_Tracks.md — Section 1 (auth matrix)](tracks/API_Tracks.md) | [API_Playlists.md — Section 1 (auth matrix)](playlists/API_Playlists.md)

`GET /api/tracks`, `GET /api/tracks/{id}`, `GET /api/playlists`, `GET /api/playlists/{id}` — thêm role `PlaybackDevice` (scope: brand của space đang pair, read-only).

---

### 🔔 SignalR — `SpaceStateSync` mở rộng trigger + fields mới

> 📄 Tài liệu đầy đủ: [SIGNALR_STOREHUB.md — Section 4 (SpaceStateDto schema), Section 5 (lifecycle, decision tree, sequence diagrams)](cams/SIGNALR_STOREHUB.md)

**Trigger thay đổi** — `SpaceStateSync` giờ bắn sau **mọi** thay đổi state:

| Trigger                         | Trước PR #26 |      Sau PR #26       |
| ------------------------------- | :----------: | :-------------------: |
| Override                        |      ❌      | ✅ (sau `PlayStream`) |
| CancelOverride                  | ✅ (partial) |       ✅ (full)       |
| Pause / Resume / Seek / Skip    |      ❌      |          ✅           |
| No-op (e.g. Pause khi đã Pause) |      —       |     ❌ Không push     |

**`SpaceStateDto` — 6 fields mới:**

**TypeScript (React):**

```ts
interface SpaceStateDto {
  // --- EXISTING (không đổi) ---
  spaceId: string;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  hlsUrl: string | null;
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: number | null; // 1=DirectPlaylist, 2=MoodOverride
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null; // REST only; null trong SignalR push

  // --- NEW ---
  storeId: string;
  brandId: string;
  isPaused: boolean; // true khi đang pause
  pausePositionSeconds: number | null; // vị trí (giây) khi pause
  pendingPlaylistId: string | null; // ≠ null khi override đang transcode
  pendingOverrideReason: string | null;
}

// Helper — dùng cho cả REST response và SignalR push
function getEffectiveSeekOffset(state: SpaceStateDto): number {
  if (state.isPaused) return state.pausePositionSeconds ?? 0;
  if (state.seekOffsetSeconds != null) return state.seekOffsetSeconds;
  if (!state.startedAtUtc) return 0;
  return (Date.now() - new Date(state.startedAtUtc).getTime()) / 1000;
}
```

**Dart (Flutter):**

```dart
class SpaceStateDto {
  // --- EXISTING (không đổi) ---
  final String spaceId;
  final String? currentPlaylistId;
  final String? currentPlaylistName;
  final String? hlsUrl;
  final String? moodName;
  final bool isManualOverride;
  final int? overrideMode;          // 1=DirectPlaylist, 2=MoodOverride
  final DateTime? startedAtUtc;
  final DateTime? expectedEndAtUtc;
  final double? seekOffsetSeconds;  // REST only; null trong SignalR push

  // --- NEW ---
  final String storeId;
  final String brandId;
  final bool isPaused;
  final int? pausePositionSeconds;  // vị trí (giây) khi pause
  final String? pendingPlaylistId;  // ≠ null khi override đang transcode
  final String? pendingOverrideReason;

  const SpaceStateDto({
    required this.spaceId,
    required this.storeId,          // NEW
    required this.brandId,          // NEW
    this.currentPlaylistId,
    this.currentPlaylistName,
    this.hlsUrl,
    this.moodName,
    required this.isManualOverride,
    this.overrideMode,
    this.startedAtUtc,
    this.expectedEndAtUtc,
    this.seekOffsetSeconds,
    required this.isPaused,         // NEW
    this.pausePositionSeconds,      // NEW
    this.pendingPlaylistId,         // NEW
    this.pendingOverrideReason,     // NEW
  });

  factory SpaceStateDto.fromJson(Map<String, dynamic> json) => SpaceStateDto(
    spaceId:              json['spaceId'] as String,
    storeId:              json['storeId'] as String,
    brandId:              json['brandId'] as String,
    currentPlaylistId:    json['currentPlaylistId'] as String?,
    currentPlaylistName:  json['currentPlaylistName'] as String?,
    hlsUrl:               json['hlsUrl'] as String?,
    moodName:             json['moodName'] as String?,
    isManualOverride:     json['isManualOverride'] as bool,
    overrideMode:         json['overrideMode'] as int?,
    startedAtUtc:         json['startedAtUtc'] != null
        ? DateTime.parse(json['startedAtUtc'] as String) : null,
    expectedEndAtUtc:     json['expectedEndAtUtc'] != null
        ? DateTime.parse(json['expectedEndAtUtc'] as String) : null,
    seekOffsetSeconds:    (json['seekOffsetSeconds'] as num?)?.toDouble(),
    isPaused:             json['isPaused'] as bool? ?? false,
    pausePositionSeconds: json['pausePositionSeconds'] as int?,
    pendingPlaylistId:    json['pendingPlaylistId'] as String?,
    pendingOverrideReason: json['pendingOverrideReason'] as String?,
  );

  /// Tính seek offset thực tế — dùng cho cả REST response và SignalR push.
  /// SignalR push không có seekOffsetSeconds → tự tính từ startedAtUtc.
  double get effectiveSeekOffset {
    if (isPaused) return pausePositionSeconds?.toDouble() ?? 0;
    if (seekOffsetSeconds != null) return seekOffsetSeconds!;
    if (startedAtUtc == null) return 0;
    return DateTime.now().toUtc().difference(startedAtUtc!).inMilliseconds / 1000.0;
  }
}
```

> **`seekOffsetSeconds`**: REST `GET /state` → có giá trị (server tính). SignalR `SpaceStateSync` → luôn `null`; dùng `effectiveSeekOffset` getter (Dart) / `getEffectiveSeekOffset()` (TS) để tính đúng trong cả hai trường hợp. Khi `isPaused=true` → hàm tự trả `pausePositionSeconds`.

> **`pendingPlaylistId ≠ null`** → UI hiển thị "⏳ Đang chuẩn bị...", đừng load HLS. Khi transcode xong server push `PlayStream` + `SpaceStateSync` mới với `pendingPlaylistId=null`.

---

### ✅ Action checklist

**Mobile (Flutter — PlaybackDevice):**

- [ ] Lưu `deviceAccessToken`, `deviceRefreshToken`, `spaceId`, `deviceSessionId` sau pair
- [ ] Implement refresh: gọi `POST /api/auth/devices/refresh` khi `deviceAccessToken` expired
- [ ] Dùng route không có `{spaceId}` cho override/playback/state/spaces
- [ ] Subscribe `SpaceStateSync` → rebuild toàn bộ UI state; xử lý `isPaused`, `pendingPlaylistId`
- [ ] Cập nhật `SpaceStateDto` class với 6 fields mới; thêm helper `effectiveSeekOffset`

**Web (React — Manager Dashboard):**

- [ ] Subscribe `SpaceStateSync` để nhận realtime sau Override/CancelOverride/Playback
- [ ] Hiển thị badge "Manual Override" / "AI Scheduling" từ `isManualOverride`
- [ ] Hiển thị trạng thái pause + thời điểm từ `isPaused` + `pausePositionSeconds`
- [ ] Hiển thị "⏳ Đang chuẩn bị..." khi `pendingPlaylistId ≠ null`
- [ ] Thêm UI pair-code: `POST /pair-code` → hiển thị mã; tự refresh sau 15 phút

---

## [2026-03-09] PR #16 — Tracks, Playlists, Moods, CAMS & AWS Infra

> **Merged:** 2026-03-09 22:54 +07:00 | **Merge commit:** `445aafb` | **Branch:** `feature/nam`  
> **Commits:** `445aafb` (Add CAMS docs, S3/CloudFront, MediaConvert & infra) — 2026-03-09

---

### 🆕 Tracks API — Hoàn toàn mới

Base path: `/api/tracks`

| Method   | Endpoint                         | Auth                           | Mô tả                                    |
| -------- | -------------------------------- | ------------------------------ | ---------------------------------------- |
| `GET`    | `/api/tracks`                    | SA, BrandManager, StoreManager | Danh sách tracks có phân trang & filter  |
| `GET`    | `/api/tracks/{id}`               | SA, BrandManager, StoreManager | Chi tiết track                           |
| `POST`   | `/api/tracks`                    | BrandManager                   | Upload track mới (`multipart/form-data`) |
| `PUT`    | `/api/tracks/{id}`               | BrandManager                   | Cập nhật track (partial update)          |
| `DELETE` | `/api/tracks/{id}`               | BrandManager                   | Soft delete                              |
| `PUT`    | `/api/tracks/{id}/toggle-status` | BrandManager                   | Toggle Active ↔ Inactive                 |

**Auth matrix:**

- **SystemAdmin:** read-only
- **BrandManager:** toàn quyền trên brand của mình (`track.BrandId == user.BrandId`)
- **StoreManager:** read-only

**Query params `GET /api/tracks`:**

| Param           | Type                 | Mô tả                                         |
| --------------- | -------------------- | --------------------------------------------- |
| `page`          | `number`             | Trang hiện tại (default 1)                    |
| `pageSize`      | `number`             | Số phần tử (max 500, default 10)              |
| `search`        | `string?`            | Tìm theo title, artist, genre                 |
| `status`        | `EntityStatusEnum?`  | 0=Inactive, 1=Active                          |
| `brandId`       | `string? (Guid)`     | BM/SM: bị ép về brand của mình; SA: lọc tự do |
| `moodId`        | `string? (Guid)`     | Lọc theo mood                                 |
| `genre`         | `string?`            | Lọc theo genre (partial match)                |
| `provider`      | `MusicProviderEnum?` | 0=Custom, 1=Suno                              |
| `isAiGenerated` | `boolean?`           | AI-generated vs manual upload                 |
| `createdFrom`   | `string? (ISO 8601)` | Lọc từ ngày tạo                               |
| `createdTo`     | `string? (ISO 8601)` | Lọc đến ngày tạo                              |

**TypeScript DTOs:**

```ts
interface TrackListItem {
  id: string; // Guid
  brandId?: string;
  title: string;
  artist?: string;
  moodId?: string;
  moodName?: string;
  genre?: string;
  provider?: number; // MusicProviderEnum: 0=Custom, 1=Suno
  durationSec?: number;
  audioUrl?: string; // S3 URL — null nếu upload thất bại
  coverImageUrl?: string;
  playCount: number;
  isAiGenerated?: boolean;
  status: number; // 0=Inactive, 1=Active
  createdAt: string; // ISO 8601
  updatedAt?: string;
}

interface TrackDetailResponse extends TrackListItem {
  bpm?: number; // 20–300
  energyLevel?: number; // 0.0–1.0
  valence?: number; // 0.0–1.0
  sunoClipId?: string;
  generationPrompt?: string;
  generatedAt?: string;
  lyricsUrl?: string;
  lastPlayedAt?: string;
}

// POST/PUT — multipart/form-data
interface TrackRequest {
  title?: string; // required on CREATE
  artist?: string;
  moodId?: string;
  durationSec?: number;
  bpm?: number;
  genre?: string;
  energyLevel?: number;
  valence?: number;
  provider?: number;
  audioFile?: File; // required on CREATE; .mp3/.wav/.aac/.flac/.ogg/.m4a; max 50MB
  coverImageFile?: File; // optional; .jpg/.png/.webp; max 5MB
}
```

> ⚠️ **Upload:** Phải dùng `Content-Type: multipart/form-data` cho `POST` và `PUT`.  
> ⚠️ **Partial update (PUT):** Chỉ field non-null mới được áp dụng — `audioFile=null` giữ nguyên file cũ.

📄 Xem chi tiết: [docs/tracks/API_Tracks.md](tracks/API_Tracks.md)

---

### 🆕 Playlists API — Hoàn toàn mới

Base path: `/api/playlists`

| Method   | Endpoint                               | Auth                           | Mô tả                                               |
| -------- | -------------------------------------- | ------------------------------ | --------------------------------------------------- |
| `GET`    | `/api/playlists`                       | SA, BrandManager, StoreManager | Danh sách playlists có phân trang & filter          |
| `GET`    | `/api/playlists/{id}`                  | SA, BrandManager, StoreManager | Chi tiết playlist + danh sách tracks kèm seekOffset |
| `POST`   | `/api/playlists`                       | BrandManager, StoreManager     | Tạo playlist mới                                    |
| `PUT`    | `/api/playlists/{id}`                  | BrandManager, StoreManager     | Cập nhật playlist (partial update)                  |
| `DELETE` | `/api/playlists/{id}`                  | BrandManager, StoreManager     | Soft delete                                         |
| `PUT`    | `/api/playlists/{id}/toggle-status`    | BrandManager, StoreManager     | Toggle Active ↔ Inactive                            |
| `POST`   | `/api/playlists/{id}/tracks`           | BrandManager, StoreManager     | Thêm tracks vào playlist                            |
| `DELETE` | `/api/playlists/{id}/tracks/{trackId}` | BrandManager, StoreManager     | Xóa track khỏi playlist                             |
| `POST`   | `/api/playlists/{id}/retranscode`      | BrandManager, StoreManager     | Queue lại MediaConvert transcode                    |

**Auth matrix:**

- **SystemAdmin:** read-only
- **BrandManager:** toàn quyền. Phải gửi `storeId` khi tạo — store phải thuộc brand của BM.
- **StoreManager:** toàn quyền trong store của mình. `storeId` trong body bị bỏ qua — server dùng `user.StoreId`.

**Query params `GET /api/playlists`:**

| Param         | Type                 | Mô tả                                                  |
| ------------- | -------------------- | ------------------------------------------------------ |
| `page`        | `number`             | Trang hiện tại                                         |
| `pageSize`    | `number`             | Số phần tử (max 500, default 10)                       |
| `search`      | `string?`            | Tìm theo name, description                             |
| `status`      | `EntityStatusEnum?`  | 0=Inactive, 1=Active                                   |
| `brandId`     | `string? (Guid)`     | BM/SM: bị ép về brand; SA: lọc tự do                   |
| `storeId`     | `string? (Guid)`     | SM: bị ép về store; BM: lọc trong brand; SA: lọc tự do |
| `moodId`      | `string? (Guid)`     | Lọc theo mood                                          |
| `isDynamic`   | `boolean?`           | Dynamic vs static playlist                             |
| `isDefault`   | `boolean?`           | Playlist mặc định của store                            |
| `createdFrom` | `string? (ISO 8601)` | Lọc từ ngày tạo                                        |
| `createdTo`   | `string? (ISO 8601)` | Lọc đến ngày tạo                                       |

**TypeScript DTOs:**

```ts
interface PlaylistListItem {
  id: string;
  brandId?: string;
  storeId?: string;
  storeName?: string;
  moodId?: string;
  moodName?: string;
  name?: string;
  description?: string;
  isDynamic?: boolean;
  isDefault?: boolean;
  hlsUrl?: string; // CloudFront HLS master URL (.m3u8); null nếu chưa transcode
  totalDurationSeconds?: number;
  trackCount: number;
  status: number; // 0=Inactive, 1=Active
  createdAt: string;
  updatedAt?: string;
}

interface PlaylistTrackItem {
  trackId: string;
  title?: string;
  artist?: string;
  durationSec?: number;
  orderIndex?: number;
  coverImageUrl?: string;
  actualDurationSec?: number; // từ MediaConvert — null nếu chưa transcode
  seekOffsetSeconds: number; // ← dùng cho SkipToTrack; tính server-side
}

interface PlaylistDetailResponse extends PlaylistListItem {
  tracks: PlaylistTrackItem[];
}

interface PlaylistRequest {
  name?: string; // required on CREATE
  storeId?: string; // BrandManager: required; StoreManager: ignored
  moodId?: string;
  description?: string;
  isDynamic?: boolean;
  isDefault?: boolean;
  hlsUrl?: string;
  totalDurationSeconds?: number;
  trackIds?: string[]; // CREATE: initial tracks; UPDATE: null=no-op, []=clear all, [ids]=sync
}

interface AddTracksToPlaylistRequest {
  trackIds: string[]; // duplicate IDs silently ignored
}
```

> ⚠️ **`trackIds` semantics trên UPDATE:** `null` = không thay đổi; `[]` = xóa tất cả; `[id1,id2]` = sync full set.  
> ⚠️ **`seekOffsetSeconds`:** Dùng giá trị này để implement tính năng SkipToTrack bằng HLS player seek.  
> ⚠️ **Retranscode:** Cần gọi khi playlist có track mới hoặc `hlsUrl` = null — sẽ nhận `PlayStream` SignalR khi xong.

📄 Xem chi tiết: [docs/playlists/API_Playlists.md](playlists/API_Playlists.md)

---

### 🆕 Moods API — Read-only reference data

Base path: `/api/moods`

| Method | Endpoint     | Auth                           | Mô tả                           |
| ------ | ------------ | ------------------------------ | ------------------------------- |
| `GET`  | `/api/moods` | SA, BrandManager, StoreManager | Danh sách tất cả moods (global) |

**TypeScript DTO:**

```ts
interface MoodListItem {
  id: string;
  moodType?: number; // MoodTypeEnum: 1=Calm, 2=Energetic, 3=Focus, 4=Social, 5=Romantic, 6=Uplifting
  name: string;
  minBpm?: number;
  maxBpm?: number;
  genre?: string;
  energyLevel?: number; // 0.0–1.0
  priority?: number; // null = cuối cùng
  status: number;
  createdAt: string;
}
```

📄 Xem chi tiết: [docs/moods/API_Moods.md](moods/API_Moods.md)

---

### 🆕 CAMS API — Manager Playback Control

Base path: `/api/cams`

| Method   | Endpoint                              | Auth                               | Mô tả                          |
| -------- | ------------------------------------- | ---------------------------------- | ------------------------------ |
| `POST`   | `/api/cams/spaces/{spaceId}/override` | BrandManager, StoreManager         | Override nhạc tại space        |
| `DELETE` | `/api/cams/spaces/{spaceId}/override` | BrandManager, StoreManager         | Hủy override — trả quyền về AI |
| `POST`   | `/api/cams/spaces/{spaceId}/playback` | BrandManager, StoreManager         | Gửi lệnh playback              |
| `GET`    | `/api/cams/spaces/{spaceId}/state`    | BrandManager, StoreManager, Tablet | Lấy trạng thái nhạc hiện tại   |

#### Override Request

```ts
interface OverrideSpaceMoodRequest {
  playlistId?: string; // Mode DirectPlaylist — chọn playlist cụ thể
  moodId?: string; // Mode MoodOverride — AI tự chọn playlist tốt nhất
  reason?: string; // max 500 ký tự
}
// Phải cung cấp đúng 1 trong 2: playlistId hoặc moodId
```

**Override Response:**

| HTTP           | Tình huống                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `200 OK`       | HLS sẵn sàng — `hlsUrl` có giá trị, `transitionType = 1 hoặc 2`                                                         |
| `202 Accepted` | Playlist đang transcode — `hlsUrl = null`, `transitionType = 3 (Pending)`. Tablet tự nhận `PlayStream` SignalR khi xong |

#### Playback Command Request

```ts
interface PlaybackCommandRequest {
  command: PlaybackCommandEnum;
  seekPositionSeconds?: number; // Seek, SeekForward, SeekBackward
  targetTrackId?: string; // SkipToTrack — bắt buộc
}

enum PlaybackCommandEnum {
  Pause = 1,
  Resume = 2,
  Seek = 3, // absolute position
  SeekForward = 4, // delta tua tới
  SeekBackward = 5, // delta tua lùi
  SkipNext = 6,
  SkipPrevious = 7,
  SkipToTrack = 8, // yêu cầu targetTrackId
}
```

#### Space State Response

```ts
interface SpaceStateDto {
  spaceId: string;
  currentPlaylistId?: string; // null nếu không có playlist đang phát
  currentPlaylistName?: string;
  hlsUrl?: string; // null nếu không có playlist
  moodName?: string; // mood hiện tại theo CAMS AI
  isManualOverride: boolean;
  overrideMode?: number; // OverrideModeEnum
  startedAtUtc?: string; // null nếu không có playlist
  expectedEndAtUtc?: string; // null nếu không có playlist
  seekOffsetSeconds?: number; // null nếu không có playlist
  isPaused: boolean;
  pausePositionSeconds?: number;
}
```

> ⚠️ **Tất cả timing fields (`hlsUrl`, `startedAtUtc`, `expectedEndAtUtc`, `seekOffsetSeconds`) đều `null` khi không có playlist đang phát** — FE không hiển thị player trong trường hợp này.

---

### 🔔 SignalR StoreHub — Events từ Server

Hub URL: `/hubs/store`

| Event                  | Payload                                                       | Mô tả                               |
| ---------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `PlayStream`           | `{ spaceId, hlsUrl, seekOffsetSeconds, transitionType, ... }` | Server push khi bắt đầu stream mới  |
| `StopPlayback`         | `{ spaceId, reason }`                                         | Server yêu cầu tablet dừng phát     |
| `SpaceStateSync`       | `SpaceStateDto`                                               | Đồng bộ trạng thái định kỳ          |
| `PlaybackStateChanged` | `{ spaceId, command, seekPosition, targetTrackId }`           | Lan truyền lệnh playback tới tablet |

📄 Xem enum contract đầy đủ + code mẫu TypeScript & Dart: [docs/cams/SIGNALR_STOREHUB.md](cams/SIGNALR_STOREHUB.md)

---

### 🐛 Bug Fixes (API behavior thay đổi)

#### `GET /api/cams/spaces/{spaceId}/state` — Timing fields thay đổi

| Trước                                                          | Sau                                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `expectedEndAtUtc` luôn có giá trị kể cả khi không có playlist | Trả `null` khi `currentPlaylistId = null`                                           |
| `seekOffsetSeconds` tăng không giới hạn theo thời gian         | Áp dụng modulo theo `totalDurationSeconds` — giá trị không vượt quá độ dài playlist |

> **Impact FE/Tablet:** Không nên giả định `expectedEndAtUtc` luôn có giá trị. Kiểm tra `currentPlaylistId != null` trước khi hiển thị player.

---

### 📦 Postman Collections cập nhật

| File                                               | Nội dung                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `docs/Postman_Collection_LogAI_CAMS_API.json`      | +folders **Tracks** (6), **Playlists** (9), **Moods** (1), **CAMS** (4) |
| `docs/tracks/Postman_Collection_Tracks.json`       | Tracks standalone collection (mới)                                      |
| `docs/playlists/Postman_Collection_Playlists.json` | Playlists standalone collection (mới)                                   |
| `docs/moods/Postman_Collection_Moods.json`         | Moods standalone collection (mới)                                       |
| `docs/cams/Postman_Collection_CAMS.json`           | CAMS standalone collection (mới)                                        |

---

## [2026-03-04] PR #12 — Space Management

> **Merged:** 2026-03-04 13:25 +07:00 | **Merge commit:** `77648ee` | **Branch:** `feature/nam`

---

### 🆕 Spaces API — Hoàn toàn mới

Base path: `/api/spaces`

| Method   | Endpoint                         | Auth                           | Mô tả                                   |
| -------- | -------------------------------- | ------------------------------ | --------------------------------------- |
| `GET`    | `/api/spaces`                    | SA, BrandManager, StoreManager | Danh sách spaces có phân trang & filter |
| `GET`    | `/api/spaces/{id}`               | SA, BrandManager, StoreManager | Chi tiết space                          |
| `POST`   | `/api/spaces`                    | BrandManager, StoreManager     | Tạo space mới                           |
| `PUT`    | `/api/spaces/{id}`               | BrandManager, StoreManager     | Cập nhật space                          |
| `DELETE` | `/api/spaces/{id}`               | BrandManager, StoreManager     | Soft delete                             |
| `PUT`    | `/api/spaces/{id}/toggle-status` | BrandManager, StoreManager     | Toggle Active ↔ Inactive                |

**Auth matrix:**

- **SystemAdmin: read-only** — SA không tạo/sửa/xóa được space
- **BrandManager:** toàn quyền trên brand của mình
- **StoreManager:** toàn quyền trên store của mình

**Query params `GET /api/spaces`:**

| Param         | Type                 | Mô tả                                                                      |
| ------------- | -------------------- | -------------------------------------------------------------------------- |
| `page`        | `number`             | Trang hiện tại                                                             |
| `pageSize`    | `number`             | Kích thước trang                                                           |
| `search`      | `string?`            | Tìm theo tên, mô tả                                                        |
| `storeId`     | `string? (Guid)`     | SM: bị ép theo store của user. BM: bị bỏ qua (dùng brandId). SA: lọc tự do |
| `brandId`     | `string? (Guid)`     | BM: bị ép theo brand của user. SA: lọc theo brand                          |
| `type`        | `SpaceTypeEnum?`     | Lọc theo loại không gian                                                   |
| `status`      | `EntityStatusEnum?`  | 0=Inactive, 1=Active, 2=Pending, 3=Rejected                                |
| `createdFrom` | `string? (ISO 8601)` | Lọc từ ngày tạo                                                            |
| `createdTo`   | `string? (ISO 8601)` | Lọc đến ngày tạo                                                           |

> ⚠️ **StoreManager với `user.StoreId == null` → 403 Forbidden** trên mọi endpoint.

**SpaceTypeEnum:** `Counter`=1, `Hall`=2, `Entrance`=3, `Outdoor`=4, `Kitchen`=5, `Restroom`=6

**TypeScript DTOs:**

```ts
interface SpaceListItem {
  id: string; // Guid
  storeId: string;
  name: string;
  type: SpaceTypeEnum; // 1–6
  description?: string;
  status: EntityStatusEnum; // 0=Inactive | 1=Active | 2=Pending | 3=Rejected
  createdAt: string; // ISO 8601
  updatedAt?: string;
}

interface SpaceDetailResponse extends SpaceListItem {
  cameraId?: string;
  roiCoordinates?: string;
  maxOccupancy?: number;
  criticalQueueThreshold?: number;
  wiFiSensorId?: string;
  currentPlaylistId?: string; // Guid | null — read-only, set by AI pipeline
}

interface SpaceRequest {
  storeId?: string; // required for BrandManager; ignored for StoreManager
  name?: string; // required on create, max 200; unique within store
  type?: SpaceTypeEnum; // required on create
  description?: string;
  cameraId?: string;
  roiCoordinates?: string;
  maxOccupancy?: number;
  criticalQueueThreshold?: number;
  wiFiSensorId?: string;
}

type SpaceTypeEnum = 1 | 2 | 3 | 4 | 5 | 6;
```

📄 Xem chi tiết: [docs/spaces/API_Spaces.md](spaces/API_Spaces.md)

---

### 📦 Postman Collections

| File                                          | Nội dung                                               |
| --------------------------------------------- | ------------------------------------------------------ |
| `docs/Postman_Collection_LogAI_CAMS_API.json` | +folder **Spaces** (6 endpoints) vào master collection |
| `docs/spaces/Postman_Collection_Spaces.json`  | Spaces standalone collection (mới)                     |

---

## [2026-03-01] PR #11 — EmailConfirmed Login Fix

> **Merged:** 2026-03-01 21:18 +07:00 | **Merge commit:** `555d0e3` | **Branch:** `feature/nam`  
> **Commits:** `abb9df3` (2026-03-01)

---

### 🐛 Bug Fixes

#### `POST /api/users` — User tạo xong không đăng nhập được

**Root cause:** `EmailConfirmed` bị ignore khi map `CreateUserRequest → AppUser` → giá trị mặc định `false` → ASP.NET Identity từ chối đăng nhập.  
**Fix:** `EmailConfirmed` được set cứng `true` khi tạo user — hệ thống không sử dụng email verification flow.  
**Impact:** Tất cả user mới tạo qua `POST /api/users` giờ đăng nhập bình thường ngay sau khi tạo.

---

## [2026-03-01] PR #10 — Store Management & ToggleBrandStatus

> **Merged:** 2026-03-01 20:52 +07:00 | **Merge commit:** `93410b1` | **Branch:** `feature/nam`  
> **Commits:** `2a0952f` (2026-03-01)

---

### 🆕 Stores API — Hoàn toàn mới

Base path: `/api/stores`

| Method   | Endpoint                         | Auth                           | Mô tả                                   |
| -------- | -------------------------------- | ------------------------------ | --------------------------------------- |
| `GET`    | `/api/stores`                    | SA, BrandManager               | Danh sách stores có phân trang & filter |
| `GET`    | `/api/stores/{id}`               | SA, BrandManager, StoreManager | Chi tiết store                          |
| `POST`   | `/api/stores`                    | BrandManager                   | Tạo store mới                           |
| `PUT`    | `/api/stores/{id}`               | BrandManager                   | Cập nhật store                          |
| `DELETE` | `/api/stores/{id}`               | BrandManager                   | Soft delete                             |
| `PUT`    | `/api/stores/{id}/toggle-status` | BrandManager                   | Toggle Active ↔ Inactive                |

**Query params `GET /api/stores`:**

| Param      | Type             | Mô tả                                          |
| ---------- | ---------------- | ---------------------------------------------- |
| `page`     | `number`         | Trang hiện tại                                 |
| `pageSize` | `number`         | Kích thước trang                               |
| `search`   | `string?`        | Tìm theo tên, địa chỉ                          |
| `brandId`  | `string? (Guid)` | SA only — BrandManager bị ép về brand của mình |
| `isActive` | `boolean?`       | Lọc theo trạng thái                            |

**TypeScript DTOs:**

```ts
interface StoreListItem {
  id: string; // Guid
  name: string;
  address: string;
  brandId: string;
  brandName: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
}

interface StoreDetailResponse extends StoreListItem {
  phone?: string;
  email?: string;
  description?: string;
  updatedAt?: string;
}

interface StoreRequest {
  name: string; // required, max 200
  address: string; // required
  phone?: string;
  email?: string;
  description?: string;
  brandId: string; // Guid, required
}
```

> **Lưu ý BrandManager:** Trường `brandId` trong filter bị server ép về `user.BrandId`.  
> Không cần gửi `brandId` — server tự xử lý.

📄 Xem chi tiết: [docs/stores/API_Stores.md](stores/API_Stores.md)

---

### ✏️ Brands API — Cập nhật thêm

#### 6. Endpoint mới: Toggle Brand Status

```
PUT /api/brands/{id}/toggle-status
Auth: SystemAdmin only
Body: (empty)
```

| Response            | Điều kiện                          |
| ------------------- | ---------------------------------- |
| `200 OK`            | Toggle thành công                  |
| `403 Forbidden`     | Không phải SystemAdmin             |
| `404 Not Found`     | Brand không tồn tại                |
| `422 Unprocessable` | Brand có Primary Owner đang Active |

Xem §5.7 trong [API_Brands.md](brands/API_Brands.md).

---

### 🔒 Users API — Thay đổi bảo mật

#### Security hardening: `GET /api/users` — BrandManager BrandId filter

| Trường hợp                           | Hành vi mới                                     |
| ------------------------------------ | ----------------------------------------------- |
| BrandManager truyền `brandId` bất kỳ | Server ép về `user.BrandId` (giá trị bị bỏ qua) |
| BrandManager truyền `brandId = null` | `403 Forbidden`                                 |
| SystemAdmin                          | Không thay đổi                                  |

> **Impact FE:** Nếu đang gửi `brandId=null` cho BrandManager → đổi thành không gửi param hoặc gửi `brandId=<user.brandId>`.

---

### 📦 Postman Collections cập nhật

| File                                          | Nội dung                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `docs/Postman_Collection_LogAI_CAMS_API.json` | +folder **Stores** (6 endpoints) + item **Toggle Brand Status** vào folder Brands |
| `docs/stores/Postman_Collection_Stores.json`  | Stores standalone collection (mới)                                                |
| `docs/brands/Postman_Collection_Brands.json`  | +item `Toggle Brand Status` (7 items tổng)                                        |

---

## [2026-02-27] PR #9 — Sync merge

> **Merged:** 2026-02-27 11:42 +07:00 | **Merge commit:** `91651e6` | **Branch:** `feature/nam`  
> _Không có thay đổi API mới — merge đồng bộ._

---

## [2026-02-25] PR #8 — Users API, Transfer Ownership & Brand updates

> **Merged:** 2026-02-25 17:26 +07:00 | **Merge commit:** `848c597` | **Branch:** `feature/nam`  
> **Commits:** `9c7cb01` · `a148ad0` · `3c3773c` · `807e59d`

---

### 🆕 Users API — Hoàn toàn mới

Base path: `/api/users`

| Method  | Endpoint                         | Auth             | Mô tả                                |
| ------- | -------------------------------- | ---------------- | ------------------------------------ |
| `GET`   | `/api/users`                     | SA, BrandManager | Danh sách users phân trang & filter  |
| `GET`   | `/api/users/{id}`                | SA, BrandManager | Chi tiết user                        |
| `POST`  | `/api/users`                     | SA, BrandManager | Tạo user mới (`multipart/form-data`) |
| `PATCH` | `/api/users/{id}`                | SA, BrandManager | Cập nhật user (partial)              |
| `PUT`   | `/api/users/{id}/status`         | SA, BrandManager | Toggle Active ↔ Inactive             |
| `PUT`   | `/api/users/{id}/reset-password` | SA, BrandManager | Reset password (admin-initiated)     |
| `PUT`   | `/api/users/{id}/brand`          | SA only          | Chuyển brand                         |
| `PUT`   | `/api/users/{id}/store`          | SA, BrandManager | Gán/gỡ store                         |

📄 Xem chi tiết: [docs/users/API_Users.md](users/API_Users.md)

---

### ✏️ Brands API — Cập nhật

#### 1. Endpoint mới: Transfer Ownership

```
PUT /api/brands/{id}/transfer-ownership
Auth: SystemAdmin only
Body: { "newOwnerId": "<guid>" }
```

Response `200` khi thành công. Xem §5.6 trong [API_Brands.md](brands/API_Brands.md).

#### 2. Response `BrandListItem` — thêm field mới

```diff
  {
    "id": "...",
    "name": "Tech Brand",
+   "primaryOwnerId": "a1b2c3d4-...",   // Guid | null
    "industry": "Retail",
    "primaryContactName": "John Doe",
    ...
  }
```

#### 3. Filter `GET /api/brands` — thêm query param `primaryOwnerId`

```
GET /api/brands?primaryOwnerId=<guid>
```

#### 4. Lỗi 422 chi tiết hơn khi tạo/cập nhật Brand

Nay báo lỗi khi trùng `TaxCode` hoặc `ContactEmail` (trước chỉ báo trùng Name).

#### 5. HTTP status Create — `201 → 200`

`POST /api/brands` và `POST /api/users` đều trả **200**.

---

### 📦 Postman Collections

| File                                          | Nội dung                          |
| --------------------------------------------- | --------------------------------- |
| `docs/Postman_Collection_LogAI_CAMS_API.json` | +folder **Users** (8 endpoints)   |
| `docs/users/Postman_Collection_Users.json`    | Users standalone collection (mới) |

---

## [2026-02-25] PR #7 — Brand validation docs

> **Merged:** 2026-02-25 16:24 +07:00 | **Merge commit:** `0d9725d` | **Branch:** `feature/nam`

_Không có thay đổi API — chỉ cập nhật tài liệu nội bộ._

---

## [2026-02-24] PR #6 — Brand model & localization

> **Merged:** 2026-02-24 23:52 +07:00 | **Merge commit:** `a262be0` | **Branch:** `feature/nam`

_Không có thay đổi API surface — cải tiến nội bộ (validation messages, localization)._

---

## [2026-02-23] PR #5 — Brand CRUD

> **Merged:** 2026-02-23 12:05 +07:00 | **Merge commit:** `15d756e` | **Branch:** `feature/nam`

**Brands API được khởi tạo** — xem tài liệu đầy đủ tại [docs/brands/API_Brands.md](brands/API_Brands.md).

---

## [2026-02-20] PR #3 — Auth & change-password

> **Merged:** 2026-02-20 10:39 +07:00 | **Merge commit:** `c201340` | **Branch:** `feature/nam`

- **ADDED** `POST /api/auth/change-password` — đổi password khi đang đăng nhập (cần current password)
- Xem [docs/auth/API_Auth.md](auth/API_Auth.md)

---

## [2026-02-16] PR #2 — Auth refresh-token flow

> **Merged:** 2026-02-16 10:57 +07:00 | **Merge commit:** `8eb2a9e` | **Branch:** `feature/nam`

- Refresh-token: chuyển từ response body sang **HTTP-only cookie**
- Access-token vẫn trả trong response body
- FE cần cập nhật cơ chế refresh (dùng `withCredentials: true` khi gọi `/api/auth/refresh-token`)
