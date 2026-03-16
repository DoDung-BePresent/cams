# 3.7 User Management – Software Design

> **Screens:** #16 User Mgmt List · #17 Create/Edit User · #18 User Detail  
> **Roles:** SystemAdmin (full access) · BrandManager (scoped to own brand, limited write) · StoreManager (no access — use `/api/auth/profile`)  
> **Endpoints:** `GET /api/users` · `GET /api/users/{id}` · `POST /api/users` · `PATCH /api/users/{id}` · `PUT /api/users/{id}/status` · `PUT /api/users/{id}/reset-password` · `PUT /api/users/{id}/brand` · `PUT /api/users/{id}/store`

---

## 3.7.1 Class Diagram – Query Side (Read)

> `GetUsersQueryHandler` and `GetUserByIdQueryHandler` both implement `IRequestHandler<TQuery, TResult>` from MediatR (NuGet) — not shown in diagram.

```mermaid
classDiagram
    class UsersController {
        -IMediator _mediator
        +GetUsers(UserFilter filter) Task~IActionResult~
        +GetUserById(Guid id) Task~IActionResult~
    }

    class GetUsersQuery {
        +UserFilter Filter
        +Guid? GetTargetBrandId()
        +Guid? GetTargetStoreId()
        +UserActionEnum GetActionType()
    }

    class GetUserByIdQuery {
        +Guid Id
        +Guid? GetTargetBrandId()
        +Guid? GetTargetStoreId()
        +UserActionEnum GetActionType()
    }

    class IUserRequest {
        <<interface>>
        +Guid? GetTargetBrandId()
        +Guid? GetTargetStoreId()
        +UserActionEnum GetActionType()
    }

    class UserFilter {
        +RoleEnum? Role
        +Guid? BrandId
        +Guid? StoreId
        +DateTime? JoiningFrom
        +DateTime? JoiningTo
        +bool? IsPrimaryOwner
        +int Page
        +int PageSize
        +string? Search
        +string? SortBy
        +bool? IsAscending
        +EntityStatusEnum? Status
    }

    class GetUsersQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetUsersQuery, CancellationToken) Task~PaginationResult~UserListItem~~
    }

    class GetUserByIdQueryHandler {
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        +Handle(GetUserByIdQuery, CancellationToken) Task~Result~UserResponse~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
    }

    class IUnitOfWork {
        <<interface>>
        +Repository~T~() IGenericRepository~T~
    }

    class UserListItem {
        +string FirstName
        +string LastName
        +string FullName
        +string Email
        +string? PhoneNumber
        +string? AvatarUrl
        +DateTime? LastLoginAt
        +List~RoleEnum~ Roles
        +Guid? BrandId
        +string? BrandName
        +Guid? StoreId
        +string? StoreName
        +bool IsPrimaryOwner
        +EntityStatusEnum Status
    }

    class UserResponse {
        +bool EmailConfirmed
        +bool PhoneNumberConfirmed
        +bool TwoFactorEnabled
    }

    UsersController --> GetUsersQuery : creates
    UsersController --> GetUserByIdQuery : creates
    UsersController ..> GetUsersQueryHandler : sends via Mediator
    UsersController ..> GetUserByIdQueryHandler : sends via Mediator
    GetUsersQuery ..|> IUserRequest : implements
    GetUserByIdQuery ..|> IUserRequest : implements
    GetUsersQuery --> UserFilter : contains
    GetUsersQueryHandler --> ICurrentUserService : uses
    GetUsersQueryHandler --> IUnitOfWork : uses
    GetUsersQueryHandler --> UserListItem : returns list
    GetUserByIdQueryHandler --> ICurrentUserService : uses
    GetUserByIdQueryHandler --> IUnitOfWork : uses
    GetUserByIdQueryHandler --> UserResponse : returns
    UserResponse --|> UserListItem : extends
```

---

## 3.7.2 Class Diagram – Command Side (Write)

> All handlers implement `IRequestHandler<TCommand, Result>` from MediatR (NuGet) — not shown.  
> **`WithTargetBrandId()` pattern:** Update/Toggle/ResetPassword handlers first load the target user from DB, enrich the command with the target's `BrandId`, then call `EnsureUserAccess()` — so authorization is always evaluated against the target user's actual brand.  
> Diagram is split into two parts for readability: **Part A** covers commands, DTOs and validators; **Part B** covers handler dependencies.

### Part A – Commands, DTOs & Validators

```mermaid
classDiagram
    class UsersController {
        -IMediator _mediator
        +CreateUser(CreateUserRequest) Task~IActionResult~
        +UpdateUser(Guid id, UpdateUserRequest) Task~IActionResult~
        +ToggleUserStatus(Guid id) Task~IActionResult~
        +ResetUserPassword(Guid id, ResetUserPasswordRequest) Task~IActionResult~
    }

    class IUserRequest {
        <<interface>>
        +Guid? GetTargetBrandId()
        +Guid? GetTargetStoreId()
        +UserActionEnum GetActionType()
    }

    class CreateUserCommand {
        +CreateUserRequest Request
        +Guid? GetTargetBrandId()
        +Guid? GetTargetStoreId()
        +UserActionEnum GetActionType()
    }

    class UpdateUserCommand {
        +Guid Id
        +UpdateUserRequest Request
        +Guid? TargetBrandId
        +UserActionEnum GetActionType()
        +WithTargetBrandId(Guid?) UpdateUserCommand
    }

    class ToggleUserStatusCommand {
        +Guid Id
        +Guid? TargetBrandId
        +UserActionEnum GetActionType()
        +WithTargetBrandId(Guid?) ToggleUserStatusCommand
    }

    class ResetUserPasswordCommand {
        +Guid UserId
        +ResetUserPasswordRequest Request
        +Guid? TargetBrandId
        +UserActionEnum GetActionType()
        +WithTargetBrandId(Guid?) ResetUserPasswordCommand
    }

    class CreateUserRequest {
        +string FirstName
        +string LastName
        +string Email
        +string? PhoneNumber
        +string Password
        +RoleEnum Role
        +Guid? BrandId
        +Guid? StoreId
        +IFormFile? Avatar
    }

    class UpdateUserRequest {
        +string? FirstName
        +string? LastName
        +string? Email
        +string? PhoneNumber
        +IFormFile? Avatar
    }

    class ResetUserPasswordRequest {
        +string NewPassword
    }

    class CreateUserCommandValidator {
        +Validate(CreateUserCommand) ValidationResult
    }

    class UpdateUserCommandValidator {
        +Validate(UpdateUserCommand) ValidationResult
    }

    class ResetUserPasswordCommandValidator {
        +Validate(ResetUserPasswordCommand) ValidationResult
    }

    UsersController --> CreateUserCommand : creates
    UsersController --> UpdateUserCommand : creates
    UsersController --> ToggleUserStatusCommand : creates
    UsersController --> ResetUserPasswordCommand : creates
    CreateUserCommand ..|> IUserRequest : implements
    UpdateUserCommand ..|> IUserRequest : implements
    ToggleUserStatusCommand ..|> IUserRequest : implements
    ResetUserPasswordCommand ..|> IUserRequest : implements
    CreateUserCommand --> CreateUserRequest : contains
    UpdateUserCommand --> UpdateUserRequest : contains
    ResetUserPasswordCommand --> ResetUserPasswordRequest : contains
    CreateUserCommandValidator ..> CreateUserCommand : validates
    UpdateUserCommandValidator ..> UpdateUserCommand : validates
    ResetUserPasswordCommandValidator ..> ResetUserPasswordCommand : validates
```

### Part B – Handler Dependencies

```mermaid
classDiagram
    class CreateUserCommandHandler {
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        +Handle(CreateUserCommand, CancellationToken) Task~Result~
    }

    class UpdateUserCommandHandler {
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -IUnitOfWork _unitOfWork
        -IMapper _mapper
        -IAuditService _auditService
        -IBackgroundFileOperationService _fileOperationService
        +Handle(UpdateUserCommand, CancellationToken) Task~Result~
    }

    class ToggleUserStatusCommandHandler {
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -IUnitOfWork _unitOfWork
        -IAuditService _auditService
        +Handle(ToggleUserStatusCommand, CancellationToken) Task~Result~
    }

    class ResetUserPasswordCommandHandler {
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -IUnitOfWork _unitOfWork
        -IAuditService _auditService
        +Handle(ResetUserPasswordCommand, CancellationToken) Task~Result~
    }

    class IIdentityService {
        <<interface>>
        +CreateUserAsync(AppUser, string) Task~IdentityResult~
        +AddToRoleAsync(AppUser, string) Task~IdentityResult~
        +UpdateUserAsync(AppUser) Task~IdentityResult~
        +ResetPasswordAsync(AppUser, string, string) Task~IdentityResult~
        +GeneratePasswordResetTokenAsync(AppUser) Task~string~
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

    class IBackgroundFileOperationService {
        <<interface>>
        +QueueAvatarUpload(Guid, IFormFile) void
        +QueueOldAvatarDelete(string) void
    }

    class IAuditService {
        <<interface>>
        +LogEntityCreate(string, string, object, bool, Guid?, string, string) void
        +LogEntityUpdate(string, string, object, bool, Guid?, string, string) void
        +LogEntityToggleStatus(string, string, object, bool, Guid?, string, string) void
    }

    CreateUserCommandHandler --> IIdentityService : uses
    CreateUserCommandHandler --> ICurrentUserService : uses
    CreateUserCommandHandler --> IUnitOfWork : uses
    CreateUserCommandHandler --> IBackgroundFileOperationService : uses
    CreateUserCommandHandler --> IAuditService : uses
    UpdateUserCommandHandler --> IIdentityService : uses
    UpdateUserCommandHandler --> ICurrentUserService : uses
    UpdateUserCommandHandler --> IUnitOfWork : uses
    UpdateUserCommandHandler --> IBackgroundFileOperationService : uses
    UpdateUserCommandHandler --> IAuditService : uses
    ToggleUserStatusCommandHandler --> IIdentityService : uses
    ToggleUserStatusCommandHandler --> ICurrentUserService : uses
    ToggleUserStatusCommandHandler --> IUnitOfWork : uses
    ToggleUserStatusCommandHandler --> IAuditService : uses
    ResetUserPasswordCommandHandler --> IIdentityService : uses
    ResetUserPasswordCommandHandler --> ICurrentUserService : uses
    ResetUserPasswordCommandHandler --> IUnitOfWork : uses
    ResetUserPasswordCommandHandler --> IAuditService : uses
```

---

## 3.7.3 Class Diagram – Special Operations (Assign Brand / Assign Store)

> `AssignUserBrandCommandHandler` and `AssignUserStoreCommandHandler` implement `IRequestHandler<TCommand, Result>` from MediatR (NuGet) — not shown.  
> Both handlers revoke all active sessions of the target user after a successful assignment (`IBackgroundSessionService`).

```mermaid
classDiagram
    class UsersController {
        -IMediator _mediator
        +AssignUserBrand(Guid id, AssignUserBrandRequest request) Task~IActionResult~
        +AssignUserStore(Guid id, AssignUserStoreRequest request) Task~IActionResult~
    }

    class AssignUserBrandRequest {
        +Guid NewBrandId
    }

    class AssignUserStoreRequest {
        +Guid? NewStoreId
    }

    class AssignUserBrandCommand {
        +Guid UserId
        +AssignUserBrandRequest Request
        +Guid? TargetBrandId
        +UserActionEnum GetActionType()
        +WithTargetBrandId(Guid?) AssignUserBrandCommand
    }

    class AssignUserStoreCommand {
        +Guid UserId
        +AssignUserStoreRequest Request
        +Guid? TargetBrandId
        +UserActionEnum GetActionType()
        +WithTargetBrandId(Guid?) AssignUserStoreCommand
    }

    class IUserRequest {
        <<interface>>
        +Guid? GetTargetBrandId()
        +Guid? GetTargetStoreId()
        +UserActionEnum GetActionType()
    }

    class AssignUserBrandCommandValidator {
        +Validate(AssignUserBrandCommand) ValidationResult
    }

    class AssignUserStoreCommandValidator {
        +Validate(AssignUserStoreCommand) ValidationResult
    }

    class AssignUserBrandCommandHandler {
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -IUnitOfWork _unitOfWork
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundSessionService _sessionService
        -ILogger _logger
        +Handle(AssignUserBrandCommand, CancellationToken) Task~Result~
    }

    class AssignUserStoreCommandHandler {
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -IUnitOfWork _unitOfWork
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -IBackgroundSessionService _sessionService
        -ILogger _logger
        +Handle(AssignUserStoreCommand, CancellationToken) Task~Result~
    }

    class IIdentityService {
        <<interface>>
        +UpdateUserAsync(AppUser) Task~IdentityResult~
    }

    class IBackgroundSessionService {
        <<interface>>
        +RevokeAllSessionsAsync(Guid userId) Task
    }

    class IAuditService {
        <<interface>>
        +LogEntityUpdate(string, string, object, bool, Guid?, string, string) void
    }

    UsersController --> AssignUserBrandCommand : creates
    UsersController --> AssignUserStoreCommand : creates
    UsersController ..> AssignUserBrandCommandHandler : sends via Mediator
    UsersController ..> AssignUserStoreCommandHandler : sends via Mediator
    AssignUserBrandCommand ..|> IUserRequest : implements
    AssignUserStoreCommand ..|> IUserRequest : implements
    AssignUserBrandCommand --> AssignUserBrandRequest : contains
    AssignUserStoreCommand --> AssignUserStoreRequest : contains
    AssignUserBrandCommandValidator ..> AssignUserBrandCommand : validates
    AssignUserStoreCommandValidator ..> AssignUserStoreCommand : validates
    AssignUserBrandCommandHandler --> IIdentityService : uses
    AssignUserBrandCommandHandler --> ICurrentUserService : uses
    AssignUserBrandCommandHandler --> IBackgroundSessionService : uses
    AssignUserBrandCommandHandler --> IAuditService : uses
    AssignUserStoreCommandHandler --> IIdentityService : uses
    AssignUserStoreCommandHandler --> ICurrentUserService : uses
    AssignUserStoreCommandHandler --> IBackgroundSessionService : uses
    AssignUserStoreCommandHandler --> IAuditService : uses
```

---

## 3.7.4 Sequence Diagram – Get Users List

```mermaid
sequenceDiagram
    actor Client
    participant UsersController
    participant GetUsersQueryHandler
    participant ICurrentUserService
    participant IUnitOfWork

    Client->>UsersController: GET /api/users?page=1&pageSize=10\n[Authorization: Bearer token]
    UsersController->>GetUsersQueryHandler: Handle(GetUsersQuery)

    GetUsersQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>GetUsersQueryHandler: (isValid=false)
        GetUsersQueryHandler-->>UsersController: UnauthorizedAccessException
        UsersController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>GetUsersQueryHandler: (isValid=true, userId, roles, user)

    GetUsersQueryHandler->>GetUsersQueryHandler: query.EnsureUserAccess(user.BrandId, user.StoreId, roles)
    alt StoreManager or invalid role
        GetUsersQueryHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt BrandManager
        GetUsersQueryHandler->>GetUsersQueryHandler: filter.BrandId = user.BrandId (force to own brand)
    end

    GetUsersQueryHandler->>IUnitOfWork: GetUsersPagedAsync(filter, isBrandManagerScope, currentUserId)\nraw SQL + COUNT(*) OVER() — no N+1, roles aggregated in one round-trip
    IUnitOfWork-->>GetUsersQueryHandler: (rows[], totalCount)

    GetUsersQueryHandler->>GetUsersQueryHandler: rows.Select(row => Mapper.Map~UserListItem~(row)\n+ split RoleNames CSV → List~RoleEnum~)
    GetUsersQueryHandler-->>UsersController: PaginationResult~UserListItem~
    UsersController-->>Client: 200 OK { items[], page, pageSize, totalCount }
```

---

## 3.7.5 Sequence Diagram – Create User

> Content-Type: `multipart/form-data` (avatar is optional `IFormFile`).  
> User identity is managed via `IIdentityService` (ASP.NET Identity), not directly through `IUnitOfWork`.  
> `CreateUserAsync` + `AddUserToRoleAsync` are wrapped in a **`TransactionScope` (ReadCommitted, async flow)** — if either fails the entire transaction rolls back (no orphan user).

```mermaid
sequenceDiagram
    actor Client
    participant UsersController
    participant CreateUserCommandValidator
    participant CreateUserCommandHandler
    participant ICurrentUserService
    participant IIdentityService
    participant IUnitOfWork
    participant IBackgroundFileOperationService
    participant IAuditService

    Client->>UsersController: POST /api/users [multipart/form-data]\n[Authorization: Bearer token]

    UsersController->>CreateUserCommandValidator: Validate(CreateUserCommand)
    alt Validation failed (missing FirstName, LastName, Email, Password, Role)
        CreateUserCommandValidator-->>UsersController: ValidationException
        UsersController-->>Client: 400 Bad Request
    end
    CreateUserCommandValidator-->>UsersController: Valid

    UsersController->>CreateUserCommandHandler: Handle(CreateUserCommand)

    CreateUserCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>CreateUserCommandHandler: (isValid=false)
        CreateUserCommandHandler-->>UsersController: UnauthorizedAccessException
        UsersController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>CreateUserCommandHandler: (isValid=true, userId, roles, user)

    CreateUserCommandHandler->>CreateUserCommandHandler: command.EnsureUserAccess(user.BrandId, user.StoreId, roles)
    alt Not permitted (BrandManager trying to create non-StoreManager, or wrong brand)
        CreateUserCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt Role requires BrandId (BrandManager or StoreManager)
        CreateUserCommandHandler->>IUnitOfWork: Repository~Brand~.AnyAsync(b.Id == request.BrandId)
        alt Brand not found
            IUnitOfWork-->>CreateUserCommandHandler: false
            CreateUserCommandHandler-->>UsersController: NotFoundException
            UsersController-->>Client: 404 Not Found
        end
    end

    alt Role = StoreManager and StoreId provided
        CreateUserCommandHandler->>IUnitOfWork: Repository~Store~.AnyAsync(s.Id == request.StoreId and s.BrandId == request.BrandId)
        alt Store not found or does not belong to Brand
            IUnitOfWork-->>CreateUserCommandHandler: false
            CreateUserCommandHandler-->>UsersController: NotFoundException / BusinessRuleViolationException
            UsersController-->>Client: 404 / 422
        end
    end

    CreateUserCommandHandler->>IIdentityService: IsEmailDuplicateAsync(dummyUser, request.Email)
    alt Email already exists
        IIdentityService-->>CreateUserCommandHandler: duplicate=true
        CreateUserCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end

    opt Avatar provided
        CreateUserCommandHandler->>IBackgroundFileOperationService: UploadFileAsync(avatar, "avatars")
        alt Upload throws exception
            IBackgroundFileOperationService-->>CreateUserCommandHandler: Exception (non-fatal)\nlog warning — continue without avatar
        else Upload succeeds
            IBackgroundFileOperationService-->>CreateUserCommandHandler: avatarUrl
        end
    end

    Note over CreateUserCommandHandler,IIdentityService: BEGIN TransactionScope (ReadCommitted, timeout 1 min, async flow)

    CreateUserCommandHandler->>IIdentityService: CreateUserAsync(user, request.Password)
    alt CreateUserAsync fails (IdentityResult.Succeeded=false)
        IIdentityService-->>CreateUserCommandHandler: IdentityResult(errors)
        Note over CreateUserCommandHandler: catch — TransactionScope rolls back
        CreateUserCommandHandler->>IBackgroundFileOperationService: DeleteFileInBackground(avatarUrl) [if uploaded]
        CreateUserCommandHandler->>IAuditService: LogEntityCreate(isSuccess=false, Error="Transaction failed")
        CreateUserCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end
    IIdentityService-->>CreateUserCommandHandler: IdentityResult(Succeeded=true)

    CreateUserCommandHandler->>IIdentityService: AddUserToRoleAsync(user, request.Role)
    alt AddUserToRoleAsync fails (IdentityResult.Succeeded=false)
        IIdentityService-->>CreateUserCommandHandler: IdentityResult(errors)
        Note over CreateUserCommandHandler: catch — TransactionScope rolls back\n(user creation also undone — no orphan user)
        CreateUserCommandHandler->>IBackgroundFileOperationService: DeleteFileInBackground(avatarUrl) [if uploaded]
        CreateUserCommandHandler->>IAuditService: LogEntityCreate(isSuccess=false, Error="Transaction failed")
        CreateUserCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end
    IIdentityService-->>CreateUserCommandHandler: IdentityResult(Succeeded=true)

    CreateUserCommandHandler->>CreateUserCommandHandler: scope.Complete() — commit transaction
    Note over CreateUserCommandHandler,IIdentityService: END TransactionScope disposed — audit runs outside scope

    CreateUserCommandHandler->>IAuditService: LogEntityCreate(isSuccess=true, email, role)
    CreateUserCommandHandler-->>UsersController: Result.Success
    UsersController-->>Client: 200 OK
```

---

## 3.7.6 Sequence Diagram – Update User

> Content-Type: `multipart/form-data` (avatar replacement is optional).  
> Uses `WithTargetBrandId()` pattern — authorization is evaluated against the target user's actual brand.  
> No `TransactionScope` — single `UpdateUserAsync` call. If it fails, the newly uploaded avatar is deleted immediately to prevent orphaned files.

```mermaid
sequenceDiagram
    actor Client
    participant UsersController
    participant UpdateUserCommandValidator
    participant UpdateUserCommandHandler
    participant ICurrentUserService
    participant IIdentityService
    participant IUnitOfWork
    participant IBackgroundFileOperationService
    participant IAuditService

    Client->>UsersController: PATCH /api/users/{id} [multipart/form-data]\n[Authorization: Bearer token]

    UsersController->>UpdateUserCommandValidator: Validate(UpdateUserCommand)
    alt Validation failed (invalid email format, name too long)
        UpdateUserCommandValidator-->>UsersController: ValidationException
        UsersController-->>Client: 400 Bad Request
    end

    UsersController->>UpdateUserCommandHandler: Handle(UpdateUserCommand)

    UpdateUserCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>UpdateUserCommandHandler: (isValid=false)
        UpdateUserCommandHandler-->>UsersController: UnauthorizedAccessException
        UsersController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>UpdateUserCommandHandler: (isValid=true, userId, roles, user)

    UpdateUserCommandHandler->>IIdentityService: GetUserByIdAsync(command.Id)
    alt User not found
        IIdentityService-->>UpdateUserCommandHandler: null
        UpdateUserCommandHandler-->>UsersController: NotFoundException
        UsersController-->>Client: 404 Not Found
    end
    IIdentityService-->>UpdateUserCommandHandler: targetUser

    UpdateUserCommandHandler->>UpdateUserCommandHandler: command = command.WithTargetBrandId(targetUser.BrandId)
    UpdateUserCommandHandler->>UpdateUserCommandHandler: command.EnsureUserAccess(user.BrandId, user.StoreId, roles)
    alt BrandManager updating own account or another BrandManager
        UpdateUserCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt Email changed — check duplicate
        UpdateUserCommandHandler->>IIdentityService: IsEmailDuplicateAsync(targetUser, newEmail)
        alt Email already taken
            IIdentityService-->>UpdateUserCommandHandler: duplicate=true
            UpdateUserCommandHandler-->>UsersController: BusinessRuleViolationException
            UsersController-->>Client: 422 Unprocessable Entity
        end
    end

    UpdateUserCommandHandler->>UpdateUserCommandHandler: Mapper.Map(request onto targetUser)

    opt New avatar provided
        UpdateUserCommandHandler->>IBackgroundFileOperationService: UploadFileAsync(newAvatar, "avatars")
        alt Upload throws exception
            IBackgroundFileOperationService-->>UpdateUserCommandHandler: Exception (non-fatal)\nlog warning — keep old avatar, proceed without change
        else Upload succeeds
            IBackgroundFileOperationService-->>UpdateUserCommandHandler: newAvatarUrl\ntargetUser.AvatarUrl = newAvatarUrl
        end
    end

    UpdateUserCommandHandler->>IIdentityService: UpdateUserAsync(targetUser)
    alt UpdateUserAsync fails (IdentityResult.Succeeded=false)
        IIdentityService-->>UpdateUserCommandHandler: IdentityResult(errors)
        opt New avatar was uploaded
            UpdateUserCommandHandler->>IBackgroundFileOperationService: DeleteFileInBackground(newAvatarUrl)\nrevert new upload — old avatar kept intact
        end
        UpdateUserCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=false, Error=errors)
        UpdateUserCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end
    IIdentityService-->>UpdateUserCommandHandler: IdentityResult(Succeeded=true)

    opt Both oldAvatarUrl and newAvatarUrl exist
        UpdateUserCommandHandler->>IBackgroundFileOperationService: DeleteFileInBackground(oldAvatarUrl)\ncleanup old avatar only after DB commit succeeds
    end

    UpdateUserCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=true, email)
    UpdateUserCommandHandler-->>UsersController: Result.Success
    UsersController-->>Client: 200 OK
```

---

## 3.7.7 Sequence Diagram – Toggle User Status

> Uses `WithTargetBrandId()` pattern. Guards: cannot toggle SystemAdmin or PrimaryOwner (by BrandManager). Sessions are revoked when user is deactivated.

```mermaid
sequenceDiagram
    actor Client
    participant UsersController
    participant ToggleUserStatusCommandHandler
    participant ICurrentUserService
    participant IIdentityService
    participant IUnitOfWork
    participant IAuditService

    Client->>UsersController: PUT /api/users/{id}/status\n[Authorization: Bearer token]
    UsersController->>ToggleUserStatusCommandHandler: Handle(ToggleUserStatusCommand)

    ToggleUserStatusCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>ToggleUserStatusCommandHandler: (isValid=false)
        ToggleUserStatusCommandHandler-->>UsersController: UnauthorizedAccessException
        UsersController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>ToggleUserStatusCommandHandler: (isValid=true, userId, roles, user)

    ToggleUserStatusCommandHandler->>IUnitOfWork: Repository~AppUser~.GetFirstOrDefaultAsync(u.Id == id)
    alt User not found
        IUnitOfWork-->>ToggleUserStatusCommandHandler: null
        ToggleUserStatusCommandHandler-->>UsersController: NotFoundException
        UsersController-->>Client: 404 Not Found
    end
    IUnitOfWork-->>ToggleUserStatusCommandHandler: targetUser

    ToggleUserStatusCommandHandler->>ToggleUserStatusCommandHandler: command = command.WithTargetBrandId(targetUser.BrandId)
    ToggleUserStatusCommandHandler->>ToggleUserStatusCommandHandler: command.EnsureUserAccess(user.BrandId, user.StoreId, roles)
    alt BrandManager trying to toggle SystemAdmin or another BrandManager
        ToggleUserStatusCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt targetUser.IsPrimaryOwner and actor is BrandManager
        ToggleUserStatusCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end

    ToggleUserStatusCommandHandler->>ToggleUserStatusCommandHandler: Toggle Active/Inactive + UpdateEntity(userId)
    ToggleUserStatusCommandHandler->>IIdentityService: UpdateUserAsync(targetUser)

    ToggleUserStatusCommandHandler->>IAuditService: LogEntityToggleStatus("User", userId, details)
    ToggleUserStatusCommandHandler-->>UsersController: Result.Success
    UsersController-->>Client: 200 OK
```

---

## 3.7.8 Sequence Diagram – Assign User Brand

> **SystemAdmin only.** Changing brand clears the old store assignment. All active sessions of the target user are revoked in the background after the change.  
> Guards: cannot reassign self, cannot reassign a SystemAdmin account, cannot reassign a PrimaryOwner (transfer ownership first), no-op if already in the same brand.

```mermaid
sequenceDiagram
    actor Client
    participant UsersController
    participant AssignUserBrandCommandValidator
    participant AssignUserBrandCommandHandler
    participant ICurrentUserService
    participant IIdentityService
    participant IUnitOfWork
    participant IBackgroundSessionService
    participant IAuditService

    Client->>UsersController: PUT /api/users/{id}/brand\n[Authorization: Bearer token]

    UsersController->>AssignUserBrandCommandValidator: Validate(AssignUserBrandCommand)
    alt Validation failed (missing UserId or NewBrandId)
        AssignUserBrandCommandValidator-->>UsersController: ValidationException
        UsersController-->>Client: 400 Bad Request
    end

    UsersController->>AssignUserBrandCommandHandler: Handle(AssignUserBrandCommand)

    AssignUserBrandCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>AssignUserBrandCommandHandler: (isValid=false)
        AssignUserBrandCommandHandler-->>UsersController: UnauthorizedAccessException
        UsersController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>AssignUserBrandCommandHandler: (isValid=true, userId, roles, user)

    AssignUserBrandCommandHandler->>IIdentityService: GetUserByIdAsync(command.UserId)
    alt User not found
        IIdentityService-->>AssignUserBrandCommandHandler: null
        AssignUserBrandCommandHandler-->>UsersController: NotFoundException
        UsersController-->>Client: 404 Not Found
    end
    IIdentityService-->>AssignUserBrandCommandHandler: targetUser

    AssignUserBrandCommandHandler->>AssignUserBrandCommandHandler: command = command.WithTargetBrandId(targetUser.BrandId)
    AssignUserBrandCommandHandler->>AssignUserBrandCommandHandler: command.EnsureUserAccess(user.BrandId, user.StoreId, roles)
    alt Not SystemAdmin
        AssignUserBrandCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt targetUser.Id == currentUserId (self-assign)
        AssignUserBrandCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    AssignUserBrandCommandHandler->>IIdentityService: GetUserRolesAsync(targetUser)
    alt targetUser has SystemAdmin role
        IIdentityService-->>AssignUserBrandCommandHandler: [SystemAdmin]
        AssignUserBrandCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt targetUser.BrandId has value
        AssignUserBrandCommandHandler->>IUnitOfWork: Repository~Brand~.AnyAsync(b.Id == targetUser.BrandId and b.PrimaryOwnerId == targetUser.Id)
        alt targetUser is PrimaryOwner of current brand
            IUnitOfWork-->>AssignUserBrandCommandHandler: true
            AssignUserBrandCommandHandler-->>UsersController: ForbiddenAccessException (transfer ownership first)
            UsersController-->>Client: 403 Forbidden
        end
    end

    AssignUserBrandCommandHandler->>IUnitOfWork: Repository~Brand~.AnyAsync(b.Id == request.NewBrandId)
    alt New brand not found
        IUnitOfWork-->>AssignUserBrandCommandHandler: false
        AssignUserBrandCommandHandler-->>UsersController: NotFoundException
        UsersController-->>Client: 404 Not Found
    end

    alt targetUser.BrandId == request.NewBrandId (no-op)
        AssignUserBrandCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end

    AssignUserBrandCommandHandler->>AssignUserBrandCommandHandler: targetUser.BrandId = request.NewBrandId\ntargetUser.StoreId = null (clear old store)

    AssignUserBrandCommandHandler->>IIdentityService: UpdateUserAsync(targetUser)
    alt UpdateUserAsync fails (IdentityResult.Succeeded=false)
        IIdentityService-->>AssignUserBrandCommandHandler: IdentityResult(errors)
        AssignUserBrandCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=false, Error=errors)
        AssignUserBrandCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end
    IIdentityService-->>AssignUserBrandCommandHandler: IdentityResult(Succeeded=true)

    AssignUserBrandCommandHandler->>IBackgroundSessionService: RevokeActiveSessionsInBackground(targetUser.Id) [fire-and-forget]

    AssignUserBrandCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=true, previousBrandId, previousStoreCleared, newBrandId)
    AssignUserBrandCommandHandler-->>UsersController: Result.Success
    UsersController-->>Client: 200 OK
```

---

## 3.7.9 Sequence Diagram – Assign User Store

> **SystemAdmin and BrandManager.** Assigns or unassigns a store from a user. Pass `null` for `NewStoreId` to remove the current assignment.  
> Guards: cannot reassign self, cannot modify SystemAdmin, BrandManager role cannot have a specific store, cannot reassign PrimaryOwner, store must belong to the same brand as target user, no-op if same store already assigned (including `null == null`).

```mermaid
sequenceDiagram
    actor Client
    participant UsersController
    participant AssignUserStoreCommandValidator
    participant AssignUserStoreCommandHandler
    participant ICurrentUserService
    participant IIdentityService
    participant IUnitOfWork
    participant IBackgroundSessionService
    participant IAuditService

    Client->>UsersController: PUT /api/users/{id}/store\n[Authorization: Bearer token]

    UsersController->>AssignUserStoreCommandValidator: Validate(AssignUserStoreCommand)
    alt Validation failed (missing UserId)
        AssignUserStoreCommandValidator-->>UsersController: ValidationException
        UsersController-->>Client: 400 Bad Request
    end

    UsersController->>AssignUserStoreCommandHandler: Handle(AssignUserStoreCommand)

    AssignUserStoreCommandHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid session
        ICurrentUserService-->>AssignUserStoreCommandHandler: (isValid=false)
        AssignUserStoreCommandHandler-->>UsersController: UnauthorizedAccessException
        UsersController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>AssignUserStoreCommandHandler: (isValid=true, userId, roles, user)

    AssignUserStoreCommandHandler->>IIdentityService: GetUserByIdAsync(command.UserId)
    alt User not found
        IIdentityService-->>AssignUserStoreCommandHandler: null
        AssignUserStoreCommandHandler-->>UsersController: NotFoundException
        UsersController-->>Client: 404 Not Found
    end
    IIdentityService-->>AssignUserStoreCommandHandler: targetUser

    AssignUserStoreCommandHandler->>AssignUserStoreCommandHandler: command = command.WithTargetBrandId(targetUser.BrandId)
    AssignUserStoreCommandHandler->>AssignUserStoreCommandHandler: command.EnsureUserAccess(user.BrandId, user.StoreId, roles)
    alt BrandManager from different brand
        AssignUserStoreCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt targetUser.Id == currentUserId (self-assign)
        AssignUserStoreCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    AssignUserStoreCommandHandler->>IIdentityService: GetUserRolesAsync(targetUser)
    alt targetUser has SystemAdmin role
        IIdentityService-->>AssignUserStoreCommandHandler: [SystemAdmin]
        AssignUserStoreCommandHandler-->>UsersController: ForbiddenAccessException
        UsersController-->>Client: 403 Forbidden
    end

    alt request.NewStoreId provided and targetUser has BrandManager role
        AssignUserStoreCommandHandler-->>UsersController: BusinessRuleViolationException (BrandManager cannot have specific store)
        UsersController-->>Client: 422 Unprocessable Entity
    end

    alt targetUser.BrandId has value
        AssignUserStoreCommandHandler->>IUnitOfWork: Repository~Brand~.GetFirstOrDefaultAsync(b.Id == targetUser.BrandId)
        alt targetBrand.PrimaryOwnerId == targetUser.Id
            IUnitOfWork-->>AssignUserStoreCommandHandler: PrimaryOwner match
            AssignUserStoreCommandHandler-->>UsersController: ForbiddenAccessException (transfer ownership first)
            UsersController-->>Client: 403 Forbidden
        end
    end

    alt request.NewStoreId provided
        AssignUserStoreCommandHandler->>IUnitOfWork: Repository~Store~.GetFirstOrDefaultAsync(s.Id == request.NewStoreId)
        alt Store not found
            IUnitOfWork-->>AssignUserStoreCommandHandler: null
            AssignUserStoreCommandHandler-->>UsersController: NotFoundException
            UsersController-->>Client: 404 Not Found
        end
        IUnitOfWork-->>AssignUserStoreCommandHandler: store
        alt store.BrandId != targetUser.BrandId
            AssignUserStoreCommandHandler-->>UsersController: BusinessRuleViolationException (store not in user brand)
            UsersController-->>Client: 422 Unprocessable Entity
        end
    end

    alt request.NewStoreId == targetUser.StoreId (no-op, includes null == null)
        AssignUserStoreCommandHandler-->>UsersController: BusinessRuleViolationException (already assigned)
        UsersController-->>Client: 422 Unprocessable Entity
    end

    AssignUserStoreCommandHandler->>AssignUserStoreCommandHandler: targetUser.StoreId = request.NewStoreId\n(null = unassign current store)

    AssignUserStoreCommandHandler->>IIdentityService: UpdateUserAsync(targetUser)
    alt UpdateUserAsync fails (IdentityResult.Succeeded=false)
        IIdentityService-->>AssignUserStoreCommandHandler: IdentityResult(errors)
        AssignUserStoreCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=false, Error=errors)
        AssignUserStoreCommandHandler-->>UsersController: BusinessRuleViolationException
        UsersController-->>Client: 422 Unprocessable Entity
    end
    IIdentityService-->>AssignUserStoreCommandHandler: IdentityResult(Succeeded=true)

    AssignUserStoreCommandHandler->>IBackgroundSessionService: RevokeActiveSessionsInBackground(targetUser.Id) [fire-and-forget]

    AssignUserStoreCommandHandler->>IAuditService: LogEntityUpdate(isSuccess=true, previousStoreId, newStoreId)
    AssignUserStoreCommandHandler-->>UsersController: Result.Success
    UsersController-->>Client: 200 OK
```
