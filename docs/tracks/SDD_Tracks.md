# 3.9 Track Management - Software Design

> **Screens:** CMS Track List · Create/Edit Track · Track Detail  
> **Roles:**
>
> - Read (`GetTracks`, `GetTrackById`): `SystemAdmin` · `BrandManager` · `StoreManager`
> - Write (`Create/Update/Delete/ToggleStatus`): **`BrandManager` only**
>   **Endpoints:** `GET /api/tracks` · `GET /api/tracks/{id}` · `POST /api/tracks` · `PUT /api/tracks/{id}` · `DELETE /api/tracks/{id}` · `PUT /api/tracks/{id}/toggle-status`

---

## 3.9.1 Class Diagram - Query Side (Read)

> `GetTracksQueryHandler` and `GetTrackByIdQueryHandler` implement `IRequestHandler<,>` (MediatR) - hidden for readability.  
> Read access is validated via `EnsureTrackAccess(...)`; for `BrandManager/StoreManager`, handler forces brand scope by setting `filter.BrandId = user.BrandId`.

```mermaid
classDiagram
    class TracksController {
        -IMediator _mediator
        +GetTracks(TrackFilter filter) Task~IActionResult~
        +GetTrackById(Guid id) Task~IActionResult~
    }

    class GetTracksQuery {
        +TrackFilter? Filter
        +UserActionEnum GetActionType()
    }

    class GetTrackByIdQuery {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class ITrackRequest {
        <<interface>>
        +UserActionEnum GetActionType()
    }

    class TrackFilter {
        +Guid? BrandId
        +Guid? MoodId
        +string? Genre
        +MusicProviderEnum? Provider
        +bool? IsAiGenerated
        +DateTime? CreatedFrom
        +DateTime? CreatedTo
        +int Page
        +int PageSize
        +string? Search
        +string? SortBy
        +bool? IsAscending
        +EntityStatusEnum? Status
    }

    class GetTracksQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetTracksQuery, CancellationToken) Task~PaginationResult~TrackListItem~~
    }

    class GetTrackByIdQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetTrackByIdQuery, CancellationToken) Task~Result~TrackDetailResponse~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
    }

    class TrackListItem {
        +Guid? BrandId
        +string Title
        +string? Artist
        +Guid? MoodId
        +string? MoodName
        +string? Genre
        +MusicProviderEnum? Provider
        +int? DurationSec
        +string? AudioUrl
        +string? CoverImageUrl
        +int PlayCount
        +bool? IsAiGenerated
    }

    class TrackDetailResponse {
        +int? Bpm
        +decimal? EnergyLevel
        +decimal? Valence
        +string? SunoClipId
        +string? GenerationPrompt
        +DateTime? GeneratedAt
        +string? LyricsUrl
        +DateTime? LastPlayedAt
    }

    TracksController --> GetTracksQuery : creates
    TracksController --> GetTrackByIdQuery : creates
    TracksController ..> GetTracksQueryHandler : sends via Mediator
    TracksController ..> GetTrackByIdQueryHandler : sends via Mediator

    GetTracksQuery ..|> ITrackRequest : implements
    GetTrackByIdQuery ..|> ITrackRequest : implements

    GetTracksQuery --> TrackFilter : contains
    GetTracksQueryHandler --> ICurrentUserService : validates session
    GetTracksQueryHandler --> IUnitOfWork : reads tracks + mood
    GetTracksQueryHandler --> TrackListItem : returns paged list

    GetTrackByIdQueryHandler --> ICurrentUserService : validates session
    GetTrackByIdQueryHandler --> IUnitOfWork : reads track + mood
    GetTrackByIdQueryHandler --> TrackDetailResponse : returns detail

    TrackDetailResponse --|> TrackListItem : extends
```

---

## 3.9.2 Class Diagram - Command Side (Write)

> Write authorization rule in `EnsureTrackAccess(...)`: only `BrandManager` with `BrandId`.  
> `TrackRequest` is shared for Create/Update; validator switches behavior with `isPartialUpdate`.

### Part A - Commands, DTOs, Validators

```mermaid
classDiagram
    class TracksController {
        -IMediator _mediator
        +CreateTrack(TrackRequest request) Task~IActionResult~
        +UpdateTrack(Guid id, TrackRequest request) Task~IActionResult~
        +DeleteTrack(Guid id) Task~IActionResult~
        +ToggleTrackStatus(Guid id) Task~IActionResult~
    }

    class ITrackRequest {
        <<interface>>
        +UserActionEnum GetActionType()
    }

    class CreateTrackCommand {
        +TrackRequest Request
        +UserActionEnum GetActionType()
    }

    class UpdateTrackCommand {
        +Guid Id
        +TrackRequest Request
        +UserActionEnum GetActionType()
    }

    class DeleteTrackCommand {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class ToggleTrackStatusCommand {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class TrackRequest {
        +string? Title
        +string? Artist
        +Guid? MoodId
        +int? DurationSec
        +int? Bpm
        +string? Genre
        +decimal? EnergyLevel
        +decimal? Valence
        +MusicProviderEnum? Provider
        +IFormFile? AudioFile
        +IFormFile? CoverImageFile
    }

    class SharedTrackRequestValidator {
        +SharedTrackRequestValidator(ILocalizationService, bool isPartialUpdate)
    }

    class CreateTrackCommandValidator {
        +Validate(CreateTrackCommand) ValidationResult
    }

    class UpdateTrackCommandValidator {
        +Validate(UpdateTrackCommand) ValidationResult
    }

    TracksController --> CreateTrackCommand : creates
    TracksController --> UpdateTrackCommand : creates
    TracksController --> DeleteTrackCommand : creates
    TracksController --> ToggleTrackStatusCommand : creates

    CreateTrackCommand ..|> ITrackRequest : implements
    UpdateTrackCommand ..|> ITrackRequest : implements
    DeleteTrackCommand ..|> ITrackRequest : implements
    ToggleTrackStatusCommand ..|> ITrackRequest : implements

    CreateTrackCommand --> TrackRequest : contains
    UpdateTrackCommand --> TrackRequest : contains

    CreateTrackCommandValidator ..> SharedTrackRequestValidator : isPartialUpdate=false
    UpdateTrackCommandValidator ..> SharedTrackRequestValidator : isPartialUpdate=true
```

### Part B - Handler Dependencies

```mermaid
classDiagram
    class CreateTrackCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        +Handle(CreateTrackCommand, CancellationToken) Task~Result~
    }

    class UpdateTrackCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        +Handle(UpdateTrackCommand, CancellationToken) Task~Result~
    }

    class DeleteTrackCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        +Handle(DeleteTrackCommand, CancellationToken) Task~Result~
    }

    class ToggleTrackStatusCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(ToggleTrackStatusCommand, CancellationToken) Task~Result~
    }

    class IBackgroundFileOperationService {
        <<interface>>
        +UploadFileAsync(IFormFile, string, CancellationToken) Task~string~
        +DeleteFileInBackground(string?) void
    }

    class IAuditService {
        <<interface>>
        +LogEntityCreate(...) void
        +LogEntityUpdate(...) void
        +LogEntityDelete(...) void
        +LogEntityToggleStatus(...) void
    }

    CreateTrackCommandHandler --> IBackgroundFileOperationService : upload + cleanup
    CreateTrackCommandHandler --> IAuditService : audit create

    UpdateTrackCommandHandler --> IBackgroundFileOperationService : replace + cleanup
    UpdateTrackCommandHandler --> IAuditService : audit update

    DeleteTrackCommandHandler --> IBackgroundFileOperationService : delete files after commit
    DeleteTrackCommandHandler --> IAuditService : audit delete

    ToggleTrackStatusCommandHandler --> IAuditService : audit toggle
```

---

## 3.9.3 Sequence Diagram - Get Tracks List

> Read allowed for `SystemAdmin`, `BrandManager`, `StoreManager`.  
> If caller is BM/SM, handler enforces brand boundary via `filter.BrandId = user.BrandId`.

```mermaid
sequenceDiagram
    actor Client
    participant TracksController
    participant GetTracksQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>TracksController: GET /api/tracks?page=1&pageSize=10
    TracksController->>GetTracksQueryHandler: Handle(GetTracksQuery)

    GetTracksQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetTracksQueryHandler: (isValid=false)
        GetTracksQueryHandler-->>TracksController: UnauthorizedAccessException
        TracksController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>GetTracksQueryHandler: (isValid=true, userId, roles, user)
    GetTracksQueryHandler->>GetTracksQueryHandler: request.EnsureTrackAccess(user.BrandId, roles)

    alt No valid read role
        GetTracksQueryHandler-->>TracksController: ForbiddenAccessException
        TracksController-->>Client: 403 Forbidden
    end

    alt BrandManager or StoreManager
        GetTracksQueryHandler->>GetTracksQueryHandler: filter.BrandId = user.BrandId (forced)
    end

    GetTracksQueryHandler->>GetTracksQueryHandler: predicate = filter.BuildPredicate()
    GetTracksQueryHandler->>GetTracksQueryHandler: Build orderBy and apply default isAscending false

    GetTracksQueryHandler->>IUnitOfWork: Repository~Track~.GetPagedAsync(... includes Mood)
    IUnitOfWork-->>GetTracksQueryHandler: (tracks[], totalCount)

    GetTracksQueryHandler->>GetTracksQueryHandler: Map to List~TrackListItem~
    GetTracksQueryHandler-->>TracksController: PaginationResult~TrackListItem~.Success
    TracksController-->>Client: 200 OK
```

---

## 3.9.4 Sequence Diagram - Get Track By Id

> Track is loaded with `Mood` include.  
> BM/SM must satisfy ownership check: `track.BrandId == user.BrandId`; SA can read all.

```mermaid
sequenceDiagram
    actor Client
    participant TracksController
    participant GetTrackByIdQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>TracksController: GET /api/tracks/{id}
    TracksController->>GetTrackByIdQueryHandler: Handle(GetTrackByIdQuery)

    GetTrackByIdQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetTrackByIdQueryHandler: (isValid=false)
        GetTrackByIdQueryHandler-->>TracksController: UnauthorizedAccessException
        TracksController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>GetTrackByIdQueryHandler: (isValid=true, userId, roles, user)
    GetTrackByIdQueryHandler->>GetTrackByIdQueryHandler: query.EnsureTrackAccess(user.BrandId, roles)

    GetTrackByIdQueryHandler->>IUnitOfWork: Repository~Track~.GetFirstOrDefaultAsync(id, includes Mood)
    alt Track not found
        IUnitOfWork-->>GetTrackByIdQueryHandler: null
        GetTrackByIdQueryHandler-->>TracksController: NotFoundException
        TracksController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>GetTrackByIdQueryHandler: track

    alt Role is BrandManager or StoreManager and track.BrandId != user.BrandId
        GetTrackByIdQueryHandler-->>TracksController: ForbiddenAccessException
        TracksController-->>Client: 403 Forbidden
    end

    GetTrackByIdQueryHandler->>GetTrackByIdQueryHandler: Map to TrackDetailResponse
    GetTrackByIdQueryHandler-->>TracksController: Result~TrackDetailResponse~.Success
    TracksController-->>Client: 200 OK
```

---

## 3.9.5 Sequence Diagram - Create Track (Manual Upload)

> Write action is `BrandManager` only.  
> Audio/Cover upload failures are **non-fatal**; DB failure triggers background cleanup for newly uploaded files.

```mermaid
sequenceDiagram
    actor Client
    participant TracksController
    participant CreateTrackCommandValidator
    participant CreateTrackCommandHandler
    participant ICurrentUserService
    participant IBackgroundFileOperationService as FileService
    participant IUnitOfWork
    participant IAuditService

    Client->>TracksController: POST /api/tracks (multipart/form-data)
    TracksController->>CreateTrackCommandValidator: Validate(CreateTrackCommand)

    alt Validation failed (Title/Audio missing or invalid)
        CreateTrackCommandValidator-->>TracksController: ValidationException
        TracksController-->>Client: 400 Bad Request
    end

    TracksController->>CreateTrackCommandHandler: Handle(CreateTrackCommand)

    CreateTrackCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>CreateTrackCommandHandler: (isValid=false)
        CreateTrackCommandHandler-->>TracksController: UnauthorizedAccessException
        TracksController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>CreateTrackCommandHandler: (isValid=true, userId, roles, user)
    CreateTrackCommandHandler->>CreateTrackCommandHandler: command.EnsureTrackAccess(user.BrandId, roles)

    alt Not BrandManager or no BrandId
        CreateTrackCommandHandler-->>TracksController: ForbiddenAccessException
        TracksController-->>Client: 403 Forbidden
    end

    CreateTrackCommandHandler->>IUnitOfWork: Repository~Track~.FindDuplicateTitleAsync(user.BrandId, title)
    alt Duplicate title in brand
        IUnitOfWork-->>CreateTrackCommandHandler: conflictField
        CreateTrackCommandHandler-->>TracksController: BusinessRuleViolationException
        TracksController-->>Client: 422 Unprocessable Entity
    end

    opt Audio file provided
        CreateTrackCommandHandler->>FileService: UploadFileAsync(audioFile, "tracks/audio")
        alt Upload fail
            FileService-->>CreateTrackCommandHandler: exception (caught)
            CreateTrackCommandHandler->>CreateTrackCommandHandler: continue with AudioUrl = null
        else Upload success
            FileService-->>CreateTrackCommandHandler: audioPath
        end
    end

    opt Cover file provided
        CreateTrackCommandHandler->>FileService: UploadFileAsync(coverFile, "tracks/covers")
        alt Upload fail
            FileService-->>CreateTrackCommandHandler: exception (caught)
            CreateTrackCommandHandler->>CreateTrackCommandHandler: continue with CoverImageUrl = null
        else Upload success
            FileService-->>CreateTrackCommandHandler: coverPath
        end
    end

    CreateTrackCommandHandler->>CreateTrackCommandHandler: map request -> Track
    CreateTrackCommandHandler->>CreateTrackCommandHandler: set BrandId, AudioUrl, CoverImageUrl, IsAiGenerated=false
    CreateTrackCommandHandler->>IUnitOfWork: Repository~Track~.AddAsync(track)

    CreateTrackCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt DB save fails
        IUnitOfWork-->>CreateTrackCommandHandler: Exception
        CreateTrackCommandHandler->>FileService: DeleteFileInBackground(audioPath?)
        CreateTrackCommandHandler->>FileService: DeleteFileInBackground(coverPath?)
        CreateTrackCommandHandler->>IAuditService: LogEntityCreate(isSuccess=false)
        CreateTrackCommandHandler-->>TracksController: rethrow
        TracksController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>CreateTrackCommandHandler: OK
        CreateTrackCommandHandler->>IAuditService: LogEntityCreate(isSuccess=true)
        CreateTrackCommandHandler-->>TracksController: Result.Success
        TracksController-->>Client: 200 Success (per Result status mapping)
    end
```

---

## 3.9.6 Sequence Diagram - Update Track

> `BrandManager` only + ownership check on existing entity.  
> New files are uploaded first; old files are deleted only **after successful DB commit**.

```mermaid
sequenceDiagram
    actor Client
    participant TracksController
    participant UpdateTrackCommandValidator
    participant UpdateTrackCommandHandler
    participant ICurrentUserService
    participant IBackgroundFileOperationService as FileService
    participant IUnitOfWork
    participant IAuditService

    Client->>TracksController: PUT /api/tracks/{id} (multipart/form-data)
    TracksController->>UpdateTrackCommandValidator: Validate(UpdateTrackCommand)

    alt Validation failed
        UpdateTrackCommandValidator-->>TracksController: ValidationException
        TracksController-->>Client: 400 Bad Request
    end

    TracksController->>UpdateTrackCommandHandler: Handle(UpdateTrackCommand)

    UpdateTrackCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>UpdateTrackCommandHandler: (isValid=false)
        UpdateTrackCommandHandler-->>TracksController: UnauthorizedAccessException
        TracksController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>UpdateTrackCommandHandler: (isValid=true, userId, roles, user)
    UpdateTrackCommandHandler->>UpdateTrackCommandHandler: command.EnsureTrackAccess(user.BrandId, roles)

    UpdateTrackCommandHandler->>IUnitOfWork: Repository~Track~.GetFirstOrDefaultAsync(id)
    alt Not found
        IUnitOfWork-->>UpdateTrackCommandHandler: null
        UpdateTrackCommandHandler-->>TracksController: NotFoundException
        TracksController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>UpdateTrackCommandHandler: track
    alt track.BrandId != user.BrandId
        UpdateTrackCommandHandler-->>TracksController: ForbiddenAccessException
        TracksController-->>Client: 403 Forbidden
    end

    opt Title provided and changed
        UpdateTrackCommandHandler->>IUnitOfWork: FindDuplicateTitleAsync(user.BrandId, newTitle, excludeId=id)
        alt Duplicate title
            IUnitOfWork-->>UpdateTrackCommandHandler: conflictField
            UpdateTrackCommandHandler-->>TracksController: BusinessRuleViolationException
            TracksController-->>Client: 422 Unprocessable Entity
        end
    end

    UpdateTrackCommandHandler->>UpdateTrackCommandHandler: oldAudioUrl = track.AudioUrl, oldCoverUrl = track.CoverImageUrl

    opt New audio file provided
        UpdateTrackCommandHandler->>FileService: UploadFileAsync(audioFile, "tracks/audio")
        alt Upload fail
            FileService-->>UpdateTrackCommandHandler: exception (caught)
            UpdateTrackCommandHandler->>UpdateTrackCommandHandler: keep existing AudioUrl
        else Upload success
            FileService-->>UpdateTrackCommandHandler: newAudioPath
            UpdateTrackCommandHandler->>UpdateTrackCommandHandler: track.AudioUrl = newAudioPath
        end
    end

    opt New cover file provided
        UpdateTrackCommandHandler->>FileService: UploadFileAsync(coverFile, "tracks/covers")
        alt Upload fail
            FileService-->>UpdateTrackCommandHandler: exception (caught)
            UpdateTrackCommandHandler->>UpdateTrackCommandHandler: keep existing CoverImageUrl
        else Upload success
            FileService-->>UpdateTrackCommandHandler: newCoverPath
            UpdateTrackCommandHandler->>UpdateTrackCommandHandler: track.CoverImageUrl = newCoverPath
        end
    end

    UpdateTrackCommandHandler->>UpdateTrackCommandHandler: _mapper.Map(request, track) (null-skip)
    UpdateTrackCommandHandler->>IUnitOfWork: Repository~Track~.Update(track)

    UpdateTrackCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt DB save fails
        IUnitOfWork-->>UpdateTrackCommandHandler: Exception
        UpdateTrackCommandHandler->>FileService: DeleteFileInBackground(newAudioPath?)
        UpdateTrackCommandHandler->>FileService: DeleteFileInBackground(newCoverPath?)
        UpdateTrackCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=false)
        UpdateTrackCommandHandler-->>TracksController: rethrow
        TracksController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>UpdateTrackCommandHandler: OK
        UpdateTrackCommandHandler->>FileService: DeleteFileInBackground(oldAudioUrl) if replaced
        UpdateTrackCommandHandler->>FileService: DeleteFileInBackground(oldCoverUrl) if replaced
        UpdateTrackCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=true)
        UpdateTrackCommandHandler-->>TracksController: Result.Success
        TracksController-->>Client: 200 OK
    end
```

---

## 3.9.7 Sequence Diagram - Delete Track

> Soft-delete only.  
> Track cannot be deleted when referenced by any playlist (`PlaylistTracks.Count > 0`).

```mermaid
sequenceDiagram
    actor Client
    participant TracksController
    participant DeleteTrackCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IBackgroundFileOperationService as FileService
    participant IAuditService

    Client->>TracksController: DELETE /api/tracks/{id}
    TracksController->>DeleteTrackCommandHandler: Handle(DeleteTrackCommand)

    DeleteTrackCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>DeleteTrackCommandHandler: (isValid=false)
        DeleteTrackCommandHandler-->>TracksController: UnauthorizedAccessException
        TracksController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>DeleteTrackCommandHandler: (isValid=true, userId, roles, user)
    DeleteTrackCommandHandler->>DeleteTrackCommandHandler: command.EnsureTrackAccess(user.BrandId, roles)

    DeleteTrackCommandHandler->>IUnitOfWork: Repository~Track~.GetFirstOrDefaultAsync(id, includes PlaylistTracks)
    alt Not found
        IUnitOfWork-->>DeleteTrackCommandHandler: null
        DeleteTrackCommandHandler-->>TracksController: NotFoundException
        TracksController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>DeleteTrackCommandHandler: track
    alt track.BrandId != user.BrandId
        DeleteTrackCommandHandler-->>TracksController: ForbiddenAccessException
        TracksController-->>Client: 403 Forbidden
    end

    alt track.PlaylistTracks.Count > 0
        DeleteTrackCommandHandler-->>TracksController: BusinessRuleViolationException
        TracksController-->>Client: 422 Unprocessable Entity
    end

    DeleteTrackCommandHandler->>DeleteTrackCommandHandler: capture audioUrl, coverUrl
    DeleteTrackCommandHandler->>DeleteTrackCommandHandler: track.SoftDeleteEntity(userId)
    DeleteTrackCommandHandler->>IUnitOfWork: Repository~Track~.Update(track)

    DeleteTrackCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt DB save fails
        IUnitOfWork-->>DeleteTrackCommandHandler: Exception
        DeleteTrackCommandHandler->>IAuditService: LogEntityDelete(isSuccess=false)
        DeleteTrackCommandHandler-->>TracksController: rethrow
        TracksController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>DeleteTrackCommandHandler: OK
        DeleteTrackCommandHandler->>FileService: DeleteFileInBackground(audioUrl)
        DeleteTrackCommandHandler->>FileService: DeleteFileInBackground(coverUrl)
        DeleteTrackCommandHandler->>IAuditService: LogEntityDelete(isSuccess=true)
        DeleteTrackCommandHandler-->>TracksController: Result.Success
        TracksController-->>Client: 200 OK
    end
```

---

## 3.9.8 Sequence Diagram - Toggle Track Status

> `BrandManager` only.  
> Status transition is binary: `Active <-> Inactive`; previous status is captured for audit.

```mermaid
sequenceDiagram
    actor Client
    participant TracksController
    participant ToggleTrackStatusCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>TracksController: PUT /api/tracks/{id}/toggle-status
    TracksController->>ToggleTrackStatusCommandHandler: Handle(ToggleTrackStatusCommand)

    ToggleTrackStatusCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>ToggleTrackStatusCommandHandler: (isValid=false)
        ToggleTrackStatusCommandHandler-->>TracksController: UnauthorizedAccessException
        TracksController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>ToggleTrackStatusCommandHandler: (isValid=true, userId, roles, user)
    ToggleTrackStatusCommandHandler->>ToggleTrackStatusCommandHandler: command.EnsureTrackAccess(user.BrandId, roles)

    ToggleTrackStatusCommandHandler->>IUnitOfWork: Repository~Track~.GetFirstOrDefaultAsync(id)
    alt Not found
        IUnitOfWork-->>ToggleTrackStatusCommandHandler: null
        ToggleTrackStatusCommandHandler-->>TracksController: NotFoundException
        TracksController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>ToggleTrackStatusCommandHandler: track
    alt track.BrandId != user.BrandId
        ToggleTrackStatusCommandHandler-->>TracksController: ForbiddenAccessException
        TracksController-->>Client: 403 Forbidden
    end

    ToggleTrackStatusCommandHandler->>ToggleTrackStatusCommandHandler: previousStatus = track.Status
    ToggleTrackStatusCommandHandler->>ToggleTrackStatusCommandHandler: track.Status = Active/Inactive toggle
    ToggleTrackStatusCommandHandler->>IUnitOfWork: Repository~Track~.Update(track)

    ToggleTrackStatusCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt DB save fails
        IUnitOfWork-->>ToggleTrackStatusCommandHandler: Exception
        ToggleTrackStatusCommandHandler->>IAuditService: LogEntityToggleStatus(isSuccess=false, previousStatus)
        ToggleTrackStatusCommandHandler-->>TracksController: rethrow
        TracksController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>ToggleTrackStatusCommandHandler: OK
        ToggleTrackStatusCommandHandler->>IAuditService: LogEntityToggleStatus(isSuccess=true, previousStatus, newStatus)
        ToggleTrackStatusCommandHandler-->>TracksController: Result.Success
        TracksController-->>Client: 200 OK
    end
```

---

## 3.9.9 Notes for Implementation Accuracy

1. `StoreManager` is strictly read-only for Track module (query endpoints only).
2. Query handlers include `Mood` navigation to populate `MoodName` in DTO mapping.
3. `TrackRequest -> Track` AutoMapper profile uses null-skip (`ForAllMembers`) to support partial update semantics.
4. File URL values in response are converted by `FilePathUrlConverter` from stored path to accessible URL.
5. `DeleteTrack` executes business rule before soft-delete: any playlist reference blocks deletion.
6. File cleanup strategy is asymmetric by design:
   - Create: uploaded files are deleted only when DB commit fails.
   - Update: newly uploaded files are deleted when DB commit fails; old files are deleted only after successful commit.
   - Delete: files are deleted only after successful soft-delete commit.

---

## 3.9.10 Data Flow Diagram — Context (Level 0)

> Shows the Track Management system as a single boundary. External entities send/receive data; internal process decomposition is in Level 1.

**Notation:**

- **Rectangle `[ ]`** — External Entity (actor or external system)
- **Rounded rectangle `( )`** — Process / System
- **Cylinder `[( )]`** — Data Store
- **Arrow `-->|label|`** — Named data flow

```mermaid
graph LR
    BM["BrandManager"]
    SA["SystemAdmin"]
    SM["StoreManager (Read Only)"]

    TMS(("Track Management System"))

    DB[("D1: PostgreSQL - Tracks and Moods")]
    S3[("D2: AWS S3 - Audio and Cover Files")]
    AUDIT[("D3: Audit Log")]

    BM -->|"CRUD requests and file uploads"| TMS
    SA -->|"Read requests"| TMS
    SM -->|"Read requests"| TMS
    TMS -->|"Track list and detail"| BM
    TMS -->|"Track list and detail"| SA
    TMS -->|"Track list and detail"| SM
    TMS -->|"Read and write track records"| DB
    DB -->|"Track and Mood entities"| TMS
    TMS -->|"Upload and delete audio and cover files"| S3
    S3 -->|"Stored file paths"| TMS
    TMS -->|"Audit events"| AUDIT
```

---

## 3.9.11 Data Flow Diagram — Level 1

> Decomposes the Track Management system into five core processes. Each process corresponds to one or more command/query handlers in `LogAICAMS.Application.Features.Tracks`.

```mermaid
graph TB
    BM["BrandManager"]
    SA["SystemAdmin"]
    SM["StoreManager (Read Only)"]

    P1("1.0 Query Tracks")
    P2("2.0 Create Track")
    P3("3.0 Update Track")
    P4("4.0 Delete Track")
    P5("5.0 Toggle Status")

    DB[("D1: PostgreSQL - Tracks and Moods")]
    S3[("D2: AWS S3 - Audio and Cover Files")]
    AUDIT[("D3: Audit Log")]

    BM -->|"TrackFilter or trackId"| P1
    SA -->|"TrackFilter or trackId"| P1
    SM -->|"TrackFilter or trackId"| P1
    P1 -->|"Paginated list or detail response"| BM
    P1 -->|"Paginated list or detail response"| SA
    P1 -->|"Paginated list or detail response"| SM
    P1 -->|"SELECT with filter and pagination"| DB
    DB -->|"Track rows with Mood join"| P1

    BM -->|"POST TrackRequest and audio and cover files"| P2
    P2 -->|"Validate brand ownership and check duplicate title"| DB
    P2 -->|"Upload audio and cover files"| S3
    S3 -->|"Stored file paths"| P2
    P2 -->|"INSERT track record"| DB
    P2 -->|"LogEntityCreate"| AUDIT
    P2 -->|"trackId result"| BM

    BM -->|"PUT TrackRequest and optional new files"| P3
    P3 -->|"SELECT and verify brand ownership"| DB
    DB -->|"Existing track entity"| P3
    P3 -->|"Upload new files"| S3
    P3 -->|"Delete replaced files"| S3
    P3 -->|"UPDATE track record"| DB
    P3 -->|"LogEntityUpdate"| AUDIT
    P3 -->|"Success result"| BM

    BM -->|"DELETE trackId"| P4
    P4 -->|"Check active playlist references"| DB
    DB -->|"Reference check result"| P4
    P4 -->|"SOFT DELETE track"| DB
    P4 -->|"Delete audio and cover files"| S3
    P4 -->|"LogEntityDelete"| AUDIT
    P4 -->|"Success result"| BM

    BM -->|"PUT toggle trackId"| P5
    P5 -->|"SELECT current status"| DB
    P5 -->|"UPDATE status field"| DB
    P5 -->|"LogToggleStatus"| AUDIT
    P5 -->|"Success result"| BM
```
