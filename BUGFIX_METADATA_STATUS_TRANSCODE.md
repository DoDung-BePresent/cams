# Bug Fix: Metadata Status Display with Transcode Status Integration

## Issue Date

2026-03-24

## Problem Description

The metadata status column in track list was not displaying correctly because the implementation assumed that metadata fields (`bpm`, `energyLevel`, `valence`) would be present in the list response, but the backend API only returns these fields in the detail response.

### Observed Behavior

- Metadata column showed incorrect status
- API response showed `transcodeStatus: 1` or `transcodeStatus: 3` (numeric field)
- NO `bpm`, `energyLevel`, `valence` fields in list response
- Fields like `actualDurationSec: null` were present but not used

### Root Cause

Backend API returns different fields in list vs detail responses:

- **List response (`GET /api/tracks`):** Returns `transcodeStatus` (0-4) and `actualDurationSec`, but NOT metadata fields
- **Detail response (`GET /api/tracks/{id}`):** Returns `bpm`, `energyLevel`, `valence` + all list fields

The original implementation only checked for metadata fields, which don't exist in list view, causing incorrect status display.

## Solution

### 1. Added Missing Type Definitions

**File:** `src/shared/modules/tracks/types/trackTypes.ts`

Added `TranscodeStatusEnum` to match backend enum:

```typescript
export enum TranscodeStatusEnum {
  None = 0, // Track chưa được transcode, hlsUrl = null
  Pending = 1, // Job đã queue, đang chờ chạy
  Processing = 2, // Đang transcode trên AWS MediaConvert
  Ready = 3, // Transcode hoàn thành, hlsUrl sẵn sàng
  Failed = 4, // Transcode thất bại
}
```

Updated `TrackListItem` interface to include missing fields:

```typescript
export interface TrackListItem extends BaseResponse {
  // ... existing fields ...
  actualDurationSec?: number; // NEW: Actual duration from MediaConvert
  transcodeStatus?: TranscodeStatusEnum; // NEW: Transcode status (0-4)
  // ... rest of fields ...
}
```

### 2. Updated Status Logic

**File:** `src/shared/modules/tracks/utils/trackUtils.ts`

Updated `getTrackMetadataStatus()` to handle three scenarios:

```typescript
export const getTrackMetadataStatus = (
  track: TrackListItem | TrackDetailResponse,
): TrackMetadataStatus => {
  // 1. If has metadata fields (detail view) → use them
  if (hasBpm || hasEnergyLevel || hasValence) {
    return hasBpm && hasEnergyLevel && hasValence
      ? TrackMetadataStatus.Ready
      : TrackMetadataStatus.Partial;
  }

  // 2. If has transcodeStatus (list view) → use as proxy
  switch (track.transcodeStatus) {
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
};
```

Added helper function for transcode status text:

```typescript
export const getTranscodeStatusText = (
  status?: TranscodeStatusEnum,
): string => {
  switch (status) {
    case TranscodeStatusEnum.None:
      return 'Not Transcoded';
    case TranscodeStatusEnum.Pending:
      return 'Queued';
    case TranscodeStatusEnum.Processing:
      return 'Transcoding...';
    case TranscodeStatusEnum.Ready:
      return 'Ready';
    case TranscodeStatusEnum.Failed:
      return 'Failed';
    default:
      return 'Unknown';
  }
};
```

### 3. Enhanced Badge Component

**File:** `src/shared/modules/tracks/components/MetadataStatusBadge.tsx`

Updated component to show specific transcode status when available:

- **transcodeStatus = 1 (Pending):** Shows "Queued" with clock icon
- **transcodeStatus = 2 (Processing):** Shows "Transcoding..." with loading icon
- **transcodeStatus = 3 (Ready):** Shows "Ready" with success badge
- **transcodeStatus = 4 (Failed):** Shows "Failed" with error icon
- **transcodeStatus = 0 or null:** Falls back to age-based logic

Added new icons:

```typescript
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  LoadingOutlined, // NEW
  CloseCircleOutlined, // NEW
} from '@ant-design/icons';
```

## Key Insights

### Backend Architecture

The metadata extraction happens during the AWS MediaConvert transcode process:

1. User uploads track → `transcodeStatus = 0` (None)
2. Backend queues transcode job → `transcodeStatus = 1` (Pending)
3. AWS MediaConvert starts processing → `transcodeStatus = 2` (Processing)
4. During transcode, Python librosa service extracts metadata (BPM, energy, valence)
5. Transcode completes → `transcodeStatus = 3` (Ready), metadata available
6. If fails → `transcodeStatus = 4` (Failed)

### Why transcodeStatus is a Good Proxy

Since metadata extraction happens during transcode:

- `transcodeStatus = 3` (Ready) → metadata is available
- `transcodeStatus = 1 or 2` → metadata not yet extracted
- `transcodeStatus = 4` → metadata extraction failed
- `transcodeStatus = 0` → not yet started

This makes `transcodeStatus` a reliable proxy for metadata availability in list view.

### API Response Structure

**List Response Example:**

```json
{
  "id": "a1b2c3d4-...",
  "title": "Demo 666",
  "artist": "Mono",
  "transcodeStatus": 1,
  "actualDurationSec": null,
  "hlsUrl": null,
  "durationSec": 30
  // NO bpm, energyLevel, valence fields
}
```

**Detail Response Example:**

```json
{
  "id": "a1b2c3d4-...",
  "title": "Demo 666",
  "artist": "Mono",
  "transcodeStatus": 3,
  "actualDurationSec": 30,
  "hlsUrl": "https://cdn.../track.m3u8",
  "durationSec": 30,
  "bpm": 128,
  "energyLevel": 0.85,
  "valence": 0.72
}
```

## Testing

### Manual Testing Performed

- [x] Verified list view shows correct status based on `transcodeStatus`
- [x] Verified detail view shows metadata fields when available
- [x] Verified "Queued" status for `transcodeStatus = 1`
- [x] Verified "Transcoding..." status for `transcodeStatus = 2`
- [x] Verified "Ready" status for `transcodeStatus = 3`
- [x] Verified "Failed" status for `transcodeStatus = 4`
- [x] Verified fallback logic for tracks without `transcodeStatus`

### Edge Cases Tested

- [x] Track with `transcodeStatus = null` → uses age-based fallback
- [x] Track with `transcodeStatus = 0` → uses age-based fallback
- [x] Newly created track (< 2 min) → shows "Processing..."
- [x] Old track (> 2 min) with no transcode → shows "Unavailable"

## Files Modified

1. `src/shared/modules/tracks/types/trackTypes.ts` - Added TranscodeStatusEnum, updated TrackListItem
2. `src/shared/modules/tracks/utils/trackUtils.ts` - Updated getTrackMetadataStatus logic, added getTranscodeStatusText
3. `src/shared/modules/tracks/components/MetadataStatusBadge.tsx` - Enhanced to show transcode status
4. `IMPLEMENTATION_TRACK_METADATA_STATUS.md` - Updated documentation with transcode status integration

## Related Documentation

- `docs/tracks/API_Tracks.md` - Track API reference (§4.3 TrackListItem, §5.5 retranscode endpoint)
- `docs/DEV-PLAN-05-MEDIACONVERT-SKIPTOTRACK-PAUSE-RESUME.md` - TranscodeStatusEnum definition
- `IMPLEMENTATION_TRACK_METADATA_STATUS.md` - Original implementation documentation

## Impact

### Before Fix

- Metadata column showed incorrect status (always "Pending" or "Unknown")
- No visibility into transcode progress
- Confusing UX for newly uploaded tracks

### After Fix

- Accurate status display based on actual backend state
- Clear visibility into transcode progress (Queued → Transcoding → Ready)
- Better UX with specific status messages and icons
- Proper handling of both list and detail views

## Lessons Learned

1. Always verify API response structure before implementing UI logic
2. Backend may return different fields in list vs detail endpoints for performance
3. Use proxy fields (like `transcodeStatus`) when direct fields not available
4. Document API response differences clearly
5. Test with actual API data, not just mock data
