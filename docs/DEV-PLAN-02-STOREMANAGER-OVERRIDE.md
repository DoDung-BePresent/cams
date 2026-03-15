# DEV PLAN 02 — StoreManager Manual Override

> Allows BrandManager / StoreManager to manually force a mood + playlist for a specific Space,
> bypassing the Fuzzy AI engine. `IsManualOverride = true` on `SpaceMusicState` blocks
> `PlaylistTransitionJob` from auto-selecting the next playlist until override is cleared.

---

## System Architecture — Override vs Auto Pipeline

```mermaid
graph TD
    subgraph Triggers["Playlist Triggers"]
        AUTO["🤖 Auto: Hangfire PlaylistTransitionJob\nevery 60s — checks ExpectedEndAtUtc"]
        FUZZY["🧠 Fuzzy AI: AnalyzeSpaceContext\nIoT telemetry → mood change"]
        MANUAL["👤 Manual: POST /api/cams/spaces/{spaceId}/override\nStoreManager / BrandManager"]
    end

    subgraph Core["Application Layer (Clean Architecture)"]
        EVT[MoodChangedDomainEvent]
        EVTHANDLER[MoodChangedDomainEventHandler\nfollows existing EDD pattern]
        OVERRIDE[OverrideSpaceMoodCommandHandler\nnew command — same pattern]
        CANCEL[CancelSpaceOverrideCommandHandler\nnew command]
    end

    subgraph State["SpaceMusicState — PostgreSQL"]
        SMS["SpaceId\nCurrentPlaylistId\nStartedAtUtc\nExpectedEndAtUtc\nCurrentMoodTag\n⭐ IsManualOverride  ← NEW"]
    end

    subgraph Delivery["Infrastructure Layer — Real-time Delivery"]
        HLS[IHlsUrlBuilderService\nrelative key → CloudFront URL]
        SR[ISignalRMusicService\nStoreHub Group spaceId]
        TABLET["React Native Tablets\nALL sessions in that space"]
    end

    AUTO -->|EvaluateAndTransitionPlaylistCommand| EVT
    FUZZY -->|Publish MoodChangedDomainEvent| EVT
    EVT --> EVTHANDLER

    EVTHANDLER --> HLS --> SR --> TABLET
    EVTHANDLER --> SMS

    MANUAL --> OVERRIDE --> HLS
    OVERRIDE --> SR
    OVERRIDE --> SMS

    CANCEL --> SMS
    CANCEL -.->|"IsManualOverride=false\nExpectedEndAtUtc=null\n→ Job picks up next cycle"| AUTO

    AUTO -.->|"WHERE NOT IsManualOverride ← guard"| SMS
```

---

## Sequence — StoreManager Override

```mermaid
sequenceDiagram
    participant SM as StoreManager / BrandManager
    participant API as CamsController
    participant CMD as OverrideSpaceMoodCommandHandler
    participant AUTH as Authorization check
    participant MUSIC as IMusicRepository
    participant HLS as IHlsUrlBuilderService
    participant STATE as ISpaceMusicStateRepository
    participant SR as ISignalRMusicService
    participant TABLET as All Tablets in Space

    SM->>API: POST /api/cams/spaces/{spaceId}/override<br/>{moodId: Guid, playlistId?: Guid}
    API->>CMD: MediatR.Send(OverrideSpaceMoodCommand)

    CMD->>CMD: ValidateUserWithSessionAsync()
    CMD->>AUTH: EnsureSpaceBelongsToBrand(spaceId, user.BrandId)
    AUTH-->>CMD: ✅ space.Store.BrandId == user.BrandId
    CMD->>CMD: Load Mood entity — validate exists

    alt PlaylistId provided by user
        CMD->>CMD: Load Playlist → validate BrandId match + MoodId match
    else Auto-select
        CMD->>MUSIC: GetHlsPlaylistAsync(mood, brandId, storeId, excludeCurrentPlaylistId)
        MUSIC-->>CMD: HlsPlaylistInfo (best matching playlist)
    end

    CMD->>HLS: BuildUrl(playlist.HlsUrl)
    HLS-->>CMD: "https://dXXX.cloudfront.net/audio/.../master.m3u8"

    CMD->>STATE: UpsertAsync(SpaceMusicState {<br/>  IsManualOverride = true,<br/>  CurrentPlaylistId = playlist.Id,<br/>  StartedAtUtc = now,<br/>  ExpectedEndAtUtc = now + TotalDurationSeconds<br/>})

    CMD->>SR: PushPlayStreamAsync(spaceId, cdnPlaylist, payload)
    SR->>TABLET: SignalR Group(spaceId).SendAsync("PlayStream", {<br/>  hlsUrl, playlistName, mood,<br/>  isManualOverride: true, triggeredRule: "ManualOverride"<br/>})
    Note over TABLET: ALL active tablet sessions receive<br/>stream command simultaneously

    CMD-->>API: Result.Success(overrideResponse)
    API-->>SM: 200 OK {spaceId, playlistId, hlsUrl, moodName, isManualOverride: true}
```

---

## Sequence — Cancel Override (Resume AI)

```mermaid
sequenceDiagram
    participant SM as StoreManager / BrandManager
    participant API as CamsController
    participant CMD as CancelSpaceOverrideCommandHandler
    participant STATE as ISpaceMusicStateRepository
    participant JOB as PlaylistTransitionJob (Hangfire)

    SM->>API: DELETE /api/cams/spaces/{spaceId}/override
    API->>CMD: MediatR.Send(CancelSpaceOverrideCommand)
    CMD->>CMD: ValidateUserWithSessionAsync() → BrandManager or StoreManager
    CMD->>CMD: EnsureSpaceBelongsToBrand(spaceId, user.BrandId)
    CMD->>STATE: GetBySpaceIdAsync(spaceId)
    STATE-->>CMD: SpaceMusicState { IsManualOverride = true, ... }
    CMD->>STATE: UpsertAsync({ IsManualOverride = false, ExpectedEndAtUtc = null })
    Note over STATE: ExpectedEndAtUtc = null → marks space as "unstarted"<br/>PlaylistTransitionJob will pick it up next cycle
    CMD-->>API: Result.Success("Manual override cleared. AI will resume.")
    API-->>SM: 200 OK

    Note over JOB: Next 60s Hangfire cycle
    JOB->>STATE: GetExpiredOrUnstartedAsync()<br/>WHERE NOT IsManualOverride AND (ExpectedEndAtUtc IS NULL OR ≤ now+30s)
    STATE-->>JOB: this space (ExpectedEndAtUtc IS NULL, IsManualOverride = false)
    JOB->>JOB: EvaluateAndTransitionPlaylistCommand<br/>→ FuzzyEngine → next playlist → SignalR PlayStream
    Note over JOB: Auto AI resumes seamlessly
```

---

## PlaylistTransitionJob — Override Guard Logic

```mermaid
flowchart TD
    A["PlaylistTransitionJob.ExecuteAsync()\nevery 60 seconds"] --> B
    B["GetExpiredOrUnstartedAsync(bufferSeconds=30)\n← MODIFIED query"]
    B --> C{"WHERE NOT IsDeleted\nAND NOT IsManualOverride  ← NEW guard\nAND ExpectedEndAtUtc ≤ now+30s\n   OR ExpectedEndAtUtc IS NULL"}
    C -->|"Space matches → auto mode"| D["DispatchSafeAsync()\n→ EvaluateAndTransitionPlaylistCommand\n→ FuzzyEngine → select next playlist\n→ UpsertSpaceMusicState\n→ SignalR PlayStream"]
    C -->|"IsManualOverride = true"| E["⏭️ SKIP\nStoreManager controls this space\nJob does nothing for it"]
```

---

## Domain Change — `SpaceMusicState`

```csharp
// src/LogAICAMS.Domain/Entities/SpaceMusicState.cs
// ADD one field:
public bool IsManualOverride { get; set; } = false;
```

**EF Core Migration (run once):**
```powershell
cd d:\MyLearning\Ky9\SEP\Log.AI-CAMS\Log.AI-CAMS-v2

dotnet ef migrations add AddIsManualOverrideToSpaceMusicState `
  -p src/LogAICAMS.Infrastructure `
  -s src/LogAICAMS.API

dotnet ef database update -s src/LogAICAMS.API
```

---

## Files to Create

### New Command Files

| Folder | File |
|--------|------|
| `Features/CAMS/Commands/OverrideSpaceMood/` | `OverrideSpaceMoodCommand.cs` |
| `Features/CAMS/Commands/OverrideSpaceMood/` | `OverrideSpaceMoodCommandHandler.cs` |
| `Features/CAMS/Commands/OverrideSpaceMood/` | `OverrideSpaceMoodCommandValidator.cs` |
| `Features/CAMS/Commands/CancelSpaceOverride/` | `CancelSpaceOverrideCommand.cs` |
| `Features/CAMS/Commands/CancelSpaceOverride/` | `CancelSpaceOverrideCommandHandler.cs` |

### New DTO

| File | Path | Fields |
|------|------|--------|
| `SpaceOverrideResponse.cs` | `Common/DTOs/CAMS/` | `SpaceId`, `PlaylistId`, `PlaylistName`, `HlsUrl`, `MoodName`, `IsManualOverride`, `StartedAtUtc`, `ExpectedEndAtUtc` |
| `OverrideSpaceMoodRequest.cs` | `Common/DTOs/CAMS/` | `MoodId: Guid`, `PlaylistId?: Guid` |

---

## Files to Modify

| File | Change |
|------|--------|
| `SpaceMusicState.cs` | + `bool IsManualOverride { get; set; } = false;` |
| `SpaceMusicStateRepository.cs` | `GetExpiredOrUnstartedAsync()`: add `&& !s.IsManualOverride`; `UpsertAsync()`: copy `IsManualOverride` field |
| `CamsController.cs` | + `POST /spaces/{spaceId}/override`, + `DELETE /spaces/{spaceId}/override` |
| `ISignalRMusicService.cs` | + overload `PushPlayStreamAsync(Guid spaceId, HlsPlaylistInfo, string triggeredRule, string reason, CancellationToken)` for override path (no domain event) |
| `SignalRMusicService.cs` | implement new overload |

---

## New CamsController Endpoints

```
POST   /api/cams/spaces/{spaceId}/override   [BrandManager, StoreManager]
Body:  { "moodId": "guid", "playlistId": "guid (optional)" }
→ Returns SpaceOverrideResponse

DELETE /api/cams/spaces/{spaceId}/override   [BrandManager, StoreManager]
→ Returns Result.Success message
```

---

## SignalR Payload — Override vs Auto (tablet receives same event name)

```json
{
  "spaceId": "3fa85f64-...",
  "hlsUrl": "https://dXXX.cloudfront.net/audio/brand-a/chill/master.m3u8",
  "playlistName": "Chill Morning",
  "mood": "Calm",
  "bpmMin": 60,
  "bpmMax": 90,
  "isManualOverride": true,
  "triggeredRule": "ManualOverride",
  "reason": "StoreManager selected mood manually",
  "occurredAtUtc": "2026-03-05T08:00:00Z"
}
```

> Tablet nhận event `"PlayStream"` — cùng tên với auto push. Field `isManualOverride` để tablet UI hiển thị badge "Manual Mode" nếu cần.

---

## SpaceMusicStateRepository — UpsertAsync change

```csharp
// Existing UpsertAsync — ADD this line when copying fields to existing row:
existing.IsManualOverride = state.IsManualOverride;
```

## GetExpiredOrUnstartedAsync — WHERE clause change

```csharp
// BEFORE:
.Where(s => !s.IsDeleted && (s.ExpectedEndAtUtc == null || s.ExpectedEndAtUtc <= cutoff))

// AFTER:
.Where(s => !s.IsDeleted
         && !s.IsManualOverride          // ← NEW: skip spaces under manual control
         && (s.ExpectedEndAtUtc == null || s.ExpectedEndAtUtc <= cutoff))
```

---

## Verification Steps

```powershell
# 1. Create migration
dotnet ef migrations add AddIsManualOverrideToSpaceMusicState -p src/LogAICAMS.Infrastructure -s src/LogAICAMS.API

# 2. Build
dotnet build src/LogAICAMS.API/LogAICAMS.API.csproj -v minimal | Select-String "error CS|succeeded"

# 3. docker-compose up --build -d

# 4. POST /api/cams/spaces/{spaceId}/override → expect 200 + SignalR push
# 5. Check SpaceMusicStates table: IsManualOverride = true
# 6. Wait 60+ seconds → confirm PlaylistTransitionJob does NOT change the space
# 7. DELETE /api/cams/spaces/{spaceId}/override → IsManualOverride = false
# 8. Wait 60s → confirm Hangfire resumes auto AI selection
```
