# 3.10 Playlist Management - Software Design

> **Screens:** CMS Playlist List · Create/Edit Playlist · Playlist Detail  
> **Roles:**
>
> - Read (`GetPlaylists`, `GetPlaylistById`): `SystemAdmin` · `BrandManager` · `StoreManager`
> - Write (`Create/Update/Delete/ToggleStatus/AddTracks/RemoveTracks/Retranscode`): **`BrandManager`** · **`StoreManager`**
>   **Endpoints:** `GET /api/playlists` · `GET /api/playlists/{id}` · `POST /api/playlists` · `PUT /api/playlists/{id}` · `DELETE /api/playlists/{id}` · `PUT /api/playlists/{id}/toggle-status` · `POST /api/playlists/{id}/tracks` · `DELETE /api/playlists/{id}/tracks/{trackId}` · `POST /api/playlists/{id}/retranscode`

---

## 3.10.1 Class Diagram - Query Side (Read)

> `GetPlaylistsQueryHandler` and `GetPlaylistByIdQueryHandler` implement `IRequestHandler<,>` (MediatR) — hidden for readability.  
> Ownership on `Playlist` is derived via `playlist.Store?.BrandId` (no direct `BrandId` column on `Playlist`).  
> `GetPlaylistsQueryHandler`: BM forces `filter.BrandId = user.BrandId`; SM forces `filter.StoreId = user.StoreId` **and** `filter.BrandId = user.BrandId`.  
> `GetPlaylistByIdQueryHandler`: loads `PlaylistTracks → Track`, `Mood`, `Store`; computes `SeekOffsetSeconds` per track after mapping.

```mermaid
classDiagram
    class PlaylistsController {
        -IMediator _mediator
        +GetPlaylists(PlaylistFilter filter) Task~IActionResult~
        +GetPlaylistById(Guid id) Task~IActionResult~
    }

    class GetPlaylistsQuery {
        +PlaylistFilter? Filter
        +UserActionEnum GetActionType()
    }

    class GetPlaylistByIdQuery {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class IPlaylistRequest {
        <<interface>>
        +UserActionEnum GetActionType()
    }

    class PlaylistFilter {
        +Guid? BrandId
        +Guid? StoreId
        +Guid? MoodId
        +bool? IsDynamic
        +bool? IsDefault
        +DateTime? CreatedFrom
        +DateTime? CreatedTo
        +int Page
        +int PageSize
        +string? Search
        +string? SortBy
        +bool? IsAscending
        +EntityStatusEnum? Status
    }

    class GetPlaylistsQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetPlaylistsQuery, CancellationToken) Task~PaginationResult~PlaylistListItem~~
    }

    class GetPlaylistByIdQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetPlaylistByIdQuery, CancellationToken) Task~Result~PlaylistDetailResponse~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
    }

    class PlaylistListItem {
        +Guid? BrandId
        +Guid? StoreId
        +string? StoreName
        +Guid? MoodId
        +string? MoodName
        +string? Name
        +string? Description
        +bool? IsDynamic
        +bool? IsDefault
        +string? HlsUrl
        +int? TotalDurationSeconds
        +int TrackCount
    }

    class PlaylistDetailResponse {
        +List~PlaylistTrackItem~ Tracks
    }

    class PlaylistTrackItem {
        +Guid TrackId
        +string? Title
        +string? Artist
        +int? DurationSec
        +int? OrderIndex
        +string? CoverImageUrl
        +int? ActualDurationSec
        +int SeekOffsetSeconds
    }

    PlaylistsController --> GetPlaylistsQuery : creates
    PlaylistsController --> GetPlaylistByIdQuery : creates
    PlaylistsController ..> GetPlaylistsQueryHandler : sends via Mediator
    PlaylistsController ..> GetPlaylistByIdQueryHandler : sends via Mediator

    GetPlaylistsQuery ..|> IPlaylistRequest : implements
    GetPlaylistByIdQuery ..|> IPlaylistRequest : implements

    GetPlaylistsQuery --> PlaylistFilter : contains

    GetPlaylistsQueryHandler --> ICurrentUserService : validates session
    GetPlaylistsQueryHandler --> IUnitOfWork : reads playlists + Mood + Store + PlaylistTracks
    GetPlaylistsQueryHandler --> PlaylistListItem : returns paged list

    GetPlaylistByIdQueryHandler --> ICurrentUserService : validates session
    GetPlaylistByIdQueryHandler --> IUnitOfWork : reads playlist + Mood + Store + PlaylistTracks→Track
    GetPlaylistByIdQueryHandler --> PlaylistDetailResponse : returns detail

    PlaylistDetailResponse --|> PlaylistListItem : extends
    PlaylistDetailResponse --> PlaylistTrackItem : contains list
```

---

## 3.10.2 Class Diagram - Command Side (Write)

> Write authorization: `BrandManager` **or** `StoreManager` (both roles can write).  
> Ownership is checked via `playlist.Store?.BrandId == user.BrandId` (BM) or `playlist.StoreId == user.StoreId` (SM).  
> `PlaylistRequest` is shared for Create/Update; `SharedPlaylistRequestValidator` switches with `isPartialUpdate`.

### Part A - Commands, DTOs, Validators

```mermaid
classDiagram
    class PlaylistsController {
        -IMediator _mediator
        +CreatePlaylist(PlaylistRequest request) Task~IActionResult~
        +UpdatePlaylist(Guid id, PlaylistRequest request) Task~IActionResult~
        +DeletePlaylist(Guid id) Task~IActionResult~
        +TogglePlaylistStatus(Guid id) Task~IActionResult~
        +AddTracksToPlaylist(Guid id, AddTracksToPlaylistRequest request) Task~IActionResult~
        +RemoveTrackFromPlaylist(Guid id, Guid trackId) Task~IActionResult~
        +RetranscodePlaylist(Guid id) Task~IActionResult~
    }

    class IPlaylistRequest {
        <<interface>>
        +UserActionEnum GetActionType()
    }

    class CreatePlaylistCommand {
        +PlaylistRequest Request
        +UserActionEnum GetActionType()
    }

    class UpdatePlaylistCommand {
        +Guid Id
        +PlaylistRequest Request
        +UserActionEnum GetActionType()
    }

    class DeletePlaylistCommand {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class TogglePlaylistStatusCommand {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class AddTracksToPlaylistCommand {
        +Guid PlaylistId
        +AddTracksToPlaylistRequest Request
        +UserActionEnum GetActionType()
    }

    class RemoveTrackFromPlaylistCommand {
        +Guid PlaylistId
        +Guid TrackId
        +UserActionEnum GetActionType()
    }

    class RetranscodePlaylistCommand {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class PlaylistRequest {
        +string? Name
        +Guid? MoodId
        +Guid? StoreId
        +string? Description
        +bool? IsDynamic
        +bool? IsDefault
        +string? HlsUrl
        +int? TotalDurationSeconds
        +List~Guid~? TrackIds
    }

    class AddTracksToPlaylistRequest {
        +List~Guid~ TrackIds
    }

    class SharedPlaylistRequestValidator {
        +SharedPlaylistRequestValidator(ILocalizationService, bool isPartialUpdate)
    }

    class CreatePlaylistCommandValidator {
        +Validate(CreatePlaylistCommand) ValidationResult
    }

    class UpdatePlaylistCommandValidator {
        +Validate(UpdatePlaylistCommand) ValidationResult
    }

    PlaylistsController --> CreatePlaylistCommand : creates
    PlaylistsController --> UpdatePlaylistCommand : creates
    PlaylistsController --> DeletePlaylistCommand : creates
    PlaylistsController --> TogglePlaylistStatusCommand : creates
    PlaylistsController --> AddTracksToPlaylistCommand : creates
    PlaylistsController --> RemoveTrackFromPlaylistCommand : creates
    PlaylistsController --> RetranscodePlaylistCommand : creates

    CreatePlaylistCommand ..|> IPlaylistRequest : implements
    UpdatePlaylistCommand ..|> IPlaylistRequest : implements
    DeletePlaylistCommand ..|> IPlaylistRequest : implements
    TogglePlaylistStatusCommand ..|> IPlaylistRequest : implements
    AddTracksToPlaylistCommand ..|> IPlaylistRequest : implements
    RemoveTrackFromPlaylistCommand ..|> IPlaylistRequest : implements
    RetranscodePlaylistCommand ..|> IPlaylistRequest : implements

    CreatePlaylistCommand --> PlaylistRequest : contains
    UpdatePlaylistCommand --> PlaylistRequest : contains
    AddTracksToPlaylistCommand --> AddTracksToPlaylistRequest : contains

    CreatePlaylistCommandValidator ..> SharedPlaylistRequestValidator : isPartialUpdate=false
    UpdatePlaylistCommandValidator ..> SharedPlaylistRequestValidator : isPartialUpdate=true
```

### Part B - Handler Dependencies

```mermaid
classDiagram
    class CreatePlaylistCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundTranscodeService _transcodeService
        -ILogger _logger
        +Handle(CreatePlaylistCommand, CancellationToken) Task~Result~
    }

    class UpdatePlaylistCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IServiceScopeFactory _scopeFactory
        +Handle(UpdatePlaylistCommand, CancellationToken) Task~Result~
    }

    class DeletePlaylistCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundTranscodeService _transcodeService
        +Handle(DeletePlaylistCommand, CancellationToken) Task~Result~
    }

    class TogglePlaylistStatusCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(TogglePlaylistStatusCommand, CancellationToken) Task~Result~
    }

    class AddTracksToPlaylistCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IServiceScopeFactory _scopeFactory
        -IBackgroundTranscodeService _transcodeService
        +Handle(AddTracksToPlaylistCommand, CancellationToken) Task~Result~
    }

    class RemoveTrackFromPlaylistCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IServiceScopeFactory _scopeFactory
        -IBackgroundTranscodeService _transcodeService
        +Handle(RemoveTrackFromPlaylistCommand, CancellationToken) Task~Result~
    }

    class RetranscodePlaylistCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IBackgroundTranscodeService _transcodeService
        +Handle(RetranscodePlaylistCommand, CancellationToken) Task~Result~
    }

    class IBackgroundTranscodeService {
        <<interface>>
        +RequestTranscode(Guid playlistId, Guid storeId, bool immediate) void
        +EnqueueS3FolderCleanup(Guid playlistId, Guid storeId) void
    }

    class IAuditService {
        <<interface>>
        +LogEntityCreate(...) void
        +LogEntityUpdate(...) void
        +LogEntityDelete(...) void
        +LogEntityToggleStatus(...) void
    }

    class PlaylistTrackOrderHelper {
        <<static>>
        +ReindexOrderInBackground(IServiceScopeFactory, Guid playlistId) void
    }

    class PlaylistActiveStreamGuard {
        <<static>>
        +ThrowIfStreamingAsync(Guid playlistId, IUnitOfWork, ILocalizationService, CancellationToken) Task
    }

    CreatePlaylistCommandHandler --> IBackgroundTranscodeService : RequestTranscode (debounced)
    CreatePlaylistCommandHandler --> IAuditService : audit create

    UpdatePlaylistCommandHandler --> PlaylistTrackOrderHelper : ReindexOrderInBackground
    UpdatePlaylistCommandHandler --> IAuditService : audit update

    DeletePlaylistCommandHandler --> IBackgroundTranscodeService : EnqueueS3FolderCleanup
    DeletePlaylistCommandHandler --> IAuditService : audit delete

    TogglePlaylistStatusCommandHandler --> IAuditService : audit toggle

    AddTracksToPlaylistCommandHandler --> PlaylistActiveStreamGuard : guard streaming check
    AddTracksToPlaylistCommandHandler --> PlaylistTrackOrderHelper : ReindexOrderInBackground
    AddTracksToPlaylistCommandHandler --> IBackgroundTranscodeService : RequestTranscode (debounced)
    AddTracksToPlaylistCommandHandler --> IAuditService : audit update

    RemoveTrackFromPlaylistCommandHandler --> PlaylistActiveStreamGuard : guard streaming check
    RemoveTrackFromPlaylistCommandHandler --> PlaylistTrackOrderHelper : ReindexOrderInBackground
    RemoveTrackFromPlaylistCommandHandler --> IBackgroundTranscodeService : RequestTranscode (debounced)
    RemoveTrackFromPlaylistCommandHandler --> IAuditService : audit update

    RetranscodePlaylistCommandHandler --> IBackgroundTranscodeService : RequestTranscode (immediate)
```

---

## 3.10.3 Sequence Diagram - Get Playlists

> Read allowed for `SystemAdmin`, `BrandManager`, `StoreManager`.  
> BM: handler forces `filter.BrandId = user.BrandId`. SM: forces both `filter.StoreId = user.StoreId` and `filter.BrandId = user.BrandId`.  
> Includes: `Mood`, `Store`, `PlaylistTracks` (for `TrackCount`).

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant GetPlaylistsQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>PlaylistsController: GET /api/playlists?page=1&pageSize=10
    PlaylistsController->>GetPlaylistsQueryHandler: Handle(GetPlaylistsQuery)

    GetPlaylistsQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetPlaylistsQueryHandler: (isValid=false)
        GetPlaylistsQueryHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>GetPlaylistsQueryHandler: (isValid=true, userId, roles, user)
    GetPlaylistsQueryHandler->>GetPlaylistsQueryHandler: request.EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    alt No valid read role
        GetPlaylistsQueryHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    alt BrandManager
        GetPlaylistsQueryHandler->>GetPlaylistsQueryHandler: filter.BrandId = user.BrandId (forced)
    else StoreManager
        GetPlaylistsQueryHandler->>GetPlaylistsQueryHandler: filter.StoreId = user.StoreId (forced)
        GetPlaylistsQueryHandler->>GetPlaylistsQueryHandler: filter.BrandId = user.BrandId (forced)
    end

    GetPlaylistsQueryHandler->>GetPlaylistsQueryHandler: predicate = filter.BuildPredicate()
    GetPlaylistsQueryHandler->>GetPlaylistsQueryHandler: Build orderBy, apply default isAscending=false

    GetPlaylistsQueryHandler->>IUnitOfWork: Repository~Playlist~.GetPagedAsync(includes: Mood, Store, PlaylistTracks)
    IUnitOfWork-->>GetPlaylistsQueryHandler: (playlists[], totalCount)

    GetPlaylistsQueryHandler->>GetPlaylistsQueryHandler: Map to List~PlaylistListItem~
    GetPlaylistsQueryHandler-->>PlaylistsController: PaginationResult~PlaylistListItem~.Success
    PlaylistsController-->>Client: 200 OK
```

---

## 3.10.4 Sequence Diagram - Get Playlist By Id

> Loaded with full graph: `PlaylistTracks → Track`, `Mood`, `Store`.  
> BM ownership: `playlist.Store?.BrandId == user.BrandId`. SM ownership: `playlist.StoreId == user.StoreId`.  
> `SeekOffsetSeconds` is computed post-mapping using `ActualDurationSec` (MediaConvert) with fallback to `DurationSec`.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant GetPlaylistByIdQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>PlaylistsController: GET /api/playlists/{id}
    PlaylistsController->>GetPlaylistByIdQueryHandler: Handle(GetPlaylistByIdQuery)

    GetPlaylistByIdQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetPlaylistByIdQueryHandler: (isValid=false)
        GetPlaylistByIdQueryHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>GetPlaylistByIdQueryHandler: (isValid=true, userId, roles, user)
    GetPlaylistByIdQueryHandler->>GetPlaylistByIdQueryHandler: query.EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    alt No valid read role
        GetPlaylistByIdQueryHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    GetPlaylistByIdQueryHandler->>IUnitOfWork: GetQueryable().Include(PlaylistTracks→Track).Include(Mood).Include(Store).FirstOrDefaultAsync(id)
    alt Playlist not found
        IUnitOfWork-->>GetPlaylistByIdQueryHandler: null
        GetPlaylistByIdQueryHandler-->>PlaylistsController: NotFoundException
        PlaylistsController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>GetPlaylistByIdQueryHandler: playlist

    alt BrandManager and playlist.Store?.BrandId != user.BrandId
        GetPlaylistByIdQueryHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    else StoreManager and playlist.StoreId != user.StoreId
        GetPlaylistByIdQueryHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    GetPlaylistByIdQueryHandler->>GetPlaylistByIdQueryHandler: Map to PlaylistDetailResponse
    GetPlaylistByIdQueryHandler->>GetPlaylistByIdQueryHandler: Compute SeekOffsetSeconds per track (cumulative ActualDurationSec ?? DurationSec)
    GetPlaylistByIdQueryHandler-->>PlaylistsController: Result~PlaylistDetailResponse~.Success
    PlaylistsController-->>Client: 200 OK
```

---

## 3.10.5 Sequence Diagram - Create Playlist

> Write allowed for `BrandManager` **and** `StoreManager`.  
> `StoreManager`: `StoreId` auto-resolved from `user.StoreId`; `BrandId` resolved from `Store.BrandId`.  
> `BrandManager`: must provide `StoreId` in request body; handler verifies `Store.BrandId == user.BrandId`.  
> Initial `TrackIds` are validated (must belong to same brand) and atomically inserted as `PlaylistTrack` rows.  
> Transcode is triggered (debounced 5 min) only when initial tracks are provided.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant CreatePlaylistCommandValidator
    participant CreatePlaylistCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IBackgroundTranscodeService as TranscodeService
    participant IAuditService

    Client->>PlaylistsController: POST /api/playlists (JSON body)
    PlaylistsController->>CreatePlaylistCommandValidator: Validate(CreatePlaylistCommand)

    alt Validation failed (Name missing or HlsUrl invalid)
        CreatePlaylistCommandValidator-->>PlaylistsController: ValidationException
        PlaylistsController-->>Client: 400 Bad Request
    end

    PlaylistsController->>CreatePlaylistCommandHandler: Handle(CreatePlaylistCommand)

    CreatePlaylistCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>CreatePlaylistCommandHandler: (isValid=false)
        CreatePlaylistCommandHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>CreatePlaylistCommandHandler: (isValid=true, userId, roles, user)
    CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    alt Not BrandManager and not StoreManager
        CreatePlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    alt StoreManager
        CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: storeId = user.StoreId
        CreatePlaylistCommandHandler->>IUnitOfWork: Repository<Store>.GetFirstOrDefaultAsync(storeId)
        alt Store not found
            IUnitOfWork-->>CreatePlaylistCommandHandler: null
            CreatePlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
            PlaylistsController-->>Client: 403 Forbidden
        end
        IUnitOfWork-->>CreatePlaylistCommandHandler: store
        CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: brandId = store.BrandId
    else BrandManager
        CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: validate request.StoreId is not null
        alt StoreId not provided
            CreatePlaylistCommandHandler-->>PlaylistsController: BusinessRuleViolationException
            PlaylistsController-->>Client: 422 Unprocessable Entity
        end
        CreatePlaylistCommandHandler->>IUnitOfWork: Repository<Store>.AnyAsync(storeId, user.BrandId)
        alt Store not found in brand
            IUnitOfWork-->>CreatePlaylistCommandHandler: false
            CreatePlaylistCommandHandler-->>PlaylistsController: NotFoundException(Store)
            PlaylistsController-->>Client: 404 Not Found
        end
        CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: brandId = user.BrandId
    end

    opt MoodId provided
        CreatePlaylistCommandHandler->>IUnitOfWork: Repository<Mood>.AnyAsync(moodId)
        alt Mood not found
            IUnitOfWork-->>CreatePlaylistCommandHandler: false
            CreatePlaylistCommandHandler-->>PlaylistsController: NotFoundException(Mood)
            PlaylistsController-->>Client: 404 Not Found
        end
    end

    CreatePlaylistCommandHandler->>IUnitOfWork: Repository<Playlist>.FindDuplicateNameAsync(storeId, name, null)
    alt Duplicate name in store
        IUnitOfWork-->>CreatePlaylistCommandHandler: conflictField
        CreatePlaylistCommandHandler-->>PlaylistsController: BusinessRuleViolationException
        PlaylistsController-->>Client: 422 Unprocessable Entity
    end

    CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: map request to Playlist
    CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: playlist.StoreId = storeId, InitializeEntity(userId)

    opt TrackIds provided and count > 0
        CreatePlaylistCommandHandler->>IUnitOfWork: Repository<Track>.GetValidIds(TrackIds, brandId)
        IUnitOfWork-->>CreatePlaylistCommandHandler: validTrackIds
        CreatePlaylistCommandHandler->>CreatePlaylistCommandHandler: build PlaylistTrack rows (OrderIndex 1..N)
        CreatePlaylistCommandHandler->>IUnitOfWork: Repository<PlaylistTrack>.AddRangeAsync(playlistTracks)
    end

    CreatePlaylistCommandHandler->>IUnitOfWork: Repository<Playlist>.AddAsync(playlist)
    CreatePlaylistCommandHandler->>IUnitOfWork: SaveChangesAsync()

    alt DB save fails
        IUnitOfWork-->>CreatePlaylistCommandHandler: Exception
        CreatePlaylistCommandHandler->>IAuditService: LogEntityCreate(isSuccess=false)
        CreatePlaylistCommandHandler-->>PlaylistsController: rethrow
        PlaylistsController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>CreatePlaylistCommandHandler: OK
        CreatePlaylistCommandHandler->>IAuditService: LogEntityCreate(isSuccess=true)
        opt TrackIds were provided
            CreatePlaylistCommandHandler->>TranscodeService: RequestTranscode(playlistId, storeId, immediate=false)
        end
        CreatePlaylistCommandHandler-->>PlaylistsController: Result.Success
        PlaylistsController-->>Client: 200 OK
    end
```

---

## 3.10.6 Sequence Diagram - Update Playlist

> BM/SM write roles; ownership derived from `playlist.Store?.BrandId` (BM) or `playlist.StoreId` (SM).  
> `TrackIds = null` → skip track management. `TrackIds = []` → remove all tracks.  
> Any track list change triggers background reindex via `PlaylistTrackOrderHelper`.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant UpdatePlaylistCommandValidator
    participant UpdatePlaylistCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant PlaylistTrackOrderHelper
    participant IAuditService

    Client->>PlaylistsController: PUT /api/playlists/{id} (JSON body)
    PlaylistsController->>UpdatePlaylistCommandValidator: Validate(UpdatePlaylistCommand)

    alt Validation failed
        UpdatePlaylistCommandValidator-->>PlaylistsController: ValidationException
        PlaylistsController-->>Client: 400 Bad Request
    end

    PlaylistsController->>UpdatePlaylistCommandHandler: Handle(UpdatePlaylistCommand)

    UpdatePlaylistCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>UpdatePlaylistCommandHandler: (isValid=false)
        UpdatePlaylistCommandHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>UpdatePlaylistCommandHandler: (isValid=true, userId, roles, user)
    UpdatePlaylistCommandHandler->>UpdatePlaylistCommandHandler: EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<Playlist>.GetByIdWithStore(id)
    alt Playlist not found
        IUnitOfWork-->>UpdatePlaylistCommandHandler: null
        UpdatePlaylistCommandHandler-->>PlaylistsController: NotFoundException
        PlaylistsController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>UpdatePlaylistCommandHandler: playlist

    alt BrandManager and playlist store brand does not match user brand
        UpdatePlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    else StoreManager and playlist store does not match user store
        UpdatePlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    opt MoodId provided and different from current
        UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<Mood>.Exists(moodId)
        alt Mood not found
            IUnitOfWork-->>UpdatePlaylistCommandHandler: false
            UpdatePlaylistCommandHandler-->>PlaylistsController: NotFoundException(Mood)
            PlaylistsController-->>Client: 404 Not Found
        end
    end

    opt Name changed
        UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<Playlist>.FindDuplicateNameAsync(storeId, newName, id)
        alt Duplicate name
            IUnitOfWork-->>UpdatePlaylistCommandHandler: conflictField
            UpdatePlaylistCommandHandler-->>PlaylistsController: BusinessRuleViolationException
            PlaylistsController-->>Client: 422 Unprocessable Entity
        end
    end

    UpdatePlaylistCommandHandler->>UpdatePlaylistCommandHandler: map request to playlist
    UpdatePlaylistCommandHandler->>UpdatePlaylistCommandHandler: playlist.UpdateEntity(userId)
    UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<Playlist>.Update(playlist)

    opt TrackIds provided (including empty list)
        UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<PlaylistTrack>.GetByPlaylistId(id)
        IUnitOfWork-->>UpdatePlaylistCommandHandler: existingTracks
        UpdatePlaylistCommandHandler->>UpdatePlaylistCommandHandler: calculate toDelete and toCreateIds
        opt any toDelete
            UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<PlaylistTrack>.DeleteRange(toDelete)
        end
        opt any toCreateIds
            UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<Track>.GetValidIds(toCreateIds, brandId)
            IUnitOfWork-->>UpdatePlaylistCommandHandler: validIds
            UpdatePlaylistCommandHandler->>UpdatePlaylistCommandHandler: build new PlaylistTrack rows
            UpdatePlaylistCommandHandler->>IUnitOfWork: Repository<PlaylistTrack>.AddRangeAsync(newTracks)
        end
        UpdatePlaylistCommandHandler->>UpdatePlaylistCommandHandler: needsReindex = list changed
    end

    UpdatePlaylistCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt DB save fails
        IUnitOfWork-->>UpdatePlaylistCommandHandler: Exception
        UpdatePlaylistCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=false)
        UpdatePlaylistCommandHandler-->>PlaylistsController: rethrow
        PlaylistsController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>UpdatePlaylistCommandHandler: OK
        UpdatePlaylistCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=true)
        opt needsReindex
            UpdatePlaylistCommandHandler->>PlaylistTrackOrderHelper: ReindexOrderInBackground(scopeFactory, playlistId)
            opt playlist has StoreId
                UpdatePlaylistCommandHandler->>TranscodeService: RequestTranscode(playlistId, storeId, immediate=false)
            end
        end
        UpdatePlaylistCommandHandler-->>PlaylistsController: Result.Success
        PlaylistsController-->>Client: 200 OK
    end
```

---

## 3.10.7 Sequence Diagram - Delete Playlist

> Soft-delete only.  
> Business rule: cannot delete a playlist that is **currently streaming** — checked via `SpaceMusicStates.CurrentPlaylistId`.  
> On success: S3 folder cleanup is enqueued via `IBackgroundTranscodeService.EnqueueS3FolderCleanup`.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant DeletePlaylistCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IBackgroundTranscodeService as TranscodeService
    participant IAuditService

    Client->>PlaylistsController: DELETE /api/playlists/{id}
    PlaylistsController->>DeletePlaylistCommandHandler: Handle(DeletePlaylistCommand)

    DeletePlaylistCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>DeletePlaylistCommandHandler: (isValid=false)
        DeletePlaylistCommandHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>DeletePlaylistCommandHandler: (isValid=true, userId, roles, user)
    DeletePlaylistCommandHandler->>DeletePlaylistCommandHandler: command.EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    DeletePlaylistCommandHandler->>IUnitOfWork: Repository~Playlist~.GetFirstOrDefaultAsync(id, includes: SpaceMusicStates, Store)
    alt Not found
        IUnitOfWork-->>DeletePlaylistCommandHandler: null
        DeletePlaylistCommandHandler-->>PlaylistsController: NotFoundException
        PlaylistsController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>DeletePlaylistCommandHandler: playlist

    alt BrandManager and playlist.Store?.BrandId != user.BrandId
        DeletePlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    else StoreManager and playlist.StoreId != user.StoreId
        DeletePlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    alt playlist.SpaceMusicStates.Any(s.CurrentPlaylistId == playlist.Id)
        DeletePlaylistCommandHandler-->>PlaylistsController: BusinessRuleViolationException (PlaylistDeleteActiveStream)
        PlaylistsController-->>Client: 422 Unprocessable Entity
    end

    DeletePlaylistCommandHandler->>DeletePlaylistCommandHandler: playlist.SoftDeleteEntity(userId)
    DeletePlaylistCommandHandler->>IUnitOfWork: Repository~Playlist~.Update(playlist)

    DeletePlaylistCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt DB save fails
        IUnitOfWork-->>DeletePlaylistCommandHandler: Exception
        DeletePlaylistCommandHandler->>IAuditService: LogEntityDelete(isSuccess=false)
        DeletePlaylistCommandHandler-->>PlaylistsController: rethrow
        PlaylistsController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>DeletePlaylistCommandHandler: OK
        DeletePlaylistCommandHandler->>TranscodeService: EnqueueS3FolderCleanup(playlistId, storeId)
        DeletePlaylistCommandHandler->>IAuditService: LogEntityDelete(isSuccess=true)
        DeletePlaylistCommandHandler-->>PlaylistsController: Result.Success
        PlaylistsController-->>Client: 200 OK
    end
```

---

## 3.10.8 Sequence Diagram - Toggle Playlist Status

> `BrandManager` and `StoreManager` both allowed.  
> Binary toggle: `Active ↔ Inactive`. Previous status captured for audit log.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant TogglePlaylistStatusCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>PlaylistsController: PUT /api/playlists/{id}/toggle-status
    PlaylistsController->>TogglePlaylistStatusCommandHandler: Handle(TogglePlaylistStatusCommand)

    TogglePlaylistStatusCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>TogglePlaylistStatusCommandHandler: (isValid=false)
        TogglePlaylistStatusCommandHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>TogglePlaylistStatusCommandHandler: (isValid=true, userId, roles, user)
    TogglePlaylistStatusCommandHandler->>TogglePlaylistStatusCommandHandler: command.EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    TogglePlaylistStatusCommandHandler->>IUnitOfWork: Repository~Playlist~.GetFirstOrDefaultAsync(id, includes: Store)
    alt Not found
        IUnitOfWork-->>TogglePlaylistStatusCommandHandler: null
        TogglePlaylistStatusCommandHandler-->>PlaylistsController: NotFoundException
        PlaylistsController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>TogglePlaylistStatusCommandHandler: playlist

    alt BrandManager and playlist.Store?.BrandId != user.BrandId
        TogglePlaylistStatusCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    else StoreManager and playlist.StoreId != user.StoreId
        TogglePlaylistStatusCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    TogglePlaylistStatusCommandHandler->>TogglePlaylistStatusCommandHandler: previousStatus = playlist.Status
    TogglePlaylistStatusCommandHandler->>TogglePlaylistStatusCommandHandler: playlist.Status = Active/Inactive toggle
    TogglePlaylistStatusCommandHandler->>TogglePlaylistStatusCommandHandler: playlist.UpdateEntity(userId)
    TogglePlaylistStatusCommandHandler->>IUnitOfWork: Repository~Playlist~.Update(playlist)

    TogglePlaylistStatusCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt DB save fails
        IUnitOfWork-->>TogglePlaylistStatusCommandHandler: Exception
        TogglePlaylistStatusCommandHandler->>IAuditService: LogEntityToggleStatus(isSuccess=false, previousStatus)
        TogglePlaylistStatusCommandHandler-->>PlaylistsController: rethrow
        PlaylistsController-->>Client: 500 Internal Server Error
    else Save succeeds
        IUnitOfWork-->>TogglePlaylistStatusCommandHandler: OK
        TogglePlaylistStatusCommandHandler->>IAuditService: LogEntityToggleStatus(isSuccess=true, previousStatus, newStatus)
        TogglePlaylistStatusCommandHandler-->>PlaylistsController: Result.Success
        PlaylistsController-->>Client: 200 OK
    end
```

---

## 3.10.9 Sequence Diagram - Add Tracks To Playlist

> BM/SM write roles.  
> Duplicate tracks (already in playlist) are silently skipped (counted as `skippedCount`).  
> Guard: cannot add tracks to a playlist that is currently streaming (`PlaylistActiveStreamGuard`).  
> New rows appended after current max `OrderIndex`; background reindex normalises ordering.  
> Transcode re-triggered (debounced 5 min) after successful save.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant AddTracksToPlaylistCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant PlaylistActiveStreamGuard
    participant PlaylistTrackOrderHelper
    participant IBackgroundTranscodeService as TranscodeService
    participant IAuditService

    Client->>PlaylistsController: POST /api/playlists/{id}/tracks (JSON body)
    PlaylistsController->>AddTracksToPlaylistCommandHandler: Handle(AddTracksToPlaylistCommand)

    AddTracksToPlaylistCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>AddTracksToPlaylistCommandHandler: (isValid=false)
        AddTracksToPlaylistCommandHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>AddTracksToPlaylistCommandHandler: (isValid=true, userId, roles, user)
    AddTracksToPlaylistCommandHandler->>AddTracksToPlaylistCommandHandler: command.EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    AddTracksToPlaylistCommandHandler->>IUnitOfWork: Repository~Playlist~.GetFirstOrDefaultAsync(playlistId, includes: Store)
    alt Not found
        IUnitOfWork-->>AddTracksToPlaylistCommandHandler: null
        AddTracksToPlaylistCommandHandler-->>PlaylistsController: NotFoundException
        PlaylistsController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>AddTracksToPlaylistCommandHandler: playlist

    alt BrandManager and playlist.Store?.BrandId != user.BrandId
        AddTracksToPlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    else StoreManager and playlist.StoreId != user.StoreId
        AddTracksToPlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    AddTracksToPlaylistCommandHandler->>AddTracksToPlaylistCommandHandler: trackIds = Distinct(request.TrackIds)
    alt trackIds is empty
        AddTracksToPlaylistCommandHandler-->>PlaylistsController: Result.Success (no-op)
        PlaylistsController-->>Client: 200 OK
    end

    AddTracksToPlaylistCommandHandler->>IUnitOfWork: Repository~Track~.GetQueryable().Where(id in trackIds && BrandId == brandId)
    IUnitOfWork-->>AddTracksToPlaylistCommandHandler: validTrackIds[]

    AddTracksToPlaylistCommandHandler->>IUnitOfWork: Repository~PlaylistTrack~.GetQueryable().Where(playlistId).Select(TrackId, OrderIndex)
    IUnitOfWork-->>AddTracksToPlaylistCommandHandler: existingTracks[]

    AddTracksToPlaylistCommandHandler->>AddTracksToPlaylistCommandHandler: newTrackIds = validTrackIds - existingIds

    alt newTrackIds is empty (all already exist)
        AddTracksToPlaylistCommandHandler-->>PlaylistsController: Result.Success (no-op)
        PlaylistsController-->>Client: 200 OK
    end

    AddTracksToPlaylistCommandHandler->>PlaylistActiveStreamGuard: ThrowIfStreamingAsync(playlistId, unitOfWork, localization)
    alt Playlist is actively streaming
        PlaylistActiveStreamGuard-->>AddTracksToPlaylistCommandHandler: BusinessRuleViolationException
        AddTracksToPlaylistCommandHandler-->>PlaylistsController: BusinessRuleViolationException
        PlaylistsController-->>Client: 422 Unprocessable Entity
    end

    AddTracksToPlaylistCommandHandler->>AddTracksToPlaylistCommandHandler: determine maxOrder from existingTracks
    AddTracksToPlaylistCommandHandler->>AddTracksToPlaylistCommandHandler: set nextOrder to maxOrder plus one
    AddTracksToPlaylistCommandHandler->>AddTracksToPlaylistCommandHandler: build PlaylistTrack rows with increasing OrderIndex
    AddTracksToPlaylistCommandHandler->>IUnitOfWork: Repository~PlaylistTrack~.AddRangeAsync(newTracks)
    AddTracksToPlaylistCommandHandler->>IUnitOfWork: SaveChangesAsync()
    IUnitOfWork-->>AddTracksToPlaylistCommandHandler: OK

    AddTracksToPlaylistCommandHandler->>PlaylistTrackOrderHelper: ReindexOrderInBackground(scopeFactory, playlistId)
    AddTracksToPlaylistCommandHandler->>TranscodeService: RequestTranscode(playlistId, storeId, immediate=false)
    AddTracksToPlaylistCommandHandler->>IAuditService: LogEntityUpdate(Action=AddTracks, AddedCount, SkippedCount)
    AddTracksToPlaylistCommandHandler-->>PlaylistsController: Result.Success
    PlaylistsController-->>Client: 200 OK
```

---

## 3.10.10 Sequence Diagram - Remove Track From Playlist

> BM/SM write roles.  
> Guard: cannot remove tracks from a playlist that is currently streaming.  
> If the `PlaylistTrack` row is not found, operation is silently ignored (idempotent).  
> Transcode re-triggered (debounced 5 min) after successful removal.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant RemoveTrackFromPlaylistCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant PlaylistActiveStreamGuard
    participant PlaylistTrackOrderHelper
    participant IBackgroundTranscodeService as TranscodeService
    participant IAuditService

    Client->>PlaylistsController: DELETE /api/playlists/{id}/tracks/{trackId}
    PlaylistsController->>RemoveTrackFromPlaylistCommandHandler: Handle(RemoveTrackFromPlaylistCommand)

    RemoveTrackFromPlaylistCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>RemoveTrackFromPlaylistCommandHandler: (isValid=false)
        RemoveTrackFromPlaylistCommandHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>RemoveTrackFromPlaylistCommandHandler: (isValid=true, userId, roles, user)
    RemoveTrackFromPlaylistCommandHandler->>RemoveTrackFromPlaylistCommandHandler: command.EnsurePlaylistAccess(user.BrandId, user.StoreId, roles)

    RemoveTrackFromPlaylistCommandHandler->>IUnitOfWork: Repository~Playlist~.GetFirstOrDefaultAsync(playlistId, includes: Store)
    alt Not found
        IUnitOfWork-->>RemoveTrackFromPlaylistCommandHandler: null
        RemoveTrackFromPlaylistCommandHandler-->>PlaylistsController: NotFoundException
        PlaylistsController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>RemoveTrackFromPlaylistCommandHandler: playlist

    alt BrandManager and playlist.Store?.BrandId != user.BrandId
        RemoveTrackFromPlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    else StoreManager and playlist.StoreId != user.StoreId
        RemoveTrackFromPlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    RemoveTrackFromPlaylistCommandHandler->>PlaylistActiveStreamGuard: ThrowIfStreamingAsync(playlistId, unitOfWork, localization)
    alt Playlist is actively streaming
        PlaylistActiveStreamGuard-->>RemoveTrackFromPlaylistCommandHandler: BusinessRuleViolationException
        RemoveTrackFromPlaylistCommandHandler-->>PlaylistsController: BusinessRuleViolationException
        PlaylistsController-->>Client: 422 Unprocessable Entity
    end

    RemoveTrackFromPlaylistCommandHandler->>IUnitOfWork: Repository~PlaylistTrack~.GetQueryable().FirstOrDefaultAsync(playlistId && trackId)
    IUnitOfWork-->>RemoveTrackFromPlaylistCommandHandler: trackEntry (or null)

    alt trackEntry found
        RemoveTrackFromPlaylistCommandHandler->>IUnitOfWork: Repository~PlaylistTrack~.DeleteRange([trackEntry])
        RemoveTrackFromPlaylistCommandHandler->>IUnitOfWork: SaveChangesAsync()
        IUnitOfWork-->>RemoveTrackFromPlaylistCommandHandler: OK
        RemoveTrackFromPlaylistCommandHandler->>PlaylistTrackOrderHelper: ReindexOrderInBackground(scopeFactory, playlistId)
        RemoveTrackFromPlaylistCommandHandler->>TranscodeService: RequestTranscode(playlistId, storeId, immediate=false)
    end

    RemoveTrackFromPlaylistCommandHandler->>IAuditService: LogEntityUpdate(Action=RemoveTrack, TrackId)
    RemoveTrackFromPlaylistCommandHandler-->>PlaylistsController: Result.Success
    PlaylistsController-->>Client: 200 OK
```

---

## 3.10.11 Sequence Diagram - Retranscode Playlist (API)

> BM/SM write roles.  
> Calls `IBackgroundTranscodeService.RequestTranscode(..., immediate=true)` and returns `202 Accepted` when enqueued.

```mermaid
sequenceDiagram
    actor Client
    participant PlaylistsController
    participant RetranscodePlaylistCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IBackgroundTranscodeService as TranscodeService

    Client->>PlaylistsController: POST /api/playlists/{id}/retranscode
    PlaylistsController->>RetranscodePlaylistCommandHandler: Handle(RetranscodePlaylistCommand)

    RetranscodePlaylistCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>RetranscodePlaylistCommandHandler: (isValid=false)
        RetranscodePlaylistCommandHandler-->>PlaylistsController: UnauthorizedAccessException
        PlaylistsController-->>Client: 401 Unauthorized
    end

    ICurrentUserService-->>RetranscodePlaylistCommandHandler: (isValid=true, userId, roles, user)
    RetranscodePlaylistCommandHandler->>RetranscodePlaylistCommandHandler: EnsurePlaylistAccess(userBrand, userStore, roles)

    RetranscodePlaylistCommandHandler->>IUnitOfWork: Load playlist with Store
    alt Playlist not found
        IUnitOfWork-->>RetranscodePlaylistCommandHandler: null
        RetranscodePlaylistCommandHandler-->>PlaylistsController: NotFoundException
        PlaylistsController-->>Client: 404 Not Found
    end

    IUnitOfWork-->>RetranscodePlaylistCommandHandler: playlist

    alt Ownership check fails
        RetranscodePlaylistCommandHandler-->>PlaylistsController: ForbiddenAccessException
        PlaylistsController-->>Client: 403 Forbidden
    end

    alt playlist has no StoreId
        RetranscodePlaylistCommandHandler-->>PlaylistsController: Result.Failure(InvalidOperation)
        PlaylistsController-->>Client: 422 Unprocessable Entity
    end

    RetranscodePlaylistCommandHandler->>TranscodeService: RequestTranscode(playlistId, storeId, immediate=true)
    RetranscodePlaylistCommandHandler-->>PlaylistsController: Result.Success
    PlaylistsController-->>Client: 202 Accepted
```

---

## 3.10.12 Sequence Diagram - Transcode Orchestration (Debounce + MediaConvert)

> This sequence describes the internal flow triggered by `RequestTranscode`.  
> Debounce key is `Playlist.TranscodeRequestedAt` stamped by `BackgroundTranscodeService` and checked in `PlaylistTranscodeJob`.

```mermaid
sequenceDiagram
    participant Caller
    participant IBackgroundTranscodeService as TranscodeService
    participant IUnitOfWork
    participant PlaylistTranscodeJob
    participant IMediaConvertService
    participant PlaylistTranscodeStatusJob

    Caller->>TranscodeService: RequestTranscode(playlistId, storeId, immediate flag)

    TranscodeService->>TranscodeService: create async scope and resolve IUnitOfWork
    TranscodeService->>IUnitOfWork: Load playlist by id
    alt Playlist not found
        IUnitOfWork-->>TranscodeService: null
        TranscodeService-->>TranscodeService: log warning and return
    else Playlist found
        IUnitOfWork-->>TranscodeService: playlist
        TranscodeService->>TranscodeService: compute requestedAt (UTC, truncated)
        TranscodeService->>TranscodeService: set TranscodeRequestedAt, increment TranscodeVersion, set Status=Pending
        TranscodeService->>IUnitOfWork: Update playlist and SaveChanges

        alt immediate flag true
            TranscodeService->>PlaylistTranscodeJob: Enqueue ExecuteAsync(playlistId, storeId, requestedAt)
        else immediate flag false
            TranscodeService->>PlaylistTranscodeJob: Schedule ExecuteAsync after 5 minutes
        end
    end

    PlaylistTranscodeJob->>PlaylistTranscodeJob: create async scope and resolve IUnitOfWork and IMediaConvertService
    PlaylistTranscodeJob->>IUnitOfWork: Load playlist by id
    alt Playlist not found
        IUnitOfWork-->>PlaylistTranscodeJob: null
        PlaylistTranscodeJob-->>PlaylistTranscodeJob: log warning and return
    end

    IUnitOfWork-->>PlaylistTranscodeJob: playlist
    alt Debounce skip (DB requestedAt differs)
        PlaylistTranscodeJob-->>PlaylistTranscodeJob: log skip and return
    end

    PlaylistTranscodeJob->>IUnitOfWork: Load ordered tracks with AudioUrl
    alt No usable tracks
        IUnitOfWork-->>PlaylistTranscodeJob: empty list
        PlaylistTranscodeJob-->>PlaylistTranscodeJob: log warning and return
    end

    IUnitOfWork-->>PlaylistTranscodeJob: tracks
    PlaylistTranscodeJob->>PlaylistTranscodeJob: build outputPrefix using playlistId, storeId, version
    PlaylistTranscodeJob->>IMediaConvertService: CreatePlaylistJobAsync(inputKeys, outputPrefix)
    alt MediaConvert job creation fails
        IMediaConvertService-->>PlaylistTranscodeJob: throws exception
        PlaylistTranscodeJob->>PlaylistTranscodeJob: set Status=Failed and ErrorMessage
        PlaylistTranscodeJob->>IUnitOfWork: Update playlist and SaveChanges
        PlaylistTranscodeJob-->>PlaylistTranscodeJob: return
    else MediaConvert job created
        IMediaConvertService-->>PlaylistTranscodeJob: jobId
        PlaylistTranscodeJob->>PlaylistTranscodeJob: set TranscodeJobId and Status=Processing
        PlaylistTranscodeJob->>IUnitOfWork: Update playlist and SaveChanges
        PlaylistTranscodeJob->>PlaylistTranscodeStatusJob: Schedule PollAsync after 30 seconds
    end
```

---

## 3.10.12 Notes for Implementation Accuracy

1. **No `BrandId` column on `Playlist`**: Brand ownership is always resolved via the `Store` navigation property (`playlist.Store?.BrandId`). All command handlers load `includes: Store` for ownership checks.
2. **Write roles are BM + SM**: Unlike `Track` (BrandManager-only write), Playlist write endpoints are accessible to both `BrandManager` and `StoreManager`.
3. **StoreId resolution on Create**: `StoreManager` auto-gets `StoreId` from `user.StoreId`; `BrandManager` must supply `StoreId` in the request body, which is then validated against the brand boundary.
4. **Track ownership on add**: Tracks added to a playlist are validated to belong to the same brand (`Track.BrandId == brandId`) to prevent cross-brand contamination.
5. **Active streaming guard**: `AddTracksToPlaylist` and `RemoveTrackFromPlaylist` check `PlaylistActiveStreamGuard.ThrowIfStreamingAsync` to prevent modification of a currently-streaming playlist.
6. **Delete business rule**: A playlist cannot be soft-deleted if any `SpaceMusicState` currently references it as `CurrentPlaylistId` (playing/paused).
7. **Background reindex**: Any track list change (add/remove/update) triggers `PlaylistTrackOrderHelper.ReindexOrderInBackground` to normalise `OrderIndex` values in a scoped background task.
8. **Transcode scheduling**: Track additions/removals use a debounced 5-minute transcode (`immediate=false`); `RetranscodePlaylist` forces an immediate job (`immediate=true`).
9. **S3 cleanup on delete**: `DeletePlaylistCommandHandler` enqueues `EnqueueS3FolderCleanup` **only after** successful soft-delete commit to clean up all HLS/transcode outputs.
10. **`SeekOffsetSeconds` computation**: `GetPlaylistByIdQueryHandler` computes cumulative HLS seek offsets post-mapping, preferring `ActualDurationSec` (from MediaConvert) and falling back to metadata `DurationSec`.
11. **`TrackIds` on Update semantics**: `null` = do not modify tracks; `[]` = remove all tracks; `[id1, id2]` = set exact desired track list (diff-based add/remove).

---

## 3.10.13 Data Flow Diagram — Context (Level 0)

> Shows the Playlist Management system boundary. Both `BrandManager` and `StoreManager` have full write access (unlike Track, which is `BrandManager`-only). Transcode scheduling is a key side-effect data flow unique to this module.

**Notation:**

- **Rectangle `[ ]`** — External Entity
- **Rounded rectangle `( )`** — Process / System
- **Cylinder `[( )]`** — Data Store
- **Arrow `-->|label|`** — Named data flow

```mermaid
graph LR
    BM["BrandManager"]
    SM["StoreManager"]
    HF["Hangfire Scheduler"]

    PMS(("Playlist Management System"))

    DB[("D1: PostgreSQL - Playlists and Tracks")]
    S3[("D2: AWS S3 - HLS and Audio Files")]
    MC[("D3: AWS MediaConvert - Transcode Engine")]
    AUDIT[("D4: Audit Log")]

    BM -->|"CRUD and track management requests"| PMS
    SM -->|"CRUD and track management requests"| PMS
    HF -->|"Transcode job execution trigger"| PMS
    PMS -->|"Playlist list and detail response"| BM
    PMS -->|"Playlist list and detail response"| SM
    PMS -->|"Read and write playlist records"| DB
    DB -->|"Playlist and PlaylistTrack entities"| PMS
    PMS -->|"Submit and monitor transcode jobs"| MC
    MC -->|"HLS output URL and job status"| PMS
    PMS -->|"Manage HLS output files"| S3
    PMS -->|"Audit events"| AUDIT
```

---

## 3.10.14 Data Flow Diagram — Level 1

> Decomposes the Playlist Management system into eight core processes. Processes 5–7 (Add Tracks, Remove Track, Retranscode) all interact with the Hangfire job queue for transcode scheduling.

```mermaid
graph TB
    MGR["BrandManager or StoreManager"]
    HF["Hangfire Scheduler"]

    P1("1.0 Query Playlists")
    P2("2.0 Create Playlist")
    P3("3.0 Update Playlist")
    P4("4.0 Delete Playlist")
    P5("5.0 Add Tracks to Playlist")
    P6("6.0 Remove Track from Playlist")
    P7("7.0 Retranscode Playlist")
    P8("8.0 Toggle Status")

    DB[("D1: PostgreSQL - Playlists and Tracks")]
    S3[("D2: AWS S3 - HLS Files")]
    JOB[("D3: Hangfire - Job Queue")]
    AUDIT[("D4: Audit Log")]

    MGR -->|"GET filter or playlistId"| P1
    P1 -->|"Paginated list or detail"| MGR
    P1 -->|"SELECT playlists with track count"| DB
    DB -->|"Playlist rows"| P1

    MGR -->|"POST PlaylistRequest with optional trackIds"| P2
    P2 -->|"Validate store and brand and mood"| DB
    P2 -->|"INSERT Playlist and PlaylistTrack rows"| DB
    P2 -->|"Queue debounced transcode job"| JOB
    P2 -->|"LogCreate"| AUDIT
    P2 -->|"playlistId result"| MGR

    MGR -->|"PUT PlaylistRequest with optional trackIds"| P3
    P3 -->|"SELECT and verify brand ownership"| DB
    DB -->|"Existing playlist entity"| P3
    P3 -->|"Diff and update PlaylistTrack list"| DB
    P3 -->|"Queue debounced transcode on track change"| JOB
    P3 -->|"LogUpdate"| AUDIT
    P3 -->|"Success result"| MGR

    MGR -->|"DELETE playlistId"| P4
    P4 -->|"Check active streaming in SpaceMusicState"| DB
    DB -->|"Streaming guard result"| P4
    P4 -->|"SOFT DELETE playlist"| DB
    P4 -->|"Delete HLS output folder"| S3
    P4 -->|"LogDelete"| AUDIT
    P4 -->|"Success result"| MGR

    MGR -->|"POST add trackIds to playlist"| P5
    P5 -->|"Validate brand ownership and streaming guard"| DB
    P5 -->|"INSERT new PlaylistTrack rows"| DB
    P5 -->|"Queue debounced transcode"| JOB
    P5 -->|"Success result"| MGR

    MGR -->|"DELETE trackId from playlist"| P6
    P6 -->|"Validate streaming guard"| DB
    P6 -->|"DELETE PlaylistTrack row"| DB
    P6 -->|"Queue debounced transcode"| JOB
    P6 -->|"Success result"| MGR

    MGR -->|"POST retranscode playlistId"| P7
    HF -->|"Scheduled job execution"| P7
    P7 -->|"SELECT playlist with store"| DB
    P7 -->|"Queue immediate transcode job"| JOB
    P7 -->|"UPDATE TranscodeStatus and HlsUrl"| DB
    P7 -->|"Store HLS output files"| S3
    P7 -->|"Success result"| MGR

    MGR -->|"PUT toggle playlistId"| P8
    P8 -->|"UPDATE status"| DB
    P8 -->|"LogToggleStatus"| AUDIT
    P8 -->|"Success result"| MGR
```
