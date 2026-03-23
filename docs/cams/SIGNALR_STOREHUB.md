# StoreHub — SignalR Connection Guide

Hướng dẫn kết nối và sử dụng SignalR Hub `StoreHub` cho **tablet (Flutter/Dart)** và **manager web app (TypeScript/React)**.

Hub URL: **`/hubs/store`**

> **Tham khảo REST API:** [API_CAMS.md](API_CAMS.md)

---

## Mục lục

1. [Enum Contract — StoreHub Payloads](#1-enum-contract--storehub-payloads)
2. [Hub Methods (Client → Server)](#2-hub-methods-client--server)
3. [Server Events (Server → Client)](#3-server-events-server--client)
4. [SpaceStateDto — Full Schema](#4-spaceStatedto--full-schema)
5. [State Sync Lifecycle — Cách UI nhận state change](#5-state-sync-lifecycle--cách-ui-nhận-state-change)
6. [Setup — Flutter / Dart (Tablet)](#6-setup--flutter--dart-tablet)
7. [Setup — Web / TypeScript (Manager Dashboard)](#7-setup--web--typescript-manager-dashboard)
8. [Connection Groups](#8-connection-groups)
9. [Error Handling & Reconnect](#9-error-handling--reconnect)

---

## 1. Enum Contract — StoreHub Payloads

Tất cả enum trong SignalR payload dùng **giá trị số nguyên**. KHÔNG dùng string.

### `PlaybackCommandEnum`

_Dùng trong: event `PlaybackStateChanged` (field `command`)_

| Giá trị | Tên            | `seekPositionSeconds` trong event       | `targetTrackId` trong event             |
| ------- | -------------- | --------------------------------------- | --------------------------------------- |
| `1`     | `Pause`        | null                                    | null                                    |
| `2`     | `Resume`       | null                                    | null                                    |
| `3`     | `Seek`         | Vị trí tuyệt đối (giây)                 | null                                    |
| `4`     | `SeekForward`  | **Absolute** đã tính (không phải delta) | null                                    |
| `5`     | `SeekBackward` | **Absolute** đã tính (không phải delta) | null                                    |
| `6`     | `SkipNext`     | `0` hoặc null (khi pending transcode)   | GUID của track kế                       |
| `7`     | `SkipPrevious` | `0` hoặc null (khi pending transcode)   | GUID của track đích                     |
| `8`     | `SkipToTrack`  | `0` hoặc null (khi pending transcode)   | GUID của track đích                     |
| `9`     | `TrackEnded`   | `0` hoặc null (khi pending transcode)   | GUID track kế / hiện tại tùy transition |

> ⚠️ Khi server relay `SeekForward`/`SeekBackward`, giá trị `seekPositionSeconds` trong event đã được **convert sang vị trí tuyệt đối** — tablet gọi `seekTo(seekPositionSeconds)` trực tiếp, không cộng/trừ thêm.

> ⚠️ Với `SkipNext`/`SkipPrevious`/`SkipToTrack`, `seekPositionSeconds` trong event chỉ mang tính tín hiệu (`0` hoặc null). Client chuyển track dựa trên `SpaceStateSync.hlsUrl/startedAtUtc` và `targetTrackId`.

> **SkipNext:** server chọn bài kế theo **`Position` tuần tự** trên toàn queue (không wrap về đầu). **TrackEnded / watchdog:** áp dụng `queueEndBehavior` (Stop / RepeatAll / RepeatOne) trên `SpaceMusicState`.

### `TransitionTypeEnum`

_Dùng trong: event `PlayStream` (field `transitionType`)_

| Giá trị | Tên         | Tablet nên làm gì                                            |
| ------- | ----------- | ------------------------------------------------------------ |
| `1`     | `Immediate` | Hard-switch ngay: dừng player cũ, load HLS URL mới           |
| `2`     | `Crossfade` | Fade out player cũ, fade in stream mới (khoảng 3–5s)         |
| `3`     | `Pending`   | Nhận event nhưng chờ `PlayStream` tiếp theo khi HLS sẵn sàng |

**Flutter enum khai báo tường minh:**

```dart
enum PlaybackCommand {
  pause       = 1,
  resume      = 2,
  seek        = 3,
  seekForward = 4,
  seekBackward = 5,
  skipNext    = 6,
  skipPrevious = 7,
  skipToTrack  = 8,
  trackEnded   = 9,
}

enum TransitionType {
  immediate = 1,
  crossfade = 2,
  pending   = 3,
}
```

**TypeScript enum khai báo tường minh:**

```typescript
export enum PlaybackCommand {
  Pause = 1,
  Resume = 2,
  Seek = 3,
  SeekForward = 4,
  SeekBackward = 5,
  SkipNext = 6,
  SkipPrevious = 7,
  SkipToTrack = 8,
  TrackEnded = 9,
}

export enum TransitionType {
  Immediate = 1,
  Crossfade = 2,
  Pending = 3,
}
```

---

## 2. Hub Methods (Client → Server)

### `JoinSpaceAsync(spaceId: string)`

Tablet gọi ngay sau khi kết nối để đăng ký nhận events của Space đó.

| Param     | Type            | Mô tả                     |
| --------- | --------------- | ------------------------- |
| `spaceId` | `string` (GUID) | ID của Space cần theo dõi |

**Server phản hồi:** event `ConnectionConfirmed` (xem Section 3)

---

### `LeaveSpaceAsync(spaceId: string)`

Tablet/manager gọi khi rời Space (trước khi switch sang Space khác).

---

### `JoinManagerRoomAsync(storeId: string)`

Manager browser tab gọi để nhận đồng bộ trạng thái tất cả Spaces trong Store.
Server thêm connection vào group `mgr-{storeId}`.

| Param     | Type            | Mô tả                                |
| --------- | --------------- | ------------------------------------ |
| `storeId` | `string` (GUID) | ID của Store mà manager đang quản lý |

---

### `ReportPlaybackStateAsync(report)`

Tablet báo cáo trạng thái phát nhạc (analytics / health monitoring). Fire-and-forget.

```json
{
  "spaceId": "uuid",
  "currentHlsUrl": "https://...",
  "isPlaying": true,
  "positionSeconds": 142.5
}
```

---

### `SendPlaybackCommandAsync(command)`

Manager gửi lệnh điều khiển trực tiếp qua Hub (low-latency alternative cho REST).
Chỉ dành cho trường hợp cần độ trễ tối thiểu. REST path là path chính khuyên dùng.

```json
{
  "spaceId": "uuid",
  "command": 1,
  "seekPositionSeconds": null,
  "targetTrackId": null
}
```

---

## 3. Server Events (Server → Client)

### `ConnectionConfirmed`

Phản hồi sau `JoinSpaceAsync` hoặc `JoinManagerRoomAsync`.

```json
{
  "spaceId": "uuid",
  "connectionId": "abc123",
  "serverTimeUtc": "2026-03-08T10:00:00Z",
  "message": "Joined Space 00000000-...-0001. Listening for PlayStream events."
}
```

---

### `PlayStream`

Khi AI scheduler hoặc manager override thay đổi playlist (bao gồm cả sau 202 khi transcode COMPLETE).

```json
{
  "spaceId": "uuid",
  "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/v3/master.m3u8",
  "transitionType": 1,
  "playlistId": "uuid",
  "isManualOverride": true,
  "startedAtUtc": "2026-03-08T10:00:00Z"
}
```

> `transitionType = 3` (Pending) → **bỏ qua**, chờ event `PlayStream` tiếp theo khi `transitionType ∈ {1, 2}`.

---

### `PlaybackStateChanged`

Broadcast sau mỗi lệnh playback (Pause/Resume/Seek/Skip…). Gửi đến **cả tablet lẫn manager tabs** trong Space group.

```json
{
  "spaceId": "uuid",
  "command": 6,
  "seekPositionSeconds": 183.5,
  "targetTrackId": "uuid-của-track-kế"
}
```

---

### `SpaceStateSync`

Full `SpaceStateDto` snapshot — gửi sau **mọi thao tác làm thay đổi state**: Override, CancelOverride, **queue operations** (add/reorder/remove/clear), **Patch audio mixer**, và **tất cả lệnh Playback** (Pause/Resume/Seek/Skip…).

> ⚠️ **Client nên dùng `SpaceStateSync` là nguồn sự thật chính** để rebuild toàn bộ UI state sau bất kỳ thay đổi nào — không cần poll REST `/state`.

```json
{
  "spaceId": "uuid",
  "storeId": "uuid",
  "brandId": "uuid",
  "currentQueueItemId": "uuid",
  "currentTrackName": "Evening Chill",
  "hlsUrl": "https://dXXX.cloudfront.net/audio/playlists/.../master.m3u8",
  "moodName": "Chill",
  "isManualOverride": false,
  "overrideMode": null,
  "startedAtUtc": "2026-03-08T09:30:00Z",
  "expectedEndAtUtc": null,
  "seekOffsetSeconds": 182.0,
  "isPaused": false,
  "pausePositionSeconds": null,
  "pendingQueueItemId": null,
  "pendingOverrideReason": null,
  "volumePercent": 100,
  "isMuted": false,
  "queueEndBehavior": 0,
  "spaceQueueItems": []
}
```

**Khi nào được push:**

| Trigger (server action)                                        | Event đi kèm                                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `OverrideSpaceMood` (200 OK)                                   | `PlayStream` + **`SpaceStateSync`**                                                                                 |
| `OverrideSpaceMood`                                            | **`SpaceStateSync`** (trước đây là 202 Accepted, hiện tại chỉ có 200 OK + ACK)                                      |
| `CancelSpaceOverride`                                          | **`SpaceStateSync`**                                                                                                |
| `AddTracksToQueue` (PlayNow và next track ready)               | `PlayStream` + **`SpaceStateSync`**                                                                                 |
| `AddTracksToQueue` (các mode khác / hoặc next track pending)   | **`SpaceStateSync`**                                                                                                |
| `AddPlaylistToQueue` (PlayNow và next track ready)             | `PlayStream` + **`SpaceStateSync`**                                                                                 |
| `AddPlaylistToQueue` (các mode khác / hoặc next track pending) | **`SpaceStateSync`**                                                                                                |
| `ReorderSpaceQueue`                                            | **`SpaceStateSync`**                                                                                                |
| `RemoveQueueItems`                                             | **`SpaceStateSync`** (+ `PlayStream` khi transition sang track đã sẵn sàng)                                         |
| `ClearSpaceQueue`                                              | `StopPlayback` + **`SpaceStateSync`**                                                                               |
| `SendPlaybackCommand` (Pause)                                  | `PlaybackStateChanged` + **`SpaceStateSync`**                                                                       |
| `SendPlaybackCommand` (Resume)                                 | `PlaybackStateChanged` + **`SpaceStateSync`**                                                                       |
| `SendPlaybackCommand` (Seek/SeekForward/SeekBackward)          | `PlaybackStateChanged` + **`SpaceStateSync`**                                                                       |
| `SendPlaybackCommand` (SkipNext/SkipPrevious/SkipToTrack)      | `PlaybackStateChanged` + **`SpaceStateSync`**                                                                       |
| `SendPlaybackCommand` (`TrackEnded`)                           | `PlaybackStateChanged` (nếu relay) + **`SpaceStateSync`**; có thể thêm `PlayStream` / `StopPlayback` tùy transition |
| `PATCH .../state/audio` (volume / mute / `queueEndBehavior`)   | Chỉ **`SpaceStateSync`** (background) — **không** `PlaybackStateChanged`                                            |
| `SendPlaybackCommand` — no-op (e.g. Pause khi đã Pause)        | ❌ Không push                                                                                                       |

> `PlaybackStateChanged` và `SpaceStateSync` đến **gần như đồng thời** sau mỗi lệnh. `PlaybackStateChanged` là relay nhanh để tablet thực hiện action tức thì; `SpaceStateSync` là state đầy đủ sau khi DB đã commit.

---

### `StopPlayback`

Dừng phát nhạc hoàn toàn (không có payload). Tablet dừng player và clear UI.

---

### `Error`

Lỗi validation tại Hub (ví dụ: `spaceId` không hợp lệ).

```json
"spaceId cannot be empty."
```

---

## 4. SpaceStateDto — Full Schema

`SpaceStateDto` là payload của event `SpaceStateSync` và response của `GET /api/cams/spaces/{spaceId}/state`. Đây là **snapshot toàn bộ trạng thái playback** của một Space tại một thời điểm.

### Bảng field chi tiết

| Field                   | Kiểu                       | Null? | Mô tả                                                                                                                                                  |
| ----------------------- | -------------------------- | :---: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spaceId`               | `Guid`                     |  ❌   | ID của Space                                                                                                                                           |
| `storeId`               | `Guid`                     |  ❌   | ID của Store chứa Space                                                                                                                                |
| `brandId`               | `Guid`                     |  ❌   | ID của Brand chứa Store                                                                                                                                |
| `currentQueueItemId`    | `Guid?`                    |  ✅   | Queue item đang được phát; null khi không có queue nào đang phát                                                                                       |
| `currentTrackName`      | `string?`                  |  ✅   | Tên track đang được phát                                                                                                                               |
| `hlsUrl`                | `string?`                  |  ✅   | CloudFront HLS URL (`.m3u8`). Tablet truyền vào player. Null khi không phát                                                                            |
| `moodName`              | `string?`                  |  ✅   | Tên mood hiện tại (từ AI scheduler hoặc manager override)                                                                                              |
| `isManualOverride`      | `bool`                     |  ❌   | `true` khi manager đang override; `false` khi AI scheduler điều khiển                                                                                  |
| `overrideMode`          | `int?`                     |  ✅   | `1` = DirectPlaylist, `2` = MoodOverride; null khi AI-driven                                                                                           |
| `startedAtUtc`          | `DateTime?`                |  ✅   | Thời điểm track bắt đầu phát (UTC). Null khi không phát                                                                                                |
| `expectedEndAtUtc`      | `DateTime?`                |  ✅   | Thời điểm dự kiến kết thúc. Null khi AI-driven hoặc pause                                                                                              |
| `seekOffsetSeconds`     | `double?`                  |  ✅   | `(UtcNow − StartedAtUtc).TotalSeconds` — tính tại thời điểm **REST call**; null trong SignalR push (dùng `startedAtUtc` để tự tính). Xem note bên dưới |
| `isPaused`              | `bool`                     |  ❌   | `true` khi playback đang pause                                                                                                                         |
| `pausePositionSeconds`  | `int?`                     |  ✅   | Vị trí (giây) tại lúc Pause. Dùng để resume đúng vị trí và hiển thị progress bar khi pause                                                             |
| `pendingQueueItemId`    | `Guid?`                    |  ✅   | Queue item đang chờ track sẵn sàng để phát (override pending). Null khi không có pending                                                               |
| `pendingOverrideReason` | `string?`                  |  ✅   | Lý do override đang pending (hiển thị cho manager/tablet)                                                                                              |
| `volumePercent`         | `byte` / `number`          |  ❌   | `0`–`100`, mặc định `100` — gợi ý âm lượng UI/player                                                                                                   |
| `isMuted`               | `bool`                     |  ❌   | `true` → client nên mute                                                                                                                               |
| `queueEndBehavior`      | `int` / `number`           |  ❌   | `0` Stop, `1` RepeatAll, `2` RepeatOne (kết thúc tự nhiên / watchdog)                                                                                  |
| `spaceQueueItems`       | `SpaceQueueStateItemDto[]` |  ❌   | Toàn bộ queue items trong Space (có thể rỗng)                                                                                                          |

### Notes quan trọng

> **`seekOffsetSeconds` trong SignalR vs REST:**
>
> - **REST** `GET /state` → `seekOffsetSeconds` được tính server-side tại thời điểm call → tablet dùng trực tiếp cho `seekTo()`.
> - **SignalR** `SpaceStateSync` → `seekOffsetSeconds` = null. Tablet tự tính: `(DateTime.now().toUtc().difference(startedAtUtc!).inMilliseconds / 1000)`.
> - Khi `isPaused = true` → dùng `pausePositionSeconds` thay vì tính từ clock.

> **`pendingQueueItemId` ≠ null** → UI nên hiển thị trạng thái "⏳ Đang chuẩn bị..." và không cố load HLS. Khi transcode xong, server sẽ push `PlayStream` + `SpaceStateSync` mới với `pendingQueueItemId = null` và `hlsUrl` đầy đủ.

### TypeScript interface đầy đủ

```typescript
export interface SpaceStateDto {
  spaceId: string; // Guid
  storeId: string; // Guid
  brandId: string; // Guid

  currentQueueItemId: string | null;
  currentTrackName: string | null;
  hlsUrl: string | null; // CloudFront .m3u8 URL
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: OverrideMode | null; // 1=DirectPlaylist, 2=MoodOverride

  startedAtUtc: string | null; // ISO 8601 UTC
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null; // REST only; null in SignalR push

  isPaused: boolean;
  pausePositionSeconds: number | null;

  pendingQueueItemId: string | null;
  pendingOverrideReason: string | null;

  volumePercent: number;
  isMuted: boolean;
  queueEndBehavior: number;
  spaceQueueItems: SpaceQueueStateItemDto[]; // includes played/skipped/pending rows
}

export interface SpaceQueueStateItemDto {
  queueItemId: string; // Guid
  trackId: string; // Guid
  trackName: string | null;
  position: number; // sequential order by Position
  queueStatus: number; // 0=Pending, 1=Playing, 2=Played, 3=Skipped
  source: number; // 0=AI, 1=Manager
  hlsUrl: string | null;
  isReadyToStream: boolean;
}

export enum OverrideMode {
  DirectPlaylist = 1,
  MoodOverride = 2,
}
```

### Dart class đầy đủ

```dart
class SpaceStateDto {
  final String spaceId;
  final String storeId;
  final String brandId;

  final String? currentQueueItemId;
  final String? currentTrackName;
  final String? hlsUrl;
  final String? moodName;
  final bool isManualOverride;
  final int? overrideMode;         // 1=DirectPlaylist, 2=MoodOverride

  final DateTime? startedAtUtc;
  final DateTime? expectedEndAtUtc;
  final double? seekOffsetSeconds; // null trong SignalR, có trong REST

  final bool isPaused;
  final int? pausePositionSeconds;

  final String? pendingQueueItemId;
  final String? pendingOverrideReason;

  final int volumePercent;       // 0–100
  final bool isMuted;
  final int queueEndBehavior;    // 0 Stop, 1 RepeatAll, 2 RepeatOne
  final List<SpaceQueueStateItemDto> spaceQueueItems;

  const SpaceStateDto({
    required this.spaceId,
    required this.storeId,
    required this.brandId,
    this.currentQueueItemId,
    this.currentTrackName,
    this.hlsUrl,
    this.moodName,
    required this.isManualOverride,
    this.overrideMode,
    this.startedAtUtc,
    this.expectedEndAtUtc,
    this.seekOffsetSeconds,
    required this.isPaused,
    this.pausePositionSeconds,
    this.pendingQueueItemId,
    this.pendingOverrideReason,
    required this.volumePercent,
    required this.isMuted,
    required this.queueEndBehavior,
    required this.spaceQueueItems,
  });

  factory SpaceStateDto.fromJson(Map<String, dynamic> json) => SpaceStateDto(
    spaceId:              json['spaceId'] as String,
    storeId:              json['storeId'] as String,
    brandId:              json['brandId'] as String,
    currentQueueItemId:    json['currentQueueItemId'] as String?,
    currentTrackName:      json['currentTrackName'] as String?,
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
    pendingQueueItemId:    json['pendingQueueItemId'] as String?,
    pendingOverrideReason: json['pendingOverrideReason'] as String?,
    volumePercent:        (json['volumePercent'] as num?)?.toInt() ?? 100,
    isMuted:              json['isMuted'] as bool? ?? false,
    queueEndBehavior:     (json['queueEndBehavior'] as num?)?.toInt() ?? 0,
    spaceQueueItems:      (json['spaceQueueItems'] as List?)
        ?.map((e) => SpaceQueueStateItemDto.fromJson(e as Map<String, dynamic>))
        .toList() ?? [],
  );

  /// Tính seek offset thực tế (cho SignalR push khi seekOffsetSeconds = null)
  double get effectiveSeekOffset {
    if (isPaused) return pausePositionSeconds?.toDouble() ?? 0;
    if (seekOffsetSeconds != null) return seekOffsetSeconds!;
    if (startedAtUtc == null) return 0;
    return DateTime.now().toUtc().difference(startedAtUtc!).inMilliseconds / 1000.0;
  }
}

class SpaceQueueStateItemDto {
  final String queueItemId;
  final String trackId;
  final String? trackName;
  final int position;
  final int queueStatus;
  final int source;
  final String? hlsUrl;
  final bool isReadyToStream;

  const SpaceQueueStateItemDto({
    required this.queueItemId,
    required this.trackId,
    this.trackName,
    required this.position,
    required this.queueStatus,
    required this.source,
    this.hlsUrl,
    required this.isReadyToStream,
  });

  factory SpaceQueueStateItemDto.fromJson(Map<String, dynamic> json) =>
      SpaceQueueStateItemDto(
        queueItemId: json['queueItemId'] as String,
        trackId: json['trackId'] as String,
        trackName: json['trackName'] as String?,
        position: json['position'] as int,
        queueStatus: json['queueStatus'] as int,
        source: json['source'] as int,
        hlsUrl: json['hlsUrl'] as String?,
        isReadyToStream: json['isReadyToStream'] as bool,
      );
}
```

---

## 5. State Sync Lifecycle — Cách UI nhận state change

### Luồng tổng quát

```
Client join Space
  │
  ├─► 1. Gọi GET /api/cams/spaces/{spaceId}/state   (REST — lấy state ban đầu)
  │       ↳ seekOffsetSeconds có sẵn → seekTo() ngay
  │
  └─► 2. Subscribe SignalR events:
          ├── PlayStream        → load HLS player mới
          ├── PlaybackStateChanged → thực hiện lệnh tức thì (pause/seek/skip)
          ├── SpaceStateSync    → rebuild toàn bộ UI state (nguồn sự thật)
          └── StopPlayback      → dừng player, clear UI
```

### Decision tree — UI nên làm gì với mỗi event

```
Nhận PlayStream?
  ├── transitionType = 3 (Pending) → hiển thị "⏳ Đang chuẩn bị..." ; bỏ qua
  ├── transitionType = 1 (Immediate) → hard-switch player sang hlsUrl mới; seekTo(0)
  └── transitionType = 2 (Crossfade) → fade out player cũ → fade in hlsUrl mới

Nhận PlaybackStateChanged?
  ├── command = 1 (Pause) → player.pause(); update UI icon
  ├── command = 2 (Resume) → player.play(); update UI icon
  └── command = 3..8 (Seek/Skip) → player.seekTo(seekPositionSeconds); update track indicator

Nhận SpaceStateSync?
  └── Luôn luôn: rebuild state từ payload (overwrite toàn bộ local state)
      ├── isPaused=true → hiển thị pause icon; progress = pausePositionSeconds
      ├── isPaused=false và startedAtUtc ≠ null → tính seek: (now − startedAtUtc)
      ├── pendingQueueItemId ≠ null → hiển thị "⏳ Đang chuẩn bị..."
      ├── isManualOverride=true → badge "Manual Override" + overrideMode label
      ├── isManualOverride=false → badge "AI Scheduling"
      └── hlsUrl = null → không có playlist; clear player

Nhận StopPlayback?
  └── player.stop(); clear UI hoàn toàn; hiển thị "No music scheduled"
```

### Sequence: Override → Tablet thấy gì

```
Manager gọi POST /api/cams/spaces/{spaceId}/override
  │
  ├─► [Server] Lưu state vào DB
  ├─► [SignalR] PlayStream        → tablet load HLS URL mới
  └─► [SignalR] SpaceStateSync    → tablet + manager rebuild state:
        isManualOverride=true, overrideMode=1, currentTrackName="Evening Chill"
```

### Sequence: Pause → Tablet + Manager thấy gì

```
Manager/Tablet gọi POST /api/cams/spaces/playback { command: 1 }
  │
  ├─► [Server] IsPaused=true, PausePositionSeconds=N → SaveChangesAsync (1 lần)
  ├─► [SignalR] PlaybackStateChanged { command:1 }   → tablet: player.pause()
  └─► [SignalR] SpaceStateSync { isPaused:true, pausePositionSeconds:N }
        → tablet: progress bar freeze tại N giây
        → manager: UI hiển thị icon pause + thời điểm dừng
```

### Sequence: Tablet reconnect sau mất mạng

```
Tablet mất mạng 30s
  → SignalR auto-reconnect
  → onreconnected: JoinSpaceAsync(spaceId)
  → Gọi GET /api/cams/spaces/state          ← lấy seekOffsetSeconds chính xác từ REST
  → Nếu isPaused: seekTo(pausePositionSeconds); player.pause()
  → Nếu đang play: seekTo(seekOffsetSeconds); player.play()
  → Tiếp tục nhận events bình thường
```

---

## 6. Setup — Flutter / Dart (Tablet)

### 4.1 Cài package

```yaml
# pubspec.yaml
dependencies:
  signalr_netcore: ^1.3.4
```

```bash
flutter pub get
```

### 4.2 Service class mẫu

```dart
import 'package:signalr_netcore/signalr_client.dart';
import 'package:logging/logging.dart';

class StoreHubService {
  static const String _hubUrl = 'https://your-api.com/hubs/store';

  late HubConnection _connection;
  final String Function() _accessTokenFactory;

  StoreHubService({required String Function() accessTokenFactory})
      : _accessTokenFactory = accessTokenFactory;

  // ─── Kết nối ──────────────────────────────────────────────────────────────

  Future<void> connect() async {
    _connection = HubConnectionBuilder()
        .withUrl(
          _hubUrl,
          options: HttpConnectionOptions(
            accessTokenFactory: () async => _accessTokenFactory(),
            // Dùng WebSocket, fallback về LongPolling
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,     // Tắt negotiate khi dùng WebSocket thuần
          ),
        )
        .withAutomaticReconnect(retryDelays: [0, 2000, 5000, 10000, 30000])
        .configureLogging(Logger('StoreHub'))
        .build();

    // Đăng ký listeners TRƯỚC khi start
    _registerListeners();

    await _connection.start();
  }

  Future<void> disconnect() async {
    await _connection.stop();
  }

  // ─── Gọi Hub methods ───────────────────────────────────────────────────────

  /// Tablet gọi sau khi kết nối để nhận events của Space
  Future<void> joinSpace(String spaceId) async {
    await _connection.invoke('JoinSpaceAsync', args: [spaceId]);
  }

  Future<void> leaveSpace(String spaceId) async {
    await _connection.invoke('LeaveSpaceAsync', args: [spaceId]);
  }

  /// Báo cáo trạng thái phát nhạc (analytics)
  Future<void> reportPlaybackState({
    required String spaceId,
    required bool isPlaying,
    double? positionSeconds,
    String? currentHlsUrl,
  }) async {
    await _connection.invoke('ReportPlaybackStateAsync', args: [
      {
        'spaceId': spaceId,
        'isPlaying': isPlaying,
        'positionSeconds': positionSeconds,
        'currentHlsUrl': currentHlsUrl,
      }
    ]);
  }

  // ─── Lắng nghe events server gửi xuống ────────────────────────────────────

  void _registerListeners() {
    // Xác nhận join thành công
    _connection.on('ConnectionConfirmed', (args) {
      final data = args?[0] as Map<String, dynamic>?;
      print('[StoreHub] Connected to Space: ${data?['spaceId']}');
    });

    // Server đổi playlist (AI hoặc override)
    _connection.on('PlayStream', (args) {
      final payload = args?[0] as Map<String, dynamic>?;
      if (payload == null) return;

      final transitionType = payload['transitionType'] as int;

      // Bỏ qua Pending (3) — chờ event tiếp theo khi HLS sẵn sàng
      if (transitionType == 3) return;

      final hlsUrl      = payload['hlsUrl'] as String;
      final playlistId  = payload['playlistId'] as String;
      final startedAtUtc = DateTime.parse(payload['startedAtUtc'] as String);

      onPlayStream?.call(
        hlsUrl: hlsUrl,
        playlistId: playlistId,
        transitionType: transitionType,
        startedAtUtc: startedAtUtc,
      );
    });

    // Lệnh điều khiển nhận từ manager
    _connection.on('PlaybackStateChanged', (args) {
      final payload = args?[0] as Map<String, dynamic>?;
      if (payload == null) return;

      final command            = payload['command'] as int;
      final seekPositionSeconds = payload['seekPositionSeconds'] as double?;
      final targetTrackId      = payload['targetTrackId'] as String?;

      onPlaybackCommand?.call(
        command: command,
        seekPositionSeconds: seekPositionSeconds,
        targetTrackId: targetTrackId,
      );
    });

    // Full state sync sau Override/CancelOverride/bất kỳ lệnh Playback nào
    _connection.on('SpaceStateSync', (args) {
      final json = args?[0] as Map<String, dynamic>?;
      if (json == null) return;
      final state = SpaceStateDto.fromJson(json);
      onSpaceStateSync?.call(state);
    });

    // Dừng phát
    _connection.on('StopPlayback', (_) {
      onStopPlayback?.call();
    });

    // Lỗi từ hub
    _connection.on('Error', (args) {
      final message = args?[0] as String?;
      print('[StoreHub] Error: $message');
    });

    // Reconnect lifecycle
    _connection.onreconnecting(({error}) {
      print('[StoreHub] Reconnecting... $error');
    });
    _connection.onreconnected(({connectionId}) {
      print('[StoreHub] Reconnected: $connectionId');
      // Re-join Space sau reconnect
      if (_currentSpaceId != null) joinSpace(_currentSpaceId!);
    });
  }

  // ─── Callbacks để widget/provider lắng nghe ────────────────────────────────

  void Function({
    required String hlsUrl,
    required String playlistId,
    required int transitionType,
    required DateTime startedAtUtc,
  })? onPlayStream;

  void Function({
    required int command,
    double? seekPositionSeconds,
    String? targetTrackId,
  })? onPlaybackCommand;

  void Function(SpaceStateDto state)? onSpaceStateSync;
  void Function()? onStopPlayback;

  String? _currentSpaceId;
}
```

### 4.3 Sử dụng trong widget

```dart
class SpacePlayerPage extends StatefulWidget {
  final String spaceId;
  const SpacePlayerPage({required this.spaceId, super.key});

  @override
  State<SpacePlayerPage> createState() => _SpacePlayerPageState();
}

class _SpacePlayerPageState extends State<SpacePlayerPage> {
  late final StoreHubService _hub;

  @override
  void initState() {
    super.initState();
    _hub = StoreHubService(
      accessTokenFactory: () => context.read<AuthService>().accessToken,
    );
    _hub.onPlayStream = _onPlayStream;
    _hub.onPlaybackCommand = _onPlaybackCommand;
    _initHub();
  }

  Future<void> _initHub() async {
    await _hub.connect();
    await _hub.joinSpace(widget.spaceId);

    // Sync vị trí hiện tại từ REST (tablet reconnect / cold start)
    final state = await context.read<CamsApiService>().getSpaceState(widget.spaceId);
    if (state.hlsUrl != null) {
      if (state.isPaused && state.pausePositionSeconds != null) {
        _loadPlayer(state.hlsUrl!, seekTo: state.pausePositionSeconds!.toDouble());
        _audioPlayer.pause();
      } else if (state.seekOffsetSeconds != null) {
        _loadPlayer(state.hlsUrl!, seekTo: state.seekOffsetSeconds!);
      }
    }

    // Subscribe SpaceStateSync — nguồn sự thật sau mỗi state change
    _hub.onSpaceStateSync = _onSpaceStateSync;
  }

  void _onPlayStream({
    required String hlsUrl,
    required String playlistId,
    required int transitionType,
    required DateTime startedAtUtc,
  }) {
    // transitionType == 1: hard-switch ngay
    // transitionType == 2: crossfade
    // transitionType == 3: Pending — bỏ qua, chờ PlayStream tiếp theo
    if (transitionType == 3) return;
    _loadPlayer(hlsUrl, seekTo: 0);
  }

  void _onPlaybackCommand({
    required int command,
    double? seekPositionSeconds,
    String? targetTrackId,
  }) {
    // Thực hiện lệnh tức thì — SpaceStateSync sẽ đến ngay sau để confirm state
    switch (command) {
      case 1: _audioPlayer.pause();
      case 2: _audioPlayer.play();
      case 3: case 4: case 5: case 6: case 7: case 8:
        if (seekPositionSeconds != null) {
          _audioPlayer.seek(Duration(milliseconds: (seekPositionSeconds * 1000).toInt()));
        }
    }
  }

  void _onSpaceStateSync(SpaceStateDto state) {
    // Rebuild toàn bộ UI state từ SpaceStateSync
    setState(() { /* update your local state: currentTrackName, isManualOverride, etc. */ });

    if (state.isPaused) {
      // Đồng bộ pause position
      final pos = state.pausePositionSeconds?.toDouble() ?? 0;
      _audioPlayer.seek(Duration(milliseconds: (pos * 1000).toInt()));
      _audioPlayer.pause();
    } else if (state.pendingQueueItemId != null) {
      // Override đang transcode — hiển thị loading state
    } else if (state.hlsUrl != null && state.startedAtUtc != null) {
      // Tính lại seek từ startedAtUtc (SpaceStateSync không có seekOffsetSeconds)
      final offset = DateTime.now().toUtc().difference(state.startedAtUtc!).inMilliseconds / 1000.0;
      _audioPlayer.seek(Duration(milliseconds: (offset * 1000).toInt()));
    }
  }

  void _loadPlayer(String hlsUrl, {required double seekTo}) {
    // Dùng just_audio, video_player, hoặc HLS player tương ứng
  }

  late final _audioPlayer = /* your audio player instance */;

  @override
  void dispose() {
    _hub.leaveSpace(widget.spaceId);
    _hub.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => const Placeholder();
}
```

---

## 7. Setup — Web / TypeScript (Manager Dashboard)

### 5.1 Cài package

```bash
npm install @microsoft/signalr
# hoặc
yarn add @microsoft/signalr
```

### 5.2 Service class mẫu

```typescript
import * as signalR from '@microsoft/signalr';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlayStreamPayload {
  spaceId: string;
  hlsUrl: string;
  transitionType: TransitionType; // số nguyên
  playlistId: string;
  isManualOverride: boolean;
  startedAtUtc: string; // ISO 8601
}

export interface PlaybackStateChangedPayload {
  spaceId: string;
  command: PlaybackCommand; // số nguyên
  seekPositionSeconds: number | null;
  targetTrackId: string | null;
}

export interface SpaceQueueStateItemDto {
  queueItemId: string;
  trackId: string;
  trackName: string | null;
  position: number;
  queueStatus: number; // 0=Pending, 1=Playing, 2=Played, 3=Skipped
  source: number; // 0=AI, 1=Manager
  hlsUrl: string | null;
  isReadyToStream: boolean;
}

export interface SpaceStateDto {
  spaceId: string;
  storeId: string;
  brandId: string;
  currentQueueItemId: string | null;
  currentTrackName: string | null;
  hlsUrl: string | null;
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: OverrideMode | null; // 1=DirectPlaylist, 2=MoodOverride
  startedAtUtc: string | null; // ISO 8601 UTC
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null; // null trong SignalR push; có trong REST
  isPaused: boolean;
  pausePositionSeconds: number | null;
  pendingQueueItemId: string | null;
  pendingOverrideReason: string | null;

  volumePercent: number;
  isMuted: boolean;
  queueEndBehavior: number;
  spaceQueueItems: SpaceQueueStateItemDto[];
}

export enum OverrideMode {
  DirectPlaylist = 1,
  MoodOverride = 2,
}

/** Tính seek offset thực tế từ SpaceStateDto (dùng cho cả REST và SignalR) */
export function getEffectiveSeekOffset(state: SpaceStateDto): number {
  if (state.isPaused) return state.pausePositionSeconds ?? 0;
  if (state.seekOffsetSeconds != null) return state.seekOffsetSeconds;
  if (!state.startedAtUtc) return 0;
  return (Date.now() - new Date(state.startedAtUtc).getTime()) / 1000;
}

export enum PlaybackCommand {
  Pause = 1,
  Resume = 2,
  Seek = 3,
  SeekForward = 4,
  SeekBackward = 5,
  SkipNext = 6,
  SkipPrevious = 7,
  SkipToTrack = 8,
  TrackEnded = 9,
}

export enum TransitionType {
  Immediate = 1,
  Crossfade = 2,
  Pending = 3,
}

// ─── Service ────────────────────────────────────────────────────────────────

export class StoreHubService {
  private connection: signalR.HubConnection;
  private currentSpaceId: string | null = null;
  private currentStoreId: string | null = null;

  constructor(private readonly getAccessToken: () => string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/store', {
        accessTokenFactory: () => this.getAccessToken(),
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => {
          // Exponential backoff: 0s, 2s, 5s, 10s, 30s, ...
          const delays = [0, 2000, 5000, 10000, 30000];
          return delays[
            Math.min(context.previousRetryCount, delays.length - 1)
          ];
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerListeners();
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    await this.connection.start();
    console.log(
      '[StoreHub] Connected. ConnectionId:',
      this.connection.connectionId,
    );
  }

  async disconnect(): Promise<void> {
    await this.connection.stop();
  }

  // ─── Client → Server ────────────────────────────────────────────────────────

  /** Tablet: đăng ký nhận events của Space */
  async joinSpace(spaceId: string): Promise<void> {
    this.currentSpaceId = spaceId;
    await this.connection.invoke('JoinSpaceAsync', spaceId);
  }

  async leaveSpace(spaceId: string): Promise<void> {
    this.currentSpaceId = null;
    await this.connection.invoke('LeaveSpaceAsync', spaceId);
  }

  /** Manager: đăng ký nhận events của toàn Store */
  async joinManagerRoom(storeId: string): Promise<void> {
    this.currentStoreId = storeId;
    await this.connection.invoke('JoinManagerRoomAsync', storeId);
  }

  // ─── Server → Client listeners ───────────────────────────────────────────────

  private registerListeners(): void {
    this.connection.on('ConnectionConfirmed', (data) => {
      console.log('[StoreHub] Joined:', data);
    });

    this.connection.on('PlayStream', (payload: PlayStreamPayload) => {
      // Bỏ qua Pending — stream chưa sẵn sàng
      if (payload.transitionType === TransitionType.Pending) return;

      this.playStreamHandlers.forEach((h) => h(payload));
    });

    this.connection.on(
      'PlaybackStateChanged',
      (payload: PlaybackStateChangedPayload) => {
        this.playbackCommandHandlers.forEach((h) => h(payload));
      },
    );

    this.connection.on('SpaceStateSync', (state: SpaceStateDto) => {
      this.stateSyncHandlers.forEach((h) => h(state));
    });

    this.connection.on('StopPlayback', () => {
      this.stopHandlers.forEach((h) => h());
    });

    this.connection.on('Error', (message: string) => {
      console.error('[StoreHub] Server error:', message);
    });

    // Reconnect: re-join sau khi mất kết nối
    this.connection.onreconnected(async () => {
      console.log('[StoreHub] Reconnected');
      if (this.currentSpaceId) await this.joinSpace(this.currentSpaceId);
      if (this.currentStoreId) await this.joinManagerRoom(this.currentStoreId);
    });

    this.connection.onreconnecting((error) => {
      console.warn('[StoreHub] Reconnecting...', error);
    });

    this.connection.onclose((error) => {
      console.error('[StoreHub] Connection closed:', error);
    });
  }

  // ─── Event subscription API ──────────────────────────────────────────────────

  private playStreamHandlers = new Set<(p: PlayStreamPayload) => void>();
  private playbackCommandHandlers = new Set<
    (p: PlaybackStateChangedPayload) => void
  >();
  private stateSyncHandlers = new Set<(s: SpaceStateDto) => void>();
  private stopHandlers = new Set<() => void>();

  onPlayStream(handler: (p: PlayStreamPayload) => void): () => void {
    this.playStreamHandlers.add(handler);
    return () => this.playStreamHandlers.delete(handler); // returns unsub fn
  }

  onPlaybackCommand(
    handler: (p: PlaybackStateChangedPayload) => void,
  ): () => void {
    this.playbackCommandHandlers.add(handler);
    return () => this.playbackCommandHandlers.delete(handler);
  }

  onSpaceStateSync(handler: (s: SpaceStateDto) => void): () => void {
    this.stateSyncHandlers.add(handler);
    return () => this.stateSyncHandlers.delete(handler);
  }

  onStopPlayback(handler: () => void): () => void {
    this.stopHandlers.add(handler);
    return () => this.stopHandlers.delete(handler);
  }

  get state(): signalR.HubConnectionState {
    return this.connection.state;
  }
}
```

### 5.3 Sử dụng trong React component

```tsx
import { useEffect, useRef } from 'react';
import {
  StoreHubService,
  PlayStreamPayload,
  PlaybackStateChangedPayload,
} from '@/services/StoreHubService';
import { useAuthStore } from '@/stores/authStore';

// Singleton hub per session
let hubInstance: StoreHubService | null = null;

function getHub(getToken: () => string): StoreHubService {
  if (!hubInstance) {
    hubInstance = new StoreHubService(getToken);
  }
  return hubInstance;
}

export function useStoreHub(spaceId: string) {
  const getAccessToken = useAuthStore((s) => s.getAccessToken);
  const hubRef = useRef<StoreHubService | null>(null);

  useEffect(() => {
    const hub = getHub(getAccessToken);
    hubRef.current = hub;

    let cleanup: (() => void)[] = [];

    async function init() {
      // Connect nếu chưa kết nối
      if (hub.state !== 'Connected') {
        await hub.connect();
      }
      await hub.joinSpace(spaceId);

      // Subscribe events
      cleanup.push(
        hub.onPlayStream((payload: PlayStreamPayload) => {
          console.log(
            'New stream:',
            payload.hlsUrl,
            'transition:',
            payload.transitionType,
          );
          // Update your audio player / state manager here
        }),

        hub.onPlaybackCommand((payload: PlaybackStateChangedPayload) => {
          console.log(
            'Playback command:',
            payload.command,
            'seek:',
            payload.seekPositionSeconds,
          );
          // Sync UI state (pause icon, progress bar, etc.)
        }),

        hub.onSpaceStateSync((state: SpaceStateDto) => {
          // Rebuild toàn bộ UI state — SpaceStateSync là nguồn sự thật
          setSpaceState(state);

          if (state.isPaused) {
            // Đồng bộ player về vị trí pause
            audioPlayer.seek(state.pausePositionSeconds ?? 0);
            audioPlayer.pause();
          } else if (state.pendingQueueItemId) {
            // Đang chờ transcode — hiển thị loading indicator
          } else if (state.hlsUrl && state.startedAtUtc) {
            // Resume: tính offset thực tế
            const offset = getEffectiveSeekOffset(state);
            audioPlayer.seek(offset);
            audioPlayer.play();
          }
        }),
      );
    }

    init().catch(console.error);

    return () => {
      hub.leaveSpace(spaceId);
      cleanup.forEach((unsub) => unsub());
    };
  }, [spaceId]);

  return hubRef;
}
```

### 5.4 Sử dụng trong manager room (manager toast/notification)

```tsx
// Kết hợp joinSpace (cho một Space cụ thể) + joinManagerRoom (toàn Store)

async function setupManagerHub(
  hub: StoreHubService,
  storeId: string,
  spaceId: string,
) {
  await hub.connect();
  await hub.joinManagerRoom(storeId); // nhận events toàn Store
  await hub.joinSpace(spaceId); // nhận events Space đang xem

  hub.onSpaceStateSync((state: SpaceStateDto) => {
    // SpaceStateSync bắn sau Override / CancelOverride / mọi lệnh Playback
    if (!state.isManualOverride) {
      toast.success('Override đã được hủy. AI scheduling đã tiếp quản.');
    }
    if (state.isPaused) {
      toast.info(`Playback paused tại ${state.pausePositionSeconds}s`);
    }
    updateSpacePanel(state); // rebuild dashboard UI từ full state
  });
}
```

---

## 8. Connection Groups

| Group name         | Thành viên                                      | Events nhận                                                  |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------ |
| `{spaceId}` (GUID) | Tablet của Space đó + manager đang xem Space đó | `PlayStream`, `PlaybackStateChanged`, `StopPlayback`         |
| `mgr-{storeId}`    | Tất cả manager tabs/sessions của Store          | `SpaceStateSync`, `OverrideActivated`\*, `OverrideCleared`\* |

> \* Chưa implement, dự kiến Phase 14.

**Một connection có thể join nhiều group** — manager gọi cả `JoinSpaceAsync` lẫn `JoinManagerRoomAsync` để nhận đủ events.

---

## 9. Error Handling & Reconnect

### Reconnect tự động

Cả hai client (Flutter và TypeScript) đã cấu hình `withAutomaticReconnect`. Sau reconnect, code phải **tự gọi lại** `JoinSpaceAsync` / `JoinManagerRoomAsync` vì SignalR group membership không được giữ nguyên sau disconnect.

Hook `onreconnected` trong service class đã xử lý việc này.

### Khi `skipNegotiation: true` không dùng được

Nếu server dùng proxy (Nginx/IIS) không pass WebSocket, bỏ qua `skipNegotiation` và đổi transport:

```dart
// Flutter
options: HttpConnectionOptions(
  // Xóa skipNegotiation và transport
)
```

```typescript
// TypeScript — cho phép fallback
.withUrl('/hubs/store', {
  accessTokenFactory: () => getAccessToken(),
  // Không set transport → tự negotiate (WebSocket → ServerSentEvents → LongPolling)
})
```

### Sequence: Tablet reconnect sau mất mạng

```
Tablet mất mạng 30s
  → SignalR auto-reconnect
  → onreconnected: JoinSpaceAsync(spaceId)
  → Gọi GET /api/cams/spaces/state           ← REST: seekOffsetSeconds chính xác
  → Nếu isPaused: seekTo(pausePositionSeconds); player.pause()
  → Nếu đang play: seekTo(seekOffsetSeconds); player.play()
  → Nếu pendingQueueItemId ≠ null: hiển thị "⏳ Đang chuẩn bị..."
  → Tiếp tục nhận SignalR events bình thường
```

> **Xem thêm Section 5** cho đầy đủ decision tree và sequence diagrams.

---

## Appendix — SpaceStateDto: mixer & queue end (backend v2)

Tóm tắt nhanh (schema đầy đủ: **Section 4**). Các field sau có trong JSON `GET /api/cams/spaces/.../state` và **`SpaceStateSync`** (camelCase theo ASP.NET):

| Field              | Kiểu             | Mô tả                                                                               |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------- |
| `volumePercent`    | `number` (0–100) | Gợi ý âm lượng cho client; mặc định 100                                             |
| `isMuted`          | `boolean`        | `true` → client nên mute player                                                     |
| `queueEndBehavior` | `number`         | `0` = Stop, `1` = RepeatAll, `2` = RepeatOne (khi bài kết thúc tự nhiên / watchdog) |

**PATCH** ` /api/cams/spaces/state/audio` hoặc `/api/cams/spaces/{spaceId}/state/audio` chỉ cập nhật các field trên; server **enqueue `SpaceStateSync`**, **không** publish `SpaceMusicStatePlaybackChangedDomainEvent` (không reschedule watchdog).

**Client:** sau mỗi `SpaceStateSync`, áp dụng `volumePercent` / `isMuted` cho UI và engine phát. `queueEndBehavior` chỉ cần hiển thị hoặc lưu local nếu product yêu cầu; logic lặp/vòng thực tế do server quyết định khi nhận `TrackEnded` / watchdog.
