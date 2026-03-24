# ✅ MIGRATION COMPLETED - API Update [2026-03-23]

## 📋 Summary of Changes

Đã hoàn thành migration UI để khớp với API changes từ commit `fb68e92baa3`:

### 1. ✅ Fixed PlaybackCommand Enum

- **File**: `src/shared/modules/cams/constants/camsConstants.ts`
- **Change**: Thêm `PlaybackCommand.TrackEnded = 9` vào `PLAYBACK_COMMAND_LABELS`

### 2. ✅ Removed Playlist Fields (isDynamic, hlsUrl, totalDurationSeconds)

#### PlaylistFilter Components (3 files):

- `src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx`
- `src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx`
- `src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx`
- **Changes**:
  - Loại bỏ `isDynamic` filter
  - Loại bỏ isDynamic tag trong active filters
  - Điều chỉnh column span cho các Select còn lại

#### CreatePlaylistDrawer Components (2 files):

- `src/features/brand/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx`
- `src/features/store/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx`
- **Changes**:
  - Loại bỏ `isDynamic` Form.useWatch
  - Loại bỏ `isDynamic: false` trong form.setFieldsValue
  - Loại bỏ toàn bộ "Advanced Settings" section (hlsUrl, totalDurationSeconds)

#### EditPlaylistDrawer Components (2 files):

- `src/features/brand/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx`
- `src/features/store/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx`
- **Changes**:
  - Loại bỏ `isDynamic` Form.useWatch và Switch control
  - Loại bỏ conditional Alert cho dynamic playlists
  - Loại bỏ `isDynamic`, `hlsUrl`, `totalDurationSeconds` trong form.setFieldsValue
  - Loại bỏ toàn bộ "Advanced Settings" section

#### PlaylistDetailsDrawer:

- `src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx`
- **Changes**:
  - Loại bỏ "Type" field (isDynamic)
  - Loại bỏ "Total Duration" field (totalDurationSeconds)
  - Loại bỏ "HLS Streaming Info" section (hlsUrl)
  - Chỉ hiển thị "Total Tracks" trong Statistics

### 3. ✅ Track Fields Migration (audioUrl → hlsUrl)

#### TrackDetailsDrawer Components (3 files):

- `src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx`
- `src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx`
- `src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx`
- **Changes**: `track.audioUrl` → `track.hlsUrl`

#### EditTrackDrawer:

- `src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx`
- **Changes**: `track?.audioUrl` → `track?.hlsUrl`

### 4. ✅ Space/CAMS Fields Migration

#### SpaceDetailDrawer:

- `src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx`
- **Changes**:
  - `currentPlaylistId` → `currentQueueItemId`
  - `currentPlaylistName` → `currentTrackName`
  - `pendingPlaylistId` → `pendingQueueItemId`
  - Label: "Current Playlist" → "Current Track"
  - Label: "Pending Playlist" → "Pending Track"

#### SpacePlayerCard:

- `src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx`
- **Changes**:
  - `currentPlaylistId` → `currentQueueItemId`
  - `currentPlaylistName` → `currentTrackName`
  - `pendingPlaylistId` → `pendingQueueItemId`

#### SpacePlayer:

- `src/shared/modules/cams/components/SpacePlayer.tsx`
- **Changes**:
  - `currentPlaylistName` → `currentTrackName`
  - `currentPlaylistId` → `currentQueueItemId` (2 places)
  - Display text: "No playlist playing" → "No track playing"

### 5. ✅ Removed useRetranscodePlaylist Hook

#### PlaylistList Components (2 files):

- `src/features/brand/pages/PlaylistManagement/PlaylistList.tsx`
- `src/features/store/pages/PlaylistManagement/PlaylistList.tsx`
- **Changes**:
  - Loại bỏ import và usage của `useRetranscodePlaylist` hook
  - Loại bỏ `handleRetranscode()` function
  - Loại bỏ `onRetranscode` callback từ `getPlaylistColumns()`
  - Lý do: Retranscode giờ là track-level (`POST /api/tracks/{id}/retranscode`), không còn playlist-level

---

## 🧪 Testing Checklist

### Playlist Management:

- [ ] Filter playlists (không còn isDynamic filter)
- [ ] Create playlist (không còn isDynamic field)
- [ ] Edit playlist (không còn isDynamic, hlsUrl, totalDurationSeconds)
- [ ] View playlist details (không còn Type, Total Duration, HLS URL)

### Track Management:

- [ ] View track details (hiển thị HLS player thay vì audio player)
- [ ] Edit track (hiển thị current HLS URL)
- [ ] Upload new track (sẽ có hlsUrl sau khi transcode)

### Space Management:

- [ ] View space details (hiển thị "Current Track" thay vì "Current Playlist")
- [ ] Space player card (hiển thị track name)
- [ ] Playback controls (skip buttons disabled khi không có currentQueueItemId)

### CAMS/SignalR:

- [ ] SpaceStateSync event nhận đúng fields mới
- [ ] PlaybackCommand.TrackEnded được xử lý đúng

---

## 🔧 Build & Deploy

```bash
# Type check
npm run type-check

# Build
npm run build

# Test
npm run test
```

---

## 📝 Notes

1. **Types đã được update đúng** trong:
   - `src/shared/modules/playlists/types/playlistTypes.ts`
   - `src/shared/modules/tracks/types/trackTypes.ts`
   - `src/shared/modules/cams/types/camsTypes.ts`

2. **Hook useRetranscodePlaylist đã bị loại bỏ** vì retranscode giờ là track-level:
   - OLD: `POST /api/playlists/{id}/retranscode`
   - NEW: `POST /api/tracks/{id}/retranscode`

3. **Queue model mới** - Frontend cần implement:
   - Queue management endpoints (add/remove/reorder)
   - Audio mixer controls (volume/mute/queueEndBehavior)
   - Pending state handling (pendingQueueItemId)

4. **SignalR changes** - SpaceStateSync giờ push sau MỌI thay đổi:
   - Override/CancelOverride
   - Pause/Resume/Seek/Skip
   - Queue operations
   - Audio mixer changes

---

## 🚀 Next Steps

1. Test toàn bộ UI flows
2. Implement queue management UI (nếu cần)
3. Implement audio mixer controls (volume/mute/repeat)
4. Update E2E tests
5. Update documentation

---

**Migration completed by**: Kiro AI Assistant
**Date**: 2026-03-23
**Commit reference**: fb68e92baa3236600c6bba53f1ee40f5bf8a39e7
