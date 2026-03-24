# Bugfix: HLS Audio Player Implementation [2026-03-24]

## Issue

Track audio player in TrackDetailsDrawer không phát được nhạc từ HLS streams (.m3u8 files).

### Symptoms

- Player hiển thị UI bình thường
- Có cover image, title, artist
- Nhưng không phát được audio khi click play
- Console có thể có errors về loading audio

### Root Cause

Component `TrackAudioPlayer` sử dụng WaveSurfer.js với backend 'WebAudio', nhưng:

- WaveSurfer.js không hỗ trợ HLS (.m3u8) streams natively
- Backend API trả về `hlsUrl` (HLS master playlist)
- Cần HLS.js để phát HLS adaptive streaming

## Solution

Tạo component mới `HLSAudioPlayer` sử dụng HLS.js để phát HLS streams.

### New Component: HLSAudioPlayer

**File:** `src/shared/modules/tracks/components/HLSAudioPlayer.tsx`

**Features:**

- ✅ HLS.js integration for adaptive streaming
- ✅ Native HLS support fallback (Safari)
- ✅ Progress slider with seek functionality
- ✅ Play/pause controls
- ✅ Time display (current / total)
- ✅ Cover image display
- ✅ Loading states
- ✅ Error handling with recovery
- ✅ Auto-stop when drawer closes

**Key Technologies:**

```typescript
import Hls from 'hls.js';

// Check HLS support
if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(hlsUrl);
  hls.attachMedia(audioElement);
} else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
  // Native HLS (Safari)
  audio.src = hlsUrl;
}
```

### Differences from TrackAudioPlayer

| Feature            | TrackAudioPlayer   | HLSAudioPlayer         |
| ------------------ | ------------------ | ---------------------- |
| Library            | WaveSurfer.js      | HLS.js + HTML5 Audio   |
| Waveform           | ✅ Visual waveform | ❌ Simple slider       |
| HLS Support        | ❌ No              | ✅ Yes                 |
| Adaptive Streaming | ❌ No              | ✅ Yes                 |
| Browser Support    | Limited            | Wide (HLS.js + native) |
| File Types         | MP3, WAV, etc.     | HLS (.m3u8)            |

## Files Modified

### New Files (1)

1. `src/shared/modules/tracks/components/HLSAudioPlayer.tsx` - New HLS player component

### Modified Files (4)

1. `src/shared/modules/tracks/components/index.ts` - Added export
2. `src/features/admin/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Use HLSAudioPlayer
3. `src/features/brand/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Use HLSAudioPlayer
4. `src/features/store/pages/TrackManagement/components/TrackDetailsDrawer.tsx` - Use HLSAudioPlayer

### Changes Applied

**Before:**

```tsx
import { TrackAudioPlayer } from '@/shared/modules/tracks/components';

<TrackAudioPlayer
  audioUrl={track.hlsUrl} // ❌ Wrong prop name
  title={track.title}
  artist={track.artist}
  coverImageUrl={track.coverImageUrl}
/>;
```

**After:**

```tsx
import { HLSAudioPlayer } from '@/shared/modules/tracks/components';

<HLSAudioPlayer
  hlsUrl={track.hlsUrl} // ✅ Correct prop name
  title={track.title}
  artist={track.artist}
  coverImageUrl={track.coverImageUrl}
  shouldStop={!open} // Auto-stop when drawer closes
/>;
```

## HLS.js Features Used

### Adaptive Streaming

- Automatically switches quality based on network conditions
- Supports multiple bitrates
- Smooth transitions between qualities

### Error Recovery

```typescript
hls.on(Hls.Events.ERROR, (_event, data) => {
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        // Show network error message
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        // Try to recover
        hls.recoverMediaError();
        break;
      default:
        // Fatal error - destroy player
        hls.destroy();
        break;
    }
  }
});
```

### Browser Compatibility

- Chrome, Firefox, Edge: HLS.js (MSE)
- Safari: Native HLS support
- Fallback: Error message if not supported

## Testing

### Manual Testing Steps

1. **Open Track Details:**
   - Navigate to Track Management
   - Click "View Details" on any track with hlsUrl

2. **Verify Player Loads:**
   - Player UI appears
   - Cover image displays
   - Title and artist show correctly
   - "Loading audio stream..." appears briefly

3. **Test Playback:**
   - Click play button
   - Audio starts playing
   - Progress slider moves
   - Time updates (00:05 / 00:30)

4. **Test Seek:**
   - Drag progress slider
   - Audio jumps to new position
   - Time updates correctly

5. **Test Pause:**
   - Click pause button
   - Audio stops
   - Progress slider stops moving

6. **Test Drawer Close:**
   - Close drawer while playing
   - Audio stops automatically
   - No audio continues in background

7. **Test Error Handling:**
   - Try track with invalid hlsUrl
   - Error message displays
   - No console errors crash app

### Expected Behavior

✅ Audio plays smoothly from HLS stream  
✅ Seek works correctly  
✅ Play/pause toggles properly  
✅ Time displays accurately  
✅ Auto-stops when drawer closes  
✅ Error messages show for failed loads  
✅ Loading state shows during initialization

## API Response Structure

```json
{
  "hlsUrl": "https://ddbdgg08nzlz.cloudfront.net/audio/tracks/{id}/v1/{filename}.m3u8",
  "title": "Demoooo",
  "artist": "Gemini",
  "coverImageUrl": "https://logaicams-bucket.s3.ap-southeast-1.amazonaws.com/...",
  "durationSec": 30
}
```

## HLS Stream Structure

```
master.m3u8 (playlist)
├── variant_1.m3u8 (low quality)
├── variant_2.m3u8 (medium quality)
└── variant_3.m3u8 (high quality)
    ├── segment_0.ts
    ├── segment_1.ts
    └── segment_2.ts
```

## Performance Considerations

### Advantages

- Adaptive bitrate streaming
- Efficient bandwidth usage
- Better user experience on slow networks
- CDN-friendly (CloudFront)

### Memory Management

- HLS instance destroyed on unmount
- Audio element cleaned up properly
- Event listeners removed

## Future Enhancements

### High Priority

- [ ] Volume control slider
- [ ] Playback speed control (0.5x, 1x, 1.5x, 2x)
- [ ] Keyboard shortcuts (Space = play/pause, Arrow keys = seek)

### Medium Priority

- [ ] Playlist support (play multiple tracks)
- [ ] Loop/repeat controls
- [ ] Download button (if allowed)
- [ ] Share button

### Low Priority

- [ ] Visualizer (frequency bars)
- [ ] Lyrics display (if available)
- [ ] Equalizer controls

## Dependencies

### Required

- `hls.js` - HLS streaming library
- `lucide-react` - Icons (PlayIcon, PauseIcon)
- `antd` - UI components

### Installation

```bash
npm install hls.js
# or
yarn add hls.js
```

## Browser Support

| Browser        | Support | Method       |
| -------------- | ------- | ------------ |
| Chrome 34+     | ✅ Yes  | HLS.js (MSE) |
| Firefox 42+    | ✅ Yes  | HLS.js (MSE) |
| Edge 12+       | ✅ Yes  | HLS.js (MSE) |
| Safari 8+      | ✅ Yes  | Native HLS   |
| iOS Safari     | ✅ Yes  | Native HLS   |
| Android Chrome | ✅ Yes  | HLS.js (MSE) |

## Troubleshooting

### Audio doesn't play

- Check hlsUrl is valid .m3u8 file
- Check CORS headers on CDN
- Check browser console for errors
- Verify HLS.js is installed

### Seek doesn't work

- Check duration is loaded (not 0)
- Check audio element has seekable ranges
- Verify HLS manifest is complete

### Audio stops when drawer closes

- This is expected behavior (shouldStop prop)
- Remove shouldStop prop if you want audio to continue

## Related Documentation

- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [AWS CloudFront HLS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/on-demand-streaming-hls.html)

---

**Fixed by:** Kiro AI Assistant  
**Date:** 2026-03-24  
**Status:** ✅ Resolved  
**Impact:** All track detail drawers now play HLS audio correctly
