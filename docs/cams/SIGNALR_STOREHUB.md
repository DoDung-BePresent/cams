# StoreHub — SignalR Connection Guide

Hướng dẫn kết nối và sử dụng SignalR Hub `StoreHub` cho **tablet (Flutter/Dart)** và **manager web app (TypeScript/React)**.

Hub URL: **`/hubs/store`**

> **Tham khảo REST API:** [API_CAMS.md](API_CAMS.md)

---

## Mục lục

1. [Enum Contract — StoreHub Payloads](#1-enum-contract--storehub-payloads)
2. [Hub Methods (Client → Server)](#2-hub-methods-client--server)
3. [Server Events (Server → Client)](#3-server-events-server--client)
4. [Setup — Flutter / Dart (Tablet)](#4-setup--flutter--dart-tablet)
5. [Setup — Web / TypeScript (Manager Dashboard)](#5-setup--web--typescript-manager-dashboard)
6. [Connection Groups](#6-connection-groups)
7. [Error Handling & Reconnect](#7-error-handling--reconnect)

---

## 1. Enum Contract — StoreHub Payloads

Tất cả enum trong SignalR payload dùng **giá trị số nguyên**. KHÔNG dùng string.

### `PlaybackCommandEnum`

_Dùng trong: event `PlaybackStateChanged` (field `command`)_

| Giá trị | Tên            | `seekPositionSeconds` trong event       | `targetTrackId` trong event |
| ------- | -------------- | --------------------------------------- | --------------------------- |
| `1`     | `Pause`        | null                                    | null                        |
| `2`     | `Resume`       | null                                    | null                        |
| `3`     | `Seek`         | Vị trí tuyệt đối (giây)                 | null                        |
| `4`     | `SeekForward`  | **Absolute** đã tính (không phải delta) | null                        |
| `5`     | `SeekBackward` | **Absolute** đã tính (không phải delta) | null                        |
| `6`     | `SkipNext`     | Offset của track kế (absolute)          | GUID của track kế           |
| `7`     | `SkipPrevious` | Offset của track trước (absolute)       | null                        |
| `8`     | `SkipToTrack`  | Offset của track đích (absolute)        | GUID của track đích         |

> ⚠️ Khi server relay `SeekForward`/`SeekBackward`, giá trị `seekPositionSeconds` trong event đã được **convert sang vị trí tuyệt đối** — tablet gọi `seekTo(seekPositionSeconds)` trực tiếp, không cộng/trừ thêm.

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

Tablet/brand gọi khi rời Space (trước khi switch sang Space khác).

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

Gửi sau `CancelOverride` — toàn bộ `SpaceStateDto` để client re-render.

```json
{
  "spaceId": "uuid",
  "currentPlaylistId": "uuid",
  "currentPlaylistName": "Evening Chill",
  "hlsUrl": "https://...",
  "moodName": "Chill",
  "isManualOverride": false,
  "overrideMode": null,
  "startedAtUtc": "2026-03-08T09:30:00Z",
  "expectedEndAtUtc": null,
  "seekOffsetSeconds": 182.0
}
```

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

## 4. Setup — Flutter / Dart (Tablet)

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

    // Đồng bộ toàn bộ state (sau cancel override)
    _connection.on('SpaceStateSync', (args) {
      final payload = args?[0] as Map<String, dynamic>?;
      onSpaceStateSync?.call(payload);
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

  void Function(Map<String, dynamic>? state)? onSpaceStateSync;
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

    // Sync vị trí hiện tại từ REST (tablet reconnect)
    final state = await context.read<CamsApiService>().getSpaceState(widget.spaceId);
    if (state.hlsUrl != null && state.seekOffsetSeconds != null) {
      _loadPlayer(state.hlsUrl!, seekTo: state.seekOffsetSeconds!);
    }
  }

  void _onPlayStream({
    required String hlsUrl,
    required String playlistId,
    required int transitionType,
    required DateTime startedAtUtc,
  }) {
    // transitionType == 1: switch ngay
    // transitionType == 2: crossfade
    _loadPlayer(hlsUrl, seekTo: 0);
  }

  void _onPlaybackCommand({
    required int command,
    double? seekPositionSeconds,
    String? targetTrackId,
  }) {
    switch (command) {
      case 1: // Pause
        _audioPlayer.pause();
      case 2: // Resume
        _audioPlayer.play();
      case 3: // Seek (absolute) — cả SeekForward/Backward/SkipToTrack đã được server convert
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        if (seekPositionSeconds != null) {
          _audioPlayer.seek(Duration(milliseconds: (seekPositionSeconds * 1000).toInt()));
        }
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

## 5. Setup — Web / TypeScript (Manager Dashboard)

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

export interface SpaceStateDto {
  spaceId: string;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  hlsUrl: string | null;
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: number | null;
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null;
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

        hub.onSpaceStateSync((state) => {
          console.log('State synced:', state);
          // Re-render space overview panel
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

  hub.onSpaceStateSync((state) => {
    // Khi manager khác cancel override → tự đồng bộ UI
    toast.success('Override đã được hủy. AI scheduling đã tiếp quản.');
    updateSpacePanel(state);
  });
}
```

---

## 6. Connection Groups

| Group name         | Thành viên                                      | Events nhận                                                  |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------ |
| `{spaceId}` (GUID) | Tablet của Space đó + manager đang xem Space đó | `PlayStream`, `PlaybackStateChanged`, `StopPlayback`         |
| `mgr-{storeId}`    | Tất cả manager tabs/sessions của Store          | `SpaceStateSync`, `OverrideActivated`\*, `OverrideCleared`\* |

> \* Chưa implement, dự kiến Phase 14.

**Một connection có thể join nhiều group** — manager gọi cả `JoinSpaceAsync` lẫn `JoinManagerRoomAsync` để nhận đủ events.

---

## 7. Error Handling & Reconnect

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
  → Gọi GET /api/cams/spaces/{spaceId}/state
  → seekTo(state.seekOffsetSeconds)   ← đồng bộ lại vị trí thực tế
  → Tiếp tục stream bình thường
```
