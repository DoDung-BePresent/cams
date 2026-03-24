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

#### Added TranscodeStatusEnum (from backend)

```typescript
export enum TranscodeStatusEnum {
  None = 0, // Track chưa được transcode, hlsUrl = null
  Pending = 1, // Job đã queue, đang chờ chạy
  Processing = 2, // Đang transcode trên AWS MediaConvert
  Ready = 3, // Transcode hoàn thành, hlsUrl sẵn sàng
  Failed = 4, // Transcode thất bại
}
```

#### Added TrackMetadataStatus Enum

```typescript
export enum TrackMetadataStatus {
  Pending = 'pending', // Just uploaded, extraction in progress
  Ready = 'ready', // Has complete metadata
  Partial = 'partial', // Has some but not all metadata
  Unknown = 'unknown', // Timeout or extraction failed
}
```

#### Updated TrackListItem Interface

Added fields returned by backend API:

```typescript
export interface TrackListItem extends BaseResponse {
  // ... existing fields ...
  actualDurationSec?: number; // Actual duration from MediaConvert
  transcodeStatus?: TranscodeStatusEnum; // Transcode status (0-4)
  // ... rest of fields ...
}
```

**Key Insight:**

Backend API returns different fields in list vs detail responses:

- **List response:** `transcodeStatus` (0-4), `actualDurationSec` - NO metadata fields
- **Detail response:** `bpm`, `energyLevel`, `valence` + all list fields

The metadata extraction happens during the transcode process, so `transcodeStatus` serves as a proxy for metadata availability in list view.

**Status Logic:**

For detail view (has bpm, energyLevel, valence fields):

- **Ready**: Has all three fields (bpm, energyLevel, valence)
- **Partial**: Has some but not all fields

For list view (only has transcodeStatus field):

- **Ready** (transcodeStatus = 3): Transcode complete, metadata ready
- **Pending** (transcodeStatus = 1 or 2): Queued or transcoding
- **Failed** (transcodeStatus = 4): Transcode failed
- **Unknown** (transcodeStatus = 0 or null): Not yet transcoded

Fallback for tracks without transcodeStatus:

- **Pending**: Created within last 2 minutes, no metadata yet
- **Unknown**: Older than 2 minutes, still no metadata

---

### 2. Utilities (`src/shared/modules/tracks/utils/trackUtils.ts`)

#### Created Utility Functions

**`getTrackMetadataStatus(track)`**

- Determines metadata status based on field presence, transcodeStatus, and track age
- Handles both list view (transcodeStatus only) and detail view (metadata fields)
- Returns `TrackMetadataStatus` enum

**Logic:**

```typescript
// 1. If has metadata fields (detail view) → use them
if (hasBpm || hasEnergyLevel || hasValence) {
  return hasBpm && hasEnergyLevel && hasValence
    ? TrackMetadataStatus.Ready
    : TrackMetadataStatus.Partial;
}

// 2. If has transcodeStatus (list view) → use as proxy
switch (transcodeStatus) {
  case TranscodeStatusEnum.Ready:
    return TrackMetadataStatus.Ready;
  case TranscodeStatusEnum.Pending:
  case TranscodeStatusEnum.Processing:
    return TrackMetadataStatus.Pending;
  case TranscodeStatusEnum.Failed:
    return TrackMetadataStatus.Unknown;
}

// 3. Fallback: check track age
const ageInMinutes = (now - createdAt) / 60000;
return ageInMinutes < 2
  ? TrackMetadataStatus.Pending
  : TrackMetadataStatus.Unknown;
```

**`formatBpm(bpm)`**

- Formats BPM for display: `"120 BPM"` or `"—"`

**`formatEnergyLevel(energyLevel)`**

- Formats energy level: `"0.85"` or `"—"`

**`formatValence(valence)`**

- Formats valence: `"0.72"` or `"—"`

**`getMetadataStatusBadgeColor(status)`**

- Returns Ant Design badge color for status

**`getMetadataStatusText(status)`**

- Returns display text for metadata status

**`getTranscodeStatusText(status)`** (NEW)

- Returns display text for transcode status
- Maps enum values to user-friendly text

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

1. **Ready + showDetails=true (detail view):**

   ```tsx
   <Tag icon={<CheckCircleOutlined />} color="success">BPM: 120</Tag>
   <Tag color="blue">Energy: 0.85</Tag>
   <Tag color="cyan">Valence: 0.72</Tag>
   ```

2. **Ready + showDetails=false (list view):**

   ```tsx
   <Badge
     status='success'
     text='Ready'
   />
   ```

3. **Pending (list view with transcodeStatus):**
   - **transcodeStatus = 1 (Pending):**
     ```tsx
     <Badge
       status='processing'
       text='Queued'
     />
     ```
     Tooltip: "Track is queued for transcoding"
   - **transcodeStatus = 2 (Processing):**
     ```tsx
     <Badge
       status='processing'
       text='Transcoding...'
     />
     ```
     Tooltip: "Track is being transcoded (may take 1-3 minutes)"
   - **Generic pending:**
     ```tsx
     <Badge
       status='processing'
       text='Processing...'
     />
     ```
     Tooltip: "Metadata extraction in progress (may take 30-120 seconds)"

4. **Partial:**

   ```tsx
   <Badge
     status='warning'
     text='Partial'
   />
   ```

   - Tooltip: "Some metadata fields are missing"

5. **Failed (transcodeStatus = 4):**

   ```tsx
   <Badge
     status='error'
     text='Failed'
   />
   ```

   - Tooltip: "Transcode failed - metadata unavailable"

6. **Unknown:**
   ```tsx
   <Badge
     status='error'
     text='Unavailable'
   />
   ```

   - Tooltip: "Metadata extraction failed or not yet started"

**Key Features:**

- Shows specific transcode status when available (Queued, Transcoding, Failed)
- Falls back to generic metadata status when transcodeStatus not available
- Different icons for different states (Clock, Loading, Close, Exclamation)
- Informative tooltips explaining each status

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
- 🟢 "Ready" - transcode & metadata extraction complete
- � "Queued" - track queued for transcoding
- 🔵 "Transcoding..." - AWS MediaConvert processing (animated)
- � "Processing..." - generic processing state
- 🟠 "Partial" - some metadata fields missing (detail view only)
- 🔴 "Failed" - transcode failed
- 🔴 "Unavailable" - metadata not available

### Track Details View

- Badge appears in Audio Metadata section header
- When ready: shows detailed tags with BPM, Energy, Valence values
- Tooltips explain each status
- Null-safe rendering for all metadata fields

### Track Upload Flow

1. User uploads track → API returns 201
2. UI shows success message immediately
3. Track appears in list with "Queued" badge (transcodeStatus = 1)
4. Badge updates to "Transcoding..." (transcodeStatus = 2)
5. After 1-3 min, badge updates to "Ready" (transcodeStatus = 3)
6. If transcode fails, badge shows "Failed" (transcodeStatus = 4)
7. Metadata extraction happens during transcode, so Ready = metadata available

---

## Technical Details

### Metadata Status Calculation

```typescript
const getTrackMetadataStatus = (track) => {
  // 1. Check if has metadata fields (detail view)
  const hasBpm = track.bpm > 0;
  const hasEnergyLevel = track.energyLevel !== null;
  const hasValence = track.valence !== null;

  if (hasBpm || hasEnergyLevel || hasValence) {
    // Ready: all three present
    if (hasBpm && hasEnergyLevel && hasValence) {
      return TrackMetadataStatus.Ready;
    }
    // Partial: some present
    return TrackMetadataStatus.Partial;
  }

  // 2. Use transcodeStatus as proxy (list view)
  switch (track.transcodeStatus) {
    case TranscodeStatusEnum.Ready: // 3
      return TrackMetadataStatus.Ready;
    case TranscodeStatusEnum.Pending: // 1
    case TranscodeStatusEnum.Processing: // 2
      return TrackMetadataStatus.Pending;
    case TranscodeStatusEnum.Failed: // 4
      return TrackMetadataStatus.Unknown;
  }

  // 3. Fallback: age-based for tracks without transcodeStatus
  const ageInMinutes = (now - createdAt) / 60000;
  return ageInMinutes < 2
    ? TrackMetadataStatus.Pending
    : TrackMetadataStatus.Unknown;
};
```

**Key Points:**

- Metadata fields (bpm, energyLevel, valence) only available in detail response
- List response only has `transcodeStatus` field
- Transcode process includes metadata extraction, so transcodeStatus = proxy for metadata
- Three-tier fallback: metadata fields → transcodeStatus → track age

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
