# Implementation: Metadata Polling & Real-time Updates

## Overview

Implemented Phase 3 of the new CAMS metadata extraction system - automatic metadata polling and real-time progress display.

## Implementation Date

2026-03-24

## Background

Since metadata extraction is asynchronous (30-120 seconds), users need visual feedback and automatic updates when extraction completes. This implementation provides polling mechanism and progress display.

See: `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md` §7-8

---

## Changes Made

### 1. Custom Hook (`src/shared/modules/tracks/hooks/useTrackMetadataPolling.ts`)

#### Created useTrackMetadataPolling Hook

**Purpose:** Automatically poll track metadata status after upload until extraction completes or timeout.

**Parameters:**

```typescript
interface UseTrackMetadataPollingOptions {
  enabled?: boolean; // Enable/disable polling (default: true)
  maxAttempts?: number; // Max attempts (default: 12 = 2 min)
  intervalMs?: number; // Interval (default: 10000 = 10s)
  onComplete?: (status) => void; // Callback when complete
  onTimeout?: () => void; // Callback when timeout
}
```

**Returns:**

```typescript
{
  isPolling: boolean;         // Currently polling
  attempts: number;           // Current attempt count
  maxAttempts: number;        // Max attempts configured
  status: TrackMetadataStatus | null;  // Current status
  startPolling: () => void;   // Manual start
  stopPolling: () => void;    // Manual stop
}
```

**Behavior:**

1. **Auto-Start:**
   - Automatically starts when track status is `Pending`
   - No manual trigger needed

2. **Polling Cycle:**
   - Fetches track data every 10 seconds
   - Checks metadata status after each fetch
   - Increments attempt counter

3. **Stop Conditions:**
   - Status becomes `Ready` → Success
   - Status becomes `Partial` → Partial success
   - Reaches max attempts (12) → Timeout
   - Component unmounts → Cleanup

4. **Side Effects:**
   - Shows success message when complete
   - Shows warning message on timeout
   - Invalidates track queries to refresh UI
   - Calls optional callbacks

5. **Cleanup:**
   - Clears interval on unmount
   - Prevents memory leaks

---

### 2. Progress Component (`src/shared/modules/tracks/components/MetadataPollingProgress.tsx`)

#### Created MetadataPollingProgress Component

**Purpose:** Display visual progress during metadata extraction.

**Props:**

```typescript
interface MetadataPollingProgressProps {
  isPolling: boolean;
  attempts: number;
  maxAttempts: number;
  status: TrackMetadataStatus | null;
}
```

**Display:**

```
ℹ️ Extracting metadata...              ~90s remaining

[████████████░░░░░░░░░░░░░░░░░░] 40%

Attempt 4 of 12 • Analyzing audio with AI...
```

**Features:**

- Animated progress bar
- Remaining time estimate (attempts × 10s)
- Attempt counter
- Loading icon
- Auto-hides when not polling

---

### 3. Integration (All TrackDetailsDrawer Components)

#### Updated 3 Drawers:

- `src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx`
- `src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx`
- `src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx`

**Changes:**

**1. Import Hook & Component:**

```typescript
import {
  HLSAudioPlayer,
  MetadataStatusBadge,
  MetadataPollingProgress, // NEW
} from '@/shared/modules/tracks/components';

import {
  useTrack,
  useTrackMetadataPolling, // NEW
} from '@/shared/modules/tracks/hooks';
```

**2. Initialize Polling:**

```typescript
const { isPolling, attempts, maxAttempts, status } = useTrackMetadataPolling(
  trackId,
  {
    enabled: open && !!trackId,
  },
);
```

**3. Display Progress:**

```typescript
<MetadataPollingProgress
  isPolling={isPolling}
  attempts={attempts}
  maxAttempts={maxAttempts}
  status={status}
/>
```

**Position:** At the top of drawer content, before audio player.

---

## User Experience

### Scenario 1: Upload New Track

**Step 1: Upload completes**

- Track appears in list with "Extracting..." badge
- User clicks to view details

**Step 2: Drawer opens**

- Progress bar appears at top
- Shows "Extracting metadata... ~120s remaining"
- Progress bar animates
- Attempt counter updates every 10s

**Step 3: Extraction completes (after ~60s)**

- Progress bar disappears
- Success message: "Metadata extraction completed!"
- Metadata badge updates to "Ready"
- BPM, Energy, Valence values appear
- Track list auto-refreshes

**Step 4: User continues**

- Can immediately see metadata
- No manual refresh needed

### Scenario 2: View Old Track

**Step 1: Open drawer for old track**

- No progress bar (status not Pending)
- Metadata already available
- Normal display

### Scenario 3: Timeout

**Step 1: Extraction takes too long**

- Progress reaches 100%
- After 12 attempts (2 minutes)
- Warning message: "Metadata extraction is taking longer than expected..."
- Progress bar disappears
- Badge shows "No Metadata"

**Step 2: User can retry later**

- Close and reopen drawer
- Or wait for backend to complete

---

## Technical Details

### Polling Algorithm

```typescript
// Initial state
attempts = 0;
isPolling = true;

// Every 10 seconds
while (attempts < maxAttempts) {
  attempts++;
  track = await refetch();
  status = getMetadataStatus(track);

  if (status === Ready || status === Partial) {
    stopPolling();
    showSuccess();
    invalidateQueries();
    break;
  }
}

// If loop completes
if (attempts >= maxAttempts) {
  stopPolling();
  showWarning();
}
```

### Memory Management

**Cleanup on unmount:**

```typescript
useEffect(() => {
  return () => {
    stopPolling(); // Clear interval
  };
}, []);
```

**Prevents:**

- Memory leaks from active intervals
- Polling after component unmount
- Multiple concurrent intervals

### Performance Optimization

**Conditional Fetching:**

- Track query disabled by default
- Only enabled during polling
- Reduces unnecessary API calls

**Query Invalidation:**

- Only invalidates on success
- Specific to track queries
- Doesn't refetch entire list

---

## Configuration

### Adjustable Parameters

**Polling Interval:**

```typescript
useTrackMetadataPolling(trackId, {
  intervalMs: 5000, // 5 seconds (faster)
});
```

**Max Attempts:**

```typescript
useTrackMetadataPolling(trackId, {
  maxAttempts: 24, // 4 minutes (longer)
});
```

**Callbacks:**

```typescript
useTrackMetadataPolling(trackId, {
  onComplete: (status) => {
    console.log('Extraction complete:', status);
    // Custom logic
  },
  onTimeout: () => {
    console.log('Extraction timed out');
    // Custom logic
  },
});
```

**Disable Polling:**

```typescript
useTrackMetadataPolling(trackId, {
  enabled: false, // Manual control
});
```

---

## Benefits

### For Users

1. **No Manual Refresh** - Automatic updates
2. **Visual Feedback** - Know extraction is in progress
3. **Time Estimate** - Know how long to wait
4. **Immediate Access** - See metadata as soon as ready

### For System

1. **Reduced Load** - Polling only when needed
2. **Automatic Cleanup** - No memory leaks
3. **Graceful Timeout** - Handles slow extractions
4. **Query Optimization** - Minimal API calls

### For Development

1. **Reusable Hook** - Use anywhere
2. **Configurable** - Adjust timing/behavior
3. **Testable** - Clear state management
4. **Maintainable** - Separated concerns

---

## Future Enhancements (Not Implemented Yet)

### 1. SignalR Real-time Updates

Replace polling with push notifications:

```typescript
hubConnection.on('MetadataExtracted', (trackId, metadata) => {
  updateTrack(trackId, metadata);
  showSuccess();
});
```

**Benefits:**

- Instant updates (no 10s delay)
- No polling overhead
- More efficient

### 2. Background Polling

Poll in background even when drawer closed:

```typescript
useTrackMetadataPolling(trackId, {
  enabled: true, // Always enabled
  background: true, // Continue when drawer closed
});
```

### 3. Batch Polling

Poll multiple tracks simultaneously:

```typescript
useMultiTrackMetadataPolling(trackIds, {
  onBatchComplete: (results) => {
    // Handle multiple completions
  },
});
```

### 4. Retry Mechanism

Manual retry button for failed extractions:

```tsx
<Button onClick={() => retryExtraction(trackId)}>Retry Extraction</Button>
```

---

## Testing Checklist

### Functional Testing

- [ ] Upload track → polling starts automatically
- [ ] Progress bar displays and updates
- [ ] Attempt counter increments every 10s
- [ ] Success message shows when complete
- [ ] Metadata badge updates to "Ready"
- [ ] Polling stops after success
- [ ] Timeout warning shows after 2 minutes
- [ ] Polling stops after timeout

### Edge Cases

- [ ] Close drawer during polling → cleanup works
- [ ] Open multiple drawers → independent polling
- [ ] Network error during polling → graceful handling
- [ ] Track already has metadata → no polling
- [ ] Very fast extraction (<10s) → immediate update

### Performance Testing

- [ ] No memory leaks after multiple open/close
- [ ] Interval clears on unmount
- [ ] Query invalidation doesn't cause cascade
- [ ] UI remains responsive during polling

### Visual Testing

- [ ] Progress bar animates smoothly
- [ ] Time estimate updates correctly
- [ ] Alert styling matches design
- [ ] Mobile responsive

---

## Files Modified

1. `src/shared/modules/tracks/hooks/useTrackMetadataPolling.ts` - Created polling hook (NEW)
2. `src/shared/modules/tracks/hooks/index.ts` - Export polling hook
3. `src/shared/modules/tracks/components/MetadataPollingProgress.tsx` - Created progress component (NEW)
4. `src/shared/modules/tracks/components/index.ts` - Export progress component
5. `src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Integrated polling
6. `src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Integrated polling
7. `src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Integrated polling

---

## Related Documentation

- `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md` - Backend implementation guide
- `docs/cams/SDD_TRACK_METADATA_PYTHON_SERVICE.md` - Python service details
- `IMPLEMENTATION_TRACK_METADATA_STATUS.md` - Phase 1 implementation
- `IMPLEMENTATION_AI_EXPLAINABILITY_PANEL.md` - Phase 2 implementation

---

## Summary

Phase 3 completes the metadata extraction user experience:

- **Phase 1**: Display metadata status
- **Phase 2**: Show AI decisions
- **Phase 3**: Auto-poll and show progress ✅

Users now have a complete, seamless experience from upload to metadata availability.
