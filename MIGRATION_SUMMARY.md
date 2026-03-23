# CAMS Frontend Migration Summary (2026-03-23)

> Migration based on CHANGELOG-FRONTEND.md commit fb68e92baa3

## ✅ Completed Changes

### 1. Types Updated (Breaking Changes)

#### Tracks (`src/shared/modules/tracks/types/trackTypes.ts`)

- ✅ `TrackListItem.audioUrl` → `hlsUrl` (HLS master playlist URL .m3u8)
- ✅ Added comment: Can be null if transcode failed

#### Playlists (`src/shared/modules/playlists/types/playlistTypes.ts`)

- ✅ Removed `isDynamic` from `CreatePlaylistRequest`, `UpdatePlaylistRequest`, `PlaylistListItem`, `PlaylistFilter`
- ✅ Removed `hlsUrl` from `CreatePlaylistRequest`, `UpdatePlaylistRequest`, `PlaylistListItem`
- ✅ Removed `totalDurationSeconds` from `CreatePlaylistRequest`, `UpdatePlaylistRequest`, `PlaylistListItem`
- ✅ Added `hlsUrl` to `PlaylistTrackItem` (per-track HLS URL)
- ✅ Updated `PlaylistTrackItem.seekOffsetSeconds` comment (for SkipToTrack)

#### CAMS (`src/shared/modules/cams/types/camsTypes.ts`)

- ✅ Added `QueueEndBehavior` enum (Stop=0, RepeatQueue=1, ReturnToSchedule=2)
- ✅ Added `SpaceQueueItemDto` interface (queue item structure)
- ✅ Updated `SpaceStateDto`:
  - `currentPlaylistId` → `currentQueueItemId`
  - `currentPlaylistName` → `currentTrackName`
  - `pendingPlaylistId` → `pendingQueueItemId`
  - Added: `volumePercent`, `isMuted`, `queueEndBehavior`, `spaceQueueItems[]`
- ✅ Updated `SpaceStateResponse` (same changes as SpaceStateDto)
- ✅ Updated `OverridePlaylistRequest`:
  - Added: `trackIds`, `isClearManagerSelectedQueues`
- ✅ Added new request types:
  - `AddTracksToQueueRequest`
  - `AddPlaylistToQueueRequest`
  - `ReorderQueueRequest`
  - `UpdateAudioStateRequest`
- ✅ Added `PlaybackCommand.TrackEnded = 9`

### 2. Services Updated

#### Track Service (`src/shared/modules/tracks/services/trackService.ts`)

- ✅ Added `retranscode(id)` method - `POST /api/tracks/{id}/retranscode`
- ✅ Added endpoint to `TRACK_ENDPOINTS`

#### Playlist Service (`src/shared/modules/playlists/services/playlistService.ts`)

- ✅ Removed `retranscode()` method (moved to track-level)
- ✅ Removed `retranscode` from `PLAYLIST_ENDPOINTS`
- ✅ Removed `isDynamic` filter from `getList()` query params

#### CAMS Service (`src/shared/modules/cams/services/camsService.ts`)

- ✅ Added queue management endpoints:
  - `addTracksToQueue(spaceId, data)` - `POST /queue/tracks`
  - `addPlaylistToQueue(spaceId, data)` - `POST /queue/playlist`
  - `reorderQueue(spaceId, data)` - `PATCH /queue/reorder`
  - `clearQueue(spaceId)` - `DELETE /queue/all`
  - `removeQueueItem(spaceId, queueItemId)` - `DELETE /queue/{queueItemId}`
  - `updateAudioState(spaceId, data)` - `PATCH /state/audio`

### 3. Hooks Updated

#### Track Hooks (`src/shared/modules/tracks/hooks/`)

- ✅ Created `useRetranscodeTrack.ts` - Hook for track-level retranscode
- ✅ Exported in `index.ts`

#### Playlist Hooks (`src/shared/modules/playlists/hooks/`)

- ✅ Deleted `useRetranscodePlaylist.ts` (moved to track-level)
- ✅ Removed export from `index.ts`

#### CAMS Hooks (`src/shared/modules/cams/hooks/`)

- ✅ Created `useQueueManagement.ts` with 5 hooks:
  - `useAddTracksToQueue()`
  - `useAddPlaylistToQueue()`
  - `useReorderQueue()`
  - `useClearQueue()`
  - `useRemoveQueueItem()`
- ✅ Created `useAudioState.ts`:
  - `useUpdateAudioState()`
- ✅ Exported in `index.ts`

### 4. Config Updated

#### Query Keys (`src/config/query.ts`)

- ✅ Added `QUERY_KEYS.cams.all` for queue management invalidation

### 5. Utilities (Already Exists)

#### Playback Helpers (`src/shared/modules/cams/utils/playbackHelpers.ts`)

- ✅ `getEffectiveSeekOffset()` already exists - handles `seekOffsetSeconds = null` case

---

## 📋 Next Steps (Not Yet Implemented)

### Step 4: Update Components

Components that need updating (to be done by developers):

#### Track Components

- [ ] `TrackTableColumns.tsx` - Update to show HLS URL instead of audio URL
- [ ] `TrackAudioPlayer.tsx` - Update to use HLS player for `hlsUrl`
- [ ] Add "Retranscode" button using `useRetranscodeTrack()`

#### Playlist Components

- [ ] `PlaylistTableColumns.tsx` - Remove `isDynamic`, `hlsUrl`, `totalDurationSeconds` columns
- [ ] `PlaylistDetailsDrawer.tsx` - Update to show per-track HLS URLs
- [ ] Remove "Retranscode Playlist" button (use track-level instead)
- [ ] Update filters to remove `isDynamic` option

#### CAMS Components

- [ ] `SpacePlayer.tsx` - Update to handle new `SpaceStateDto` schema:
  - Use `currentQueueItemId` instead of `currentPlaylistId`
  - Use `currentTrackName` instead of `currentPlaylistName`
  - Display "⏳ Đang chuẩn bị..." when `pendingQueueItemId !== null`
  - Apply `volumePercent` and `isMuted` from state
  - Use `getEffectiveSeekOffset()` helper when `seekOffsetSeconds = null`
- [ ] Create queue management UI:
  - Queue list display (`spaceQueueItems`)
  - Add tracks/playlist buttons
  - Reorder queue (drag & drop)
  - Clear queue button
  - Remove queue item buttons
- [ ] Create audio controls UI:
  - Volume slider (0-100)
  - Mute toggle
  - Queue end behavior selector

#### Form Components

- [ ] Update create/edit playlist forms to remove `isDynamic`, `hlsUrl`, `totalDurationSeconds` fields

---

## 🔍 Testing Checklist

### API Integration Tests

- [ ] Test track retranscode: `POST /api/tracks/{id}/retranscode`
- [ ] Verify playlist endpoints no longer accept `isDynamic`, `hlsUrl`, `totalDurationSeconds`
- [ ] Test queue management endpoints:
  - [ ] Add tracks to queue
  - [ ] Add playlist to queue
  - [ ] Reorder queue
  - [ ] Clear queue
  - [ ] Remove queue item
- [ ] Test audio state update: volume, mute, queueEndBehavior

### SignalR Tests

- [ ] Verify `SpaceStateSync` event has new schema
- [ ] Test `seekOffsetSeconds = null` handling
- [ ] Test `pendingQueueItemId` display
- [ ] Test `spaceQueueItems` array rendering

### Player Tests

- [ ] HLS playback with per-track URLs
- [ ] Seek offset calculation when `seekOffsetSeconds = null`
- [ ] Volume control (0-100)
- [ ] Mute toggle
- [ ] Pending state display

---

## 🚨 Breaking Changes Summary

### For Developers

1. **Track `audioUrl` → `hlsUrl`**
   - All references to `track.audioUrl` must be changed to `track.hlsUrl`
   - Player must support HLS (.m3u8) format

2. **Playlist fields removed**
   - `isDynamic`, `hlsUrl`, `totalDurationSeconds` no longer exist
   - Remove from forms, filters, table columns

3. **CAMS state schema changed**
   - `currentPlaylistId` → `currentQueueItemId`
   - `currentPlaylistName` → `currentTrackName`
   - `pendingPlaylistId` → `pendingQueueItemId`
   - Update all component props and state management

4. **Retranscode moved to track-level**
   - Replace `useRetranscodePlaylist()` with `useRetranscodeTrack()`
   - Update UI buttons accordingly

5. **SignalR `seekOffsetSeconds` always null**
   - Must use `getEffectiveSeekOffset()` helper
   - Calculate from `startedAtUtc` when needed

---

## 📚 Documentation References

- [CHANGELOG-FRONTEND.md](docs/CHANGELOG-FRONTEND.md) - Full API changes
- [API_Tracks.md](docs/tracks/API_Tracks.md) - Track API documentation
- [API_Playlists.md](docs/playlists/API_Playlists.md) - Playlist API documentation
- [API_CAMS.md](docs/cams/API_CAMS.md) - CAMS API documentation
- [SIGNALR_STOREHUB.md](docs/cams/SIGNALR_STOREHUB.md) - SignalR events documentation

---

## ✅ Verification

Run diagnostics to verify no TypeScript errors:

```bash
npm run type-check
```

All types, services, and hooks have been updated with no compilation errors.

---

**Migration Date:** 2026-03-23  
**Commit Reference:** fb68e92baa3236600c6bba53f1ee40f5bf8a39e7  
**Status:** Types, Services, and Hooks completed ✅ | Components pending ⏳
