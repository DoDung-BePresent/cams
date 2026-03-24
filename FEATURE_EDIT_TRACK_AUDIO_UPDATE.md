# Feature: Audio File Update in Edit Track Drawer

## Overview

Added ability to replace audio file when editing an existing track in the Brand Manager's Track Management page.

## Implementation Date

2026-03-24

## Changes Made

### File Modified

`src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx`

### New Features

1. **Audio File Upload Section**
   - Added `AudioDragger` component for uploading new audio file
   - Auto-detects duration from uploaded audio file
   - Shows current audio player when no new file is uploaded
   - Hides current audio player when new file is selected

2. **Auto-Duration Detection**
   - When user uploads new audio file, duration is automatically extracted
   - Duration field becomes disabled and shows "Auto-detected" placeholder
   - Duration is automatically set in form

3. **State Management**
   - Added `audioFile` state to track uploaded audio file
   - Added `audioDuration` state to track detected duration
   - Both states are reset when drawer is closed

4. **User Experience**
   - Clear visual separation between current and new audio
   - Helpful text: "Leave empty to keep current audio file"
   - When new file uploaded: "New audio file will replace the current one"
   - Current audio player only shows when no new file is selected

## Component Structure

### New Imports

```typescript
import { AudioDragger } from '@/shared/components';
import { createAudioUploadProps, getAudioDuration } from '@/shared/utils';
```

### New State Variables

```typescript
const [audioFile, setAudioFile] = useState<UploadFile | null>(null);
const [audioDuration, setAudioDuration] = useState<number>();
```

### Audio Upload Props

```typescript
const audioUploadProps = createAudioUploadProps<UpdateTrackRequest>(
  async (file) => {
    setAudioFile(file);

    // Auto-extract duration
    if (file?.originFileObj) {
      try {
        const duration = await getAudioDuration(file.originFileObj);
        setAudioDuration(duration);
        form.setFieldValue('durationSec', Math.floor(duration));
      } catch (error) {
        console.error('Failed to get audio duration:', error);
      }
    }
  },
  (field, value) => form.setFieldValue(field, value),
);
```

## UI Layout

### Section Order (in drawer)

1. **Current Audio** (conditional - only shows if no new file uploaded)
   - HLSAudioPlayer with current track's HLS URL
   - Shows title, artist, cover image
   - Auto-stops when drawer closes

2. **Replace Audio File (Optional)** (new section)
   - AudioDragger component
   - Help text explaining behavior
   - Shows audio waveform preview when file uploaded
   - Displays detected duration

3. **Basic Information**
   - Title, Artist, Genre fields

4. **Cover Image (Optional)**
   - ImageDragger component
   - Help text: "Leave empty to keep current cover image"

5. **Audio Metadata**
   - Duration (auto-filled from new audio, or keeps existing)
   - BPM
   - Energy Level slider
   - Valence slider

6. **Additional Settings**
   - Mood selector

## API Integration

### Request Payload

```typescript
const payload: UpdateTrackRequest = {
  title: values.title,
  artist: values.artist,
  genre: values.genre,
  durationSec: values.durationSec,
  bpm: values.bpm,
  moodId: values.moodId,
  energyLevel,
  valence,
  audioFile: audioFile?.originFileObj, // NEW - optional
  coverImageFile: coverImageFile?.originFileObj,
};
```

### Backend Behavior (from API docs)

- **Partial update semantics:** `audioFile = null` → keeps existing audio file
- **File replacement:** If `audioFile` provided → replaces old audio file
- **Old file cleanup:** Old audio file deleted from S3 after successful DB commit
- **Transcode trigger:** New audio file triggers HLS transcoding pipeline
- **Max file size:** 50 MB
- **Allowed formats:** `.mp3`, `.wav`, `.aac`, `.flac`, `.ogg`, `.m4a`

## User Workflow

### Scenario 1: Update metadata only (no audio change)

1. User opens Edit Track drawer
2. Current audio player shows existing track
3. User modifies title, artist, BPM, etc.
4. User clicks "Update"
5. Backend keeps existing audio file

### Scenario 2: Replace audio file

1. User opens Edit Track drawer
2. Current audio player shows existing track
3. User drags new audio file to AudioDragger
4. Current audio player disappears
5. AudioDragger shows new file with waveform
6. Duration auto-detected and filled
7. User clicks "Update"
8. Backend replaces old audio with new file
9. Old file deleted from S3
10. New file transcoded to HLS

### Scenario 3: Cancel after uploading new file

1. User uploads new audio file
2. User clicks "Cancel"
3. All state reset (audioFile, audioDuration cleared)
4. No changes saved to backend

## Validation

### Audio File Validation (handled by AudioDragger)

- File type: must be audio format
- File size: max 50 MB
- Format: `.mp3`, `.wav`, `.aac`, `.flac`, `.ogg`, `.m4a`

### Duration Field

- Disabled when new audio uploaded (auto-detected)
- Enabled when no new audio (can manually edit)
- Min value: 1 second
- Validation: must be positive integer

## Error Handling

### Audio Duration Detection Failure

```typescript
try {
  const duration = await getAudioDuration(file.originFileObj);
  setAudioDuration(duration);
  form.setFieldValue('durationSec', Math.floor(duration));
} catch (error) {
  console.error('Failed to get audio duration:', error);
  // User can manually enter duration
}
```

### Backend Upload Failure

- Handled by `useUpdateTrack` hook
- Error message displayed via `handleApiError()`
- Old audio file preserved if update fails

## Consistency with CreateTrackDrawer

Both drawers now have identical audio upload behavior:

- ✅ Same AudioDragger component
- ✅ Same auto-duration detection
- ✅ Same validation rules
- ✅ Same user experience
- ✅ Same error handling

## Testing Checklist

- [ ] Upload new audio file - verify duration auto-detected
- [ ] Upload new audio file - verify current player disappears
- [ ] Update without changing audio - verify old file kept
- [ ] Cancel after uploading - verify state reset
- [ ] Upload invalid file type - verify error message
- [ ] Upload file > 50MB - verify error message
- [ ] Update with new audio - verify old file deleted from S3
- [ ] Update with new audio - verify HLS transcoding triggered
- [ ] Duration field disabled when audio uploaded
- [ ] Duration field enabled when no audio uploaded

## Related Files

- `src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx` (modified)
- `src/features/brand/pages/TrackManagement/components/CreateTrackDrawer.tsx` (reference)
- `src/shared/components/AudioDragger.tsx` (used)
- `src/shared/utils/audioUtils.ts` (getAudioDuration)
- `src/shared/modules/tracks/types/trackTypes.ts` (UpdateTrackRequest)
- `docs/tracks/API_Tracks.md` (API reference - §5.4)

## Benefits

1. **Feature Parity:** Edit drawer now has same capabilities as Create drawer
2. **User Convenience:** Can fix audio issues without deleting and recreating track
3. **Metadata Preservation:** Keeps play count, creation date, etc. when replacing audio
4. **Consistent UX:** Same upload experience across create and edit flows
5. **Auto-Detection:** Reduces manual data entry with duration auto-detection

## Notes

- Audio file upload is **optional** in edit mode (partial update semantics)
- Old audio file only deleted after successful DB commit (safe rollback)
- HLS transcoding happens asynchronously after upload
- Track may temporarily have `hlsUrl = null` during transcoding
- Use retranscode endpoint if transcoding fails
