# 3.6 Store Management – Software Design

> **Screens:** #13 Store Mgmt List · #14 Create/Edit Store · #15 Store Detail  
> **Roles:** BrandManager (all write ops, own brand) · SystemAdmin (read-only) · StoreManager (read own store)  
> **Endpoints:** `GET /api/stores` · `GET /api/stores/{id}` · `POST /api/stores` · `PUT /api/stores/{id}` · `DELETE /api/stores/{id}` · `PUT /api/stores/{id}/toggle-status`

---

## 3.6.1 Class Diagram – Query Side (Read)

> Nhóm này gồm `GetStoresQueryHandler` và `GetStoreByIdQueryHandler`. Cả hai đều implement `IRequestHandler<TQuery, TResult>` từ MediatR (NuGet), không thể hiện trong diagram.

```mermaid
classDiagram
    class StoresController {
        -IMediator _mediator
        +GetStores(StoreFilter filter) Task~IActionResult~
        +GetStoreById(Guid id) Task~IActionResult~
    }

    class GetStoresQuery {
        +StoreFilter Filter
        +GetActionType() UserActionEnum
    }

    class GetStoreByIdQuery {
        +Guid Id
        +GetActionType() UserActionEnum
    }

    class IStoreRequest {
        <<interface>>
        +GetActionType() UserActionEnum
    }

    class StoreFilter {
        +Guid? BrandId
        +string? City
        +string? District
        +string? StoreManagerName
        +DateTime? CreatedFrom
        +DateTime? CreatedTo
        +int Page
        +int PageSize
        +string? Search
        +string? SortBy
        +bool? IsAscending
        +EntityStatusEnum? Status
    }

    class GetStoresQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetStoresQuery, CancellationToken) Task~PaginationResult~StoreListItem~~
    }

    class GetStoreByIdQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetStoreByIdQuery, CancellationToken) Task~Result~StoreDetailResponse~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
    }

    class StoreListItem {
        +Guid BrandId
        +string Name
        +string? ContactNumber
        +string? Address
        +string? City
        +string? District
        +EntityStatusEnum Status
    }

    class StoreDetailResponse {
        +float? Latitude
        +float? Longitude
        +string? MapUrl
        +string? TimeZone
        +float? AreaSquareMeters
        +int? MaxCapacity
        +string? FirestoreCollectionPath
        +MoodTypeEnum? CurrentMood
        +DateTime? LastMoodUpdateAt
    }

    StoresController --> GetStoresQuery : creates
    StoresController --> GetStoreByIdQuery : creates
    StoresController ..> GetStoresQueryHandler : sends via Mediator
    StoresController ..> GetStoreByIdQueryHandler : sends via Mediator
    GetStoresQuery ..|> IStoreRequest : implements
    GetStoreByIdQuery ..|> IStoreRequest : implements
    GetStoresQuery --> StoreFilter : contains
    GetStoresQueryHandler --> ICurrentUserService : uses
    GetStoresQueryHandler --> IUnitOfWork : uses
    GetStoresQueryHandler --> StoreListItem : returns list
    GetStoreByIdQueryHandler --> ICurrentUserService : uses
    GetStoreByIdQueryHandler --> IUnitOfWork : uses
    GetStoreByIdQueryHandler --> StoreDetailResponse : returns
    StoreDetailResponse --|> StoreListItem : extends
```

---

## 3.6.2 Class Diagram – Command Side (Write)

> Nhóm này gồm `CreateStoreCommandHandler`, `UpdateStoreCommandHandler`, `DeleteStoreCommandHandler`, `ToggleStoreStatusCommandHandler`. Tất cả implement `IRequestHandler<TCommand, Result>` từ MediatR (NuGet), không thể hiện trong diagram.

```mermaid
classDiagram
    class StoresController {
        -IMediator _mediator
        +CreateStore(StoreRequest request) Task~IActionResult~
        +UpdateStore(Guid id, StoreRequest request) Task~IActionResult~
        +DeleteStore(Guid id) Task~IActionResult~
        +ToggleStoreStatus(Guid id) Task~IActionResult~
    }

    class StoreRequest {
        +string? Name
        +string? Address
        +string? City
        +string? District
        +string? ContactNumber
        +float? Latitude
        +float? Longitude
        +string? MapUrl
        +string? TimeZone
        +float? AreaSquareMeters
        +int? MaxCapacity
    }

    class CreateStoreCommand {
        +StoreRequest Request
        +GetActionType() UserActionEnum
    }

    class UpdateStoreCommand {
        +Guid Id
        +StoreRequest Request
        +GetActionType() UserActionEnum
    }

    class DeleteStoreCommand {
        +Guid Id
        +GetActionType() UserActionEnum
    }

    class ToggleStoreStatusCommand {
        +Guid Id
        +GetActionType() UserActionEnum
    }

    class IStoreRequest {
        <<interface>>
        +GetActionType() UserActionEnum
    }

    class CreateStoreCommandValidator {
        #ILocalizationService LocalizationService
        +Validate(CreateStoreCommand) ValidationResult
    }

    class UpdateStoreCommandValidator {
        #ILocalizationService LocalizationService
        +Validate(UpdateStoreCommand) ValidationResult
    }

    class CreateStoreCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(CreateStoreCommand, CancellationToken) Task~Result~
    }

    class UpdateStoreCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -ILogger _logger
        +Handle(UpdateStoreCommand, CancellationToken) Task~Result~
    }

    class DeleteStoreCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(DeleteStoreCommand, CancellationToken) Task~Result~
    }

    class ToggleStoreStatusCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        +Handle(ToggleStoreStatusCommand, CancellationToken) Task~Result~
    }

    class IAuditService {
        <<interface>>
        +LogEntityCreate(string, string, object, bool, Guid?, string, string) void
        +LogEntityUpdate(string, string, object, bool, Guid?, string, string) void
        +LogEntityDelete(string, string, object, bool, Guid?, string, string) void
        +LogEntityToggleStatus(string, string, object, bool, Guid?, string, string) void
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
        +IpAddress string
        +UserAgent string
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
        +SaveChangesAsync(CancellationToken) Task~int~
    }

    StoresController --> CreateStoreCommand : creates
    StoresController --> UpdateStoreCommand : creates
    StoresController --> DeleteStoreCommand : creates
    StoresController --> ToggleStoreStatusCommand : creates
    StoresController ..> CreateStoreCommandHandler : sends via Mediator
    StoresController ..> UpdateStoreCommandHandler : sends via Mediator
    StoresController ..> DeleteStoreCommandHandler : sends via Mediator
    StoresController ..> ToggleStoreStatusCommandHandler : sends via Mediator
    CreateStoreCommand ..|> IStoreRequest : implements
    UpdateStoreCommand ..|> IStoreRequest : implements
    DeleteStoreCommand ..|> IStoreRequest : implements
    ToggleStoreStatusCommand ..|> IStoreRequest : implements
    CreateStoreCommand --> StoreRequest : contains
    UpdateStoreCommand --> StoreRequest : contains
    CreateStoreCommandValidator ..> CreateStoreCommand : validates
    UpdateStoreCommandValidator ..> UpdateStoreCommand : validates
    CreateStoreCommandHandler --> ICurrentUserService : uses
    CreateStoreCommandHandler --> IUnitOfWork : uses
    CreateStoreCommandHandler --> IAuditService : uses
    UpdateStoreCommandHandler --> ICurrentUserService : uses
    UpdateStoreCommandHandler --> IUnitOfWork : uses
    UpdateStoreCommandHandler --> IAuditService : uses
    DeleteStoreCommandHandler --> ICurrentUserService : uses
    DeleteStoreCommandHandler --> IUnitOfWork : uses
    DeleteStoreCommandHandler --> IAuditService : uses
    ToggleStoreStatusCommandHandler --> ICurrentUserService : uses
    ToggleStoreStatusCommandHandler --> IUnitOfWork : uses
    ToggleStoreStatusCommandHandler --> IAuditService : uses
```

---

## 3.6.3 Sequence Diagram – Get Stores List

```mermaid
sequenceDiagram
    actor Client
    participant StoresController
    participant GetStoresQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>StoresController: GET /api/stores?page=1&pageSize=10\n[Authorization: Bearer token]
    StoresController->>GetStoresQueryHandler: Handle(GetStoresQuery)

    GetStoresQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetStoresQueryHandler: (isValid=false)
        GetStoresQueryHandler-->>StoresController: UnauthorizedAccessException
        StoresController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>GetStoresQueryHandler: (isValid=true, userId, roles, user)

    GetStoresQueryHandler->>GetStoresQueryHandler: query.EnsureStoreAccess(user.BrandId, roles)
    alt No permission (StoreManager or invalid role)
        GetStoresQueryHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    alt BrandManager
        GetStoresQueryHandler->>GetStoresQueryHandler: filter.BrandId = user.BrandId (force to own brand)
    end

    GetStoresQueryHandler->>GetStoresQueryHandler: filter.BuildPredicate() + BuildOrderBy()
    GetStoresQueryHandler->>IUnitOfWork: Repository~Store~.GetPagedAsync(page, pageSize, predicate, orderBy)
    IUnitOfWork-->>GetStoresQueryHandler: (stores[], totalCount)

    GetStoresQueryHandler->>GetStoresQueryHandler: Mapper.Map~List~StoreListItem~~(stores)
    GetStoresQueryHandler-->>StoresController: PaginationResult~StoreListItem~
    StoresController-->>Client: 200 OK { items[], page, pageSize, totalCount }
```

---

## 3.6.4 Sequence Diagram – Get Store By ID

> Đáng vẽ riêng vì có 3 role paths khác nhau trong ownership check.

```mermaid
sequenceDiagram
    actor Client
    participant StoresController
    participant GetStoreByIdQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>StoresController: GET /api/stores/{id}\n[Authorization: Bearer token]
    StoresController->>GetStoreByIdQueryHandler: Handle(GetStoreByIdQuery)

    GetStoreByIdQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetStoreByIdQueryHandler: (isValid=false)
        GetStoreByIdQueryHandler-->>StoresController: UnauthorizedAccessException
        StoresController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>GetStoreByIdQueryHandler: (isValid=true, userId, roles, user)

    GetStoreByIdQueryHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == id)
    alt Store not found
        IUnitOfWork-->>GetStoreByIdQueryHandler: null
        GetStoreByIdQueryHandler-->>StoresController: NotFoundException
        StoresController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>GetStoreByIdQueryHandler: Store

    GetStoreByIdQueryHandler->>GetStoreByIdQueryHandler: query.EnsureStoreAccess(user.BrandId, roles)
    alt Role not permitted (read access)
        GetStoreByIdQueryHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    alt BrandManager: store.BrandId != user.BrandId
        GetStoreByIdQueryHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    else StoreManager: store.Id != user.StoreId
        GetStoreByIdQueryHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    GetStoreByIdQueryHandler->>GetStoreByIdQueryHandler: Mapper.Map~StoreDetailResponse~(store)
    GetStoreByIdQueryHandler-->>StoresController: Result.Success(StoreDetailResponse)
    StoresController-->>Client: 200 OK { storeDetail }
```

---

## 3.6.5 Sequence Diagram – Create Store

```mermaid
sequenceDiagram
    actor Client
    participant StoresController
    participant CreateStoreCommandValidator
    participant CreateStoreCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>StoresController: POST /api/stores [application/json]\n[Authorization: Bearer token]

    StoresController->>CreateStoreCommandValidator: Validate(CreateStoreCommand)
    alt Validation failed (missing Name, invalid coordinates, ...)
        CreateStoreCommandValidator-->>StoresController: ValidationException
        StoresController-->>Client: 400 Bad Request
    end
    CreateStoreCommandValidator-->>StoresController: Valid

    StoresController->>CreateStoreCommandHandler: Handle(CreateStoreCommand)

    CreateStoreCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>CreateStoreCommandHandler: (isValid=false)
        CreateStoreCommandHandler-->>StoresController: UnauthorizedAccessException
        StoresController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>CreateStoreCommandHandler: (isValid=true, userId, roles, user)

    CreateStoreCommandHandler->>CreateStoreCommandHandler: command.EnsureStoreAccess(user.BrandId, roles)
    alt Not BrandManager or brand not yet assigned
        CreateStoreCommandHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    alt TimeZone not provided
        CreateStoreCommandHandler->>IUnitOfWork: Repository~Brand~.GetFirstOrDefaultAsync(b.Id == user.BrandId)
        IUnitOfWork-->>CreateStoreCommandHandler: Brand
        CreateStoreCommandHandler->>CreateStoreCommandHandler: Inherit TimeZone from Brand
    else TimeZone provided
        CreateStoreCommandHandler->>IUnitOfWork: Repository~Brand~.AnyAsync(b.Id == user.BrandId)
        alt Brand not found
            IUnitOfWork-->>CreateStoreCommandHandler: false
            CreateStoreCommandHandler-->>StoresController: NotFoundException
            StoresController-->>Client: 404 Not Found
        end
    end

    CreateStoreCommandHandler->>IUnitOfWork: Repository~Store~.FindDuplicateFieldAsync(name, ...)
    alt Duplicate Name within same brand
        IUnitOfWork-->>CreateStoreCommandHandler: conflictField
        CreateStoreCommandHandler-->>StoresController: BusinessRuleViolationException
        StoresController-->>Client: 422 Unprocessable Entity
    end
    IUnitOfWork-->>CreateStoreCommandHandler: null (no duplicate)

    CreateStoreCommandHandler->>CreateStoreCommandHandler: Mapper.Map~Store~(request) + InitializeEntity(userId)
    CreateStoreCommandHandler->>IUnitOfWork: Repository~Store~.AddAsync(store)
    CreateStoreCommandHandler->>IUnitOfWork: SaveChangesAsync()
    CreateStoreCommandHandler->>IAuditService: LogEntityCreate("Store", storeId, details)

    CreateStoreCommandHandler-->>StoresController: Result.Success
    StoresController-->>Client: 200 OK
```

---

## 3.6.6 Sequence Diagram – Update Store

```mermaid
sequenceDiagram
    actor Client
    participant StoresController
    participant UpdateStoreCommandValidator
    participant UpdateStoreCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>StoresController: PUT /api/stores/{id} [application/json]\n[Authorization: Bearer token]

    StoresController->>UpdateStoreCommandValidator: Validate(UpdateStoreCommand)
    alt Validation failed
        UpdateStoreCommandValidator-->>StoresController: ValidationException
        StoresController-->>Client: 400 Bad Request
    end

    StoresController->>UpdateStoreCommandHandler: Handle(UpdateStoreCommand)

    UpdateStoreCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    ICurrentUserService-->>UpdateStoreCommandHandler: (isValid, userId, roles, user)

    UpdateStoreCommandHandler->>UpdateStoreCommandHandler: command.EnsureStoreAccess(user.BrandId, roles)
    alt Not BrandManager
        UpdateStoreCommandHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    UpdateStoreCommandHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == id)
    alt Store not found
        IUnitOfWork-->>UpdateStoreCommandHandler: null
        UpdateStoreCommandHandler-->>StoresController: NotFoundException
        StoresController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>UpdateStoreCommandHandler: Store

    alt store.BrandId != user.BrandId (cross-brand attempt)
        UpdateStoreCommandHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    UpdateStoreCommandHandler->>IUnitOfWork: FindDuplicateFieldAsync(newName?, excludeId)
    alt Duplicate Name within same brand
        IUnitOfWork-->>UpdateStoreCommandHandler: conflictField
        UpdateStoreCommandHandler-->>StoresController: BusinessRuleViolationException
        StoresController-->>Client: 422 Unprocessable Entity
    end

    UpdateStoreCommandHandler->>UpdateStoreCommandHandler: Mapper.Map(request onto store) + UpdateEntity(userId)
    UpdateStoreCommandHandler->>IUnitOfWork: Repository~Store~.Update(store)
    UpdateStoreCommandHandler->>IUnitOfWork: SaveChangesAsync()
    UpdateStoreCommandHandler->>IAuditService: LogEntityUpdate("Store", storeId, details)

    UpdateStoreCommandHandler-->>StoresController: Result.Success
    StoresController-->>Client: 200 OK
```

---

## 3.6.7 Sequence Diagram – Delete Store

```mermaid
sequenceDiagram
    actor Client
    participant StoresController
    participant DeleteStoreCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IAuditService

    Client->>StoresController: DELETE /api/stores/{id}\n[Authorization: Bearer token]
    StoresController->>DeleteStoreCommandHandler: Handle(DeleteStoreCommand)

    DeleteStoreCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    ICurrentUserService-->>DeleteStoreCommandHandler: (isValid, userId, roles, user)

    DeleteStoreCommandHandler->>DeleteStoreCommandHandler: command.EnsureStoreAccess(user.BrandId, roles)
    alt Not BrandManager
        DeleteStoreCommandHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    DeleteStoreCommandHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == id)
    alt Store not found
        IUnitOfWork-->>DeleteStoreCommandHandler: null
        DeleteStoreCommandHandler-->>StoresController: NotFoundException
        StoresController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>DeleteStoreCommandHandler: Store

    alt store.BrandId != user.BrandId
        DeleteStoreCommandHandler-->>StoresController: ForbiddenAccessException
        StoresController-->>Client: 403 Forbidden
    end

    DeleteStoreCommandHandler->>IUnitOfWork: Repository~AppUser~.AnyAsync(u.StoreId == id)
    alt Users still assigned to this store
        IUnitOfWork-->>DeleteStoreCommandHandler: true
        DeleteStoreCommandHandler-->>StoresController: BusinessRuleViolationException
        StoresController-->>Client: 422 Unprocessable Entity
    end

    DeleteStoreCommandHandler->>IUnitOfWork: Repository~Space~.AnyAsync(sp.StoreId == id and Active)
    alt Active Spaces still exist in this store
        IUnitOfWork-->>DeleteStoreCommandHandler: true
        DeleteStoreCommandHandler-->>StoresController: BusinessRuleViolationException
        StoresController-->>Client: 422 Unprocessable Entity
    end

    DeleteStoreCommandHandler->>IUnitOfWork: Repository~Store~.SoftDelete(store) + UpdateEntity(userId)
    DeleteStoreCommandHandler->>IUnitOfWork: SaveChangesAsync()
    DeleteStoreCommandHandler->>IAuditService: LogEntityDelete("Store", storeId, details)

    DeleteStoreCommandHandler-->>StoresController: Result.Success
    StoresController-->>Client: 200 OK
```
