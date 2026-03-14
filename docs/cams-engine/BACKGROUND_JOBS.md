# CAMS Engine — Background Jobs Architecture

Tài liệu mô tả kiến trúc và luồng hoạt động của 2 background jobs trong CAMS Engine:
**ContextAnalysisWorker** và **PlaylistTransitionJob**.

---

## Tổng quan kiến trúc

CAMS Engine có 2 jobs độc lập, mỗi job phục vụ một mục đích khác nhau:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CAMS ENGINE                                      │
│                                                                          │
│  ┌──────────────────────────┐    ┌──────────────────────────────────┐   │
│  │  ContextAnalysisWorker   │    │      PlaylistTransitionJob        │   │
│  │  (.NET BackgroundService)│    │      (Hangfire Recurring)         │   │
│  │                          │    │                                  │   │
│  │  Trigger: Timer 60s      │    │  Trigger: Hangfire 60s +         │   │
│  │                          │    │  ExpectedEndAtUtc ≤ Now-30s      │   │
│  │  Mục đích:               │    │                                  │   │
│  │  Phân tích context IoT   │    │  Mục đích:                       │   │
│  │  → đổi mood khi cần      │    │  Rotate playlist khi hết thời    │   │
│  │                          │    │  lượng (seamless transition)     │   │
│  └────────────┬─────────────┘    └──────────────┬───────────────────┘   │
│               │                                  │                       │
│               ▼                                  ▼                       │
│     AnalyzeSpaceContextCommand       EvaluateAndTransitionPlaylistCommand│
│               │                                  │                       │
│               └─────────────────┬────────────────┘                       │
│                                 ▼                                        │
│                      SlidingWindowAggregator                             │
│                      FuzzyLogicEngine                                    │
│                      MoodChangedDomainEvent                              │
│                      MusicRepository (chọn playlist)                    │
│                      SpaceMusicStateRepository (lưu state)              │
│                      SignalRMusicService (push HLS URL)                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Job 1 — ContextAnalysisWorker

**File:** `LogAICAMS.Infrastructure/Workers/ContextAnalysisWorker.cs`
**Type:** `BackgroundService` (IHostedService Singleton)
**Interval:** 60 giây (hardcoded `TimeSpan.FromSeconds(60)`)

### Trách nhiệm

Phân tích **context realtime** từ IoT — chỉ đổi nhạc khi context thực sự thay đổi (ví dụ: quán đột ngột đông lên).

### Flow chi tiết

```
[Timer 60s]
    │
    ▼
GetActiveSpacesForCamsQuery
    │  → Truy vấn tất cả Space có status=Active, is_deleted=false
    │  → Trả về List<ActiveSpaceForCamsDto> (SpaceId, StoreId, BrandId, IoTDeviceId, ...)
    │
    ▼ [Parallel – Task.WhenAll per Space]
AnalyzeSpaceContextCommand (SpaceId, StoreId, BrandId, IoTDeviceId)
    │
    ├─► SlidingWindowAggregator.AggregateAsync(IoTDeviceId, windowMinutes=5)
    │       │
    │       └─► ITelemetryRepository.GetLastNMinutesAsync(IoTDeviceId, minutes=5)
    │               [Firestore__Enabled=true]  → FirestoreTelemetryRepository
    │               [Firestore__Enabled=false] → MockTelemetryRepository
    │
    ├─► FuzzyLogicEngine.Analyze(aggregatedPayload, maxOccupancy)
    │       │  Tính 3 biến ngôn ngữ:
    │       │  • ServicePressure  = PeopleCount / MaxOccupancy
    │       │  • EnvironmentalStress = Temperature → Low/Tolerable/High
    │       │  • DwellingDensity  = WiFiDevices / MaxOccupancy
    │       │
    │       │  Rules (ưu tiên từ trên xuống):
    │       │  1. Pressure = Critical (≥90%)     → Energetic
    │       │  2. Stress = High AND Density = Crowded → Chill
    │       │  3. DEFAULT                          → Focus
    │       │
    │       └─► FuzzyAnalysisResult { TargetMood, Reason, TriggeredRule }
    │
    ├─► So sánh TargetMood vs CurrentMood (ContextHistory)
    │       [Mood KHÔNG đổi] → ghi ContextHistory, return (không push SignalR)
    │       [Mood ĐỔI]       → publish MoodChangedDomainEvent
    │
    └─► [Event] MoodChangedDomainEventHandler
            │
            ├─► IMusicRepository.GetHlsPlaylistAsync(mood, storeId, excludeCurrentPlaylist)
            │       → Trả về HlsPlaylistInfo { PlaylistId, HlsUrl, TotalDurationSeconds, ... }
            │
            ├─► IHlsUrlBuilderService.BuildUrl(rawPath)
            │       → "audio/mock/deep-focus/master.m3u8"
            │       → "https://xxx.cloudfront.net/audio/mock/deep-focus/master.m3u8"
            │
            ├─► ISpaceMusicStateRepository.UpsertAsync(state)
            │       ExpectedEndAtUtc = Now + TotalDurationSeconds
            │
            └─► ISignalRMusicService.PushPlayStreamAsync(spaceId, hlsUrl, mood)
                    → Tablet nhận URL m3u8 và bắt đầu stream
```

### Điều kiện bỏ qua Space

- `IsManualOverride = true` → Worker **bỏ qua hoàn toàn**, không phân tích Space đó.
- Space không có `IoTDeviceId` → Fallback về Mock/default data.

---

## Job 2 — PlaylistTransitionJob

**File:** `LogAICAMS.Infrastructure/Jobs/PlaylistTransitionJob.cs`
**Type:** Hangfire Recurring Job (`[Queue("cams")]`)
**Schedule:** Hangfire cron mỗi 60 giây
**Buffer:** 30 giây trước khi hết hạn (seamless crossfade)

### Trách nhiệm

Quản lý **vòng đời playlist** — tự động rotate sang playlist tiếp theo khi bài nhạc hiện tại sắp hết.

### Flow chi tiết

```
[Hangfire Scheduler 60s]
    │
    ├─► ClearExpiredOverridesAsync()
    │       → Tìm Space có IsManualOverride=true VÀ ExpectedEndAtUtc đã qua
    │       → Tự động tắt override, push SpaceStateSync SignalR → tablet resume AI mode
    │
    ▼
ISpaceMusicStateRepository.GetExpiredOrUnstartedAsync(bufferSeconds=30)
    │  → WHERE ExpectedEndAtUtc <= NOW() + 30s
    │     OR   CurrentPlaylistId IS NULL (chưa bao giờ phát)
    │  → Trả về List<SpaceMusicState>
    │
    [Không có Space hết hạn] → return (log debug, nothing to do)
    │
    ▼ [Parallel – Task.WhenAll per expired Space]
EvaluateAndTransitionPlaylistCommand (SpaceId, StoreId, BrandId, IoTDeviceId)
    │
    │  [Giống flow của ContextAnalysisWorker từ đây, nhưng LUÔN publish event]
    │  → SlidingWindowAggregator → FuzzyLogicEngine
    │  → LUÔN publish MoodChangedDomainEvent (dù mood không đổi)
    │     vì mục đích là ROTATE playlist, không phải chỉ đổi mood
    │
    └─► MoodChangedDomainEventHandler
            → Chọn playlist tiếp theo (excludePlaylistId = currentPlaylistId)
            → Update SpaceMusicState.ExpectedEndAtUtc = Now + TotalDurationSeconds
            → SignalR push HLS URL mới đến tablet
```

### Sự khác biệt then chốt giữa 2 Jobs

| | ContextAnalysisWorker | PlaylistTransitionJob |
|---|---|---|
| **Trigger** | Timer 60s | Hangfire 60s + hết hạn playlist |
| **Khi nào push SignalR** | Chỉ khi **mood thay đổi** | **Luôn luôn** (để rotate playlist) |
| **Skip override** | ✅ Bỏ qua space đang override | ✅ Auto-clear override hết hạn |
| **Dùng exclude playlist** | ❌ Không (chọn playlist tốt nhất) | ✅ Có (tránh lặp playlist cũ) |
| **Nguồn IoTDeviceId** | Từ `ActiveSpaceForCamsDto` | Bulk query từ `Space.IoTDeviceId` |

---

## Sliding Window Aggregation

Cơ chế chống "State Flapping" (dao động nhạc liên tục do spike dữ liệu IoT).

**File:** `LogAICAMS.Application/Common/Services/SlidingWindowAggregator.cs`

```
Thay vì lấy 1 điểm latest:
  IoT: 15 người → AI: ENERGETIC (1 phút sau đoàn khách đi → Chill → Energetic → ...)

Dùng Sliding Window 5 phút:
  [3, 5, 15, 4, 2] → Median = 4 → Pressure = Low → Mood ổn định
```

| Biến | Phương pháp | Lý do |
|---|---|---|
| `PeopleCount` | Median | Loại bỏ spike đột ngột |
| `WifiDeviceCount` | Median | Loại bỏ spike đột ngột |
| `Temperature` | Average | Nhiệt độ thay đổi chậm, trung bình hợp lý |
| `Humidity` | Average | Tương tự nhiệt độ |

Config window size (mặc định 5 phút):
```bash
# .env
Cams__SlidingWindowMinutes=5
```

---

## Fuzzy Logic Engine

**File:** `LogAICAMS.Application/Common/Services/FuzzyLogicEngine.cs`

### Input Variables

```
ServicePressure   = PeopleCount(median) / SpaceMaxOccupancy
                    Low:      0% – 40%
                    Medium:  40% – 70%
                    High:    70% – 90%
                    Critical: 90% – 100%

EnvironmentalStress = Temperature(avg)
                    Comfortable: < 26°C
                    Tolerable:   26°C – 32°C
                    High:        > 32°C

DwellingDensity   = WiFiDevices(median) / SpaceMaxOccupancy
                    Sparse:   0% – 30%
                    Moderate: 30% – 60%
                    Crowded:  > 60%
```

### Rule Base (Priority Order)

| Priority | Condition | Output | Rule Name |
|---|---|---|---|
| 1 | Pressure = **Critical** | **Energetic** | `PRESSURE_CRITICAL` |
| 2 | Stress = **High** AND Density = **Crowded** | **Chill** | `HIGH_STRESS_CROWDED` |
| 3 | (Không match) | **Focus** | `DEFAULT` |

### Mapping CamsMood → MoodTypeEnum → Playlist

```
CamsMood.Chill     → MoodTypeEnum.Calm      (mood_type = 1)  → BPM 60–80
CamsMood.Energetic → MoodTypeEnum.Energetic  (mood_type = 2)  → BPM 120–140
CamsMood.Focus     → MoodTypeEnum.Focus      (mood_type = 3)  → BPM 85–105
```

---

## Đọc hiểu Log

Mỗi lần pipeline chạy, log sẽ theo trình tự sau:

```
# 1. Job phát hiện Space cần xử lý
[CAMS Worker] Cycle started. Analyzing 1 space(s).
    HOẶC
[PlaylistTransitionJob] Found 1 space(s) needing playlist transition.

# 2. Sliding Window tổng hợp IoT data
[SlidingWindow] device=esp32-mock-01: 2 samples over 5 min
               People median=5 | WiFi avg=17.0 | Temp avg=29.8°C

# 3. Fuzzy Logic Engine quyết định Mood
[FuzzyEngine] Rule fired: DEFAULT → Mood=Focus
              Reason: Pressure=Medium, Stress=Tolerable, Density=Crowded

# 4. Domain Event được publish
[CAMS Event] MoodChangedDomainEvent | Space=33333333-... | Focus | Rule=DEFAULT

# 5. HLS URL được build qua CloudFront
[HlsUrlBuilder] Built CloudFront URL: https://xxx.cloudfront.net/audio/mock/deep-focus/master.m3u8

# 6. SpaceMusicState được cập nhật
[CAMS Event] SpaceMusicState updated | Playlist=Deep Focus - Work
             Start=09:42 UTC | ExpectedEnd=10:42 UTC (3600s / 1 giờ)

# 7. SignalR push tới Tablet
[SignalR] ✅ PlayStream → Group=33333333-... | HLS=https://xxx.cloudfront.net/...

# 8. Xác nhận hoàn thành
[CAMS Event] ✅ PlayStream pushed | Mood=Focus | Playlist='Deep Focus - Work'
```

### Các warning cần chú ý

| Log | Nguyên nhân | Cách xử lý |
|---|---|---|
| `No HLS playlist found for Store=..., Mood=Focus` | Chưa seed playlist hoặc `status != 1` | Chạy lại script seed ở `MOCK_DATA_SEED.md` |
| `No active spaces to analyze` | Chưa có Space nào `status=1` | Update `spaces SET status=1` |
| `Space is in manual override mode. Skipping.` | Space đang bị override bởi Manager | Bình thường, override sẽ tự hết sau `ExpectedEndAtUtc` |
| `[SlidingWindow] device=(none)` | Space chưa có `io_t_device_id` | `UPDATE spaces SET io_t_device_id='esp32-mock-01'` |

---

## Hangfire Dashboard

Xem trạng thái và lịch sử các job Hangfire tại:

```
http://localhost:5001/hangfire
```

Các recurring jobs được đăng ký:
- `playlist-transition` — chạy mỗi 60 giây, queue `cams`
- `playlist-transcode` — xử lý MediaConvert pipeline
- `playlist-transcode-status` — poll trạng thái MediaConvert job

---

## Configuration Reference

| Key (`.env`) | Default | Mô tả |
|---|---|---|
| `Firestore__Enabled` | `false` | `true` = Firestore thật, `false` = Mock |
| `Firestore__ProjectId` | — | Google Cloud Project ID |
| `Cams__SlidingWindowMinutes` | `5` | Kích thước sliding window |
| `Cams__WorkerIntervalSeconds` | `60` | Interval của ContextAnalysisWorker |
| `Hangfire__Queues` | `default,cams` | Queue `cams` phải có để PlaylistTransitionJob chạy |
| `AwsCdn__CloudFrontDomain` | — | Domain CloudFront để build HLS URL |
