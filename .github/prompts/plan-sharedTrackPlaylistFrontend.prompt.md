# Frontend Plan: Shared Track & Playlist Support

## Context

Backend Phases 1–6 are complete. Shared content model:

- `Track.BrandId = null` → shared track (owned by SystemAdmin)
- `Playlist.BrandId = null` → shared playlist (owned by SystemAdmin)

Backend auto-sets `IncludeShared = true` for BM/SM in query handlers — FE does **not** need to send this param for normal flows. Only admin CRUD and visual badges are missing.

---

## Phase A — Types & Service Layer

### A1 — `src/shared/modules/tracks/types/trackTypes.ts`

- Add `includeShared?: boolean` to `TrackFilter` interface

### A2 — `src/shared/modules/playlists/types/playlistTypes.ts`

- Add `includeShared?: boolean` to `PlaylistFilter` interface
- Make `CreatePlaylistRequest.storeId` optional: `storeId?: string`

### A3 — `src/shared/modules/tracks/services/trackService.ts`

- In `getList`: add `if (filter.includeShared !== undefined) params.append('includeShared', filter.includeShared.toString())`

### A4 — `src/shared/modules/playlists/services/playlistService.ts`

- In `getList`: add `if (filter.brandId) params.append('brandId', filter.brandId)`
- In `getList`: add `if (filter.includeShared !== undefined) params.append('includeShared', filter.includeShared.toString())`

---

## Phase B — Shared Visual Components

### B1 — `src/shared/modules/playlists/components/PlaylistTableColumns.tsx`

- Column "Name + Store": when `record.storeId == null` (and `record.brandId == null`), render `<Tag color="purple">Shared</Tag>` in place of store name

### B2 — `src/shared/modules/tracks/components/TrackTableColumns.tsx`

- Column "Title + Artist": when `record.brandId == null`, add `<Tag color="purple">Shared</Tag>` below the title

### B3 — `src/shared/modules/playlists/components/AddTracksDrawer.tsx`

- When `playlist?.brandId` is null: show an info Alert — "Only shared tracks can be added to shared playlists"
- Pass `filter: { includeShared: false }` (or no brandId) to restrict track selector to shared tracks only when in shared-playlist context

### B4 — `src/shared/modules/cams/components/OverrideMusicSourceSelector.tsx` _(high value, low risk)_

- `trackColumns`: add `<Tag color="purple" size="small">Shared</Tag>` when `!record.brandId`
- `playlistColumns`: add `<Tag color="purple" size="small">Shared</Tag>` when `!record.storeId && !record.brandId`
- No filter changes needed — backend already auto-includes shared for BM/SM

---

## Phase C — Admin Track Management CRUD

### C1 — `src/features/admin/pages/TrackManagement/TrackList.tsx`

- Add "Create Shared Track" button (triggers `CreateSharedTrackDrawer`)
- Column actions (`onEdit`, `onDelete`, `onToggleStatus`) — only show/enable when `record.brandId === null` (shared) — brand-owned tracks are read-only from admin view

### C2 — NEW `src/features/admin/pages/TrackManagement/components/CreateSharedTrackDrawer.tsx`

- Fields: Title, Artist, Genre (Select), BPM (Number), Mood (Select), Energy (Slider 0–1), Valence (Slider 0–1), Audio file (Upload), Cover image (Upload)
- No brand/store field — these are system-wide tracks

### C3 — NEW `src/features/admin/pages/TrackManagement/components/EditSharedTrackDrawer.tsx`

- Same fields as Create, pre-populated from selected track
- Only callable when `track.brandId === null`

### C4 — `src/features/admin/pages/TrackManagement/components/index.ts`

- Export `CreateSharedTrackDrawer`, `EditSharedTrackDrawer`

---

## Phase D — Admin Playlist Management CRUD

### D1 — `src/features/admin/pages/PlaylistManagement/PlaylistList.tsx`

- Add "Create Shared Playlist" button (triggers `CreateSharedPlaylistDrawer`)
- Column actions (`onEdit`, `onDelete`, `onToggleStatus`, `onAddTracks`) — only show/enable when `record.brandId === null`
- Wire `AddTracksDrawer` with shared-playlist context flag

### D2 — `src/features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx`

- Remove read-only Alert (currently blocks admin from filtering)
- Add "Shared (System)" sentinel option to Brand filter (value: `"__shared__"`) — maps to `{ includeShared: true, brandId: undefined }` in filter logic

### D3 — NEW `src/features/admin/pages/PlaylistManagement/components/CreateSharedPlaylistDrawer.tsx`

- Fields: Name, Mood (Select), Description (Textarea), IsDefault (Switch)
- No storeId / brandId fields — shared playlist is system-wide

### D4 — NEW `src/features/admin/pages/PlaylistManagement/components/EditSharedPlaylistDrawer.tsx`

- Same fields as Create, pre-populated
- Only callable when `playlist.brandId === null`

### D5 — `src/features/admin/pages/PlaylistManagement/components/index.ts`

- Export `CreateSharedPlaylistDrawer`, `EditSharedPlaylistDrawer`

---

## Phase E — Brand/Store Action Guards

### E1 — `src/features/brand/pages/PlaylistManagement/PlaylistList.tsx`

- `onEdit`, `onDelete`, `onToggleStatus`, `onAddTracks` — disable/hide when `record.brandId === null` (shared playlists are read-only for BM)
- Optionally show a tooltip: "Shared playlists are managed by SystemAdmin"

### E2 — `src/features/store/pages/PlaylistManagement/PlaylistList.tsx`

- Same guard as E1 — SM also cannot mutate shared playlists

---

## File Summary

| #   | File                                                                                | Action  |
| --- | ----------------------------------------------------------------------------------- | ------- |
| A1  | `shared/modules/tracks/types/trackTypes.ts`                                         | Edit    |
| A2  | `shared/modules/playlists/types/playlistTypes.ts`                                   | Edit    |
| A3  | `shared/modules/tracks/services/trackService.ts`                                    | Edit    |
| A4  | `shared/modules/playlists/services/playlistService.ts`                              | Edit    |
| B1  | `shared/modules/playlists/components/PlaylistTableColumns.tsx`                      | Edit    |
| B2  | `shared/modules/tracks/components/TrackTableColumns.tsx`                            | Edit    |
| B3  | `shared/modules/playlists/components/AddTracksDrawer.tsx`                           | Edit    |
| B4  | `shared/modules/cams/components/OverrideMusicSourceSelector.tsx`                    | Edit    |
| C1  | `features/admin/pages/TrackManagement/TrackList.tsx`                                | Edit    |
| C2  | `features/admin/pages/TrackManagement/components/CreateSharedTrackDrawer.tsx`       | **New** |
| C3  | `features/admin/pages/TrackManagement/components/EditSharedTrackDrawer.tsx`         | **New** |
| C4  | `features/admin/pages/TrackManagement/components/index.ts`                          | Edit    |
| D1  | `features/admin/pages/PlaylistManagement/PlaylistList.tsx`                          | Edit    |
| D2  | `features/admin/pages/PlaylistManagement/components/PlaylistFilter.tsx`             | Edit    |
| D3  | `features/admin/pages/PlaylistManagement/components/CreateSharedPlaylistDrawer.tsx` | **New** |
| D4  | `features/admin/pages/PlaylistManagement/components/EditSharedPlaylistDrawer.tsx`   | **New** |
| D5  | `features/admin/pages/PlaylistManagement/components/index.ts`                       | Edit    |
| E1  | `features/brand/pages/PlaylistManagement/PlaylistList.tsx`                          | Edit    |
| E2  | `features/store/pages/PlaylistManagement/PlaylistList.tsx`                          | Edit    |

---

## Priority Order

1. **Phase A** first — unblocks type safety across all other phases
2. **Phase B4** (`OverrideMusicSourceSelector`) — high value, standalone, zero risk
3. **Phase D** — admin playlist CRUD (core feature)
4. **Phase C** — admin track CRUD
5. **Phase B1–B3** — visual polish
6. **Phase E** — guards (defensive, lowest risk last)
