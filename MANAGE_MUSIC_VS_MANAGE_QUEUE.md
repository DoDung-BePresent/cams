# Manage Music vs Manage Queue - Giải Thích Chi Tiết

## Tổng Quan

Trong Space Management có 2 actions quan trọng:

- **Manage Music** - Quản lý nhạc (Override & Playback Control)
- **Manage Queue** - Quản lý hàng đợi (Queue Management)

Cả 2 đều liên quan đến việc điều khiển nhạc phát tại Space, nhưng phục vụ mục đích khác nhau.

---

## 1. Manage Music (SpaceMusicDrawer)

### Mục Đích

Điều khiển **nguồn nhạc** và **playback** của Space - tức là chọn nhạc gì sẽ phát và điều khiển phát/dừng/tua.

### Chức Năng Chính

#### 1.1 Override Playlist/Mood (Chọn Nguồn Nhạc)

**API:** `POST /api/cams/spaces/{spaceId}/override`

**Cho phép:**

- Chọn **Playlist** để phát (Mode 1: DirectPlaylist)
- Chọn **Mood** để AI tự chọn nhạc (Mode 2: MoodOverride)
- Chọn **Tracks** thủ công (Mode 3: TrackListOverride)

**Khi nào dùng:**

- Muốn thay đổi playlist đang phát
- Muốn chuyển sang mood khác
- Muốn override AI scheduling

**Ví dụ:**

```typescript
// Chọn playlist "Chill Vibes" để phát
overridePlaylist({
  spaceId: 'space-123',
  playlistId: 'playlist-chill-vibes',
  isClearManagerSelectedQueues: true,
  reason: 'Customer request for chill music',
});
```

#### 1.2 Playback Controls (Điều Khiển Phát)

**API:** `POST /api/cams/spaces/{spaceId}/playback`

**Cho phép:**

- ▶️ Play / ⏸️ Pause
- ⏭️ Skip Next / ⏮️ Skip Previous
- 🔄 Seek (tua tới/lùi)
- 🎯 Skip to Track (nhảy đến bài cụ thể)

**Khi nào dùng:**

- Tạm dừng nhạc khi có thông báo
- Chuyển bài nếu khách hàng không thích
- Tua lại đoạn hay

**Ví dụ:**

```typescript
// Pause nhạc
playbackControl({
  spaceId: 'space-123',
  command: PlaybackCommand.Pause,
});

// Skip sang bài tiếp theo
playbackControl({
  spaceId: 'space-123',
  command: PlaybackCommand.SkipNext,
});
```

#### 1.3 Cancel Override (Hủy Override)

**API:** `DELETE /api/cams/spaces/{spaceId}/override`

**Cho phép:**

- Hủy override thủ công
- Trả quyền điều khiển về AI scheduling

**Khi nào dùng:**

- Đã xong việc override tạm thời
- Muốn AI tự động chọn nhạc lại

---

## 2. Manage Queue (QueueManagementDrawer)

### Mục Đích

Quản lý **hàng đợi phát nhạc** chi tiết - tức là xem và sắp xếp các bài hát sẽ phát tiếp theo.

### Chức Năng Chính

#### 2.1 View Queue (Xem Hàng Đợi)

**API:** `GET /api/cams/spaces/{spaceId}/queue`

**Hiển thị:**

- Danh sách tất cả tracks trong queue
- Status của từng track:
  - 🟢 Playing (đang phát)
  - 🔵 Pending (chờ phát)
  - ⚪ Played (đã phát)
  - 🔴 Skipped (đã bỏ qua)
- Source: AI hoặc Manager
- Position (thứ tự)

**Khi nào dùng:**

- Muốn xem bài nào sẽ phát tiếp theo
- Kiểm tra queue có bao nhiêu bài
- Xem lịch sử đã phát

#### 2.2 Add to Queue (Thêm Vào Hàng Đợi)

**API:**

- `POST /api/cams/spaces/{spaceId}/queue/tracks`
- `POST /api/cams/spaces/{spaceId}/queue/playlist`

**Cho phép:**

- Thêm tracks vào queue với 3 modes:
  - **Play Now** (1): Phát ngay lập tức
  - **Play Next** (2): Phát sau bài hiện tại
  - **Add to Queue** (3): Thêm vào cuối hàng đợi
- Thêm cả playlist vào queue
- Tùy chọn clear queue cũ

**Khi nào dùng:**

- Khách hàng request bài cụ thể
- Muốn xếp hàng nhiều bài
- Chuẩn bị playlist cho event

**Ví dụ:**

```typescript
// Thêm 2 tracks vào cuối queue
addTracksToQueue({
  spaceId: 'space-123',
  trackIds: ['track-1', 'track-2'],
  mode: QueueInsertMode.AddToQueue,
  reason: 'Customer requests',
});

// Phát ngay 1 bài
addTracksToQueue({
  spaceId: 'space-123',
  trackIds: ['track-urgent'],
  mode: QueueInsertMode.PlayNow,
  isClearExistingQueue: false,
});
```

#### 2.3 Reorder Queue (Sắp Xếp Lại)

**API:** `PATCH /api/cams/spaces/{spaceId}/queue/reorder`

**Cho phép:**

- Kéo thả để sắp xếp lại thứ tự pending tracks
- Chỉ áp dụng cho tracks chưa phát

**Khi nào dùng:**

- Muốn đổi thứ tự bài sẽ phát
- Ưu tiên bài quan trọng lên trước

#### 2.4 Remove Queue Items (Xóa Khỏi Hàng Đợi)

**API:** `DELETE /api/cams/spaces/{spaceId}/queue`

**Cho phép:**

- Xóa 1 hoặc nhiều tracks khỏi queue
- Không thể xóa track đang phát

**Khi nào dùng:**

- Bài không phù hợp
- Khách hàng không thích
- Dọn dẹp queue

#### 2.5 Clear Queue (Xóa Toàn Bộ)

**API:** `DELETE /api/cams/spaces/{spaceId}/queue/all`

**Cho phép:**

- Xóa toàn bộ queue
- Dừng phát nhạc

**Khi nào dùng:**

- Reset hoàn toàn
- Kết thúc ca làm việc
- Chuẩn bị cho event mới

#### 2.6 Audio Mixer (Điều Chỉnh Âm Thanh)

**API:** `PATCH /api/cams/spaces/{spaceId}/state/audio`

**Cho phép:**

- Điều chỉnh volume (0-100%)
- Bật/tắt mute
- Chọn queue end behavior:
  - Stop: Dừng khi hết queue
  - Repeat Queue: Lặp lại toàn bộ queue
  - Return to Schedule: Trả về AI scheduling

**Khi nào dùng:**

- Điều chỉnh âm lượng phù hợp
- Tắt tiếng tạm thời
- Cấu hình hành vi khi hết nhạc

---

## 3. So Sánh Trực Tiếp

| Tiêu Chí             | Manage Music                      | Manage Queue                     |
| -------------------- | --------------------------------- | -------------------------------- |
| **Mục đích chính**   | Chọn nguồn nhạc & điều khiển phát | Quản lý chi tiết hàng đợi        |
| **Scope**            | Macro (playlist/mood level)       | Micro (track level)              |
| **Use case**         | "Phát playlist gì?"               | "Bài nào phát tiếp theo?"        |
| **Tần suất sử dụng** | Thỉnh thoảng (khi cần đổi mood)   | Thường xuyên (quản lý hàng ngày) |
| **User persona**     | Manager quyết định chiến lược     | Manager điều chỉnh chi tiết      |

### 3.1 Chức Năng Chính

#### Manage Music

- ✅ Override playlist/mood
- ✅ Play/Pause/Skip controls
- ✅ Cancel override
- ❌ Không xem được queue chi tiết
- ❌ Không sắp xếp được thứ tự tracks

#### Manage Queue

- ✅ Xem toàn bộ queue
- ✅ Add tracks với 3 modes
- ✅ Reorder pending tracks
- ✅ Remove specific tracks
- ✅ Clear all queue
- ✅ Audio mixer controls
- ❌ Không override playlist/mood
- ❌ Không có playback controls cơ bản

---

## 4. Workflow Thực Tế

### Scenario 1: Thay Đổi Mood Toàn Diện

**Dùng: Manage Music**

1. Mở Manage Music drawer
2. Chọn playlist "Energetic Morning"
3. Click "Override" → Toàn bộ queue được thay thế
4. Nhạc chuyển sang mood mới

### Scenario 2: Khách Hàng Request Bài Cụ Thể

**Dùng: Manage Queue**

1. Mở Manage Queue drawer
2. Click "Add to Queue"
3. Chọn tracks khách yêu cầu
4. Chọn mode "Play Next"
5. Bài được xếp vào sau bài đang phát

### Scenario 3: Điều Chỉnh Thứ Tự Phát

**Dùng: Manage Queue**

1. Mở Manage Queue drawer
2. Xem danh sách pending tracks
3. Kéo thả để sắp xếp lại
4. Bài quan trọng lên đầu

### Scenario 4: Tạm Dừng Nhạc

**Dùng: Manage Music**

1. Mở Manage Music drawer (hoặc dùng SpacePlayerCard)
2. Click Pause button
3. Nhạc tạm dừng

### Scenario 5: Chuẩn Bị Playlist Cho Event

**Dùng: Manage Queue**

1. Mở Manage Queue drawer
2. Clear queue hiện tại
3. Add playlist event vào queue
4. Kiểm tra thứ tự
5. Điều chỉnh volume phù hợp

---

## 5. Khi Nào Dùng Cái Nào?

### Dùng Manage Music Khi:

- ✅ Muốn thay đổi **toàn bộ** nguồn nhạc (playlist/mood)
- ✅ Cần điều khiển phát/dừng **nhanh**
- ✅ Override AI scheduling
- ✅ Hủy override về AI
- ✅ Không quan tâm chi tiết từng bài

### Dùng Manage Queue Khi:

- ✅ Muốn xem **chi tiết** bài nào sẽ phát
- ✅ Cần **thêm** bài vào queue (không thay thế toàn bộ)
- ✅ Muốn **sắp xếp lại** thứ tự
- ✅ Cần **xóa** bài cụ thể
- ✅ Điều chỉnh **audio settings** (volume, mute, queue end behavior)
- ✅ Quản lý **hàng ngày** chi tiết

---

## 6. UI Components

### Manage Music (SpaceMusicDrawer)

```
┌─────────────────────────────────┐
│ Manage Music - Counter Area A   │
├─────────────────────────────────┤
│ Select Playlist to Play         │
│ [Dropdown: Choose playlist...]  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │   🎵 Current Track Info     │ │
│ │   ▶️ ⏸️ ⏭️ ⏮️ Controls      │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancel Override]               │
└─────────────────────────────────┘
```

### Manage Queue (QueueManagementDrawer)

```
┌─────────────────────────────────┐
│ Queue Management - Counter A    │
│ [Refresh] [Clear All] [Add]     │
├─────────────────────────────────┤
│ Audio Mixer                     │
│ Volume: [=========>    ] 75%    │
│ Mute: [OFF]                     │
│ Queue End: [Repeat Queue ▼]     │
├─────────────────────────────────┤
│ Queue Items (5 tracks)          │
│                                 │
│ #1 🟢 Evening Chill [Manager]   │
│ #2 🔵 Sunset Vibes [AI]     [×] │
│ #3 🔵 Night Jazz [Manager]  [×] │
│ #4 ⚪ Morning Coffee [AI]    [×] │
│ #5 🔴 Rock Anthem [Manager] [×] │
└─────────────────────────────────┘
```

---

## 7. API Mapping

### Manage Music APIs

```typescript
// Override
POST / api / cams / spaces / { spaceId } / override;
DELETE / api / cams / spaces / { spaceId } / override;

// Playback Control
POST / api / cams / spaces / { spaceId } / playback;

// Get State
GET / api / cams / spaces / { spaceId } / state;
```

### Manage Queue APIs

```typescript
// Queue Operations
GET / api / cams / spaces / { spaceId } / queue;
POST / api / cams / spaces / { spaceId } / queue / tracks;
POST / api / cams / spaces / { spaceId } / queue / playlist;
PATCH / api / cams / spaces / { spaceId } / queue / reorder;
DELETE / api / cams / spaces / { spaceId } / queue;
DELETE / api / cams / spaces / { spaceId } / queue / all;

// Audio Mixer
PATCH / api / cams / spaces / { spaceId } / state / audio;
```

---

## 8. Tóm Tắt

### Manage Music = "Chọn & Phát"

- Chọn playlist/mood nào sẽ phát
- Điều khiển play/pause/skip cơ bản
- Override hoặc cancel override
- **Macro control** - mức playlist

### Manage Queue = "Quản Lý Chi Tiết"

- Xem chi tiết từng bài trong queue
- Thêm/xóa/sắp xếp tracks
- Điều chỉnh audio settings
- **Micro control** - mức track

### Mối Quan Hệ

```
Manage Music (Override Playlist)
        ↓
    Tạo Queue
        ↓
Manage Queue (Điều chỉnh chi tiết)
        ↓
    Phát nhạc
```

---

## 9. Best Practices

### Workflow Khuyến Nghị

1. **Bắt đầu ca làm việc:**
   - Dùng **Manage Music** để chọn playlist phù hợp với thời gian
   - Ví dụ: "Morning Energetic" cho buổi sáng

2. **Trong ca:**
   - Dùng **Manage Queue** để:
     - Thêm bài khách request
     - Xóa bài không phù hợp
     - Sắp xếp thứ tự
     - Điều chỉnh volume

3. **Thay đổi mood:**
   - Dùng **Manage Music** để override sang playlist mới
   - Queue tự động được rebuild

4. **Kết thúc ca:**
   - Dùng **Manage Queue** để clear all
   - Hoặc dùng **Manage Music** để cancel override (về AI)

---

**Kết luận:** Manage Music và Manage Queue bổ sung cho nhau - một cái cho control macro (playlist level), một cái cho control micro (track level). Sử dụng kết hợp để có trải nghiệm quản lý nhạc tốt nhất!
