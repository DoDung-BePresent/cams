# Implementation: Track Metadata Status Display

## Overview

Implemented Phase 1 of the new CAMS metadata extraction system - displaying track metadata status in the UI.

## Implementation Date

2026-03-24

## Background

Backend now uses Python librosa service to asynchronously extract audio metadata (BPM, energy level, valence) after track upload. This process takes 30-120 seconds, so the UI must handle the async nature gracefully.

See: `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md`

---

## Changes Made

### 1. Types (`src/shared/modules/tracks/types/trackTypes.ts`)

#### Added TrackMetadataStatus Enum

```typescript
export enum TrackMetadataStatus {
  Pending = 'pending', // Just uploaded, extraction in progress
  Ready = 'ready', // Has complete metadata
  Partial = 'partial', // Has some but not all metadata
  Unknown = 'unknown', // Timeout or extraction failed
}
```

**Status Logic:**

- **Ready**: Has all three fields (bpm, energyLevel, valence)
- **Partial**: Has some but not all fields
- **Pending**: Created within last 2 minutes, no metadata yet
- **Unknown**: Older than 2 minutes, still no metadata (extraction failed)

---

### 2. Utilities (`src/shared/modules/tracks/utils/trackUtils.ts`)

#### Created Utility Functions

**`getTrackMetadataStatus(track)`**

- Determines metadata status based on field presence and track age
- Returns `TrackMetadataStatus` enum

**`formatBpm(bpm)`**

- Formats BPM for display: `"120 BPM"` or `"—"`

**`formatEnergyLevel(energyLevel)`**

- Formats energy level: `"0.85"` or `"—"`

**`formatValence(valence)`**

- Formats valence: `"0.72"` or `"—"`

**`getMetadataStatusBadgeColor(status)`**

- Returns Ant Design badge color for status

**`getMetadataStatusText(status)`**

- Returns display text for status

---

### 3. Component (`src/shared/modules/tracks/components/MetadataStatusBadge.tsx`)

#### Created MetadataStatusBadge Component

**Props:**

```typescript
interface MetadataStatusBadgeProps {
  track: TrackListItem | TrackDetailResponse;
  showDetails?: boolean; // Show BPM, Energy, Valence tags when ready
}
```

**Behavior:**

1. **Ready + showDetails=true:**

   ```tsx
   <Tag icon={<CheckCircleOutlined />} color="success">BPM: 120</Tag>
   <Tag color="blue">Energy: 0.85</Tag>
   <Tag color="cyan">Valence: 0.72</Tag>
   ```

2. **Ready + showDetails=false:**

   ```tsx
   <Badge
     status='success'
     text='Metadata Ready'
   />
   ```

3. **Pending:**

   ```tsx
   <Badge
     status='processing'
     text='Extracting...'
   />
   ```

   - Tooltip: "Metadata extraction in progress (may take 30-120 seconds)"

4. **Partial:**

   ```tsx
   <Badge
     status='warning'
     text='Partial Metadata'
   />
   ```

   - Tooltip: "Some metadata fields are missing"

5. **Unknown:**
   ```tsx
   <Badge
     status='error'
     text='No Metadata'
   />
   ```

   - Tooltip: "Metadata extraction failed or timed out"

---

### 4. Track Table Columns (`src/shared/modules/tracks/components/TrackTableColumns.tsx`)

#### Added Metadata Column

**Position:** Between "Provider" and "Plays" columns

**Width:** 150px

**Render:**

```tsx
<MetadataStatusBadge track={record} />
```

Shows compact badge in table view (no details).

---

### 5. Track Details Drawers

Updated all three TrackDetailsDrawer components:

- `src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx`
- `src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx`
- `src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx`

#### Changes:

**Import:**

```typescript
import {
  HLSAudioPlayer,
  MetadataStatusBadge,
} from '@/shared/modules/tracks/components';
```

**Audio Metadata Section:**

```tsx
<Descriptions
  title='Audio Metadata'
  column={2}
  bordered
  extra={
    <MetadataStatusBadge
      track={track}
      showDetails
    />
  }
>
  {/* ... existing fields ... */}
</Descriptions>
```

The badge appears in the top-right corner of the Audio Metadata section with full details (BPM, Energy, Valence tags).

---

## User Experience

### Track List View

- New "Metadata" column shows status badge
- 🟢 "Metadata Ready" - extraction complete
- 🟡 "Extracting..." - in progress (animated)
- 🟠 "Partial Metadata" - some fields missing
- 🔴 "No Metadata" - extraction failed

### Track Details View

- Badge appears in Audio Metadata section header
- When ready: shows detailed tags with values
- Tooltips explain each status
- Null-safe rendering for all metadata fields

### Track Upload Flow

1. User uploads track → API returns 201
2. UI shows success message immediately
3. Track appears in list with "Extracting..." badge
4. After 30-120s, badge updates to "Metadata Ready"
5. If timeout (>2 min), badge shows "No Metadata"

---

## Technical Details

### Metadata Status Calculation

```typescript
const getTrackMetadataStatus = (track) => {
  const hasBpm = track.bpm > 0;
  const hasEnergyLevel = track.energyLevel !== null;
  const hasValence = track.valence !== null;

  // Ready: all three present
  if (hasBpm && hasEnergyLevel && hasValence) {
    return TrackMetadataStatus.Ready;
  }

  // Partial: some present
  if (hasBpm || hasEnergyLevel || hasValence) {
    return TrackMetadataStatus.Partial;
  }

  // Age-based: Pending vs Unknown
  const ageInMinutes = (now - createdAt) / 60000;
  return ageInMinutes < 2
    ? TrackMetadataStatus.Pending
    : TrackMetadataStatus.Unknown;
};
```

### Null Safety

All metadata fields are rendered null-safe:

```typescript
{
  track.bpm || '—';
}
{
  track.energyLevel?.toFixed(2) || '—';
}
{
  track.valence?.toFixed(2) || '—';
}
```

---

## Future Enhancements (Not Implemented Yet)

### 1. Real-time Updates via SignalR

Currently, metadata status updates require page refresh or re-fetch. Future implementation could use SignalR to push updates when extraction completes.

### 2. Metadata Polling

Optional polling mechanism to auto-refresh track after upload:

```typescript
const pollMetadataStatus = async (trackId: string) => {
  for (let i = 0; i < 12; i++) {
    // 2 minutes
    await sleep(10000); // 10s
    const track = await fetchTrack(trackId);
    if (track.bpm !== null) {
      updateTrackInList(track);
      return;
    }
  }
};
```

### 3. Retry Extraction Button

For tracks with "No Metadata" status, add button to manually trigger re-extraction.

### 4. Metadata Quality Indicators

Show confidence scores or quality metrics if backend provides them.

---

## Testing Checklist

### Manual Testing

- [ ] Upload new track → verify "Extracting..." badge appears
- [ ] Wait 30-120s → verify badge updates to "Metadata Ready"
- [ ] View track details → verify metadata values display correctly
- [ ] Check track older than 2 min with no metadata → verify "No Metadata" badge
- [ ] Verify tooltips show on hover
- [ ] Verify null-safe rendering (no crashes on null values)

### Edge Cases

- [ ] Track with only BPM (no energy/valence) → "Partial Metadata"
- [ ] Track with only energy/valence (no BPM) → "Partial Metadata"
- [ ] Very old track with no metadata → "No Metadata" (not "Pending")
- [ ] Track created exactly 2 minutes ago → boundary test

### Visual Testing

- [ ] Badge colors match design (success=green, processing=blue, warning=orange, error=red)
- [ ] Icons display correctly
- [ ] Tags in details view are properly formatted
- [ ] Table column width is appropriate
- [ ] Mobile responsive (if applicable)

---

## Files Modified

1. `src/shared/modules/tracks/types/trackTypes.ts` - Added TrackMetadataStatus enum
2. `src/shared/modules/tracks/utils/trackUtils.ts` - Created utility functions (NEW)
3. `src/shared/modules/tracks/utils/index.ts` - Export utils (NEW)
4. `src/shared/modules/tracks/components/MetadataStatusBadge.tsx` - Created badge component (NEW)
5. `src/shared/modules/tracks/components/index.ts` - Export badge component
6. `src/shared/modules/tracks/components/TrackTableColumns.tsx` - Added metadata column
7. `src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Added badge
8. `src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Added badge
9. `src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Added badge

---

## Related Documentation

- `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md` - Backend implementation guide
- `docs/cams/SDD_TRACK_METADATA_PYTHON_SERVICE.md` - Python service details
- `docs/tracks/API_Tracks.md` - Track API reference

---

## Next Steps (Phase 2)

After this implementation is tested and deployed:

1. **AI Explainability Panel** - Show fuzzy logic decisions (mood, BPM range, rules)
2. **SignalR Improvements** - Real-time metadata updates
3. **BPM-Based Queue Display** - Show why tracks were selected
4. **Metadata Polling** - Auto-refresh after upload

See: `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md` §7-10
