# Queue Management UI Implementation [2026-03-24]

## Overview

Implemented complete UI for queue management features based on the new queue-based playback model from backend update `fb68e92baa3`.

## Components Created

### 1. QueueList Component ✅

**File:** `src/shared/modules/cams/components/QueueList.tsx`

**Features:**

- Display queue items with position, track name, status, and source
- Status badges (Playing/Pending/Played/Skipped) with icons and colors
- Source badges (AI/Manager)
- Transcoding indicator for tracks not ready to stream
- Remove button for each item (disabled for currently playing track)
- Drag handle for future reorder functionality
- Empty state when no tracks in queue

**Status Icons:**

- 🟢 Playing (green play icon)
- 🔵 Pending (blue clock icon)
- ⚪ Played (gray check icon)
- 🔴 Skipped (red stop icon)

### 2. AudioMixerControls Component ✅

**File:** `src/shared/modules/cams/components/AudioMixerControls.tsx`

**Features:**

- Volume slider (0-100%) with live percentage display
- Mute toggle switch with icon indicators
- Queue end behavior dropdown:
  - Stop (0)
  - Repeat Queue (1)
  - Return to Schedule (2)
- Real-time state updates via mutation hooks
- Disabled state during loading

### 3. AddToQueueModal Component ✅

**File:** `src/shared/modules/cams/components/AddToQueueModal.tsx`

**Features:**

- Tabbed interface for Tracks vs Playlist selection
- Multi-select for tracks
- Single-select for playlist
- Queue mode selector (button group):
  - **Play Now** (1): Switch immediately to track
  - **Play Next** (2): Add after current track
  - **Add to Queue** (3): Add to end of queue
- Clear existing queue option (switch)
- Optional reason field (max 500 chars)
- Form validation
- Loading states during mutations

### 4. QueueManagementDrawer Component ✅

**File:** `src/shared/modules/cams/components/QueueManagementDrawer.tsx`

**Features:**

- Large drawer (right side) with space name in header
- Audio mixer controls section
- Queue list section with item count
- Action buttons in header:
  - Refresh queue
  - Clear all (with confirmation)
  - Add to queue (opens modal)
- Real-time queue data fetching
- Integrated with all queue management hooks

## Integration Points

### 1. Space Table Columns ✅

**File:** `src/features/store/pages/SpaceManagement/components/SpaceTableColumns.tsx`

**Changes:**

- Added "Manage Queue" action to dropdown menu
- Added `UnorderedListOutlined` icon
- Added `onManageQueue` callback to actions type

### 2. Space List Page ✅

**File:** `src/features/store/pages/SpaceManagement/SpaceList.tsx`

**Changes:**

- Added `queueDrawerOpen` state
- Added `handleManageQueue` handler
- Imported `QueueManagementDrawer` component
- Passed `onManageQueue` to table columns
- Rendered drawer with space context (spaceId, storeId, spaceName)

### 3. Space Detail Drawer ✅

**File:** `src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx`

**Changes:**

- Added "Audio Mixer" section showing:
  - Volume percentage
  - Muted status (Yes/No tag)
  - Queue end behavior (Stop/Repeat Queue/Return to Schedule)
  - Queue items count

## Hooks Used

All hooks are already implemented and working:

1. **useSpaceQueue()** - GET queue snapshot
2. **useAddTracksToQueue()** - Add tracks with mode
3. **useAddPlaylistToQueue()** - Add playlist tracks
4. **useReorderQueue()** - Reorder pending items (UI not implemented yet)
5. **useClearQueue()** - Clear entire queue
6. **useRemoveQueueItem()** - Remove specific item
7. **useUpdateAudioState()** - Update volume/mute/queueEndBehavior
8. **useSpaceState()** - Get current space state for audio mixer

## User Flows

### Flow 1: View Queue

1. Navigate to Space Management
2. Click "..." menu on any space
3. Click "Manage Queue"
4. Drawer opens showing:
   - Audio mixer controls
   - Current queue items with status

### Flow 2: Add Tracks to Queue

1. Open Queue Management Drawer
2. Click "Add to Queue" button
3. Modal opens with tabs (Tracks/Playlist)
4. Select tracks or playlist
5. Choose queue mode (Play Now/Play Next/Add to Queue)
6. Optionally toggle "Clear existing queue"
7. Optionally add reason
8. Click "Add to Queue"
9. Queue refreshes automatically

### Flow 3: Manage Audio

1. Open Queue Management Drawer
2. Adjust volume slider (0-100%)
3. Toggle mute switch
4. Select queue end behavior from dropdown
5. Changes apply immediately via API

### Flow 4: Remove Queue Items

1. Open Queue Management Drawer
2. Click trash icon on any queue item
3. Item removed (except currently playing track)
4. Queue updates automatically

### Flow 5: Clear Queue

1. Open Queue Management Drawer
2. Click "Clear All" button
3. Confirmation dialog appears
4. Confirm to clear entire queue
5. Queue empties

## Files Modified

### New Files (4)

1. `src/shared/modules/cams/components/QueueList.tsx`
2. `src/shared/modules/cams/components/AudioMixerControls.tsx`
3. `src/shared/modules/cams/components/AddToQueueModal.tsx`
4. `src/shared/modules/cams/components/QueueManagementDrawer.tsx`

### Modified Files (5)

1. `src/shared/modules/cams/components/index.ts` - Added exports
2. `src/features/store/pages/SpaceManagement/components/SpaceTableColumns.tsx` - Added action
3. `src/features/store/pages/SpaceManagement/SpaceList.tsx` - Integrated drawer
4. `src/features/store/pages/SpaceManagement/components/SpaceDetailDrawer.tsx` - Added audio mixer section
5. `src/config/query.ts` - Added queue query key (already done)

## TypeScript Status

✅ All files compile without errors
✅ All type definitions correct
✅ All imports resolved
✅ All hooks properly typed

## Testing Checklist

### Queue Display

- [ ] Queue items display with correct position numbers
- [ ] Status badges show correct colors and icons
- [ ] Source badges distinguish AI vs Manager
- [ ] Transcoding indicator appears for non-ready tracks
- [ ] Empty state shows when queue is empty
- [ ] Currently playing track has green background

### Add to Queue

- [ ] Tracks tab shows all available tracks
- [ ] Playlist tab shows all available playlists
- [ ] Multi-select works for tracks
- [ ] Queue mode buttons are mutually exclusive
- [ ] Clear queue switch toggles correctly
- [ ] Reason field accepts up to 500 characters
- [ ] Form validation prevents empty submission
- [ ] Success message appears after adding
- [ ] Queue refreshes automatically

### Audio Mixer

- [ ] Volume slider updates in real-time
- [ ] Percentage display matches slider value
- [ ] Mute switch disables volume slider
- [ ] Mute icon changes based on state
- [ ] Queue end behavior dropdown shows 3 options
- [ ] Changes persist after closing drawer

### Queue Management

- [ ] Remove button works for non-playing tracks
- [ ] Remove button disabled for playing track
- [ ] Clear all shows confirmation dialog
- [ ] Clear all empties entire queue
- [ ] Refresh button reloads queue data
- [ ] Drawer shows space name in header
- [ ] Queue count displays correctly

### Integration

- [ ] "Manage Queue" appears in space actions menu
- [ ] Clicking opens drawer with correct space context
- [ ] Space detail drawer shows audio mixer info
- [ ] All mutations trigger proper cache invalidation
- [ ] Loading states appear during API calls

## Future Enhancements

### Drag-and-Drop Reorder

- Implement drag-and-drop using `@dnd-kit/core`
- Call `useReorderQueue()` on drop
- Show visual feedback during drag
- Disable for non-pending items

### Queue Item Details

- Click to expand track details
- Show cover image, artist, duration
- Display HLS URL for debugging
- Show transcode status

### Bulk Actions

- Select multiple queue items
- Bulk remove selected items
- Move selected items to top/bottom

### Queue History

- Show played/skipped items in separate section
- Filter by status (Pending/Playing/Played/Skipped)
- Search queue items by track name

### Audio Visualizer

- Real-time waveform display
- Spectrum analyzer
- Volume meter

## API Endpoints Used

| Endpoint                               | Method | Hook                      | Purpose      |
| -------------------------------------- | ------ | ------------------------- | ------------ |
| `/api/cams/spaces/{id}/queue`          | GET    | `useSpaceQueue()`         | Fetch queue  |
| `/api/cams/spaces/{id}/queue/tracks`   | POST   | `useAddTracksToQueue()`   | Add tracks   |
| `/api/cams/spaces/{id}/queue/playlist` | POST   | `useAddPlaylistToQueue()` | Add playlist |
| `/api/cams/spaces/{id}/queue/all`      | DELETE | `useClearQueue()`         | Clear queue  |
| `/api/cams/spaces/{id}/queue`          | DELETE | `useRemoveQueueItem()`    | Remove item  |
| `/api/cams/spaces/{id}/state/audio`    | PATCH  | `useUpdateAudioState()`   | Update audio |
| `/api/cams/spaces/{id}/state`          | GET    | `useSpaceState()`         | Get state    |

## Notes

- Queue items are sorted by `position` field
- Currently playing track cannot be removed
- Audio mixer state comes from `SpaceStateDto`
- Queue end behavior values: 0=Stop, 1=RepeatQueue, 2=ReturnToSchedule
- All mutations use optimistic updates via React Query
- Cache invalidation uses specific `queue(spaceId)` key for performance

---

**Implementation completed by:** Kiro AI Assistant  
**Date:** 2026-03-24  
**Total new components:** 4  
**Total modified files:** 5  
**TypeScript errors:** 0 ✅
