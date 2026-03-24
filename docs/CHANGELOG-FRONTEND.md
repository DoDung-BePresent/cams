# API Changelog — Frontend & Mobile

> Các thay đổi API ảnh hưởng đến Frontend (React TypeScript) và Mobile (Flutter).  
> **Quy ước:** Mỗi section = 1 PR merge. Section đầu tiên là `[Unreleased]` = thay đổi chưa merge vào `develop`.  
> **So sánh nhanh:** `git log develop..HEAD --oneline`

---

## [2026-03-23] Commit fb68e92baa3 — Docs & API changes impacting Frontend

> Tóm tắt thay đổi quan trọng ảnh hưởng tới Frontend (React TypeScript) và Mobile (Flutter):

- **Tracks**: `audioUrl` → `hlsUrl` (.m3u8) trong response/examples; thêm endpoint per-track `POST /api/tracks/{id}/retranscode` (playlist-level retranscode đã chuyển sang track-level); cập nhật business rule: không thể xóa track nếu còn tồn tại trong playlists hoặc space queues.
- **Playlists**: loại bỏ các trường playlist-level không còn dùng (`isDynamic`, playlist `hlsUrl`, `totalDurationSeconds`); mỗi track trong playlist giờ chứa `hlsUrl` + `seekOffsetSeconds` (dùng để SkipToTrack); playlist-level retranscode bị loại bỏ.
- **CAMS API**: thay đổi lớn về queue model — thêm/chuẩn hoá endpoints quản lý queue (`POST /api/cams/spaces/queue/tracks`, `POST /api/cams/spaces/queue/playlist`, `PATCH /api/cams/spaces/queue/reorder`, `DELETE /api/cams/spaces/queue/all`, v.v.) và `PATCH /api/cams/spaces/state/audio` (volume/mute/queueEndBehavior); Override API hỗ trợ `trackIds` và cờ `isClearManagerSelectedQueues`.
- **SignalR / StoreHub**: `SpaceStateSync` thay đổi schema: `currentPlaylistId`/`currentPlaylistName` → `currentQueueItemId`/`currentTrackName`; thêm `pendingQueueItemId`, `volumePercent`, `isMuted`, `queueEndBehavior`, `spaceQueueItems[]` (new DTO); thêm enum `TrackEnded`; thay đổi semantics của Skip/Seek (SignalR push có thể có `seekOffsetSeconds = null` — frontend phải compute từ `startedAtUtc`).

**Hành động frontend (recommended):**

- Cập nhật TypeScript/Dart models và serializers theo tài liệu: [docs/tracks/API_Tracks.md](docs/tracks/API_Tracks.md), [docs/playlists/API_Playlists.md](docs/playlists/API_Playlists.md), [docs/cams/API_CAMS.md](docs/cams/API_CAMS.md), [docs/cams/SIGNALR_STOREHUB.md](docs/cams/SIGNALR_STOREHUB.md).
- Player logic: khi SignalR push có `seekOffsetSeconds = null` tính offset từ `startedAtUtc`; hiển thị trạng thái "⏳ Đang chuẩn bị" khi `pendingQueueItemId` ≠ null; áp dụng `volumePercent`/`isMuted` từ `SpaceStateSync`.
- Tích hợp lại flow retranscode: thay vì playlist-level, gọi `POST /api/tracks/{id}/retranscode` khi cần force re-transcode.
- Kiểm tra flows liên quan tới xóa track/playlist vì rules giờ tính cả space queues.

Commit tham khảo: `fb68e92baa3236600c6bba53f1ee40f5bf8a39e7` — xem diff đầy đủ trong git để chi tiết.
