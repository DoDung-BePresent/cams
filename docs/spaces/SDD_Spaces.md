# 3.8 Space Management – Software Design

> **Screens:** #19 Space Mgmt List · #20 Create/Edit Space · #21 Space Detail  
> **Roles:**
>
> - Read (GetSpaces, GetSpaceById): SystemAdmin · BrandManager · StoreManager
> - Write (Create/Update/Delete/Toggle): **BrandManager and StoreManager only — SystemAdmin is explicitly excluded**  
>   **Endpoints:** `GET /api/spaces` · `GET /api/spaces/{id}` · `POST /api/spaces` · `PUT /api/spaces/{id}` · `DELETE /api/spaces/{id}` · `PUT /api/spaces/{id}/toggle-status`

---

## 3.8.1 Class Diagram – Query Side (Read)

> `GetSpacesQueryHandler` and `GetSpaceByIdQueryHandler` both implement `IRequestHandler<TQuery, TResult>` from MediatR (NuGet) — not shown in diagram.  
> `ISpaceRequest` only carries `GetActionType()` — no `GetTargetBrandId/StoreId` (simpler than `IUserRequest`).  
> Access scoping is applied directly in the handler: BrandManager → `filter.BrandId = user.BrandId`; StoreManager → `filter.StoreId = user.StoreId`.

```mermaid
classDiagram
    class SpacesController {
        -IMediator _mediator
        +GetSpaces(SpaceFilter filter) Task~IActionResult~
        +GetSpaceById(Guid id) Task~IActionResult~
    }

    class GetSpacesQuery {
        +SpaceFilter Filter
        +UserActionEnum GetActionType()
    }

    class GetSpaceByIdQuery {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class ISpaceRequest {
        <<interface>>
        +UserActionEnum GetActionType()
    }

    class SpaceFilter {
        +Guid? StoreId
        +Guid? BrandId
        +SpaceTypeEnum? Type
        +DateTime? CreatedFrom
        +DateTime? CreatedTo
        +int Page
        +int PageSize
        +string? SortBy
        +bool? IsAscending
    }

    class GetSpacesQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetSpacesQuery, CancellationToken) Task~PaginationResult~SpaceListItem~~
    }

    class GetSpaceByIdQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetSpaceByIdQuery, CancellationToken) Task~Result~SpaceDetailResponse~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
    }

    class SpaceListItem {
        +Guid StoreId
        +string Name
        +SpaceTypeEnum Type
        +string? Description
    }

    class SpaceDetailResponse {
        +string? CameraId
        +string? RoiCoordinates
        +int? MaxOccupancy
        +int? CriticalQueueThreshold
        +string? WiFiSensorId
        +Guid? CurrentPlaylistId
    }

    SpacesController --> GetSpacesQuery : creates
    SpacesController --> GetSpaceByIdQuery : creates
    SpacesController ..> GetSpacesQueryHandler : sends via Mediator
    SpacesController ..> GetSpaceByIdQueryHandler : sends via Mediator
    GetSpacesQuery ..|> ISpaceRequest : implements
    GetSpaceByIdQuery ..|> ISpaceRequest : implements
    GetSpacesQuery --> SpaceFilter : contains
    GetSpacesQueryHandler --> ICurrentUserService : uses
    GetSpacesQueryHandler --> IUnitOfWork : uses
    GetSpacesQueryHandler --> SpaceListItem : returns list
    GetSpaceByIdQueryHandler --> ICurrentUserService : uses
    GetSpaceByIdQueryHandler --> IUnitOfWork : uses
    GetSpaceByIdQueryHandler --> SpaceDetailResponse : returns
    SpaceDetailResponse --|> SpaceListItem : extends
```

---

## 3.8.2 Class Diagram – Command Side (Write)

> All handlers implement `IRequestHandler<TCommand, Result>` from MediatR (NuGet) — not shown.  
> `SpaceRequest` is a **shared DTO** used for both Create and Update (all fields nullable for partial-update semantics).  
> `DeleteSpaceCommand` and `ToggleSpaceStatusCommand` have no validator — they carry only `Guid Id`.  
> Diagram split into Part A (Commands, DTOs, Validators) and Part B (Handler Dependencies).

### Part A – Commands, DTOs & Validators

```mermaid
classDiagram
    class SpacesController {
        -IMediator _mediator
        +CreateSpace(SpaceRequest request) Task~IActionResult~
        +UpdateSpace(Guid id, SpaceRequest request) Task~IActionResult~
        +DeleteSpace(Guid id) Task~IActionResult~
        +ToggleSpaceStatus(Guid id) Task~IActionResult~
    }

    class ISpaceRequest {
        <<interface>>
        +UserActionEnum GetActionType()
    }

    class CreateSpaceCommand {
        +SpaceRequest Request
        +UserActionEnum GetActionType()
    }

    class UpdateSpaceCommand {
        +Guid Id
        +SpaceRequest Request
        +UserActionEnum GetActionType()
    }

    class DeleteSpaceCommand {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class ToggleSpaceStatusCommand {
        +Guid Id
        +UserActionEnum GetActionType()
    }

    class SpaceRequest {
        +Guid? StoreId
        +string? Name
        +SpaceTypeEnum? Type
        +string? Description
        +string? CameraId
        +string? RoiCoordinates
        +int? MaxOccupancy
        +int? CriticalQueueThreshold
        +string? WiFiSensorId
    }

    class CreateSpaceCommandValidator {
        +Validate(CreateSpaceCommand) ValidationResult
    }

    class UpdateSpaceCommandValidator {
        +Validate(UpdateSpaceCommand) ValidationResult
    }

    SpacesController --> CreateSpaceCommand : creates
    SpacesController --> UpdateSpaceCommand : creates
    SpacesController --> DeleteSpaceCommand : creates
    SpacesController --> ToggleSpaceStatusCommand : creates
    CreateSpaceCommand ..|> ISpaceRequest : implements
    UpdateSpaceCommand ..|> ISpaceRequest : implements
    DeleteSpaceCommand ..|> ISpaceRequest : implements
    ToggleSpaceStatusCommand ..|> ISpaceRequest : implements
    CreateSpaceCommand --> SpaceRequest : contains
    UpdateSpaceCommand --> SpaceRequest : contains
    CreateSpaceCommandValidator ..> CreateSpaceCommand : validates
    UpdateSpaceCommandValidator ..> UpdateSpaceCommand : validates
```

### Part B – Handler Dependencies

```mermaid
classDiagram
    class CreateSpaceCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(CreateSpaceCommand, CancellationToken) Task~Result~
    }

    class UpdateSpaceCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(UpdateSpaceCommand, CancellationToken) Task~Result~
    }

    class DeleteSpaceCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(DeleteSpaceCommand, CancellationToken) Task~Result~
    }

    class ToggleSpaceStatusCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(ToggleSpaceStatusCommand, CancellationToken) Task~Result~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
        +SaveChangesAsync(CancellationToken) Task~int~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
        +IpAddress string
        +UserAgent string
    }

    class IAuditService {
        <<interface>>
        +LogEntityCreate(string, string, object, bool, Guid?, string, string) void
        +LogEntityUpdate(string, string, object, bool, Guid?, string, string) void
        +LogEntityDelete(string, string, object, bool, Guid?, string, string) void
        +LogEntityToggleStatus(string, string, object, bool, Guid?, string, string) void
    }

    CreateSpaceCommandHandler --> IUnitOfWork : uses
    CreateSpaceCommandHandler --> ICurrentUserService : uses
    CreateSpaceCommandHandler --> IAuditService : uses
    UpdateSpaceCommandHandler --> IUnitOfWork : uses
    UpdateSpaceCommandHandler --> ICurrentUserService : uses
    UpdateSpaceCommandHandler --> IAuditService : uses
    DeleteSpaceCommandHandler --> IUnitOfWork : uses
    DeleteSpaceCommandHandler --> ICurrentUserService : uses
    DeleteSpaceCommandHandler --> IAuditService : uses
    ToggleSpaceStatusCommandHandler --> IUnitOfWork : uses
    ToggleSpaceStatusCommandHandler --> ICurrentUserService : uses
    ToggleSpaceStatusCommandHandler --> IAuditService : uses
```

---

## 3.8.3 Sequence Diagram – Get Spaces List

> All 3 roles allowed. Handler forces scope: BrandManager → `filter.BrandId = user.BrandId`; StoreManager → `filter.StoreId = user.StoreId`.  
> Uses standard `Repository<Space>.GetPagedAsync()` with `BuildPredicate()` + `BuildOrderBy()` — no raw SQL.

```mermaid
sequenceDiagram
    actor Client
    participant SpacesController
    participant GetSpacesQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>SpacesController: GET /api/spaces?page=1&pageSize=10\n[Authorization: Bearer token]
    SpacesController->>GetSpacesQueryHandler: Handle(GetSpacesQuery)

    GetSpacesQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetSpacesQueryHandler: (isValid=false)
        GetSpacesQueryHandler-->>SpacesController: UnauthorizedAccessException
        SpacesController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>GetSpacesQueryHandler: (isValid=true, userId, roles, user)

    GetSpacesQueryHandler->>GetSpacesQueryHandler: query.EnsureSpaceAccess(user.BrandId, user.StoreId, roles)
    alt No valid role or missing BrandId/StoreId for role
        GetSpacesQueryHandler-->>SpacesController: ForbiddenAccessException
        SpacesController-->>Client: 403 Forbidden
    end

    alt BrandManager
        GetSpacesQueryHandler->>GetSpacesQueryHandler: filter.BrandId = user.BrandId (force to own brand)
    else StoreManager
        GetSpacesQueryHandler->>GetSpacesQueryHandler: filter.StoreId = user.StoreId (force to own store)
    end

    GetSpacesQueryHandler->>GetSpacesQueryHandler: filter.BuildPredicate() + BuildOrderBy()
    GetSpacesQueryHandler->>IUnitOfWork: Repository~Space~.GetPagedAsync(page, pageSize, predicate, orderBy)
    IUnitOfWork-->>GetSpacesQueryHandler: (spaces[], totalCount)

    GetSpacesQueryHandler->>GetSpacesQueryHandler: Mapper.Map~List~SpaceListItem~~(spaces)
    GetSpacesQueryHandler-->>SpacesController: PaginationResult~SpaceListItem~
    SpacesController-->>Client: 200 OK { items[], page, pageSize, totalCount }
```

---

## 3.8.4 Sequence Diagram – Get Space By ID

> All 3 roles allowed. Space is loaded first, then ownership is verified per-role.  
> SystemAdmin skips ownership check. BrandManager loads the parent store to verify brand. StoreManager checks `space.StoreId` directly.

```mermaid
sequenceDiagram
    actor Client
    participant SpacesController
    participant GetSpaceByIdQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>SpacesController: GET /api/spaces/{id}\n[Authorization: Bearer token]
    SpacesController->>GetSpaceByIdQueryHandler: Handle(GetSpaceByIdQuery)

    GetSpaceByIdQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetSpaceByIdQueryHandler: (isValid=false)
        GetSpaceByIdQueryHandler-->>SpacesController: UnauthorizedAccessException
        SpacesController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>GetSpaceByIdQueryHandler: (isValid=true, userId, roles, user)

    GetSpaceByIdQueryHandler->>IUnitOfWork: Repository~Space~.GetFirstOrDefaultAsync(s.Id == id)
    alt Space not found
        IUnitOfWork-->>GetSpaceByIdQueryHandler: null
        GetSpaceByIdQueryHandler-->>SpacesController: NotFoundException
        SpacesController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>GetSpaceByIdQueryHandler: space

    GetSpaceByIdQueryHandler->>GetSpaceByIdQueryHandler: query.EnsureSpaceAccess(user.BrandId, user.StoreId, roles)
    alt No valid role or missing BrandId/StoreId for role
        GetSpaceByIdQueryHandler-->>SpacesController: ForbiddenAccessException
        SpacesController-->>Client: 403 Forbidden
    end

    alt BrandManager
        GetSpaceByIdQueryHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == space.StoreId)
        alt Store not found
            IUnitOfWork-->>GetSpaceByIdQueryHandler: null
            GetSpaceByIdQueryHandler-->>SpacesController: NotFoundException
            SpacesController-->>Client: 404 Not Found
        end
        IUnitOfWork-->>GetSpaceByIdQueryHandler: store
        alt store.BrandId != user.BrandId
            GetSpaceByIdQueryHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    else StoreManager
        alt space.StoreId != user.StoreId
            GetSpaceByIdQueryHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    end

    GetSpaceByIdQueryHandler->>GetSpaceByIdQueryHandler: Mapper.Map~SpaceDetailResponse~(space)
    GetSpaceByIdQueryHandler-->>SpacesController: Result~SpaceDetailResponse~
    SpacesController-->>Client: 200 OK { space detail }
```

---

## 3.8.5 Sequence Diagram – Create Space

> **SystemAdmin excluded** from write operations.  
> StoreManager: `space.StoreId` is always forced to `user.StoreId` — any client-supplied `StoreId` is ignored.  
> BrandManager: `request.StoreId` is required and must belong to their brand.  
> Uniqueness checked per-store: no two spaces in the same store may share a name.

```mermaid
sequenceDiagram
    actor Client
    participant SpacesController
    participant CreateSpaceCommandValidator
    participant CreateSpaceCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>SpacesController: POST /api/spaces [application/json]\n[Authorization: Bearer token]

    SpacesController->>CreateSpaceCommandValidator: Validate(CreateSpaceCommand)
    alt Validation failed (missing Name or Type)
        CreateSpaceCommandValidator-->>SpacesController: ValidationException
        SpacesController-->>Client: 400 Bad Request
    end
    CreateSpaceCommandValidator-->>SpacesController: Valid

    SpacesController->>CreateSpaceCommandHandler: Handle(CreateSpaceCommand)

    CreateSpaceCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>CreateSpaceCommandHandler: (isValid=false)
        CreateSpaceCommandHandler-->>SpacesController: UnauthorizedAccessException
        SpacesController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>CreateSpaceCommandHandler: (isValid=true, userId, roles, user)

    CreateSpaceCommandHandler->>CreateSpaceCommandHandler: command.EnsureSpaceAccess(user.BrandId, user.StoreId, roles)
    alt SystemAdmin or missing BrandId/StoreId for role
        CreateSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
        SpacesController-->>Client: 403 Forbidden
    end

    alt StoreManager
        CreateSpaceCommandHandler->>CreateSpaceCommandHandler: resolvedStoreId = user.StoreId\n(client StoreId ignored)
    else BrandManager
        alt request.StoreId is null
            CreateSpaceCommandHandler-->>SpacesController: BusinessRuleViolationException
            SpacesController-->>Client: 422 Unprocessable Entity
        end
        CreateSpaceCommandHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == request.StoreId)
        alt Store not found
            IUnitOfWork-->>CreateSpaceCommandHandler: null
            CreateSpaceCommandHandler-->>SpacesController: NotFoundException
            SpacesController-->>Client: 404 Not Found
        end
        IUnitOfWork-->>CreateSpaceCommandHandler: store
        alt store.BrandId != user.BrandId
            CreateSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
        CreateSpaceCommandHandler->>CreateSpaceCommandHandler: resolvedStoreId = request.StoreId
    end

    CreateSpaceCommandHandler->>IUnitOfWork: Repository~Space~.FindDuplicateNameAsync(resolvedStoreId, request.Name)
    alt Name already exists in store
        IUnitOfWork-->>CreateSpaceCommandHandler: conflictField
        CreateSpaceCommandHandler-->>SpacesController: BusinessRuleViolationException
        SpacesController-->>Client: 422 Unprocessable Entity
    end

    CreateSpaceCommandHandler->>CreateSpaceCommandHandler: Mapper.Map~Space~(request)\nspace.StoreId = resolvedStoreId\nspace.InitializeEntity(userId)
    CreateSpaceCommandHandler->>IUnitOfWork: Repository~Space~.AddAsync(space)

    CreateSpaceCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt SaveChangesAsync throws exception (DB error)
        IUnitOfWork-->>CreateSpaceCommandHandler: Exception
        CreateSpaceCommandHandler->>IAuditService: LogEntityCreate(isSuccess=false, name, storeId)
        CreateSpaceCommandHandler-->>SpacesController: Exception rethrown
        SpacesController-->>Client: 500 Internal Server Error
    end

    CreateSpaceCommandHandler->>IAuditService: LogEntityCreate(isSuccess=true, name, storeId, type)
    CreateSpaceCommandHandler-->>SpacesController: Result.Success
    SpacesController-->>Client: 200 OK
```

---

## 3.8.6 Sequence Diagram – Update Space

> **SystemAdmin excluded.**  
> Space is loaded first, then the parent store is loaded to verify ownership.  
> Name uniqueness is checked **only if** the name is provided and actually changed.

```mermaid
sequenceDiagram
    actor Client
    participant SpacesController
    participant UpdateSpaceCommandValidator
    participant UpdateSpaceCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>SpacesController: PUT /api/spaces/{id} [application/json]\n[Authorization: Bearer token]

    SpacesController->>UpdateSpaceCommandValidator: Validate(UpdateSpaceCommand)
    alt Validation failed
        UpdateSpaceCommandValidator-->>SpacesController: ValidationException
        SpacesController-->>Client: 400 Bad Request
    end

    SpacesController->>UpdateSpaceCommandHandler: Handle(UpdateSpaceCommand)

    UpdateSpaceCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>UpdateSpaceCommandHandler: (isValid=false)
        UpdateSpaceCommandHandler-->>SpacesController: UnauthorizedAccessException
        SpacesController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>UpdateSpaceCommandHandler: (isValid=true, userId, roles, user)

    UpdateSpaceCommandHandler->>UpdateSpaceCommandHandler: command.EnsureSpaceAccess(user.BrandId, user.StoreId, roles)
    alt SystemAdmin or missing BrandId/StoreId for role
        UpdateSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
        SpacesController-->>Client: 403 Forbidden
    end

    UpdateSpaceCommandHandler->>IUnitOfWork: Repository~Space~.GetFirstOrDefaultAsync(s.Id == command.Id)
    alt Space not found
        IUnitOfWork-->>UpdateSpaceCommandHandler: null
        UpdateSpaceCommandHandler-->>SpacesController: NotFoundException
        SpacesController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>UpdateSpaceCommandHandler: space

    UpdateSpaceCommandHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == space.StoreId)
    alt Store not found
        IUnitOfWork-->>UpdateSpaceCommandHandler: null
        UpdateSpaceCommandHandler-->>SpacesController: NotFoundException
        SpacesController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>UpdateSpaceCommandHandler: store

    alt BrandManager
        alt store.BrandId != user.BrandId
            UpdateSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    else StoreManager
        alt space.StoreId != user.StoreId
            UpdateSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    end

    alt request.Name provided and different from current name
        UpdateSpaceCommandHandler->>IUnitOfWork: Repository~Space~.FindDuplicateNameAsync(space.StoreId, newName, excludeId=command.Id)
        alt Name conflict found
            IUnitOfWork-->>UpdateSpaceCommandHandler: conflictField
            UpdateSpaceCommandHandler-->>SpacesController: BusinessRuleViolationException
            SpacesController-->>Client: 422 Unprocessable Entity
        end
    end

    UpdateSpaceCommandHandler->>UpdateSpaceCommandHandler: Mapper.Map(command.Request onto space)\nspace.UpdateEntity(userId)
    UpdateSpaceCommandHandler->>IUnitOfWork: Repository~Space~.Update(space)

    UpdateSpaceCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt SaveChangesAsync throws exception (DB error)
        IUnitOfWork-->>UpdateSpaceCommandHandler: Exception
        UpdateSpaceCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=false, name, storeId)
        UpdateSpaceCommandHandler-->>SpacesController: Exception rethrown
        SpacesController-->>Client: 500 Internal Server Error
    end

    UpdateSpaceCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=true, name, storeId, type)
    UpdateSpaceCommandHandler-->>SpacesController: Result.Success
    SpacesController-->>Client: 200 OK
```

---

## 3.8.7 Sequence Diagram – Delete Space

> **SystemAdmin excluded.** Soft-delete only (`SoftDeleteEntity`) — no physical row removal.  
> Same ownership verification pattern as Update (load space → load store → check by role).

```mermaid
sequenceDiagram
    actor Client
    participant SpacesController
    participant DeleteSpaceCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>SpacesController: DELETE /api/spaces/{id}\n[Authorization: Bearer token]
    SpacesController->>DeleteSpaceCommandHandler: Handle(DeleteSpaceCommand)

    DeleteSpaceCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>DeleteSpaceCommandHandler: (isValid=false)
        DeleteSpaceCommandHandler-->>SpacesController: UnauthorizedAccessException
        SpacesController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>DeleteSpaceCommandHandler: (isValid=true, userId, roles, user)

    DeleteSpaceCommandHandler->>DeleteSpaceCommandHandler: command.EnsureSpaceAccess(user.BrandId, user.StoreId, roles)
    alt SystemAdmin or missing BrandId/StoreId for role
        DeleteSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
        SpacesController-->>Client: 403 Forbidden
    end

    DeleteSpaceCommandHandler->>IUnitOfWork: Repository~Space~.GetFirstOrDefaultAsync(s.Id == command.Id)
    alt Space not found
        IUnitOfWork-->>DeleteSpaceCommandHandler: null
        DeleteSpaceCommandHandler-->>SpacesController: NotFoundException
        SpacesController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>DeleteSpaceCommandHandler: space

    DeleteSpaceCommandHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == space.StoreId)
    alt Store not found
        IUnitOfWork-->>DeleteSpaceCommandHandler: null
        DeleteSpaceCommandHandler-->>SpacesController: NotFoundException
        SpacesController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>DeleteSpaceCommandHandler: store

    alt BrandManager
        alt store.BrandId != user.BrandId
            DeleteSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    else StoreManager
        alt space.StoreId != user.StoreId
            DeleteSpaceCommandHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    end

    DeleteSpaceCommandHandler->>DeleteSpaceCommandHandler: space.SoftDeleteEntity(userId)
    DeleteSpaceCommandHandler->>IUnitOfWork: Repository~Space~.Update(space)

    DeleteSpaceCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt SaveChangesAsync throws exception (DB error)
        IUnitOfWork-->>DeleteSpaceCommandHandler: Exception
        DeleteSpaceCommandHandler->>IAuditService: LogEntityDelete(isSuccess=false, name, storeId)
        DeleteSpaceCommandHandler-->>SpacesController: Exception rethrown
        SpacesController-->>Client: 500 Internal Server Error
    end

    DeleteSpaceCommandHandler->>IAuditService: LogEntityDelete(isSuccess=true, name, storeId, deletedAt)
    DeleteSpaceCommandHandler-->>SpacesController: Result.Success
    SpacesController-->>Client: 200 OK
```

---

## 3.8.8 Sequence Diagram – Toggle Space Status

> **SystemAdmin excluded.** Toggles `Status` between `Active` and `Inactive`.  
> `previousStatus` is captured before the toggle for the audit log entry.

```mermaid
sequenceDiagram
    actor Client
    participant SpacesController
    participant ToggleSpaceStatusCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>SpacesController: PUT /api/spaces/{id}/toggle-status\n[Authorization: Bearer token]
    SpacesController->>ToggleSpaceStatusCommandHandler: Handle(ToggleSpaceStatusCommand)

    ToggleSpaceStatusCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>ToggleSpaceStatusCommandHandler: (isValid=false)
        ToggleSpaceStatusCommandHandler-->>SpacesController: UnauthorizedAccessException
        SpacesController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>ToggleSpaceStatusCommandHandler: (isValid=true, userId, roles, user)

    ToggleSpaceStatusCommandHandler->>ToggleSpaceStatusCommandHandler: command.EnsureSpaceAccess(user.BrandId, user.StoreId, roles)
    alt SystemAdmin or missing BrandId/StoreId for role
        ToggleSpaceStatusCommandHandler-->>SpacesController: ForbiddenAccessException
        SpacesController-->>Client: 403 Forbidden
    end

    ToggleSpaceStatusCommandHandler->>IUnitOfWork: Repository~Space~.GetFirstOrDefaultAsync(s.Id == command.Id)
    alt Space not found
        IUnitOfWork-->>ToggleSpaceStatusCommandHandler: null
        ToggleSpaceStatusCommandHandler-->>SpacesController: NotFoundException
        SpacesController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>ToggleSpaceStatusCommandHandler: space

    ToggleSpaceStatusCommandHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == space.StoreId)
    alt Store not found
        IUnitOfWork-->>ToggleSpaceStatusCommandHandler: null
        ToggleSpaceStatusCommandHandler-->>SpacesController: NotFoundException
        SpacesController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>ToggleSpaceStatusCommandHandler: store

    alt BrandManager
        alt store.BrandId != user.BrandId
            ToggleSpaceStatusCommandHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    else StoreManager
        alt space.StoreId != user.StoreId
            ToggleSpaceStatusCommandHandler-->>SpacesController: ForbiddenAccessException
            SpacesController-->>Client: 403 Forbidden
        end
    end

    ToggleSpaceStatusCommandHandler->>ToggleSpaceStatusCommandHandler: previousStatus = space.Status\nspace.Status = Active ↔ Inactive\nspace.UpdateEntity(userId)
    ToggleSpaceStatusCommandHandler->>IUnitOfWork: Repository~Space~.Update(space)

    ToggleSpaceStatusCommandHandler->>IUnitOfWork: SaveChangesAsync()
    alt SaveChangesAsync throws exception (DB error)
        IUnitOfWork-->>ToggleSpaceStatusCommandHandler: Exception
        ToggleSpaceStatusCommandHandler->>IAuditService: LogEntityToggleStatus(isSuccess=false, name, storeId, previousStatus)
        ToggleSpaceStatusCommandHandler-->>SpacesController: Exception rethrown
        SpacesController-->>Client: 500 Internal Server Error
    end

    ToggleSpaceStatusCommandHandler->>IAuditService: LogEntityToggleStatus(isSuccess=true, name, storeId, previousStatus, newStatus)
    ToggleSpaceStatusCommandHandler-->>SpacesController: Result.Success
    SpacesController-->>Client: 200 OK
```
