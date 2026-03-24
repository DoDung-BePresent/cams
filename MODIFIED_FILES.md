# Modified Files - API Migration [2026-03-23]

## Total: 19 files modified

### 1. Constants & Types (1 file)

```
src/shared/modules/cams/constants/camsConstants.ts
```

- Added `PlaybackCommand.TrackEnded` to PLAYBACK_COMMAND_LABELS

---

### 2. Playlist Filter Components (3 files)

```
src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx
src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx
src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx
```

- Removed `isDynamic` filter from UI
- Removed `isDynamic` from hasActiveFilters check
- Removed `isDynamic` tag from active filters display
- Adjusted column spans

---

### 3. Playlist Create/Edit Drawers (4 files)

```
src/features/brand/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx
src/features/store/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx
src/features/brand/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx
src/features/store/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx
```

- Removed `isDynamic` Form.useWatch
- Removed `isDynamic`, `hlsUrl`, `totalDurationSeconds` from form values

---

### 4. Playlist Details (2 files)

```
src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx
src/shared/modules/playlists/components/PlaylistTableColumns.tsx
```

- Removed "Type" field (isDynamic)
- Removed "Total Duration" field
- Removed "HLS Streaming Info" section
- Removed `onRetranscode` action from table columns

---

### 5. Track Components (4 files)

```
src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx
src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx
src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx
src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx
```

- Changed `track.audioUrl` → `track.hlsUrl`
- Changed `track?.audioUrl` → `track?.hlsUrl`

---

### 6. Space/CAMS Components (3 files)

```
src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx
src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx
src/shared/modules/cams/components/SpacePlayer.tsx
```

- Changed `currentPlaylistId` → `currentQueueItemId`
- Changed `currentPlaylistName` → `currentTrackName`
- Changed `pendingPlaylistId` → `pendingQueueItemId`
- Updated labels and display text

---

### 7. Playlist List Components (2 files)

```
src/features/brand/pages/PlaylistManagement/PlaylistList.tsx
src/features/store/pages/PlaylistManagement/PlaylistList.tsx
```

- Removed `useRetranscodePlaylist` import and usage
- Removed `handleRetranscode()` function
- Removed `onRetranscode` callback from `getPlaylistColumns()`

---

## Git Commands

```bash
# Stage all modified files
git add src/shared/modules/cams/constants/camsConstants.ts
git add src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx
git add src/features/brand/pages/PlaylistManagement/components/PlaylistFilter.tsx
git add src/features/store/pages/PlaylistManagement/components/PlaylistFilter.tsx
git add src/features/brand/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx
git add src/features/store/pages/PlaylistManagement/components/CreatePlaylistDrawer.tsx
git add src/features/brand/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx
git add src/features/store/pages/PlaylistManagement/components/EditPlaylistDrawer.tsx
git add src/shared/modules/playlists/components/PlaylistDetailsDrawer.tsx
git add src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx
git add src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx
git add src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx
git add src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx
git add src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx
git add src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx
git add src/shared/modules/cams/components/SpacePlayer.tsx
git add src/features/brand/pages/PlaylistManagement/PlaylistList.tsx
git add src/features/store/pages/PlaylistManagement/PlaylistList.tsx

# Commit
git commit -m "feat: migrate UI to match API changes [2026-03-23]

- Remove playlist fields: isDynamic, hlsUrl, totalDurationSeconds
- Migrate track audioUrl → hlsUrl
- Update CAMS fields: currentPlaylistId/Name → currentQueueItemId/TrackName
- Update pending fields: pendingPlaylistId → pendingQueueItemId
- Add PlaybackCommand.TrackEnded enum
- Remove useRetranscodePlaylist hook (moved to track-level)

Ref: commit fb68e92baa3236600c6bba53f1ee40f5bf8a39e7"
```

---

## Verification

Run these commands to verify:

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```
