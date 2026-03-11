# CAMS — Known Issues & Implementation Notes

> **Dành cho:** Team Backend  
> **Cập nhật lần cuối:** 2026-03-08  
> Tài liệu này ghi lại 3 vấn đề đã xác định trong CAMS engine, bao gồm
> 1 cơ chế đã được triển khai và 2 TODO cần implement tiếp.

---

## Vấn đề 1 — Auto-clear Manual Override khi Playlist kết thúc ✅ ĐÃ IMPLEMENT

### Bối cảnh

Manager có thể dùng API **Override Space Mood** để ép Space phát một playlist cụ thể trong một khoảng thời gian. Khi đó `SpaceMusicState.IsManualOverride = true` và `ExpectedEndAtUtc` được set.

**Vấn đề:** `PlaylistTransitionJob` chỉ query các Space có `!IsManualOverride` (lọc thông qua `GetExpiredOrUnstartedAsync`). Khi override playlist hết thời gian, không có cơ chế nào tự động clear cờ `IsManualOverride` → Space rơi vào trạng thái "chết": không có AI scheduling, không có nhạc mới.

### Giải pháp đã triển khai

**Thêm bước `ClearExpiredOverridesAsync()`** vào đầu mỗi cycle của `PlaylistTransitionJob`, chạy **trước** khi query AI.

#### Flow hoạt động (mỗi 60 giây):

```
PlaylistTransitionJob.ExecuteAsync()
  │
  ├─① ClearExpiredOverridesAsync()          ← BƯỚC MỚI
  │     │
  │     ├─ Query: WHERE IsManualOverride = true
  │     │         AND ExpectedEndAtUtc <= now + 30s buffer
  │     │
  │     └─ Với mỗi Space expired:
  │           ├─ Clear 5 fields:
  │           │     IsManualOverride   = false
  │           │     OverrideMode       = null
  │           │     OverrideReason     = null
  │           │     OverriddenByUserId = null
  │           │     ExpectedEndAtUtc   = null
  │           ├─ UpsertAsync() → lưu DB
  │           ├─ Audit log: reason = "[AUTO] Override playlist finished"
  │           └─ Push SpaceStateSync SignalR → tablet/FE cập nhật UI
  │
  └─② GetExpiredOrUnstartedAsync()           ← QUERY HIỆN TẠI
        │
        ├─ Lọc WHERE !IsManualOverride (các Space ở bước ① vừa được clear
        │   sẽ ELIGIBLE ngay trong cùng cycle này)
        │
        └─ Dispatch EvaluateAndTransitionPlaylistCommand → AI chọn playlist mới
```

**Điểm mấu chốt:** Bước ① và ② chạy trong **cùng 1 cycle 60s** → Space hết override xong là AI pick up luôn, không có khoảng trắng âm thanh.

#### Files đã thay đổi:

| File | Thay đổi |
|------|---------|
| `src/LogAICAMS.Infrastructure/Jobs/PlaylistTransitionJob.cs` | Thêm `ClearExpiredOverridesAsync()`, inject `ISignalRMusicService` + `IAuditService` |
| `src/LogAICAMS.Application/Common/Interfaces/ISpaceMusicStateRepository.cs` | Thêm method `GetExpiredOverrideSpacesAsync()` |
| `src/LogAICAMS.Infrastructure/Repositories/SpaceMusicStateRepository.cs` | Implement `GetExpiredOverrideSpacesAsync()` |

#### Query mới (`GetExpiredOverrideSpacesAsync`):

```csharp
var cutoff = DateTime.UtcNow.AddSeconds(bufferSeconds); // bufferSeconds = 30
WHERE !IsDeleted
  AND IsManualOverride = true
  AND ExpectedEndAtUtc != null
  AND ExpectedEndAtUtc <= cutoff
```

---

## Vấn đề 2 — `AnalyzeSpaceContextCommandHandler` chưa kiểm tra `IsManualOverride` ⚠️ TODO

### Bối cảnh

Khi IoT gửi dữ liệu cảm biến (hoặc API manual trigger), `AnalyzeSpaceContextCommandHandler` sẽ chạy FuzzyLogicEngine và nếu mood thay đổi, publish `MoodChangedDomainEvent`. Event này sẽ trigger `MoodChangedDomainEventHandler` → gọi `EvaluateAndTransitionPlaylistCommand` → đổi playlist đang phát.

**Vấn đề:** Handler này **không kiểm tra `IsManualOverride`** trước khi publish event. Nếu một Space đang bị override bởi manager, IoT data vẫn có thể trigger đổi playlist → **override bị vô hiệu hóa ngoài ý muốn**.

### Vị trí cần sửa

**File:** `src/LogAICAMS.Application/Features/CAMS/Commands/AnalyzeSpaceContext/AnalyzeSpaceContextCommandHandler.cs`

**Vị trí:** Trước Step 8 — "Publish Domain Event" (khoảng sau block Step 7 `ExecuteUpdateAsync`).

### Code cần implement

**Bước 1: Inject dependency vào constructor**

```csharp
// Thêm field:
private readonly ISpaceMusicStateRepository _spaceMusicStateRepository;

// Thêm vào constructor:
public AnalyzeSpaceContextCommandHandler(
    IUnitOfWork unitOfWork,
    ISlidingWindowAggregator windowAggregator,
    IContextHistoryRepository historyRepo,
    IFuzzyLogicEngine fuzzyEngine,
    IMediator mediator,
    ISpaceMusicStateRepository spaceMusicStateRepository,   // ← THÊM
    ILogger<AnalyzeSpaceContextCommandHandler> logger)
{
    // ... existing assignments ...
    _spaceMusicStateRepository = spaceMusicStateRepository; // ← THÊM
}
```

**Bước 2: Thêm guard trước Step 8**

```csharp
// ── Step 7.5: Guard — skip nếu Space đang manual override ─────────────
var musicState = await _spaceMusicStateRepository.GetBySpaceIdAsync(
    command.SpaceId, cancellationToken);

if (musicState?.IsManualOverride == true)
{
    _logger.LogInformation(
        "[CAMS] Space={SpaceId} is under manual override. " +
        "Skipping MoodChanged event. ContextHistory still saved.",
        command.SpaceId);

    // Vẫn return OK — ContextHistory đã được lưu (Step 6),
    // dữ liệu phân tích không bị mất.
    return Result<ContextAnalysisDto>.Success(new ContextAnalysisDto
    {
        SpaceId      = command.SpaceId,
        TargetMood   = fuzzyResult.TargetMood,
        TriggeredRule = fuzzyResult.TriggeredRule,
        Reason       = fuzzyResult.Reason,
        MoodChanged  = false,
        AnalyzedAtUtc = fuzzyResult.AnalyzedAtUtc,
    });
}

// ── Step 8: Publish Domain Event (EDD) ────────────────────────────────
// ... code publish hiện tại ...
```

> **Lưu ý quan trọng:** Phải vẫn lưu `ContextHistory` (Step 6) ngay cả khi bị skip — để không mất dữ liệu phân tích IoT cho analytics/reporting sau này.

---

## Vấn đề 3 — `PlaylistTransitionJob` chưa kiểm tra giờ mở/đóng cửa ⚠️ TODO

### Bối cảnh

`PlaylistTransitionJob` chạy mỗi 60 giây **bất kể thời gian trong ngày**. Điều này có nghĩa là hệ thống vẫn đổi playlist ngay cả khi cửa hàng đang đóng cửa (ví dụ: 2 giờ sáng).

### Schema hiện tại đã có

| Entity | Field | Ghi chú |
|--------|-------|---------|
| `Store` | `TimeZone` (`string?`) | IANA timezone string, ví dụ `"Asia/Ho_Chi_Minh"` |
| `BrandGlobalConfig` | `OpenTime` (`TimeOnly?`) | Giờ mở cửa (local time) |
| `BrandGlobalConfig` | `CloseTime` (`TimeOnly?`) | Giờ đóng cửa (local time) |

`Store.TimeZone` **đã tồn tại** — không cần migration thêm field này.

### Vị trí cần sửa

**File:** `src/LogAICAMS.Infrastructure/Jobs/PlaylistTransitionJob.cs`

**Vị trí:** Trong `ExecuteAsync()`, sau `ClearExpiredOverridesAsync()` và trước `GetExpiredOrUnstartedAsync()`.

### Code gợi ý implement

```csharp
// Sau ClearExpiredOverridesAsync():
var expiredStates = await stateRepo.GetExpiredOrUnstartedAsync(
    TransitionBufferSeconds, cancellationToken);

// Lọc bỏ các Space thuộc Brand đang ngoài giờ hoạt động
var activeStates = new List<SpaceMusicState>();
foreach (var state in expiredStates)
{
    var brandConfig = await brandConfigRepo.GetByBrandIdAsync(state.BrandId, cancellationToken);
    if (brandConfig is null) { activeStates.Add(state); continue; } // không có config → không chặn

    // Resolve timezone từ Store.TimeZone (cần load Store navigation hoặc join)
    var tzId = state.Store?.TimeZone ?? "UTC";
    TimeZoneInfo tz;
    try { tz = TimeZoneInfo.FindSystemTimeZoneById(tzId); }
    catch { tz = TimeZoneInfo.Utc; }

    var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
    var timeOfDay = TimeOnly.FromDateTime(localNow);

    if (brandConfig.OpenTime.HasValue  && timeOfDay < brandConfig.OpenTime.Value)  continue; // chưa mở cửa
    if (brandConfig.CloseTime.HasValue && timeOfDay > brandConfig.CloseTime.Value) continue; // đã đóng cửa

    activeStates.Add(state);
}

// Thay expiredStates → activeStates khi dispatch
```

### Điểm cần lưu ý khi implement

1. **`GetExpiredOrUnstartedAsync` cần load `Store`** (navigation property) để lấy `TimeZone`. Hiện tại query có thể dùng `AsNoTracking()`, cần thêm `.Include(s => s.Store)` hoặc join.

2. **Khi đóng cửa — cần push `StopPlayback` SignalR** đến tablet thay vì chỉ skip. Hiện tại nếu skip thì tablet không biết và vẫn phát nhạc đến hết playlist hiện tại (có thể chấp nhận được trong phiên bản đầu).

3. **Ngày nghỉ/lễ:** `BrandGlobalConfig` chưa có concept `ClosedDates`. Nếu cần, thêm bảng `BrandHoliday` (`BrandId`, `Date`, `Reason`) hoặc field `ClosedDatesJson` (đơn giản hơn). Đây là **enhancement optional**, không phải blocker.

4. **Windows vs Linux timezone ID:** Trên Linux (Docker), `TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")` sẽ fail. Phải dùng IANA string (`"Asia/Ho_Chi_Minh"`). Nếu cần cross-platform, thêm NuGet package `TimeZoneConverter`.

---

## Tổng kết

| # | Vấn đề | Trạng thái | File chính cần sửa |
|---|--------|-----------|-------------------|
| 1 | Auto-clear override khi playlist hết | ✅ Đã implement | `PlaylistTransitionJob.cs` |
| 2 | Guard `IsManualOverride` trong `AnalyzeSpaceContextCommandHandler` | ⚠️ TODO | `AnalyzeSpaceContextCommandHandler.cs` |
| 3 | Skip Space ngoài giờ mở cửa trong `PlaylistTransitionJob` | ⚠️ TODO | `PlaylistTransitionJob.cs` |

> Build hiện tại: **0 errors / 9 warnings** (warnings là nullable pre-existing, không liên quan).
