# 3.1 Authentication Feature – Software Design

## 3.1.1 Class Diagram – Login

> Ghi chú: `LoginCommandHandler` implement `IRequestHandler<LoginCommand, Result<AuthResponse>>` từ thư viện MediatR (NuGet package), không thuộc source code dự án nên không thể hiện trong class diagram.

```mermaid
classDiagram
    class AuthController {
        -IMediator _mediator
        +Login(LoginRequest request) Task~IActionResult~
    }

    class LoginCommand {
        +LoginRequest Request
    }

    class LoginRequest {
        +string Email
        +string Password
        +bool RememberMe
    }

    class LoginCommandValidator {
        #ILocalizationService LocalizationService
        #SetupValidationRules() void
    }

    class LoginCommandHandler {
        -IIdentityService _identityService
        -ITokenService _tokenService
        -IUnitOfWork _unitOfWork
        -ILogger _logger
        -ILocalizationService _localizationService
        -IAuditService _auditService
        -ICurrentUserService _currentUserService
        -IRefreshTokenCookieService _refreshTokenCookieService
        +Handle(LoginCommand, CancellationToken) Task~Result~AuthResponse~~
    }

    class AuthSessionHelper {
        <<static>>
        +CreateSessionAsync(IUnitOfWork, ITokenService, Guid, string, DateTime, string, string, string) Task~UserSession~
        +DeactivateAllUserSessionsAsync(IUnitOfWork, Guid) Task~int~
    }

    class IIdentityService {
        <<interface>>
        +AuthenticateAsync(LoginRequest) Task~Result~AppUser~~
        +GetUserRolesAsync(AppUser) Task~IList~string~~
    }

    class ITokenService {
        <<interface>>
        +GenerateRefreshTokenWithExpiration(bool) Tuple
        +GenerateJwtTokenWithExpiration(AppUser, IList) Tuple
        +HashRefreshToken(string) string
    }

    class IRefreshTokenCookieService {
        <<interface>>
        +SetRefreshTokenCookie(string, DateTime) void
    }

    class IAuditService {
        <<interface>>
        +LogLogin(bool, Guid, string, string, object) void
    }

    class AuthResponse {
        +string AccessToken
        +List~RoleEnum~ Roles
        +DateTime ExpiresAt
    }

    AuthController --> LoginCommand : creates
    AuthController ..> LoginCommandHandler : sends via Mediator
    LoginCommandHandler --> IIdentityService : uses
    LoginCommandHandler --> ITokenService : uses
    LoginCommandHandler --> IRefreshTokenCookieService : uses
    LoginCommandHandler --> IAuditService : uses
    LoginCommandHandler --> AuthSessionHelper : calls
    LoginCommandHandler --> AuthResponse : returns
    LoginCommand --> LoginRequest : contains
    LoginCommandValidator ..> LoginCommand : validates
```

---

## 3.1.2 Sequence Diagram – Login

```mermaid
sequenceDiagram
    actor Client
    participant AuthController
    participant LoginCommandValidator
    participant LoginCommandHandler
    participant IIdentityService
    participant ITokenService
    participant AuthSessionHelper
    participant IUnitOfWork
    participant IRefreshTokenCookieService
    participant IAuditService

    Client->>AuthController: POST /api/auth/login {email, password, rememberMe}
    AuthController->>LoginCommandValidator: Validate(LoginCommand)
    alt Validation failed
        LoginCommandValidator-->>AuthController: ValidationException
        AuthController-->>Client: 400 Bad Request
    end
    LoginCommandValidator-->>AuthController: Valid

    AuthController->>LoginCommandHandler: Handle(LoginCommand)
    LoginCommandHandler->>IIdentityService: AuthenticateAsync(request)
    alt Invalid credentials
        IIdentityService-->>LoginCommandHandler: Result.Failure
        LoginCommandHandler->>IAuditService: LogLogin(isSuccess=false)
        LoginCommandHandler-->>AuthController: Result.Failure (InvalidCredentials)
        AuthController-->>Client: 401 Unauthorized
    end
    IIdentityService-->>LoginCommandHandler: Result.Success(AppUser)

    LoginCommandHandler->>IIdentityService: GetUserRolesAsync(user)
    alt No roles assigned
        IIdentityService-->>LoginCommandHandler: empty list
        LoginCommandHandler-->>AuthController: Result.Failure (Unauthorized)
        AuthController-->>Client: 403 Forbidden
    end
    IIdentityService-->>LoginCommandHandler: roles

    LoginCommandHandler->>ITokenService: GenerateRefreshTokenWithExpiration(rememberMe)
    ITokenService-->>LoginCommandHandler: (refreshToken, expiryTime)

    LoginCommandHandler->>AuthSessionHelper: CreateSessionAsync(unitOfWork, tokenService, userId, refreshToken, expiryTime, ip, device, browser)
    AuthSessionHelper->>ITokenService: HashRefreshToken(refreshToken)
    ITokenService-->>AuthSessionHelper: hashedToken
    AuthSessionHelper->>IUnitOfWork: Repository~UserSession~.AddAsync(session)
    AuthSessionHelper-->>LoginCommandHandler: UserSession

    LoginCommandHandler->>IUnitOfWork: SaveChangesAsync()
    LoginCommandHandler->>IRefreshTokenCookieService: SetRefreshTokenCookie(refreshToken, expiryTime)
    LoginCommandHandler->>ITokenService: GenerateJwtTokenWithExpiration(user, roles)
    ITokenService-->>LoginCommandHandler: (accessToken, roles, expiresAt)

    LoginCommandHandler->>IAuditService: LogLogin(isSuccess=true, userId, ip, userAgent)
    LoginCommandHandler-->>AuthController: Result.Success(AuthResponse)
    AuthController-->>Client: 200 OK {accessToken, roles, expiresAt} + Set-Cookie: refreshToken
```

---

## 3.2 Refresh Token Feature – Software Design

## 3.2.1 Class Diagram – Refresh Token

> Ghi chú: `RefreshTokenCommandHandler` implement `IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>` từ thư viện MediatR (NuGet package), không thuộc source code dự án nên không thể hiện trong class diagram.

```mermaid
classDiagram
    class AuthController {
        -IMediator _mediator
        +RefreshToken() Task~IActionResult~
    }

    class RefreshTokenCommand {
    }

    class RefreshTokenCommandHandler {
        -ICurrentUserService _currentUserService
        -IIdentityService _identityService
        -IUnitOfWork _unitOfWork
        -ILogger _logger
        -ITokenService _tokenService
        -ILocalizationService _localizationService
        +Handle(RefreshTokenCommand, CancellationToken) Task~Result~AuthResponse~~
    }

    class AuthSessionHelper {
        <<static>>
        +FindActiveSessionByRefreshTokenAsync(IUnitOfWork, ITokenService, string, Guid) Task~UserSession~
        +DeactivateAllUserSessionsAsync(IUnitOfWork, Guid) Task~int~
        +UpdateLastActivityAsync(IUnitOfWork, Guid, Guid?) Task~bool~
    }

    class ICurrentUserService {
        <<interface>>
        +IsUserValidAsync() Task~(bool, Guid?)~
        +GetRefreshTokenFromCookie() string
        +UserId Guid?
        +IpAddress string
    }

    class IIdentityService {
        <<interface>>
        +GetUserByIdAsync(string) Task~AppUser~
        +GetUserRolesAsync(AppUser) Task~IList~string~~
    }

    class ITokenService {
        <<interface>>
        +GenerateJwtTokenWithExpiration(AppUser, IList) Tuple
        +VerifyRefreshToken(string, string) bool
    }

    class UserSession {
        +Guid Id
        +Guid UserId
        +string RefreshToken
        +DateTime RefreshTokenExpiryTime
        +DateTime? LastActivityAt
        +EntityStatusEnum Status
    }

    class AuthResponse {
        +string AccessToken
        +List~RoleEnum~ Roles
        +DateTime ExpiresAt
    }

    AuthController --> RefreshTokenCommand : creates
    AuthController ..> RefreshTokenCommandHandler : sends via Mediator
    RefreshTokenCommandHandler --> ICurrentUserService : uses
    RefreshTokenCommandHandler --> IIdentityService : uses
    RefreshTokenCommandHandler --> ITokenService : uses
    RefreshTokenCommandHandler --> AuthSessionHelper : calls
    RefreshTokenCommandHandler --> AuthResponse : returns
    AuthSessionHelper --> UserSession : manages
```

---

## 3.2.2 Sequence Diagram – Refresh Token

```mermaid
sequenceDiagram
    actor Client
    participant AuthController
    participant RefreshTokenCommandHandler
    participant ICurrentUserService
    participant AuthSessionHelper
    participant IUnitOfWork
    participant IIdentityService
    participant ITokenService

    Client->>AuthController: POST /api/auth/refresh-token\n[Authorization: Bearer <expired_token>]\n[Cookie: refreshToken=<token>]
    AuthController->>RefreshTokenCommandHandler: Handle(RefreshTokenCommand)

    RefreshTokenCommandHandler->>ICurrentUserService: IsUserValidAsync()
    alt Invalid user / token tampered
        ICurrentUserService-->>RefreshTokenCommandHandler: (false, userId)
        RefreshTokenCommandHandler->>AuthSessionHelper: DeactivateAllUserSessionsAsync(unitOfWork, userId)
        AuthSessionHelper->>IUnitOfWork: UpdateRange(sessions)
        IUnitOfWork-->>AuthSessionHelper: saved
        RefreshTokenCommandHandler-->>AuthController: Result.Failure (Unauthorized)
        AuthController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>RefreshTokenCommandHandler: (true, userId)

    RefreshTokenCommandHandler->>ICurrentUserService: GetRefreshTokenFromCookie()
    alt No refresh token cookie
        ICurrentUserService-->>RefreshTokenCommandHandler: null/empty
        RefreshTokenCommandHandler-->>AuthController: Result.Failure (Unauthorized)
        AuthController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>RefreshTokenCommandHandler: refreshToken

    RefreshTokenCommandHandler->>AuthSessionHelper: FindActiveSessionByRefreshTokenAsync(unitOfWork, tokenService, refreshToken, userId)
    AuthSessionHelper->>ITokenService: VerifyRefreshToken(rawToken, session.RefreshToken)
    ITokenService-->>AuthSessionHelper: match result
    alt Session not found or token mismatch
        AuthSessionHelper-->>RefreshTokenCommandHandler: null
        RefreshTokenCommandHandler-->>AuthController: Result.Failure (Unauthorized)
        AuthController-->>Client: 401 Unauthorized
    end
    AuthSessionHelper-->>RefreshTokenCommandHandler: UserSession

    alt Session expired (RefreshTokenExpiryTime <= UtcNow)
        RefreshTokenCommandHandler-->>AuthController: Result.Failure (Unauthorized)
        AuthController-->>Client: 401 Unauthorized
    end

    RefreshTokenCommandHandler->>IIdentityService: GetUserByIdAsync(userId)
    IIdentityService-->>RefreshTokenCommandHandler: AppUser
    RefreshTokenCommandHandler->>IIdentityService: GetUserRolesAsync(user)
    IIdentityService-->>RefreshTokenCommandHandler: roles

    RefreshTokenCommandHandler->>AuthSessionHelper: UpdateLastActivityAsync(unitOfWork, sessionId, userId)
    AuthSessionHelper->>IUnitOfWork: Update(session)
    RefreshTokenCommandHandler->>IUnitOfWork: SaveChangesAsync()

    RefreshTokenCommandHandler->>ITokenService: GenerateJwtTokenWithExpiration(user, roles)
    ITokenService-->>RefreshTokenCommandHandler: (accessToken, roles, expiresAt)

    RefreshTokenCommandHandler-->>AuthController: Result.Success(AuthResponse)
    AuthController-->>Client: 200 OK {accessToken, roles, expiresAt}
```

---

## 3.3 Get Profile Feature – Software Design

## 3.3.1 Class Diagram – Get Profile

> Ghi chú: `GetProfileQueryHandler` implement `IRequestHandler<GetProfileQuery, Result<ProfileResponse>>` từ thư viện MediatR (NuGet package), không thuộc source code dự án nên không thể hiện trong class diagram.

```mermaid
classDiagram
    class AuthController {
        -IMediator _mediator
        +GetProfile() Task~IActionResult~
    }

    class GetProfileQuery {
    }

    class GetProfileQueryHandler {
        -ICurrentUserService _currentUserService
        -IMapper _mapper
        -ILocalizationService _localizationService
        -ILogger _logger
        +Handle(GetProfileQuery, CancellationToken) Task~Result~ProfileResponse~~
    }

    class ICurrentUserService {
        <<interface>>
        +ValidateUserWithSessionAsync() Task~(bool, Guid?, IList, AppUser)~
        +UserId Guid?
    }

    class ProfileResponse {
        +string UserId
        +string Email
        +string FirstName
        +string LastName
        +string? PhoneNumber
        +string? AvatarUrl
        +List~RoleEnum~ Roles
    }

    AuthController --> GetProfileQuery : creates
    AuthController ..> GetProfileQueryHandler : sends via Mediator
    GetProfileQueryHandler --> ICurrentUserService : uses
    GetProfileQueryHandler --> ProfileResponse : returns
```

---

## 3.3.2 Sequence Diagram – Get Profile

```mermaid
sequenceDiagram
    actor Client
    participant AuthController
    participant GetProfileQueryHandler
    participant ICurrentUserService
    participant IMapper

    Client->>AuthController: GET /api/auth/profile\n[Authorization: Bearer <access_token>]
    AuthController->>GetProfileQueryHandler: Handle(GetProfileQuery)

    GetProfileQueryHandler->>ICurrentUserService: ValidateUserWithSessionAsync()
    alt Invalid token / no active session
        ICurrentUserService-->>GetProfileQueryHandler: (isValid=false, ...)
        GetProfileQueryHandler-->>AuthController: Result.Failure (Unauthorized)
        AuthController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>GetProfileQueryHandler: (isValid=true, userId, roles, AppUser)

    GetProfileQueryHandler->>IMapper: Map~ProfileResponse~(user)
    IMapper-->>GetProfileQueryHandler: ProfileResponse

    GetProfileQueryHandler-->>AuthController: Result.Success(ProfileResponse)
    AuthController-->>Client: 200 OK { userId, email, firstName, lastName, phoneNumber, avatarUrl, roles }
```

---

## 3.4 Change Password Feature – Software Design

## 3.4.1 Class Diagram – Change Password

> Ghi chú: `ChangePasswordCommandHandler` implement `IRequestHandler<ChangePasswordCommand, Result>` từ thư viện MediatR (NuGet package), không thuộc source code dự án nên không thể hiện trong class diagram.

```mermaid
classDiagram
    class AuthController {
        -IMediator _mediator
        +ChangePassword(ChangePasswordRequest request) Task~IActionResult~
    }

    class ChangePasswordCommand {
        +ChangePasswordRequest Request
    }

    class ChangePasswordRequest {
        +string CurrentPassword
        +string NewPassword
        +string ConfirmPassword
    }

    class ChangePasswordCommandValidator {
        #ILocalizationService LocalizationService
        #SetupValidationRules() void
    }

    class ChangePasswordCommandHandler {
        -IIdentityService _identityService
        -ICurrentUserService _currentUserService
        -ILocalizationService _localizationService
        -ILogger _logger
        +Handle(ChangePasswordCommand, CancellationToken) Task~Result~
    }

    class ICurrentUserService {
        <<interface>>
        +IsUserValidAsync() Task~(bool, Guid?)~
    }

    class IIdentityService {
        <<interface>>
        +GetUserByIdAsync(string) Task~AppUser~
        +ChangePasswordAsync(AppUser, string, string) Task~IdentityResult~
    }

    AuthController --> ChangePasswordCommand : creates
    AuthController ..> ChangePasswordCommandHandler : sends via Mediator
    ChangePasswordCommand --> ChangePasswordRequest : contains
    ChangePasswordCommandValidator ..> ChangePasswordCommand : validates
    ChangePasswordCommandHandler --> ICurrentUserService : uses
    ChangePasswordCommandHandler --> IIdentityService : uses
```

---

## 3.4.2 Sequence Diagram – Change Password

```mermaid
sequenceDiagram
    actor Client
    participant AuthController
    participant ChangePasswordCommandValidator
    participant ChangePasswordCommandHandler
    participant ICurrentUserService
    participant IIdentityService

    Client->>AuthController: POST /api/auth/change-password\n[Authorization: Bearer <access_token>]\n{ currentPassword, newPassword, confirmPassword }

    AuthController->>ChangePasswordCommandValidator: Validate(ChangePasswordCommand)
    alt Validation failed (empty fields / newPassword != confirmPassword / weak password)
        ChangePasswordCommandValidator-->>AuthController: ValidationException
        AuthController-->>Client: 400 Bad Request
    end
    ChangePasswordCommandValidator-->>AuthController: Valid

    AuthController->>ChangePasswordCommandHandler: Handle(ChangePasswordCommand)

    ChangePasswordCommandHandler->>ICurrentUserService: IsUserValidAsync()
    alt Invalid token / session expired
        ICurrentUserService-->>ChangePasswordCommandHandler: (isValid=false, null)
        ChangePasswordCommandHandler-->>AuthController: Result.Failure (Unauthorized)
        AuthController-->>Client: 401 Unauthorized
    end
    ICurrentUserService-->>ChangePasswordCommandHandler: (isValid=true, userId)

    ChangePasswordCommandHandler->>IIdentityService: GetUserByIdAsync(userId)
    IIdentityService-->>ChangePasswordCommandHandler: AppUser

    ChangePasswordCommandHandler->>IIdentityService: ChangePasswordAsync(user, currentPassword, newPassword)
    alt CurrentPassword mismatch
        IIdentityService-->>ChangePasswordCommandHandler: IdentityResult { Errors: [PasswordMismatch] }
        ChangePasswordCommandHandler-->>AuthController: Result.Failure (InvalidCredentials)
        AuthController-->>Client: 400 Bad Request
    end
    alt Other identity error
        IIdentityService-->>ChangePasswordCommandHandler: IdentityResult { Succeeded=false }
        ChangePasswordCommandHandler-->>AuthController: Result.Failure (InternalError)
        AuthController-->>Client: 400 Bad Request
    end
    IIdentityService-->>ChangePasswordCommandHandler: IdentityResult { Succeeded=true }

    ChangePasswordCommandHandler-->>AuthController: Result.Success
    AuthController-->>Client: 200 OK { message: "Password changed successfully" }
```
