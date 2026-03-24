# CAMS Engine — Tài liệu kỹ thuật

Tài liệu kỹ thuật cho **CAMS Engine** — bộ não tự động của hệ thống CAMS (Context-Aware AI Music System).

CAMS Engine chịu trách nhiệm:

- Thu thập dữ liệu IoT từ cảm biến (ESP32, camera YOLO)
- Phân tích context bằng thuật toán Fuzzy Logic (mô hình Mehrabian-Russell)
- Tự động chọn playlist nhạc phù hợp với không gian
- Đẩy HLS stream URL xuống tablet qua SignalR

---

## Nội dung tài liệu

| File                                                                               | Mô tả                                                                                  |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [MOCK_DATA_SEED.md](MOCK_DATA_SEED.md)                                             | Seed mock data vào PostgreSQL và chạy E2E test từ đầu đến cuối                         |
| [BACKGROUND_JOBS.md](BACKGROUND_JOBS.md)                                           | Kiến trúc 2 background jobs, flow diagram, log guide, config reference                 |
| [FUZZYLOGIC_MUSIC_SELECTION_EXPLAINED.md](FUZZYLOGIC_MUSIC_SELECTION_EXPLAINED.md) | Giải thích end-to-end vì sao AI chọn bài nhạc cụ thể (rule, BPM band, fallback, guard) |

---

## Kiến trúc tóm tắt

```
IoT Sensor (ESP32)
    │
    ▼  (Firestore / Mock)
SlidingWindowAggregator        ← chống State Flapping (Median 5 phút)
    │
    ▼
FuzzyLogicEngine               ← Mehrabian-Russell Model
    │  ServicePressure + EnvironmentalStress + DwellingDensity
    │  → CamsMood { Chill | Focus | Energetic }
    ▼
MoodChangedDomainEvent
    │
    ▼
MusicRepository                ← chọn HLS playlist khớp mood + brand
    │
    ▼
HlsUrlBuilderService           ← relative path → CloudFront CDN URL
    │
    ▼
SignalR PushPlayStream         ← tablet nhận URL m3u8, bắt đầu stream
```

---

## Quick Start (Local Docker)

```bash
# 1. Đảm bảo containers đang chạy
docker compose up -d

# 2. Seed mock data (Brand → Store → Space → 3 Playlists)
# Xem chi tiết: MOCK_DATA_SEED.md

# 3. Login lấy JWT
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cams.deercoffee.vn","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# 4. Trigger thủ công
curl -s -X POST "http://localhost:5001/api/cams/trigger-analysis/33333333-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"storeId":"22222222-0000-0000-0000-000000000001","brandId":"11111111-0000-0000-0000-000000000001","spaceMaxOccupancy":20}' \
  | python3 -m json.tool

# 5. Xem log pipeline
docker logs -f logaicams-api 2>&1 | grep -E "\[CAMS|FuzzyEngine|SignalR|Playlist"
```

---

## Liên kết tài liệu liên quan

| Tài liệu                        | Đường dẫn                                                            |
| ------------------------------- | -------------------------------------------------------------------- |
| CAMS API (Manager endpoints)    | [docs/cams/API_CAMS.md](../cams/API_CAMS.md)                         |
| SignalR StoreHub events         | [docs/cams/SIGNALR_STOREHUB.md](../cams/SIGNALR_STOREHUB.md)         |
| CloudFront & MediaConvert setup | [docs/CAMS-CLOUDFRONT-SETUP.md](../CAMS-CLOUDFRONT-SETUP.md)         |
| Environment variables           | [docs/ENVIRONMENT_CONFIGURATION.md](../ENVIRONMENT_CONFIGURATION.md) |
| Hangfire Dashboard              | http://localhost:5001/hangfire                                       |
| Swagger UI                      | http://localhost:5001/swagger                                        |
