# CAMS Frontend Migration Guide (2026-03-23)

> Step-by-step guide for developers to update components after API changes

---

## 🎯 Quick Start

### What Changed?

1. **Tracks**: `audioUrl` → `hlsUrl` (HLS streaming)
2. **Playlists**: Removed `isDynamic`, `hlsUrl`, `totalDurationSeconds`
3. **CAMS**: New queue model with volume/mute controls
4. **Retranscode**: Moved from playlist-level to track-level

### What's Already Done? ✅

- ✅ TypeScript types updated
- ✅ API services updated
- ✅ React Query hooks updated
- ✅ Helper functions ready

### What You Need to Do? ⏳

- ⏳ Update compo
