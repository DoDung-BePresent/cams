# CAMS Engine — Mock Data Seed & E2E Test Guide

Hướng dẫn seed toàn bộ dữ liệu mock vào PostgreSQL và chạy kiểm thử end-to-end pipeline CAMS (Fuzzy Logic → Playlist → SignalR) trong môi trường local Docker.

---

## Yêu cầu trước khi bắt đầu

| Điều kiện | Kiểm tra |
|---|---|
| Docker đang chạy | `docker ps` thấy `logaicams-api`, `logaicams-postgres` |
| API healthy | `curl http://localhost:5001/health` → `200 OK` |
| Firestore disabled | `.env` có `Firestore__Enabled=false` (dùng MockTelemetryRepository) |

Nếu API chưa chạy:
```bash
cd Log.AI-CAMS-v2
docker compose up -d
```

Nếu cần reload env sau khi sửa `.env`:
```bash
docker compose up -d --no-deps logaicams-api
```

---

## Bước 1 — Kiểm tra Moods đã seed sẵn

Hệ thống seed 6 Mood khi khởi động. Ba mood quan trọng với CAMS Engine:

```bash
docker exec -i logaicams-postgres psql -U admin -d logaicams_db -c \
  "SELECT id, name, mood_type, min_bpm, max_bpm FROM moods ORDER BY mood_type;"
```

Kết quả mong đợi:

| id | name | mood_type | min_bpm | max_bpm |
|---|---|---|---|---|
| `9ba6995e-...` | Calm | 1 | 60 | 80 |
| `c09c7cce-...` | Energetic | 2 | 120 | 140 |
| `e57cb285-...` | Focus | 3 | 85 | 105 |

> **Lưu ý:** Mood IDs được sinh ra cố định khi seeding. Chép lại 3 ID trên để dùng trong bước 2.

---

## Bước 2 — Seed toàn bộ Mock Data

Chạy script SQL sau để tạo Brand → Store → Space → 3 Playlists:

```bash
docker exec -i logaicams-postgres psql -U admin -d logaicams_db << 'ENDSQL'
-- ============================================================
-- CAMS MOCK DATA SEED
-- Chạy lại an toàn (ON CONFLICT DO NOTHING / DO UPDATE)
-- ============================================================

-- 1. Brand
INSERT INTO brands (id, name, description, is_deleted, status, created_at)
VALUES (
    '11111111-0000-0000-0000-000000000001',
    'DeerCoffee Mock',
    'Mock brand for CAMS testing',
    false, 1, NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Store
INSERT INTO stores (id, brand_id, name, address, is_deleted, status, created_at)
VALUES (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'DeerCoffee - Hoàn Kiếm',
    '15 Hàng Gai, Hoàn Kiếm, Hà Nội',
    false, 1, NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Space (io_t_device_id = 'esp32-mock-01' khớp với MockTelemetryRepository)
INSERT INTO spaces (id, store_id, name, description, type, max_occupancy,
                   critical_queue_threshold, is_deleted, status, io_t_device_id, created_at)
VALUES (
    '33333333-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    'Main Hall', 'Khu vực ngồi chính',
    0, 20, 15, false, 1, 'esp32-mock-01', NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4a. Playlist Chill (mood_type=1 Calm)
INSERT INTO playlists (id, store_id, mood_id, name, description, is_default, is_dynamic,
                       is_deleted, status, hls_url, total_duration_seconds,
                       transcode_status, transcode_version, created_at)
VALUES (
    'aaaa0000-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    '9ba6995e-3c6b-4e6f-a9f8-f6d56da109e9',   -- Calm mood
    'Chill Lofi - Morning', 'Nhạc chill buổi sáng cho quán ít khách',
    true, false, false, 1,
    'audio/mock/chill-lofi/master.m3u8',
    3600, 3, 1, NOW()
) ON CONFLICT (id) DO UPDATE SET
    hls_url = EXCLUDED.hls_url, status = 1, total_duration_seconds = EXCLUDED.total_duration_seconds;

-- 4b. Playlist Focus (mood_type=3 Focus)
INSERT INTO playlists (id, store_id, mood_id, name, description, is_default, is_dynamic,
                       is_deleted, status, hls_url, total_duration_seconds,
                       transcode_status, transcode_version, created_at)
VALUES (
    'aaaa0000-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    'e57cb285-a137-4dc0-b72b-28186ebe9315',   -- Focus mood
    'Deep Focus - Work', 'Nhạc tập trung làm việc',
    true, false, false, 1,
    'audio/mock/deep-focus/master.m3u8',
    3600, 3, 1, NOW()
) ON CONFLICT (id) DO UPDATE SET
    hls_url = EXCLUDED.hls_url, status = 1, total_duration_seconds = EXCLUDED.total_duration_seconds;

-- 4c. Playlist Energetic (mood_type=2 Energetic)
INSERT INTO playlists (id, store_id, mood_id, name, description, is_default, is_dynamic,
                       is_deleted, status, hls_url, total_duration_seconds,
                       transcode_status, transcode_version, created_at)
VALUES (
    'aaaa0000-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000001',
    'c09c7cce-ed47-4002-b784-96f6bd6a908a',   -- Energetic mood
    'Energetic Peak - Rush Hour', 'Nhạc bật mạnh giờ cao điểm',
    true, false, false, 1,
    'audio/mock/energetic-rush/master.m3u8',
    2700, 3, 1, NOW()
) ON CONFLICT (id) DO UPDATE SET
    hls_url = EXCLUDED.hls_url, status = 1, total_duration_seconds = EXCLUDED.total_duration_seconds;

-- Verify
SELECT 'brand'    as entity, id, name FROM brands    WHERE id = '11111111-0000-0000-0000-000000000001'
UNION ALL
SELECT 'store',   id, name FROM stores    WHERE id = '22222222-0000-0000-0000-000000000001'
UNION ALL
SELECT 'space',   id, name FROM spaces    WHERE id = '33333333-0000-0000-0000-000000000001'
UNION ALL
SELECT 'pl_chill',   id, name FROM playlists WHERE id = 'aaaa0000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'pl_focus',   id, name FROM playlists WHERE id = 'aaaa0000-0000-0000-0000-000000000002'
UNION ALL
SELECT 'pl_energy',  id, name FROM playlists WHERE id = 'aaaa0000-0000-0000-0000-000000000003';
ENDSQL
```

Kết quả mong đợi: 6 dòng entity được in ra, tất cả `INSERT 0 1` hoặc `UPDATE 1`.

---

## Bước 3 — Login & Lấy JWT Token

```bash
TOKEN=$(curl -s -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cams.deercoffee.vn","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "Token: ${TOKEN:0:60}..."
```

---

## Bước 4 — Chạy E2E Test Thủ Công

### 4.1 — Trigger Fuzzy Analysis

Chạy 1 vòng phân tích Fuzzy Logic cho Space:

```bash
curl -s -X POST "http://localhost:5001/api/cams/trigger-analysis/33333333-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "storeId": "22222222-0000-0000-0000-000000000001",
    "brandId": "11111111-0000-0000-0000-000000000001",
    "spaceMaxOccupancy": 20
  }' | python3 -m json.tool
```

**Response mẫu:**
```json
{
  "isSuccess": true,
  "data": {
    "spaceId": "33333333-0000-0000-0000-000000000001",
    "targetMood": 1,
    "targetMoodType": 3,
    "moodChanged": true,
    "previousMood": null,
    "pressure": 1,
    "stress": 1,
    "density": 2,
    "triggeredRule": "DEFAULT",
    "reason": "No specific rule matched (Pressure=Medium, Stress=Tolerable, Density=Crowded). Defaulting to Focus mood as a neutral safe state.",
    "analyzedAtUtc": "2026-03-10T09:38:14Z"
  }
}
```

### 4.2 — Force Playlist Transition (Full Pipeline)

Buộc pipeline chạy đầy đủ: Fuzzy → MoodChangedEvent → Playlist → SignalR:

```bash
curl -s -X POST "http://localhost:5001/api/cams/force-transition/33333333-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "storeId": "22222222-0000-0000-0000-000000000001",
    "brandId": "11111111-0000-0000-0000-000000000001",
    "spaceMaxOccupancy": 20
  }' | python3 -m json.tool
```

### 4.3 — Đọc Mood State Hiện Tại

```bash
curl -s "http://localhost:5001/api/cams/space/33333333-0000-0000-0000-000000000001/mood" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Response mẫu:**
```json
{
  "isSuccess": true,
  "data": {
    "spaceId": "33333333-0000-0000-0000-000000000001",
    "spaceName": "Main Hall",
    "currentMood": 1,
    "currentMoodType": 3,
    "moodName": "Focus",
    "bpmMin": 85,
    "bpmMax": 105,
    "lastAnalyzedAtUtc": "2026-03-10T09:39:28Z",
    "isFirstCycle": false
  }
}
```

---

## Bước 5 — Xác nhận kết quả trong DB

### 5.1 — Kiểm tra SpaceMusicState (Playlist đang phát)

```bash
docker exec -i logaicams-postgres psql -U admin -d logaicams_db -c "
SELECT
    sms.space_id,
    sms.current_mood_tag,
    sms.started_at_utc,
    sms.expected_end_at_utc,
    p.name  AS playlist_name,
    p.hls_url,
    p.total_duration_seconds
FROM space_music_states sms
LEFT JOIN playlists p ON p.id = sms.current_playlist_id
WHERE sms.space_id = '33333333-0000-0000-0000-000000000001';
"
```

### 5.2 — Kiểm tra ContextHistory (Audit log AI)

```bash
docker exec -i logaicams-postgres psql -U admin -d logaicams_db -c "
SELECT
    ch.space_id,
    m.name     AS mood_name,
    ch.crowd_density,
    ch.avg_temperature,
    ch.measured_at
FROM context_histories ch
LEFT JOIN moods m ON m.id = ch.mood_id
WHERE ch.space_id = '33333333-0000-0000-0000-000000000001'
ORDER BY ch.measured_at DESC
LIMIT 10;
"
```

---

## Bước 6 — Test Auto Trigger (Background Job)

Giả lập "playlist hết hạn" để Hangfire `PlaylistTransitionJob` tự kích hoạt:

```bash
# Đặt ExpectedEndAtUtc về quá khứ
docker exec -i logaicams-postgres psql -U admin -d logaicams_db -c "
UPDATE space_music_states
SET expected_end_at_utc = NOW() - INTERVAL '2 minutes'
WHERE space_id = '33333333-0000-0000-0000-000000000001';
"

# Theo dõi log — Job sẽ tự chạy trong vòng 60 giây tiếp theo
docker logs -f logaicams-api 2>&1 | grep -E "\[PlaylistTransition|SignalR.*PlayStream"
```

**Log mong đợi sau ~60 giây:**
```
[PlaylistTransitionJob] Found 1 space(s) needing playlist transition.
[PlaylistTransition]    Space=33333333-... | Mood=Focus | Rule=DEFAULT
[CAMS Event]            SpaceMusicState updated | Playlist=Deep Focus - Work | ExpectedEnd=+1h
[SignalR] ✅            PlayStream → Group=33333333-... | HLS=https://....cloudfront.net/audio/mock/deep-focus/master.m3u8
```

---

## Mock IoT Scenarios (MockTelemetryRepository)

Khi `Firestore__Enabled=false`, hệ thống dùng `MockTelemetryRepository` trả về 4 scenario cố định. `GetLastNMinutesAsync` (dùng bởi SlidingWindow) luôn trả 2 sample đầu tiên:

| Scenario | PeopleCount | Temp (°C) | WiFi Devices | Fuzzy dự kiến |
|---|---|---|---|---|
| 1 – Rush Hour | 7 | 25.0 | 10 | Energetic (nếu đứng 1 mình) |
| 2 – Heatwave | 3 | 34.5 | 25 | Chill (nếu đứng 1 mình) |
| 3 – Retention | 1 | 26.0 | 15 | Focus |
| 4 – Default | 4 | 27.0 | null | Focus |

**Sliding Window luôn lấy sample 1+2:**
- People median: `(7+3)/2 = 5` → Pressure = Medium (5/20 = 25%)
- WiFi avg: `(10+25)/2 = 17.5` → Density = Crowded (17.5/20 = 87.5%)
- Temp avg: `(25.0+34.5)/2 = 29.75°C` → Stress = Tolerable
- **Kết quả: Rule DEFAULT → Mood = Focus**

### Tạo scenario Energetic để test

Để trigger rule Energetic (cần Pressure = Critical ≥ 90%):

```bash
# Giảm max_occupancy xuống 5 người (5 người / 5 = 100% critical)
docker exec -i logaicams-postgres psql -U admin -d logaicams_db -c "
UPDATE spaces SET max_occupancy = 5
WHERE id = '33333333-0000-0000-0000-000000000001';
"
```

Sau đó trigger lại analysis → Fuzzy sẽ fire rule **PRESSURE_CRITICAL → Energetic**.

Restore về 20:
```bash
docker exec -i logaicams-postgres psql -U admin -d logaicams_db -c "
UPDATE spaces SET max_occupancy = 20
WHERE id = '33333333-0000-0000-0000-000000000001';
"
```

---

## Cleanup (Xoá toàn bộ mock data)

```bash
docker exec -i logaicams-postgres psql -U admin -d logaicams_db << 'ENDSQL'
DELETE FROM space_music_states WHERE space_id = '33333333-0000-0000-0000-000000000001';
DELETE FROM context_histories  WHERE space_id = '33333333-0000-0000-0000-000000000001';
DELETE FROM playlists WHERE id IN (
    'aaaa0000-0000-0000-0000-000000000001',
    'aaaa0000-0000-0000-0000-000000000002',
    'aaaa0000-0000-0000-0000-000000000003'
);
DELETE FROM spaces WHERE id = '33333333-0000-0000-0000-000000000001';
DELETE FROM stores  WHERE id = '22222222-0000-0000-0000-000000000001';
DELETE FROM brands  WHERE id = '11111111-0000-0000-0000-000000000001';
ENDSQL
```
