# 🔧 Pause/Resume Sync Fix

## 🔴 Vấn đề ban đầu

Pause và Resume không đồng bộ giữa manager và player vì:

1. **Type definitions không khớp với API docs** - thiếu `isPaused`, `pausePositionSeconds`
2. **SpacePlayer không xử lý `SpaceStateSync` event** - chỉ dựa vào prop `isPlaying`
3. **`isSpacePlaying()` utility không check `isPaused` flag** - chỉ dựa vào time range
4. **SpacePlayerCard không invalidate query đúng cách** khi nhận SignalR events

## ✅ Giải pháp đã áp dụng

### 1. Cập nhật Type Definitions (`camsTypes.ts`)

```typescript
// ✅ SpaceStateDto - SignalR event payload
export interface SpaceStateDto {
  spaceId: string;
  storeId: string;
  brandId: string;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  hlsUrl: string | null;
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: OverrideMode | null;
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null; // ⚠️ Always null in SignalR
  isPaused: boolean; // ✅ Added
  pausePositionSeconds: number | null; // ✅ Added
  pendingPlaylistId: string | null;
  pendingOverrideReason: string | null;
}

// ✅ SpaceStateResponse - REST API response
export interface SpaceStateResponse {
  // ... same fields as SpaceStateDto
  seekOffsetSeconds: number | null; // ✅ Calculated server-side in REST
  isPaused: boolean; // ✅ Added
  pausePositionSeconds: number | null; // ✅ Added
}
```

### 2. Sửa `isSpacePlaying()` utility (`playbackHelpers.ts`)

```typescript
// ✅ Priority 1: Check isPaused flag (from server)
export const isSpacePlaying = (state: {
  isPaused?: boolean;
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
}): boolean => {
  // ✅ isPaused takes priority
  if (state.isPaused === true) {
    return false;
  }

  // Check time range for AI-scheduled playlists
  if (!state.startedAtUtc || !state.expectedEndAtUtc) {
    return false;
  }

  const now = new Date();
  const startedAt = new Date(state.startedAtUtc);
  const expectedEndAt = new Date(state.expectedEndAtUtc);

  return now >= startedAt && now <= expectedEndAt;
};
```

### 3. Thêm `getEffectiveSeekOffset()` helper (`playbackHelpers.ts`)

```typescript
// ✅ Calculate effective seek offset (REST vs SignalR)
export const getEffectiveSeekOffset = (state: {
  isPaused: boolean;
  pausePositionSeconds: number | null;
  seekOffsetSeconds: number | null;
  startedAtUtc: string | null;
}): number => {
  // Priority 1: If paused, use pause position
  if (state.isPaused) {
    return state.pausePositionSeconds ?? 0;
  }

  // Priority 2: If REST response has seekOffsetSeconds, use it
  if (state.seekOffsetSeconds != null) {
    return state.seekOffsetSeconds;
  }

  // Priority 3: Calculate from startedAtUtc (SignalR case)
  if (!state.startedAtUtc) {
    return 0;
  }

  const now = Date.now();
  const startedAt = new Date(state.startedAtUtc).getTime();
  return Math.max(0, (now - startedAt) / 1000);
};
```

### 4. Cập nhật SpacePlayer sync logic (`SpacePlayer.tsx`)

```typescript
// ✅ Sync audio playback state from server (SpaceStateSync)
useEffect(() => {
  if (!audioRef.current || !state) return;

  const audio = audioRef.current;
  isSyncingRef.current = true;

  // Handle pause state from server
  if (state.isPaused) {
    if (!audio.paused) {
      audio.pause();
    }
    // Sync to pause position
    if (state.pausePositionSeconds != null) {
      audio.currentTime = state.pausePositionSeconds;
    }
  } else {
    // Handle playing state from server
    if (audio.paused && isPlaying) {
      audio.play().catch(console.error);
    }

    // ✅ Use helper to calculate position
    const expectedPosition = getEffectiveSeekOffset(state);

    // Only sync if difference is significant (> 2 seconds)
    const diff = Math.abs(audio.currentTime - expectedPosition);
    if (diff > 2) {
      console.log(
        `🔄 Syncing position: ${audio.currentTime.toFixed(1)}s → ${expectedPosition.toFixed(1)}s`,
      );
      audio.currentTime = expectedPosition;
    }
  }

  setTimeout(() => {
    isSyncingRef.current = false;
  }, 100);
}, [state, isPlaying]);
```

### 5. Sửa SpacePlayerCard logic (`SpacePlayerCard.tsx`)

```typescript
// ✅ Calculate isPlaying - prioritize isPaused flag
const isPlaying = spaceState
  ? !spaceState.isPaused && isSpacePlaying(spaceState)
  : false;

// ✅ Listen to SignalR events and invalidate query
useEffect(() => {
  if (onPlayStreamReceived) {
    console.log('🎵 PlayStream received for space:', space.id);
    queryClient.invalidateQueries({
      queryKey: ['cams-space-state', space.id],
    });
  }
}, [onPlayStreamReceived, space.id, queryClient]);

useEffect(() => {
  if (onPlaybackCommandReceived) {
    console.log('⏯️ PlaybackCommand received for space:', space.id);
    queryClient.invalidateQueries({
      queryKey: ['cams-space-state', space.id],
    });
  }
}, [onPlaybackCommandReceived, space.id, queryClient]);
```

### 6. Cập nhật SpaceList SignalR handlers (`SpaceList.tsx`)

```typescript
// ✅ SpaceStateSync is the source of truth
const { isConnected, isConnecting } = useStoreHub(
  user?.storeId || null,
  accessToken,
  {
    onPlayStream: (payload) => {
      console.log('🎵 PlayStream event received:', payload);
      setPlayStreamTrigger((prev) => prev + 1);
      refetch();
    },
    onPlaybackStateChanged: (payload) => {
      console.log('⏯️ PlaybackStateChanged event received:', payload);
      setPlaybackCommandTrigger((prev) => prev + 1);
    },
    onSpaceStateSync: (spaceId, state) => {
      console.log('🔄 SpaceStateSync event received:', spaceId, state);
      // ✅ Update both triggers
      setPlayStreamTrigger((prev) => prev + 1);
      setPlaybackCommandTrigger((prev) => prev + 1);
      refetch();
    },
  },
);
```

## 📋 Checklist

- [x] Cập nhật `SpaceStateDto` và `SpaceStateResponse` types
- [x] Sửa `isSpacePlaying()` để check `isPaused` flag
- [x] Thêm `getEffectiveSeekOffset()` helper
- [x] Cập nhật SpacePlayer sync logic
- [x] Sửa SpacePlayerCard `isPlaying` calculation
- [x] Cập nhật SignalR event handlers trong SpaceList
- [x] Thêm logging để debug

## 🧪 Testing

### Test Case 1: Pause

1. Manager click Pause button
2. ✅ `PlaybackStateChanged` event → command = 1 (Pause)
3. ✅ `SpaceStateSync` event → `isPaused = true`, `pausePositionSeconds = N`
4. ✅ SpacePlayer pause audio tại vị trí N giây
5. ✅ UI hiển thị pause icon

### Test Case 2: Resume

1. Manager click Play button (khi đang pause)
2. ✅ `PlaybackStateChanged` event → command = 2 (Resume)
3. ✅ `SpaceStateSync` event → `isPaused = false`, `startedAtUtc` updated
4. ✅ SpacePlayer resume từ `pausePositionSeconds`
5. ✅ UI hiển thị play icon

### Test Case 3: Reconnect sau mất mạng

1. Tablet mất mạng 30s
2. SignalR auto-reconnect
3. ✅ Gọi `GET /api/cams/spaces/state` → lấy `seekOffsetSeconds` chính xác
4. ✅ Nếu `isPaused = true`: seekTo(`pausePositionSeconds`)
5. ✅ Nếu đang play: seekTo(`seekOffsetSeconds`)

## 📚 Tham khảo

- **API_CAMS.md § 3.4** - SpaceStateDto field reference
- **SIGNALR_STOREHUB.md § 4** - SpaceStateDto schema
- **SIGNALR_STOREHUB.md § 5** - State sync lifecycle
