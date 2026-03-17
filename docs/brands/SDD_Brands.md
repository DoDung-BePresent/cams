# 3.5 Brand Management – Software Design

> **Screens:** #7 Brand Mgmt List · #8 Create/Edit Brand · #9 Brand Detail View  
> **Roles:** SystemAdmin (all operations) · BrandManager (read own brand, update nếu là PrimaryOwner)  
> **Endpoints:** `GET /api/brands` · `GET /api/brands/{id}` · `POST /api/brands` · `PATCH /api/brands/{id}` · `DELETE /api/brands/{id}` · `PUT /api/brands/{id}/toggle-status` · `PUT /api/brands/{id}/transfer-ownership`

---

## 3.5.1 Class Diagram – Query Side (Read)

> Nhóm này gồm `GetBrandsQueryHandler` và `GetBrandByIdQueryHandler`. Cả hai đều implement `IRequestHandler<TQuery, TResult>` từ MediatR (NuGet), không thể hiện trong diagram.

```mermaid
classDiagram
    class BrandsController {
        -IMediator _mediator
        +GetBrands(BrandFilter filter) Task~IActionResult~
        +GetBrandById(Guid id) Task~IActionResult~
    }

    class GetBrandsQuery {
        +BrandFilter? Filter
    }

    class GetBrandByIdQuery {
        +Guid Id
    }

    class BrandFilter {
        +string? Name
        +EntityStatusEnum? Status
        +int Page
        +int PageSize
        +string? SortBy
        +bool? IsAscending
    }

    class GetBrandsQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -ILogger _logger
        +Handle(GetBrandsQuery, CancellationToken) Task~PaginationResult~BrandListItem~~
    }

    class GetBrandByIdQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -ILogger _logger
        +Handle(GetBrandByIdQuery, CancellationToken) Task~Result~BrandDetailResponse~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
    }

    class BrandListItem {
        +Guid Id
        +string Name
        +string? LogoUrl
        +string? Industry
        +string? PrimaryContactName
        +string? ContactEmail
        +Guid? PrimaryOwnerId
        +EntityStatusEnum Status
    }

    class BrandDetailResponse {
        +string Name
        +string? LogoUrl
        +string? Industry
        +string? Description
        +string? Website
        +string? LegalName
        +string? TaxCode
        +string? BillingAddress
        +string? ContactEmail
        +string? TechnicalContactEmail
        +string? DefaultTimeZone
        +Guid? PrimaryOwnerId
        +Guid? CurrentSubscriptionId
        +EntityStatusEnum Status
    }

    BrandsController --> GetBrandsQuery : creates
    BrandsController --> GetBrandByIdQuery : creates
    BrandsController ..> GetBrandsQueryHandler : sends via Mediator
    BrandsController ..> GetBrandByIdQueryHandler : sends via Mediator
    GetBrandsQuery --> BrandFilter : contains
    GetBrandsQueryHandler --> ICurrentUserService : uses
    GetBrandsQueryHandler --> IUnitOfWork : uses
    GetBrandsQueryHandler --> BrandListItem : returns list
    GetBrandByIdQueryHandler --> ICurrentUserService : uses
    GetBrandByIdQueryHandler --> IUnitOfWork : uses
    GetBrandByIdQueryHandler --> BrandDetailResponse : returns
```

---

## 3.5.2 Class Diagram – Command Side (Write)

> Nhóm này gồm `CreateBrandCommandHandler`, `UpdateBrandCommandHandler`, `DeleteBrandCommandHandler`, `ToggleBrandStatusCommandHandler`. Tất cả implement `IRequestHandler<TCommand, Result>` từ MediatR (NuGet), không thể hiện trong diagram.

```mermaid
classDiagram
    class BrandsController {
        -IMediator _mediator
        +CreateBrand(BrandRequest request) Task~IActionResult~
        +UpdateBrand(Guid id, BrandRequest request) Task~IActionResult~
        +DeleteBrand(Guid id) Task~IActionResult~
        +ToggleBrandStatus(Guid id) Task~IActionResult~
    }

    class BrandRequest {
        +string? Name
        +IFormFile? Logo
        +string? Description
        +string? Website
        +string? Industry
        +string? LegalName
        +string? TaxCode
        +string? BillingAddress
        +string? ContactEmail
        +string? ContactPhone
        +string? PrimaryContactName
        +string? TechnicalContactEmail
        +string? DefaultTimeZone
    }

    class CreateBrandCommand {
        +BrandRequest Request
    }

    class UpdateBrandCommand {
        +Guid Id
        +BrandRequest Request
    }

    class DeleteBrandCommand {
        +Guid Id
    }

    class ToggleBrandStatusCommand {
        +Guid Id
    }

    class CreateBrandCommandValidator {
        #ILocalizationService LocalizationService
        +Validate(CreateBrandCommand) ValidationResult
    }

    class UpdateBrandCommandValidator {
        #ILocalizationService LocalizationService
        +Validate(UpdateBrandCommand) ValidationResult
    }

    class CreateBrandCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        -ILogger _logger
        +Handle(CreateBrandCommand, CancellationToken) Task~Result~
    }

    class UpdateBrandCommandHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        -ILogger _logger
        +Handle(UpdateBrandCommand, CancellationToken) Task~Result~
    }

    class DeleteBrandCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        -ILogger _logger
        +Handle(DeleteBrandCommand, CancellationToken) Task~Result~
    }

    class ToggleBrandStatusCommandHandler {
        -IUnitOfWork _unitOfWork
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -ILogger _logger
        +Handle(ToggleBrandStatusCommand, CancellationToken) Task~Result~
    }

    class IBackgroundFileOperationService {
        <<interface>>
        +UploadFileAsync(IFormFile, string, CancellationToken) Task~string~
        +QueueDeleteFileAsync(string) void
    }

    class IAuditService {
        <<interface>>
        +LogEntityCreated(string, string, object, bool) void
        +LogEntityUpdated(string, string, object, bool) void
        +LogEntityDeleted(string, string, object, bool) void
        +LogEntityToggleStatus(string, string, object, bool) void
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
        +SaveChangesAsync(CancellationToken) Task~int~
    }

    BrandsController --> CreateBrandCommand : creates
    BrandsController --> UpdateBrandCommand : creates
    BrandsController --> DeleteBrandCommand : creates
    BrandsController --> ToggleBrandStatusCommand : creates
    BrandsController ..> CreateBrandCommandHandler : sends via Mediator
    BrandsController ..> UpdateBrandCommandHandler : sends via Mediator
    BrandsController ..> DeleteBrandCommandHandler : sends via Mediator
    BrandsController ..> ToggleBrandStatusCommandHandler : sends via Mediator
    CreateBrandCommand --> BrandRequest : contains
    UpdateBrandCommand --> BrandRequest : contains
    CreateBrandCommandValidator ..> CreateBrandCommand : validates
    UpdateBrandCommandValidator ..> UpdateBrandCommand : validates
    CreateBrandCommandHandler --> ICurrentUserService : uses
    CreateBrandCommandHandler --> IUnitOfWork : uses
    CreateBrandCommandHandler --> IBackgroundFileOperationService : uses
    CreateBrandCommandHandler --> IAuditService : uses
    UpdateBrandCommandHandler --> ICurrentUserService : uses
    UpdateBrandCommandHandler --> IUnitOfWork : uses
    UpdateBrandCommandHandler --> IBackgroundFileOperationService : uses
    UpdateBrandCommandHandler --> IAuditService : uses
    DeleteBrandCommandHandler --> ICurrentUserService : uses
    DeleteBrandCommandHandler --> IUnitOfWork : uses
    DeleteBrandCommandHandler --> IBackgroundFileOperationService : uses
    DeleteBrandCommandHandler --> IAuditService : uses
    ToggleBrandStatusCommandHandler --> ICurrentUserService : uses
    ToggleBrandStatusCommandHandler --> IUnitOfWork : uses
    ToggleBrandStatusCommandHandler --> IAuditService : uses
```

---

## 3.5.3 Class Diagram – Special Operations

> `TransferOwnershipCommandHandler` implement `IRequestHandler<TransferOwnershipCommand, Result>` từ MediatR (NuGet), không thể hiện trong diagram.

```mermaid
classDiagram
    class BrandsController {
        -IMediator _mediator
        +TransferOwnership(Guid id, TransferOwnershipRequest request) Task~IActionResult~
    }

    class TransferOwnershipCommand {
        +Guid BrandId
        +Guid NewOwnerId
    }

    class TransferOwnershipRequest {
        +Guid NewOwnerId
    }

    class TransferOwnershipCommandHandler {
        -IUnitOfWork _unitOfWork
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -ILogger _logger
        +Handle(TransferOwnershipCommand, CancellationToken) Task~Result~
    }

    class IIdentityService {
        <<interface>>
        +GetUserByFirstOrDefaultAsync(Expression) Task~AppUser~
        +GetUserRolesAsync(AppUser) Task~IList~string~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
        +SaveChangesAsync(CancellationToken) Task~int~
    }

    BrandsController --> TransferOwnershipCommand : creates
    BrandsController ..> TransferOwnershipCommandHandler : sends via Mediator
    TransferOwnershipCommand --> TransferOwnershipRequest : contains
    TransferOwnershipCommandHandler --> ICurrentUserService : uses
    TransferOwnershipCommandHandler --> IUnitOfWork : uses
    TransferOwnershipCommandHandler --> IIdentityService : uses
```

---

## 3.5.4 Sequence Diagram – Get Brands List

```mermaid
sequenceDiagram
    actor Client
    participant BrandsController
    participant GetBrandsQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>BrandsController: GET /api/brands?page=1&pageSize=10\n[Authorization: Bearer token]
    BrandsController->>GetBrandsQueryHandler: Handle(GetBrandsQuery)

    GetBrandsQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetBrandsQueryHandler: (isValid=false)
        GetBrandsQueryHandler-->>BrandsController: UnauthorizedAccessException
        BrandsController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>GetBrandsQueryHandler: (isValid=true, userId, roles, user)

    GetBrandsQueryHandler->>GetBrandsQueryHandler: EnsureBrandAccess(user.BrandId, roles)
    alt Not SystemAdmin
        GetBrandsQueryHandler-->>BrandsController: ForbiddenAccessException
        BrandsController-->>Client: 403 Forbidden
    end

    GetBrandsQueryHandler->>GetBrandsQueryHandler: filter.BuildPredicate() + BuildOrderBy()
    GetBrandsQueryHandler->>IUnitOfWork: Repository~Brand~.GetPagedAsync(page, pageSize, predicate, orderBy)
    IUnitOfWork-->>GetBrandsQueryHandler: (brands[], totalCount)

    GetBrandsQueryHandler->>GetBrandsQueryHandler: Mapper.Map~List~BrandListItem~~(brands)
    GetBrandsQueryHandler-->>BrandsController: PaginationResult~BrandListItem~
    BrandsController-->>Client: 200 OK { items[], page, pageSize, totalCount }
```

---

## 3.5.5 Sequence Diagram – Create Brand

```mermaid
sequenceDiagram
    actor Client
    participant BrandsController
    participant CreateBrandCommandValidator
    participant CreateBrandCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IBackgroundFileOperationService
    participant IAuditService

    Client->>BrandsController: POST /api/brands [multipart/form-data]\n[Authorization: Bearer token]

    BrandsController->>CreateBrandCommandValidator: Validate(CreateBrandCommand)
    alt Validation failed (thieu Name, email sai dinh dang, ...)
        CreateBrandCommandValidator-->>BrandsController: ValidationException
        BrandsController-->>Client: 400 Bad Request
    end
    CreateBrandCommandValidator-->>BrandsController: Valid

    BrandsController->>CreateBrandCommandHandler: Handle(CreateBrandCommand)

    CreateBrandCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>CreateBrandCommandHandler: (isValid=false)
        CreateBrandCommandHandler-->>BrandsController: UnauthorizedAccessException
        BrandsController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>CreateBrandCommandHandler: (isValid=true, userId, roles, user)

    CreateBrandCommandHandler->>CreateBrandCommandHandler: EnsureBrandAccess(user.BrandId, roles)
    alt Not SystemAdmin
        CreateBrandCommandHandler-->>BrandsController: ForbiddenAccessException
        BrandsController-->>Client: 403 Forbidden
    end

    CreateBrandCommandHandler->>IUnitOfWork: Repository~Brand~.FindDuplicateFieldAsync(name, taxCode, contactEmail)
    alt Trung Name / TaxCode / ContactEmail
        IUnitOfWork-->>CreateBrandCommandHandler: conflictField
        CreateBrandCommandHandler-->>BrandsController: BusinessRuleViolationException
        BrandsController-->>Client: 422 Unprocessable Entity
    end
    IUnitOfWork-->>CreateBrandCommandHandler: null (khong trung)

    opt Logo file duoc cung cap
        CreateBrandCommandHandler->>IBackgroundFileOperationService: UploadFileAsync(logo, "brands")
        IBackgroundFileOperationService-->>CreateBrandCommandHandler: logoUrl
    end

    CreateBrandCommandHandler->>CreateBrandCommandHandler: Mapper.Map~Brand~(request) + InitializeEntity(userId)
    CreateBrandCommandHandler->>IUnitOfWork: Repository~Brand~.AddAsync(brand)
    CreateBrandCommandHandler->>IUnitOfWork: SaveChangesAsync()
    CreateBrandCommandHandler->>IAuditService: LogEntityCreated("Brand", brandId, details)

    CreateBrandCommandHandler-->>BrandsController: Result.Success
    BrandsController-->>Client: 200 OK
```

---

## 3.5.6 Sequence Diagram – Update Brand

```mermaid
sequenceDiagram
    actor Client
    participant BrandsController
    participant UpdateBrandCommandValidator
    participant UpdateBrandCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IBackgroundFileOperationService
    participant IAuditService

    Client->>BrandsController: PATCH /api/brands/{id} [multipart/form-data]\n[Authorization: Bearer token]

    BrandsController->>UpdateBrandCommandValidator: Validate(UpdateBrandCommand)
    alt Validation failed
        UpdateBrandCommandValidator-->>BrandsController: ValidationException
        BrandsController-->>Client: 400 Bad Request
    end

    BrandsController->>UpdateBrandCommandHandler: Handle(UpdateBrandCommand)

    UpdateBrandCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    ICurrentUserService-->>UpdateBrandCommandHandler: (isValid, userId, roles, user)

    UpdateBrandCommandHandler->>IUnitOfWork: Repository~Brand~.GetFirstOrDefaultAsync(id)
    alt Brand not found
        IUnitOfWork-->>UpdateBrandCommandHandler: null
        UpdateBrandCommandHandler-->>BrandsController: NotFoundException
        BrandsController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>UpdateBrandCommandHandler: Brand

    UpdateBrandCommandHandler->>UpdateBrandCommandHandler: EnsureBrandAccess(user.BrandId, roles)
    alt BrandManager nhung khong phai PrimaryOwner
        UpdateBrandCommandHandler-->>BrandsController: ForbiddenAccessException
        BrandsController-->>Client: 403 Forbidden
    end

    UpdateBrandCommandHandler->>IUnitOfWork: FindDuplicateFieldAsync(newName?, newTaxCode?, newContactEmail?, excludeId)
    alt Trung field
        IUnitOfWork-->>UpdateBrandCommandHandler: conflictField
        UpdateBrandCommandHandler-->>BrandsController: BusinessRuleViolationException
        BrandsController-->>Client: 422 Unprocessable Entity
    end

    opt Logo moi duoc cung cap
        UpdateBrandCommandHandler->>IBackgroundFileOperationService: UploadFileAsync(newLogo, "brands")
        IBackgroundFileOperationService-->>UpdateBrandCommandHandler: newLogoUrl
        opt Logo cu ton tai
            UpdateBrandCommandHandler->>IBackgroundFileOperationService: QueueDeleteFileAsync(oldLogoUrl)
        end
    end

    UpdateBrandCommandHandler->>UpdateBrandCommandHandler: Mapper.Map(request onto brand) + UpdateEntity(userId)
    UpdateBrandCommandHandler->>IUnitOfWork: Repository~Brand~.Update(brand)
    UpdateBrandCommandHandler->>IUnitOfWork: SaveChangesAsync()
    UpdateBrandCommandHandler->>IAuditService: LogEntityUpdated("Brand", brandId, details)

    UpdateBrandCommandHandler-->>BrandsController: Result.Success
    BrandsController-->>Client: 200 OK
```

---

## 3.5.7 Sequence Diagram – Delete Brand

```mermaid
sequenceDiagram
    actor Client
    participant BrandsController
    participant DeleteBrandCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IBackgroundFileOperationService
    participant IAuditService

    Client->>BrandsController: DELETE /api/brands/{id}\n[Authorization: Bearer token]
    BrandsController->>DeleteBrandCommandHandler: Handle(DeleteBrandCommand)

    DeleteBrandCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    ICurrentUserService-->>DeleteBrandCommandHandler: (isValid, userId, roles, user)

    DeleteBrandCommandHandler->>IUnitOfWork: Repository~Brand~.GetByIdAsync(id)
    alt Brand not found
        IUnitOfWork-->>DeleteBrandCommandHandler: null
        DeleteBrandCommandHandler-->>BrandsController: NotFoundException
        BrandsController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>DeleteBrandCommandHandler: Brand

    DeleteBrandCommandHandler->>DeleteBrandCommandHandler: EnsureBrandAccess(user.BrandId, roles)
    alt Not SystemAdmin
        DeleteBrandCommandHandler-->>BrandsController: ForbiddenAccessException
        BrandsController-->>Client: 403 Forbidden
    end

    DeleteBrandCommandHandler->>IUnitOfWork: Repository~Store~.AnyAsync(s.BrandId == id)
    alt Con Store lien ket
        IUnitOfWork-->>DeleteBrandCommandHandler: true
        DeleteBrandCommandHandler-->>BrandsController: BusinessRuleViolationException
        BrandsController-->>Client: 422 Unprocessable Entity
    end

    DeleteBrandCommandHandler->>IUnitOfWork: Repository~BrandSubscription~.AnyAsync(s.BrandId == id)
    alt Con BrandSubscription lien ket
        IUnitOfWork-->>DeleteBrandCommandHandler: true
        DeleteBrandCommandHandler-->>BrandsController: BusinessRuleViolationException
        BrandsController-->>Client: 422 Unprocessable Entity
    end

    DeleteBrandCommandHandler->>IUnitOfWork: Repository~Brand~.SoftDelete(brand) + UpdateEntity(userId)
    DeleteBrandCommandHandler->>IUnitOfWork: SaveChangesAsync()

    opt Logo file ton tai
        DeleteBrandCommandHandler->>IBackgroundFileOperationService: QueueDeleteFileAsync(brand.LogoUrl)
    end

    DeleteBrandCommandHandler->>IAuditService: LogEntityDeleted("Brand", brandId, details)
    DeleteBrandCommandHandler-->>BrandsController: Result.Success
    BrandsController-->>Client: 200 OK
```

---

## 3.5.8 Sequence Diagram – Transfer Ownership

```mermaid
sequenceDiagram
    actor Client
    participant BrandsController
    participant TransferOwnershipCommandHandler
    participant ICurrentUserService
    participant IUnitOfWork
    participant IIdentityService
    participant IAuditService

    Client->>BrandsController: PUT /api/brands/{id}/transfer-ownership\n{ newOwnerId }\n[Authorization: Bearer token]
    BrandsController->>TransferOwnershipCommandHandler: Handle(TransferOwnershipCommand)

    TransferOwnershipCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>TransferOwnershipCommandHandler: (isValid=false)
        TransferOwnershipCommandHandler-->>BrandsController: UnauthorizedAccessException
        BrandsController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>TransferOwnershipCommandHandler: (isValid=true, currentUserId, roles, currentUser)

    TransferOwnershipCommandHandler->>IUnitOfWork: Repository~Brand~.GetFirstOrDefaultAsync(brandId)
    alt Brand not found
        IUnitOfWork-->>TransferOwnershipCommandHandler: null
        TransferOwnershipCommandHandler-->>BrandsController: NotFoundException
        BrandsController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>TransferOwnershipCommandHandler: Brand

    alt Not SystemAdmin
        TransferOwnershipCommandHandler-->>BrandsController: ForbiddenAccessException
        BrandsController-->>Client: 403 Forbidden
    end

    TransferOwnershipCommandHandler->>IIdentityService: GetUserByFirstOrDefaultAsync(u.Id == newOwnerId)
    alt New owner khong ton tai hoac khong thuoc brand nay
        IIdentityService-->>TransferOwnershipCommandHandler: null / BrandId mismatch
        TransferOwnershipCommandHandler-->>BrandsController: BusinessRuleViolationException
        BrandsController-->>Client: 422 Unprocessable Entity
    end
    IIdentityService-->>TransferOwnershipCommandHandler: AppUser (newOwner)

    TransferOwnershipCommandHandler->>IIdentityService: GetUserRolesAsync(newOwner)
    alt New owner khong co role BrandManager
        IIdentityService-->>TransferOwnershipCommandHandler: roles thieu BrandManager
        TransferOwnershipCommandHandler-->>BrandsController: BusinessRuleViolationException
        BrandsController-->>Client: 422 Unprocessable Entity
    end
    IIdentityService-->>TransferOwnershipCommandHandler: roles (co BrandManager)

    TransferOwnershipCommandHandler->>TransferOwnershipCommandHandler: brand.PrimaryOwnerId = newOwnerId + UpdateEntity(currentUserId)
    TransferOwnershipCommandHandler->>IUnitOfWork: Repository~Brand~.Update(brand)
    TransferOwnershipCommandHandler->>IUnitOfWork: SaveChangesAsync()
    TransferOwnershipCommandHandler->>IAuditService: LogEntityUpdated("Brand", brandId, {previousOwnerId, newOwnerId})

    TransferOwnershipCommandHandler-->>BrandsController: Result.Success
    BrandsController-->>Client: 200 OK
```
