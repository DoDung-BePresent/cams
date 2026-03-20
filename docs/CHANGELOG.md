# CHANGELOG — Log.AI-CAMS v2

> **Mục đích:** Ghi nhận các thay đổi có ý nghĩa (API docs, tests, source code) theo từng PR merge vào `develop`.  
> **Quy ước:** Mỗi section = 1 PR merge. So sánh luôn là `develop` vs nhánh tính năng.  
> **Cách dùng:**
>
> - Xem commit chưa merge vào develop: `git log develop..HEAD --oneline`
> - Xem diff chi tiết: `git diff develop..HEAD -- <path>`
> - Tìm thay đổi theo PR: tra cứu SHA merge bên dưới

---

## [2026-03-16] PR #26 — Device pairing, PlaybackDevice access & SpaceState sync

> **Branch:** `feature/nam` → `develop` | **Commits:** `d4f8cbb` (Device pairing & playback device support), `5568020` (SpaceState mapping & SignalR state sync)

---

### 🔀 Commit `5568020` — SpaceState mapping & SignalR state sync

---

### ⚙️ Source Code

#### `SpaceStateDto` — mở rộng playback state fields

| Field mới               | Kiểu      | Mô tả                                                                         |
| ----------------------- | --------- | ----------------------------------------------------------------------------- |
| `StoreId`               | `Guid`    | **ADDED**                                                                     |
| `BrandId`               | `Guid`    | **ADDED**                                                                     |
| `IsPaused`              | `bool`    | **ADDED** — trạng thái pause hiện tại của playback                            |
| `PausePositionSeconds`  | `int?`    | **ADDED** — vị trí (giây) tại thời điểm Pause, dùng cho Resume & progress bar |
| `PendingPlaylistId`     | `Guid?`   | **ADDED** — playlist đang chờ transcode khi override ở trạng thái Pending     |
| `PendingOverrideReason` | `string?` | **ADDED** — lý do override đang pending, hiển thị cho manager/tablet          |

#### `SpaceMappingProfile` — AutoMapper `SpaceMusicState → SpaceStateDto`

| Thay đổi                                                | Mô tả                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ADDED** `CreateMap<SpaceMusicState, SpaceStateDto>()` | Convention mapping cho các field đồng tên; `CurrentPlaylistName` map từ `CurrentPlaylist.Name`; `HlsUrl` và `SeekOffsetSeconds` ignore (computed thủ công trong handler) |

#### `GetSpaceStateQueryHandler` — refactor dùng AutoMapper

| Thay đổi                     | Mô tả                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| **UPDATED** inject `IMapper` | Thay manual DTO init bằng `_mapper.Map<SpaceStateDto>(state)`                                   |
| **KEPT** computed fields     | `HlsUrl`, `SeekOffsetSeconds` vẫn set thủ công sau map vì phụ thuộc CDN URL và time calculation |

#### `CancelSpaceOverrideCommandHandler` — SignalR state sync đầy đủ

| Thay đổi                     | Mô tả                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UPDATED** inject `IMapper` | Thay manual `SpaceStateDto` partial init bằng `_mapper.Map<SpaceStateDto>(state)` trước khi push `SpaceStateSync` — client nhận đủ fields sau khi cancel |

#### `OverrideSpaceMoodCommandHandler` — bổ sung `SpaceStateSync` push

| Thay đổi                     | Mô tả                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UPDATED** inject `IMapper` | Sau `PushManualPlayStreamAsync`, thêm `PushSpaceStateSyncAsync` với full `SpaceStateDto` từ AutoMapper — đảm bảo manager dashboard và tablet đều sync state |

#### `SendPlaybackCommandCommandHandler` — refactor save & SignalR

| Thay đổi                                                       | Mô tả                                                                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **UPDATED** inject `IMapper`                                   | Inject `IMapper` để map `SpaceMusicState → SpaceStateDto`                                                   |
| **REFACTORED** `Apply*Async` → trả về `Task<SpaceMusicState?>` | Các method chỉ load + mutate state, không tự gọi `SaveState`/`SaveChangesAsync`; trả `null` khi no-op       |
| **REFACTORED** single `SaveChangesAsync`                       | Gọi duy nhất 1 lần sau switch block — no-op command (e.g. Pause khi đã pause) không tạo DB write            |
| **REFACTORED** switch expression                               | Thay `switch` statement bằng `switch expression` gán thẳng vào `SpaceMusicState? updatedState`              |
| **ADDED** `PushSpaceStateSyncAsync`                            | Sau mỗi lệnh playback thành công, push full `SpaceStateDto` (AutoMapper) via `SpaceStateSync` SignalR event |

---

---

### 🔀 Commit `d4f8cbb` — Device pairing & playback device support

---

### 📄 API Documentation

#### `docs/auth/API_Auth.md` — cập nhật Device Auth

| Thay đổi                                     | Endpoint / Mục                                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **UPDATED** `POST /api/auth/pair`            | Sửa request body khớp `PairDeviceRequest` (`code`, `manufacturer`, `model`, `osVersion`, `appVersion`); sửa response mô tả `DeviceAuthResponse` |
| **UPDATED** `POST /api/auth/devices/refresh` | Sửa request body dùng `deviceRefreshToken`                                                                                                      |
| **ADDED** mô tả `DeviceAuthResponse`         | `deviceAccessToken`, `deviceRefreshToken`, `expiresAt`, `deviceSessionId`, `spaceId`                                                            |
| **ADDED** mô tả `DeviceAccessTokenResponse`  | `deviceAccessToken`, `expiresAt`                                                                                                                |

#### `docs/cams/API_CAMS.md` — cập nhật CAMS endpoints

| Thay đổi                                                                    | Endpoint                                                                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **ADDED** `POST /api/cams/spaces/{spaceId}/pair-code`                       | Tạo mã ghép đôi 6 ký tự cho Space (BrandManager, StoreManager)                                             |
| **ADDED** `DELETE /api/cams/spaces/{spaceId}/pair-code`                     | Thu hồi mã ghép đôi (BrandManager, StoreManager)                                                           |
| **ADDED** `GET /api/cams/spaces/pair-device`                                | Lấy thông tin ghép đôi; PlaybackDevice không truyền spaceId, Manager bắt buộc                              |
| **ADDED** `DELETE /api/cams/spaces/{spaceId}/pair-device/{deviceSessionId}` | Unregister device session (BrandManager, StoreManager)                                                     |
| **UPDATED** Override/CancelOverride/Playback routes                         | Dual route: không có `{spaceId}` (PlaybackDevice lấy từ session) và có `{spaceId:guid}` (Manager bắt buộc) |
| **UPDATED** `GET /api/cams/spaces/state`                                    | PlaybackDevice không cần truyền `spaceId`                                                                  |

#### `docs/spaces/API_Spaces.md` — cập nhật Spaces API

| Thay đổi                           | Endpoint                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| **UPDATED** `GET /api/spaces/{id}` | PlaybackDevice có thể gọi không truyền `id` — handler tự lấy spaceId từ session |

#### `docs/tracks/API_Tracks.md`, `docs/playlists/API_Playlists.md` — PlaybackDevice matrix

| Thay đổi                | Mô tả                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **UPDATED** auth matrix | PlaybackDevice: read-only `GET` cho playlist/track trong scope Space của mình |

#### `docs/stores/API_Stores.md`, `docs/brands/...` — PlaybackDevice no access

| Thay đổi                | Mô tả                                                    |
| ----------------------- | -------------------------------------------------------- |
| **UPDATED** auth matrix | PlaybackDevice không có quyền truy cập Stores/Brands API |

#### Postman Collections cập nhật

| File                                               | Thay đổi                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `docs/auth/Postman_Collection_Auth.json`           | Fix request body `pair` + `refresh` device; test script lưu `deviceAccessToken`  |
| `docs/cams/Postman_Collection_CAMS.json`           | Thêm pair-code, pair-device endpoints; cập nhật dual-route cho override/playback |
| `docs/spaces/Postman_Collection_Spaces.json`       | Thêm request PlaybackDevice cho `GET /api/spaces/{id}` không truyền id           |
| `docs/tracks/Postman_Collection_Tracks.json`       | Thêm request PlaybackDevice GET tracks                                           |
| `docs/playlists/Postman_Collection_Playlists.json` | Thêm request PlaybackDevice GET playlists                                        |

#### SDD Documents _(NEW)_

| File                              | Mô tả                                                               |
| --------------------------------- | ------------------------------------------------------------------- |
| `docs/auth/SDD_Auth.md`           | SDD đầy đủ cho Auth module (device pairing flow, sequence diagrams) |
| `docs/cams/SDD_CAMS.md`           | SDD đầy đủ cho CAMS module                                          |
| `docs/spaces/SDD_Spaces.md`       | SDD đầy đủ cho Spaces module                                        |
| `docs/playlists/SDD_Playlists.md` | SDD đầy đủ cho Playlists module                                     |
| `docs/tracks/SDD_Tracks.md`       | SDD đầy đủ cho Tracks module                                        |
| `docs/stores/SDD_Stores.md`       | SDD đầy đủ cho Stores module                                        |
| `docs/brands/SDD_Brands.md`       | SDD đầy đủ cho Brands module                                        |
| `docs/users/SDD_Users.md`         | SDD đầy đủ cho Users module                                         |
| `docs/SDD_PackageDiagram.md`      | Package diagram toàn hệ thống                                       |

---

### ⚙️ Source Code

#### Domain — entities & enums mới

| Layer                 | Thay đổi                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain — Entities** | `DeviceSession` — **NEW** (device JWT session; fields: `SpaceId`, `DeviceRefreshTokenHash`, `Manufacturer`, `Model`, `OsVersion`, `AppVersion`, `LastSeenAt`, `ExpiresAt`, `IsRevoked`) |
| **Domain — Entities** | `SpacePairingCode` — **NEW** (mã ghép đôi 6 ký tự ngắn hạn; encrypted + hashed)                                                                                                         |
| **Domain — Entities** | `Space.cs` — **UPDATED** nav props: `DeviceSessions`, `PairingCode`                                                                                                                     |
| **Domain — Enums**    | `RoleEnum.PlaybackDevice` — **ADDED**                                                                                                                                                   |
| **Domain — Enums**    | `UserActionEnum` — **ADDED** (track audit actions)                                                                                                                                      |

#### Infrastructure — services & migrations

| Layer                           | Thay đổi                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Infrastructure — Services**   | `DeviceTokenService` — **NEW** (generate/validate device access JWT, refresh token hashing)                 |
| **Infrastructure — Services**   | `CodeEncryptionService` — **NEW** (AES-256-GCM encrypt/decrypt pair code)                                   |
| **Infrastructure — Services**   | `CurrentUserService` — **UPDATED** (thêm `IsPlaybackDevice`, `GetDeviceContextAsync`)                       |
| **Infrastructure — Hubs**       | `StoreHub.cs` — **UPDATED** (validate Space claim khi tablet join group, enforce scope)                     |
| **Infrastructure — Migrations** | `AddKeyPairAndDeviceSession` — **NEW** (bảng `space_pairing_codes`, `device_sessions`, indexes)             |
| **Infrastructure — DI**         | `InfrastructureDependencyInjection` — **UPDATED** (đăng ký `IDeviceTokenService`, `ICodeEncryptionService`) |

#### Application — Commands & Queries

| Feature                 | Thay đổi                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth — Commands**     | `PairDevice` (command + handler + validator) — **NEW**                                                                                                         |
| **Auth — Commands**     | `RefreshDeviceToken` (command + handler + validator) — **NEW**                                                                                                 |
| **CAMS — Commands**     | `GeneratePairCode` (command + handler + validator) — **NEW**                                                                                                   |
| **CAMS — Commands**     | `RevokePairCode` (command + handler) — **NEW**                                                                                                                 |
| **CAMS — Commands**     | `UnpairDevice` (command + handler) — **NEW**                                                                                                                   |
| **CAMS — Queries**      | `GetPairDeviceInfo` (query + handler) — **NEW** (trả `PairDeviceInfoDto` cho device và manager)                                                                |
| **CAMS — Commands**     | `OverrideSpaceMood`, `CancelSpaceOverride`, `SendPlaybackCommand` — **UPDATED** (`SpaceId` → `Guid?`; handler resolve từ device session nếu là PlaybackDevice) |
| **CAMS — Queries**      | `GetSpaceState` — **UPDATED** (`SpaceId` → `Guid?`; PlaybackDevice lấy từ session)                                                                             |
| **Spaces — Queries**    | `GetSpaceById` — **UPDATED** (`Id` → `Guid?`; PlaybackDevice lấy từ session)                                                                                   |
| **Playlists — Queries** | `GetPlaylists`, `GetPlaylistById` — **UPDATED** (PlaybackDevice: chỉ đọc playlist trong scope space)                                                           |
| **Tracks — Queries**    | `GetTracks`, `GetTrackById` — **UPDATED** (PlaybackDevice: chỉ đọc track trong scope brand)                                                                    |

#### Application — DTOs & Constants

| Thay đổi                                  | Mô tả                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `PairDeviceRequest` — **NEW**             | `code`, `manufacturer`, `model`, `osVersion`, `appVersion`                           |
| `PairCodeResponse` — **NEW**              | `pairingCode`, `expiresAt`, `spaceId`                                                |
| `DeviceAuthResponse` — **NEW**            | `deviceAccessToken`, `deviceRefreshToken`, `expiresAt`, `deviceSessionId`, `spaceId` |
| `DeviceAccessTokenResponse` — **NEW**     | `deviceAccessToken`, `expiresAt`                                                     |
| `RefreshDeviceTokenRequest` — **NEW**     | `deviceRefreshToken`                                                                 |
| `PairDeviceInfoDto` — **NEW**             | Thông tin ghép đôi tổng hợp cho device hoặc manager                                  |
| `PairDeviceMessageKeys` — **NEW**         | Localization keys cho pair device messages                                           |
| `DeviceContextFailureReason` — **NEW**    | Enum lý do validate device session thất bại                                          |
| `SpaceStoreBrandInactiveReason` — **NEW** | Enum lý do không active                                                              |

#### Application — Resources (localization)

| File                                   | Thay đổi                                      |
| -------------------------------------- | --------------------------------------------- |
| `CommonMessages.resx` / `.vi.resx`     | **ADDED** ~12 keys cho device pair/auth flows |
| `SuccessMessages.resx` / `.vi.resx`    | **ADDED** ~4 keys                             |
| `ValidationMessages.resx` / `.vi.resx` | **ADDED** ~3 keys                             |

#### API — Controllers

| Controller                                | Thay đổi                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `AuthController`                          | **UPDATED** — thêm `POST /api/auth/pair`, `POST /api/auth/devices/refresh`, `DELETE /api/auth/devices/unpair` |
| `CamsController`                          | **UPDATED** — thêm pair-code/pair-device endpoints; dual-route cho override/cancel/playback/state             |
| `SpacesController`                        | **UPDATED** — `GET /api/spaces/{id?}` optional id                                                             |
| `PlaylistsController`, `TracksController` | **UPDATED** — thêm PlaybackDevice guard                                                                       |

---

## [2026-03-09] PR #16 — Tracks, Playlists, Moods, CAMS & AWS Infra

> **Merged:** 2026-03-09 22:54 +07:00 | **Merge commit:** `445aafb` | **Branch:** `feature/nam`  
> **Commits:** `445aafb` (Add CAMS docs, S3/CloudFront, MediaConvert & infra) — 2026-03-09

---

### 📄 API Documentation

#### `docs/tracks/API_Tracks.md` _(NEW)_

Tài liệu đầy đủ cho **Track Management API**:

| Method   | Endpoint                         | Auth                           | Mô tả                                       |
| -------- | -------------------------------- | ------------------------------ | ------------------------------------------- |
| `GET`    | `/api/tracks`                    | SA, BrandManager, StoreManager | Danh sách tracks phân trang, filter đa dạng |
| `GET`    | `/api/tracks/{id}`               | SA, BrandManager, StoreManager | Chi tiết track                              |
| `POST`   | `/api/tracks`                    | BrandManager                   | Upload track mới (`multipart/form-data`)    |
| `PUT`    | `/api/tracks/{id}`               | BrandManager                   | Cập nhật track (partial update)             |
| `DELETE` | `/api/tracks/{id}`               | BrandManager                   | Soft delete track                           |
| `PUT`    | `/api/tracks/{id}/toggle-status` | BrandManager                   | Toggle Active ↔ Inactive                    |

**DTOs được tài liệu:** `TrackRequest`, `TrackFilter`, `TrackListItem`, `TrackDetailResponse`  
StoreManager **read-only** — không tạo/sửa/xóa track.

#### `docs/tracks/Postman_Collection_Tracks.json` _(NEW)_

- Standalone Postman collection cho Tracks API — 6 endpoints
- Collection variables: `baseUrl`, `accessToken`, `trackId`

---

#### `docs/playlists/API_Playlists.md` _(NEW)_

Tài liệu đầy đủ cho **Playlist Management API**:

| Method   | Endpoint                               | Auth                           | Mô tả                                |
| -------- | -------------------------------------- | ------------------------------ | ------------------------------------ |
| `GET`    | `/api/playlists`                       | SA, BrandManager, StoreManager | Danh sách playlists phân trang       |
| `GET`    | `/api/playlists/{id}`                  | SA, BrandManager, StoreManager | Chi tiết playlist + danh sách tracks |
| `POST`   | `/api/playlists`                       | BrandManager, StoreManager     | Tạo playlist mới                     |
| `PUT`    | `/api/playlists/{id}`                  | BrandManager, StoreManager     | Cập nhật playlist (partial update)   |
| `DELETE` | `/api/playlists/{id}`                  | BrandManager, StoreManager     | Soft delete playlist                 |
| `PUT`    | `/api/playlists/{id}/toggle-status`    | BrandManager, StoreManager     | Toggle Active ↔ Inactive             |
| `POST`   | `/api/playlists/{id}/tracks`           | BrandManager, StoreManager     | Thêm tracks vào playlist             |
| `DELETE` | `/api/playlists/{id}/tracks/{trackId}` | BrandManager, StoreManager     | Xóa track khỏi playlist              |
| `POST`   | `/api/playlists/{id}/retranscode`      | BrandManager, StoreManager     | Queue lại MediaConvert transcode     |

**DTOs được tài liệu:** `PlaylistRequest`, `PlaylistFilter`, `PlaylistListItem`, `PlaylistDetailResponse`, `PlaylistTrackItem`, `AddTracksToPlaylistRequest`  
SystemAdmin **read-only** — write operations giới hạn cho BrandManager và StoreManager.

#### `docs/playlists/Postman_Collection_Playlists.json` _(NEW)_

- Standalone Postman collection cho Playlists API — 9 endpoints (bao gồm Retranscode)
- Collection variables: `baseUrl`, `accessToken`, `playlistId`, `trackId`

---

#### `docs/moods/API_Moods.md` _(NEW)_

Tài liệu đầy đủ cho **Mood API** (read-only reference data):

| Method | Endpoint     | Auth                           | Mô tả                                             |
| ------ | ------------ | ------------------------------ | ------------------------------------------------- |
| `GET`  | `/api/moods` | SA, BrandManager, StoreManager | Danh sách tất cả moods (global, không phân brand) |

**DTO:** `MoodListItem` — id, moodType, name, minBpm, maxBpm, genre, energyLevel, priority, status  
Thứ tự: `priority ASC` (null xuống cuối) → `name ASC`.

#### `docs/moods/Postman_Collection_Moods.json` _(NEW)_

- Standalone Postman collection cho Moods API — 1 endpoint

---

#### `docs/cams/API_CAMS.md` _(NEW)_

Tài liệu đầy đủ cho **CAMS Manager Playback API**:

| Method   | Endpoint                              | Auth                               | Mô tả                                                                    |
| -------- | ------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `POST`   | `/api/cams/spaces/{spaceId}/override` | BrandManager, StoreManager         | Override nhạc tại space (DirectPlaylist hoặc MoodOverride)               |
| `DELETE` | `/api/cams/spaces/{spaceId}/override` | BrandManager, StoreManager         | Hủy override — trả quyền điều khiển về AI                                |
| `POST`   | `/api/cams/spaces/{spaceId}/playback` | BrandManager, StoreManager         | Gửi lệnh playback (Pause/Resume/Seek/SkipNext/SkipPrevious/SkipToTrack…) |
| `GET`    | `/api/cams/spaces/{spaceId}/state`    | BrandManager, StoreManager, Tablet | Lấy trạng thái phát nhạc hiện tại của space                              |

**Enums được tài liệu:** `OverrideModeEnum` (DirectPlaylist=1, MoodOverride=2), `TransitionTypeEnum` (Immediate=1, Crossfade=2, Pending=3), `PlaybackCommandEnum` (Pause=1…SkipToTrack=8)

#### `docs/cams/SIGNALR_STOREHUB.md` _(NEW)_

Tài liệu SignalR StoreHub — contract events, enum values, TypeScript & Dart code examples:

- **Hub URL:** `/hubs/store`
- **Events push từ server:** `PlayStream`, `StopPlayback`, `SpaceStateSync`, `PlaybackStateChanged`

#### `docs/cams/CAMS_KNOWN_ISSUES.md` _(NEW)_

Danh sách known issues & workarounds của CAMS pipeline.

#### `docs/cams/Postman_Collection_CAMS.json` _(NEW)_

- Standalone Postman collection cho CAMS API — 4 endpoints
- Collection variables: `baseUrl`, `accessToken`, `spaceId`

---

#### `docs/AWS-CLOUDFRONT-MEDIACONVERT-SETUP.md` _(NEW)_

Hướng dẫn thiết lập AWS CloudFront + MediaConvert: IAM roles, distributions, behaviors, MediaConvert job template, cài đặt giá CloudFront tiết kiệm.  
**Đã sanitize** — account ID, CloudFront domain, IAM user đã được thay bằng placeholder.

#### `docs/AWS-S3-SETUP-LOG.md` _(NEW)_

Nhật ký thiết lập S3 bucket: CORS policy, folder structure, pre-signed URLs, bucket permissions.

#### `docs/DEV-PLAN-01-PLAYLIST-MANAGEMENT.md` → `DEV-PLAN-05-MEDIACONVERT-SKIPTOTRACK-PAUSE-RESUME.md` _(NEW × 5)_

Dev plans ghi lại thiết kế kiến trúc và quyết định kỹ thuật theo từng sprint CAMS:

| File          | Nội dung                                  |
| ------------- | ----------------------------------------- |
| `DEV-PLAN-01` | Playlist Management data model & CQRS     |
| `DEV-PLAN-02` | StoreManager Override flow                |
| `DEV-PLAN-03` | HLS + CloudFront + MediaConvert pipeline  |
| `DEV-PLAN-04` | Manual Override & Multi-session sync      |
| `DEV-PLAN-05` | MediaConvert + SkipToTrack + Pause/Resume |

#### `docs/Postman_Collection_LogAI_CAMS_API.json`

| #   | Thay đổi                                                           |
| --- | ------------------------------------------------------------------ |
| 1   | **ADDED** folder **Tracks** — 6 endpoints                          |
| 2   | **ADDED** folder **Playlists** — 9 endpoints (bao gồm Retranscode) |
| 3   | **ADDED** folder **Moods** — 1 endpoint                            |
| 4   | **ADDED** folder **CAMS** — 4 endpoints                            |

---

### ⚙️ Source Code

#### Track Management — hoàn chỉnh CQRS stack

| Layer                           | Thay đổi                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Domain**                      | (dùng entity `Track` và `Mood` hiện có)                                                               |
| **Application — Commands**      | `CreateTrack`, `UpdateTrack`, `DeleteTrack`, `ToggleTrackStatus` (command + handler × 4) — **NEW**    |
| **Application — Queries**       | `GetTracks`, `GetTrackById` (query + handler × 2) — **NEW**                                           |
| **Application — DTOs**          | `TrackRequest`, `TrackFilter`, `TrackListItem`, `TrackDetailResponse` — **NEW**                       |
| **Application — Extensions**    | `TrackAuthorizationExtensions`, `TrackQueryExtensions` — **NEW**                                      |
| **Application — Interfaces**    | `ITrackRequest` — **NEW**                                                                             |
| **Application — Validators**    | `SharedTrackRequestValidator`, `CreateTrackCommandValidator`, `UpdateTrackCommandValidator` — **NEW** |
| **Application — QueryBuilders** | `TrackQueryBuilder` — **NEW**                                                                         |
| **Application — Mappings**      | `TrackMappingProfile` — **NEW**                                                                       |
| **Application — Resources**     | `ValidationMessages.resx` + `.vi.resx` — thêm Track field display names                               |
| **API**                         | `TracksController` — **NEW**                                                                          |

#### Playlist Management — hoàn chỉnh CQRS stack

| Layer                           | Thay đổi                                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**                      | `Playlist.cs` — **NEW**; `PlaylistTrack.cs` — update (kế thừa BaseEntity)                                                                                                               |
| **Application — Commands**      | `CreatePlaylist`, `UpdatePlaylist`, `DeletePlaylist`, `TogglePlaylistStatus`, `AddTracksToPlaylist`, `RemoveTrackFromPlaylist`, `RetranscodePlaylist` (command + handler × 7) — **NEW** |
| **Application — Queries**       | `GetPlaylists`, `GetPlaylistById` (query + handler × 2) — **NEW**                                                                                                                       |
| **Application — DTOs**          | `PlaylistRequest`, `PlaylistFilter`, `PlaylistListItem`, `PlaylistDetailResponse`, `PlaylistTrackItem`, `AddTracksToPlaylistRequest` — **NEW**                                          |
| **Application — Extensions**    | `PlaylistAuthorizationExtensions`, `PlaylistQueryExtensions` — **NEW**                                                                                                                  |
| **Application — Interfaces**    | `IPlaylistRequest` — **NEW**                                                                                                                                                            |
| **Application — Helpers**       | `PlaylistActiveStreamGuard`, `PlaylistTrackOrderHelper` — **NEW**                                                                                                                       |
| **Application — Validators**    | `SharedPlaylistRequestValidator`, `CreatePlaylistCommandValidator`, `UpdatePlaylistCommandValidator` — **NEW**                                                                          |
| **Application — QueryBuilders** | `PlaylistQueryBuilder` — **NEW**                                                                                                                                                        |
| **Application — Mappings**      | `PlaylistMappingProfile` — **NEW**                                                                                                                                                      |
| **Application — Resources**     | `ValidationMessages.resx` + `.vi.resx` — thêm Playlist field display names                                                                                                              |
| **API**                         | `PlaylistsController` — **NEW**                                                                                                                                                         |

#### Mood — query đơn giản

| Layer                      | Thay đổi                               |
| -------------------------- | -------------------------------------- |
| **Application — Queries**  | `GetMoods` (query + handler) — **NEW** |
| **Application — DTOs**     | `MoodListItem` — **NEW**               |
| **Application — Mappings** | `MoodMappingProfile` — **NEW**         |
| **API**                    | `MoodsController` — **NEW**            |

#### CAMS (Context-Aware AI Music System) — core engine

| Layer                           | Thay đổi                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**                      | `SpaceMusicState.cs` — **NEW** entity; Enums: `OverrideModeEnum`, `PlaybackCommandEnum`, `TranscodeStatusEnum`, `TransitionTypeEnum` — **NEW**           |
| **Application — Commands**      | `OverrideSpaceMood`, `CancelSpaceOverride`, `SendPlaybackCommand`, `AnalyzeSpaceContext` (command + handler × 4) — **NEW**                               |
| **Application — Domain Events** | `MoodChangedDomainEventHandler` — **UPDATED** (clear state + StopPlayback khi không tìm được playlist)                                                   |
| **Application — Queries**       | `GetSpaceState` (query + handler) — **NEW**                                                                                                              |
| **Application — DTOs**          | `OverrideSpaceMoodRequest`, `PlaybackCommandDto`, `SpaceOverrideResponse`, `SpaceStateDto` — **NEW**                                                     |
| **Infrastructure**              | `StoreHub` (SignalR Hub) — **NEW**; `SignalRMusicService` — **NEW**                                                                                      |
| **Infrastructure**              | `MediaConvertService` (AWS MediaConvert integration) — **NEW**                                                                                           |
| **Infrastructure**              | `BackgroundTranscodeService` (queue transcode background) — **NEW**                                                                                      |
| **Infrastructure**              | `S3FileService` (unified S3: track, cover, playlist folder) — **NEW**                                                                                    |
| **Infrastructure**              | `PlaybackHistoryService` (audit log) — **NEW**                                                                                                           |
| **Infrastructure — Jobs**       | `PlaylistTranscodeJob`, `PlaylistTranscodeStatusJob`, `DeleteS3FolderJob`, `PlaybackHistoryLogJob` — **NEW**; `PlaylistTransitionJob` — **REWRITE**      |
| **Infrastructure — Migrations** | `AddSpaceMusicStateEntity`, `PlaylistTrackInheritsBaseEntity`, `AddIsManualOverrideToSpaceMusicState`, `AddTranscodeAndSessionStateFields` — **NEW × 4** |
| **Infrastructure — Repository** | `SpaceMusicStateRepository` — **NEW**                                                                                                                    |
| **API**                         | `CamsController` — **NEW**                                                                                                                               |

---

### 🐛 Bug Fixes

#### `MoodChangedDomainEventHandler.cs`

| #   | Thay đổi                                                   | Mô tả                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **FIXED** Clear playlist state khi không tìm được playlist | Trước backoff 5 phút nhưng giữ `CurrentPlaylistId` → tablet tiếp tục request HLS segments → CloudFront billing tăng. Fix: clear tất cả playback fields + gửi `StopPlayback` SignalR để tablet dừng ngay. |

#### `GetSpaceStateQueryHandler.cs`

| #   | Thay đổi                                                        | Mô tả                                                                                                                                                                             |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **FIXED** `seekOffsetSeconds` unbounded growth                  | Áp dụng modulo theo `TotalDurationSeconds` — ngăn seek position vượt quá độ dài playlist.                                                                                         |
| 2   | **FIXED** `expectedEndAtUtc` lộ ra client khi không có playlist | Khi `CurrentPlaylistId is null`, tất cả timing fields (`hlsUrl`, `startedAtUtc`, `expectedEndAtUtc`, `seekOffsetSeconds`) trả về `null` — internal backoff timer không bị expose. |

#### `SpaceMusicStateRepository.cs`

| #   | Thay đổi                                                                | Mô tả                                                                                            |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | **FIXED** `UpsertAsync` thiếu sync `IsPaused` và `PausePositionSeconds` | Hai fields bị thiếu trong update block → trạng thái pause/resume không được lưu đúng sau upsert. |

#### `.env.example`

| #   | Thay đổi                                                  | Mô tả                                                         |
| --- | --------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | **ADDED** `FileStorage__S3__PresignedUrlExpiryMinutes=60` | Biến này có trong `.env` nhưng bị thiếu trong `.env.example`. |

---

## [2026-03-04] PR #15 — CAMS Core Engine

> **Merged:** 2026-03-04 13:45 +07:00 | **Merge commit:** `21b361d` | **Branch:** `feature/dat`  
> **Commits:** `c9333b1` (store/space config & fuzzy logic + Hangfire), `afc8466` (unit tests, fuzzy engine), `2fccb18` (sliding windows), `2d44706` (config .env) — 2026-03-04

---

### ⚙️ Source Code

#### CAMS Core Engine — Fuzzy Logic & IoT Pipeline (v1)

| Layer                           | Thay đổi                                                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**                      | `SpaceMusicState.cs` — **NEW** entity; `IDomainEvent`, `MoodChangedDomainEvent` — **NEW** domain events; Enums: `CamsMood` (Chill/Focus/Energetic), `FuzzyDensity`, `FuzzyPressure`, `FuzzyStress` — **NEW**                                      |
| **Application — Services**      | `FuzzyLogicEngine` (customer density/pressure/stress → CamsMood via fuzzy membership functions) — **NEW**; `SlidingWindowAggregator` (IoT telemetry time-window aggregation) — **NEW**; `ConfigResolverService`, `HlsUrlBuilderService` — **NEW** |
| **Application — Commands**      | `AnalyzeSpaceContext` (+ validator), `EvaluateAndTransitionPlaylist` (command + handler × 2) — **NEW**                                                                                                                                            |
| **Application — Domain Events** | `MoodChangedDomainEventHandler` (v1) — **NEW**: chọn playlist khi mood thay đổi, push `PlayStream` qua SignalR                                                                                                                                    |
| **Application — Queries**       | `GetActiveSpacesForCams`, `GetSpaceCurrentMood` (query + handler × 2) — **NEW**                                                                                                                                                                   |
| **Application — DTOs**          | `ContextAnalysisDto`, `FuzzyAnalysisResult`, `FuzzyThresholds`, `IotTelemetryPayload`, `SpaceMoodDto`, `HlsPlaylistInfo`, `ActiveSpaceForCamsDto` — **NEW**                                                                                       |
| **Application — Interfaces**    | `IConfigResolverService`, `IContextHistoryRepository`, `IFuzzyLogicEngine`, `IHlsUrlBuilderService`, `ISlidingWindowAggregator`, `ITelemetryRepository` — **NEW**                                                                                 |
| **Infrastructure**              | `StoreHub` (SignalR Hub v1) — **NEW**; `SpaceMusicStateRepository`, `ContextHistoryRepository`, `FirestoreTelemetryRepository`, `MusicRepository` (v1) — **NEW**                                                                                  |
| **Infrastructure**              | `SignalRMusicService` (v1), `HlsUrlBuilderService` — **NEW**                                                                                                                                                                                      |
| **Infrastructure — Jobs**       | `PlaylistTransitionJob` (Hangfire — kiểm tra & chuyển playlist theo lịch) — **NEW**                                                                                                                                                               |
| **Infrastructure — Workers**    | `ContextAnalysisWorker` (background worker — poll IoT telemetry mỗi chu kỳ, trigger `AnalyzeSpaceContext`) — **NEW**                                                                                                                              |
| **Infrastructure — Config**     | `FirestoreOptions` (Firestore telemetry DB), `AwsCdnOptions` (CloudFront CDN) — **NEW**; `HangfireConfiguration` — **UPDATED**                                                                                                                    |
| **Config**                      | `.env.example` — thêm env vars CAMS/Firestore/CloudFront; `docker-compose.yml` — cập nhật services                                                                                                                                                |
| **Solution**                    | `LogAICAMS.CAMS.Tests` project — thêm vào `.sln`                                                                                                                                                                                                  |

---

### 🧪 Tests — NEW project: `LogAICAMS.CAMS.Tests`

| File                              | Mô tả                                                                    |
| --------------------------------- | ------------------------------------------------------------------------ |
| `FuzzyLogicEngineTests.cs`        | Test membership functions, defuzzification rules (Chill/Focus/Energetic) |
| `SlidingWindowAggregatorTests.cs` | Test aggregation IoT telemetry theo time-window                          |
| `CamsBackgroundFlowTests.cs`      | Integration test: IoT → mood change → playlist selection → SignalR push  |
| `MockImplementations/`            | `MockMusicRepository`, `MockTelemetryRepository` — test isolation        |

---

### 📄 API Documentation

#### `docs/CAMS-CLOUDFRONT-SETUP.md` _(NEW)_

Tài liệu setup CloudFront + CAMS pipeline (v1 — trước khi có MediaConvert). Ghi nhận các quyết định CDN ban đầu.

---

## [2026-03-04] PR #12 — Space Management

> **Merged:** 2026-03-04 13:25 +07:00 | **Merge commit:** `77648ee` | **Branch:** `feature/nam`  
> **Commits:** `80b935f` (Add Spaces API, DTOs, docs and tests), `96160d7` (add changelog) — 2026-03-04

---

### 📄 API Documentation

#### `docs/spaces/API_Spaces.md` _(NEW)_

Tài liệu đầy đủ cho **Space Management API**:

| Method   | Endpoint                         | Auth                           | Mô tả                                       |
| -------- | -------------------------------- | ------------------------------ | ------------------------------------------- |
| `GET`    | `/api/spaces`                    | SA, BrandManager, StoreManager | Danh sách spaces phân trang, filter đa dạng |
| `GET`    | `/api/spaces/{id}`               | SA, BrandManager, StoreManager | Chi tiết space                              |
| `POST`   | `/api/spaces`                    | BrandManager, StoreManager     | Tạo space mới                               |
| `PUT`    | `/api/spaces/{id}`               | BrandManager, StoreManager     | Cập nhật space                              |
| `DELETE` | `/api/spaces/{id}`               | BrandManager, StoreManager     | Soft delete space                           |
| `PUT`    | `/api/spaces/{id}/toggle-status` | BrandManager, StoreManager     | Toggle Active ↔ Inactive                    |

**DTOs được tài liệu:** `SpaceFilter`, `SpaceRequest`, `SpaceListItem`, `SpaceDetailResponse`  
TypeScript types + Dart types cho tất cả DTOs trên.

#### `docs/spaces/Postman_Collection_Spaces.json` _(NEW)_

- Standalone Postman collection cho Spaces API — 6 endpoints
- Collection variables: `baseUrl`, `accessToken`

#### `docs/Postman_Collection_LogAI_CAMS_API.json`

| #   | Thay đổi                                                               |
| --- | ---------------------------------------------------------------------- |
| 1   | **ADDED** folder **Spaces** — 6 endpoints Spaces vào master collection |
| 2   | **UPDATED** `info.description` — thêm dòng Spaces                      |

---

### 🧪 Test Documentation

#### `tests/docs/spaces/SPACE_UNIT_TESTS_SUMMARY.md` _(NEW)_

| Module                            | Test Cases | File                                      |
| --------------------------------- | ---------- | ----------------------------------------- |
| `CreateSpaceCommandValidator`     | 9          | `CreateSpaceCommandValidatorTests.cs`     |
| `UpdateSpaceCommandValidator`     | 6          | `UpdateSpaceCommandValidatorTests.cs`     |
| `CreateSpaceCommandHandler`       | 9          | `CreateSpaceCommandHandlerTests.cs`       |
| `UpdateSpaceCommandHandler`       | 8          | `UpdateSpaceCommandHandlerTests.cs`       |
| `DeleteSpaceCommandHandler`       | 8          | `DeleteSpaceCommandHandlerTests.cs`       |
| `ToggleSpaceStatusCommandHandler` | 7          | `ToggleSpaceStatusCommandHandlerTests.cs` |
| `GetSpacesQueryHandler`           | 7          | `GetSpacesQueryHandlerTests.cs`           |
| `GetSpaceByIdQueryHandler`        | 8          | `GetSpaceByIdQueryHandlerTests.cs`        |
| **Tổng**                          | **62**     | **8 files**                               |

#### `tests/docs/README.md`

| #   | Thay đổi                             | Mô tả                                    |
| --- | ------------------------------------ | ---------------------------------------- |
| 1   | **UPDATED** bảng tổng hợp test suite | Thêm mục Spaces (62 test cases, 8 files) |

---

### ⚙️ Source Code

#### Space Management — hoàn chỉnh CQRS stack

| Layer                           | Thay đổi                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Domain**                      | `Space.cs` — cập nhật; xóa field `IoTSensorId`                                                                   |
| **Application — Commands**      | `CreateSpace`, `UpdateSpace`, `DeleteSpace`, `ToggleSpaceStatus` (command + handler × 4) — refactor + hoàn thiện |
| **Application — Queries**       | `GetSpaces`, `GetSpaceById` (query + handler × 2) — **NEW**; xóa `GetSpacesByStore` (deprecated)                 |
| **Application — DTOs**          | `SpaceDetailResponse`, `SpaceFilter`, `SpaceListItem`, `SpaceRequest` — **NEW**                                  |
| **Application — Extensions**    | `SpaceAuthorizationExtensions`, `SpaceQueryExtensions` — **NEW**                                                 |
| **Application — Interfaces**    | `ISpaceRequest` — **NEW**                                                                                        |
| **Application — Validators**    | `SharedSpaceRequestValidator`, `CreateSpaceCommandValidator`, `UpdateSpaceCommandValidator` — **NEW**            |
| **Application — QueryBuilders** | `SpaceQueryBuilder` — **NEW**                                                                                    |
| **Application — Mappings**      | `SpaceMappingProfile` — cập nhật                                                                                 |
| **Application — Resources**     | `ValidationMessages.resx` + `.vi.resx` — thêm 7 Space field display names                                        |
| **Infrastructure**              | Migration `20260303140743_RemoveIoTSensorIdFromSpace` — xóa cột `iot_sensor_id` khỏi bảng spaces                 |
| **API**                         | `SpacesController` — refactor toàn bộ, fix `[AuthorizeRoles()]` theo auth matrix                                 |

---

## [2026-03-01] PR #11 — EmailConfirmed Login Fix

> **Merged:** 2026-03-01 21:18 +07:00 | **Merge commit:** `555d0e3` | **Branch:** `feature/nam`  
> **Commits:** `abb9df3` (2026-03-01)

---

### �🐛 Bug Fixes

#### `UserMappingProfile.cs`

| #   | Thay đổi                                                   | Mô tả                                                                                                                                                             |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **FIXED** `CreateUserRequest → AppUser` — `EmailConfirmed` | Trước được ignore → user tạo ra có `EmailConfirmed = false` → ASP.NET Identity block đăng nhập. Này map cứng `true` — hệ thống không dùng email verification flow |

---

## [2026-03-01] PR #10 — Store Management & ToggleBrandStatus

> **Merged:** 2026-03-01 20:52 +07:00 | **Merge commit:** `93410b1` | **Branch:** `feature/nam`  
> **Commits:** `2a0952f` (2026-03-01)

---

### 📄 API Documentation

#### `docs/stores/API_Stores.md` _(NEW)_

Tài liệu đầy đủ cho **Store Management API**:

| Method   | Endpoint                         | Auth                           | Mô tả                                       |
| -------- | -------------------------------- | ------------------------------ | ------------------------------------------- |
| `GET`    | `/api/stores`                    | SA, BrandManager               | Danh sách stores phân trang, filter đa dạng |
| `GET`    | `/api/stores/{id}`               | SA, BrandManager, StoreManager | Chi tiết store                              |
| `POST`   | `/api/stores`                    | BrandManager                   | Tạo store mới                               |
| `PUT`    | `/api/stores/{id}`               | BrandManager                   | Cập nhật store                              |
| `DELETE` | `/api/stores/{id}`               | BrandManager                   | Soft delete store                           |
| `PUT`    | `/api/stores/{id}/toggle-status` | BrandManager                   | Toggle Active ↔ Inactive                    |

**DTOs được tài liệu:** `StoreFilter`, `StoreRequest`, `StoreListItem`, `StoreDetailResponse`  
TypeScript types + Dart types cho tất cả DTOs trên.

#### `docs/stores/Postman_Collection_Stores.json` _(NEW)_

- Standalone Postman collection cho Stores API — 6 endpoints
- Collection variables: `baseUrl`, `accessToken`, `storeId`

#### `docs/brands/API_Brands.md`

| #   | Thay đổi                                              | Mô tả                                                                                                                                                  |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **ADDED** §5.7 — `PUT /api/brands/{id}/toggle-status` | Toggle trạng thái Brand Active ↔ Inactive (SystemAdmin only); response 200/403/404/422; điều kiện: không thể toggle Brand có Primary Owner đang Active |
| 2   | **UPDATED** Auth matrix                               | Thêm hàng `toggle-status` vào bảng phân quyền                                                                                                          |

#### `docs/users/API_Users.md`

| #   | Thay đổi                                              | Mô tả                                                                                               |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | **UPDATED** §4.1 GET /api/users — BrandManager filter | Bổ sung ghi chú bảo mật: BrandManager không thể override `brandId` — server tự ép về `user.BrandId` |

#### `docs/Postman_Collection_LogAI_CAMS_API.json`

| #   | Thay đổi                                                               |
| --- | ---------------------------------------------------------------------- |
| 1   | **ADDED** folder **Stores** — 6 endpoints Stores vào master collection |
| 2   | **ADDED** item `Toggle Brand Status` vào folder Brands                 |

#### `docs/brands/Postman_Collection_Brands.json`

- **ADDED** item `Toggle Brand Status` (7 items tổng cộng)

---

### 🧪 Test Documentation

#### `tests/docs/stores/STORE_UNIT_TESTS_SUMMARY.md` _(NEW)_

| Module                            | Test Cases | File                                      |
| --------------------------------- | ---------- | ----------------------------------------- |
| `CreateStoreCommandValidator`     | 15         | `CreateStoreCommandValidatorTests.cs`     |
| `UpdateStoreCommandValidator`     | 5          | `UpdateStoreCommandValidatorTests.cs`     |
| `CreateStoreCommandHandler`       | 7          | `CreateStoreCommandHandlerTests.cs`       |
| `UpdateStoreCommandHandler`       | 7          | `UpdateStoreCommandHandlerTests.cs`       |
| `DeleteStoreCommandHandler`       | 7          | `DeleteStoreCommandHandlerTests.cs`       |
| `ToggleStoreStatusCommandHandler` | 6          | `ToggleStoreStatusCommandHandlerTests.cs` |
| `GetStoreByIdQueryHandler`        | 7          | `GetStoreByIdQueryHandlerTests.cs`        |
| `GetStoresQueryHandler`           | 6          | `GetStoresQueryHandlerTests.cs`           |
| **Tổng**                          | **61**     | **8 files**                               |

#### `tests/docs/brands/BRAND_UNIT_TESTS_SUMMARY.md`

| #   | Thay đổi                                                | Mô tả                                                                                                                            |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **ADDED** §1.9 — `ToggleBrandStatusCommandHandlerTests` | 6 test cases (H01–H06): not found, trạng thái không đổi, PrimaryOwner Active → block, Active→Inactive, Inactive→Active, DB error |
| 2   | **UPDATED** Tổng số test cases                          | 69 → **75**                                                                                                                      |
| 3   | **UPDATED** Tổng số file                                | 7 → **9 files**                                                                                                                  |

#### `tests/docs/users/USER_UNIT_TESTS_SUMMARY.md`

| #   | Thay đổi                                   | Mô tả                                                                                                      |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1   | **UPDATED** §1.11 — `GetUsersQueryHandler` | 4 → **6 test cases**: H05 (null brandId → Forbidden), H06 (override filter → bị server ép về user.BrandId) |
| 2   | **UPDATED** Tổng số test cases             | 89 → **91**                                                                                                |

---

### ⚙️ Source Code

#### Store Management — toàn bộ stack mới

| Layer                           | Thay đổi                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| **Domain**                      | `Store.cs` — entity cập nhật                                                             |
| **Application — Commands**      | `CreateStore`, `UpdateStore`, `DeleteStore`, `ToggleStoreStatus` (command + handler × 4) |
| **Application — Queries**       | `GetStores`, `GetStoreById` (query + handler × 2)                                        |
| **Application — DTOs**          | `StoreDetailResponse`, `StoreFilter`, `StoreListItem`, `StoreRequest`                    |
| **Application — Extensions**    | `StoreAuthorizationExtensions`, `StoreQueryExtensions`                                   |
| **Application — Interfaces**    | `IStoreRequest`                                                                          |
| **Application — Validators**    | `SharedStoreRequestValidator`, `UpdateStoreCommandValidator`                             |
| **Application — QueryBuilders** | `StoreQueryBuilder`                                                                      |
| **Application — Mappings**      | `StoreMappingProfile` — cập nhật                                                         |
| **Application — Constants**     | `SuccessMessageKeys` — thêm Store keys                                                   |
| **Application — Enums**         | `SuccessActionEnum` + `UserActionEnum` — thêm `ToggleStatus`                             |
| **Application — Resources**     | `ErrorMessages`, `SuccessMessages`, `ValidationMessages` (.resx + .vi.resx)              |
| **Infrastructure**              | `LogAICAMSDbContext` — store indexes; Migration `20260301100238_AddIndexInStoreEntity`   |
| **API**                         | `StoresController` — fix tất cả `[AuthorizeRoles()]` theo auth matrix                    |

#### ToggleBrandStatus — tính năng mới

| Layer                        | Thay đổi                                                       |
| ---------------------------- | -------------------------------------------------------------- |
| **Application — Commands**   | `ToggleBrandStatusCommand` + `ToggleBrandStatusCommandHandler` |
| **Application — Extensions** | `BrandAuthorizationExtensions` — thêm nhánh `ToggleStatus`     |
| **Application — Extensions** | `AuditServiceExtensions` — thêm `LogEntityToggleStatus`        |
| **API**                      | `BrandsController` — thêm endpoint `PUT /{id}/toggle-status`   |

#### Security Fix — GetUsers BrandManager BrandId override

| Layer                     | Thay đổi                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| **Application — Queries** | `GetUsersQueryHandler` — ép `filter.BrandId = user.BrandId`; 403 nếu BrandManager gửi `null` |

#### Miscellaneous

| File                             | Thay đổi                 |
| -------------------------------- | ------------------------ |
| `HangfireConfiguration`          | Đăng ký queue `user-ops` |
| `SpacesController`               | Cập nhật nhỏ             |
| `ToggleUserStatusCommandHandler` | Cập nhật nhỏ             |

---

## [2026-02-27] PR #9 — Sync merge (feature/nam → develop)

> **Merged:** 2026-02-27 11:42 +07:00 | **Merge commit:** `91651e6` | **Branch:** `feature/nam`  
> _PR này là merge đồng bộ sau khi feature/nam tích hợp lại develop từ PR #8. Không có commit tính năng mới._

---

## [2026-02-25] PR #8 — User Management, Transfer Ownership & Brand API Docs

> **Merged:** 2026-02-25 17:26 +07:00 | **Merge commit:** `848c597` | **Branch:** `feature/nam`  
> **Commits:** `9c7cb01` (2026-02-24) · `a148ad0` (2026-02-24) · `3c3773c` (2026-02-25) · `807e59d` (2026-02-25)

---

### 📄 API Documentation

#### `docs/brands/API_Brands.md`

| #   | Thay đổi                                                   | Mô tả                                                                                 |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | **ADDED** §5.6 — `PUT /api/brands/{id}/transfer-ownership` | Endpoint chuyển Primary Owner: request body, auth rules, response 200/401/403/404/422 |
| 2   | **ADDED** §4.2 BrandFilter — `primaryOwnerId`              | Query param `primaryOwnerId` (Guid?) để lọc brands theo Primary Owner                 |
| 3   | **ADDED** §4.3 BrandListItem — `primaryOwnerId`            | Field `primaryOwnerId: string? (Guid)` trong response BrandListItem                   |
| 4   | **UPDATED** §5.3 POST /api/brands — Response 201 → 200     | Thống nhất HTTP 200 cho create operation                                              |
| 5   | **UPDATED** §5.3 + §5.4 — Business rule 422                | Bổ sung lỗi trùng TaxCode và ContactEmail (không chỉ Name)                            |
| 6   | **UPDATED** TypeScript `BrandFilter` + `BrandListItem`     | Thêm `primaryOwnerId` field                                                           |
| 7   | **UPDATED** Dart `BrandListItem`                           | Thêm `primaryOwnerId`, constructor param, fromJson mapping                            |
| 8   | **UPDATED** §5.1 GET brands sample response                | Thêm `primaryOwnerId`, `industry`, `primaryContactName`                               |

#### `docs/users/API_Users.md` _(NEW)_

Tài liệu đầy đủ **User Management API**:

| Endpoint                             | Mô tả                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `GET /api/users`                     | Danh sách users phân trang (role, brandId, storeId, search, isPrimaryOwner…) |
| `GET /api/users/{id}`                | Chi tiết user (SA xem tất cả; BM xem own-brand non-SA)                       |
| `POST /api/users`                    | Tạo user mới (multipart/form-data, role rules, avatar upload)                |
| `PATCH /api/users/{id}`              | Cập nhật user (partial update, email/phone unique check)                     |
| `PUT /api/users/{id}/status`         | Toggle status Active ↔ Inactive                                              |
| `PUT /api/users/{id}/reset-password` | Admin-initiated password reset                                               |
| `PUT /api/users/{id}/brand`          | Chuyển brand (SA only; revoke sessions)                                      |
| `PUT /api/users/{id}/store`          | Gán/gỡ store (null = unassign; revoke sessions)                              |

**DTOs:** `UserFilter`, `CreateUserRequest`, `UpdateUserRequest`, `ResetUserPasswordRequest`, `AssignUserBrand/StoreRequest`, `UserListItem`, `UserDetailResponse`  
TypeScript types + Dart types cho tất cả.

#### `docs/Postman_Collection_LogAI_CAMS_API.json`

- **ADDED** folder **Users** với 8 endpoints vào master collection

#### `docs/users/Postman_Collection_Users.json` _(NEW)_

- Standalone Postman collection cho Users API — 8 endpoints
- Collection variables: `baseUrl`, `accessToken`, `userId`

#### `docs/brands/Postman_Collection_Brands.json`

- Cập nhật nhỏ format và response examples

---

### 🧪 Test Documentation

#### `tests/docs/brands/BRAND_UNIT_TESTS_SUMMARY.md`

| #   | Thay đổi                        | Mô tả                                                     |
| --- | ------------------------------- | --------------------------------------------------------- |
| 1   | **ADDED** `TC_BRAND_CREATE_H07` | TaxCode trùng → `BusinessRuleViolationException`          |
| 2   | **ADDED** `TC_BRAND_CREATE_H08` | ContactEmail trùng → `BusinessRuleViolationException`     |
| 3   | **ADDED** `TC_BRAND_UPDATE_H10` | TaxCode mới trùng → `BusinessRuleViolationException`      |
| 4   | **ADDED** `TC_BRAND_UPDATE_H11` | ContactEmail mới trùng → `BusinessRuleViolationException` |
| 5   | **UPDATED** Transfer Ownership  | `TransferOwnershipCommandHandlerTests` — 10+ test cases   |
| 6   | **UPDATED** Tổng số test cases  | 48+ → **57+**                                             |

#### `tests/docs/users/USER_UNIT_TESTS_SUMMARY.md` _(NEW)_

| Module                                        | Test Cases |
| --------------------------------------------- | ---------- |
| `CreateUserCommandHandler` + Validator        | 18+        |
| `UpdateUserCommandHandler` + Validator        | 16+        |
| `ToggleUserStatusCommandHandler`              | 10+        |
| `ResetUserPasswordCommandHandler` + Validator | 12+        |
| `AssignUserBrandCommandHandler`               | 8+         |
| `AssignUserStoreCommandHandler`               | 8+         |
| `GetUsersQueryHandler`                        | 5+         |
| `GetUserByIdQueryHandler`                     | 5+         |
| **Tổng**                                      | **80+**    |

---

### ⚙️ Source Code

| Commit    | Thay đổi                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `9c7cb01` | Full User management CQRS stack — 8 commands/queries, validator, mapping, controller                   |
| `9c7cb01` | `TransferOwnershipCommandHandler` — chuyển PrimaryOwnerId của Brand                                    |
| `9c7cb01` | `UserQueryExtensions` — raw SQL paging cho GetUsers                                                    |
| `a148ad0` | `BrandQueryExtensions.FindDuplicateFieldAsync` — single-query unique check (Name/TaxCode/ContactEmail) |
| `a148ad0` | Refactor `CreateBrandCommandHandler` + `UpdateBrandCommandHandler` dùng shared helper                  |
| `a148ad0` | `LogAICAMSDbContext` — thêm index `HasIndex(x => x.TaxCode)`                                           |
| `3c3773c` | Fix `UserQueryExtensions.SelectColumns` — bare snake_case alias để tương thích Npgsql                  |
| `807e59d` | `BrandFilter.cs` — thêm `PrimaryOwnerId` filter property                                               |
| `807e59d` | `BrandQueryBuilder.cs` — thêm `AddFilterRule` cho `PrimaryOwnerId`                                     |

---

## [2026-02-25] PR #7 — Brand validation docs cleanup

> **Merged:** 2026-02-25 16:24 +07:00 | **Merge commit:** `0d9725d` | **Branch:** `feature/nam`  
> **Commits:** `33e57fa` (2026-02-25)

- **`docs/brands/API_Brands.md`** — làm rõ BrandRequest validation rules, format minor fixes

---

## [2026-02-24] PR #6 — Brand model enhancement & localization

> **Merged:** 2026-02-24 23:52 +07:00 | **Merge commit:** `a262be0` | **Branch:** `feature/nam`  
> **Commits:** `01861db` · `850096b` · `5ff1ce1`

- `01861db` — Enhance Brand model & API docs; add EF migration
- `850096b` — Localize Brand NotFound exceptions (EN + VI resource files)
- `5ff1ce1` — Add exceptions to ignore list; add FluentValidation labels

---

## [2026-02-23] PR #5 — Brand CRUD feature & background file jobs

> **Merged:** 2026-02-23 12:05 +07:00 | **Merge commit:** `15d756e` | **Branch:** `feature/nam`  
> **Commits:** `54c7387` · `4692b47`

- `54c7387` — Full Brand feature: CQRS stack (Create/Update/Delete/Get), controller, mapping, migration
- `4692b47` — Persist logs/uploads volumes; add `file-ops` Hangfire queue; fix JSONB cast

---

## [2026-02-22] PR #4 — Environment configuration update

> **Merged:** 2026-02-22 23:20 +07:00 | **Merge commit:** `5060c0d` | **Branch:** `feature/nam`  
> **Commits:** `8db2157`

- `8db2157` — Cập nhật `.env.example` với các biến môi trường mới

---

## [2026-02-20] PR #3 — Auth docs & change-password endpoint

> **Merged:** 2026-02-20 10:39 +07:00 | **Merge commit:** `c201340` | **Branch:** `feature/nam`  
> **Commits:** `64d0429`

- `64d0429` — `docs/auth/API_Auth.md`: tài liệu Auth endpoints (login, logout, refresh-token, change-password)
- Thêm endpoint `POST /api/auth/change-password`

---

## [2026-02-16] PR #2 — Audit logging & Refresh-token cookie flow

> **Merged:** 2026-02-16 10:57 +07:00 | **Merge commit:** `8eb2a9e` | **Branch:** `feature/nam`  
> **Commits:** `b64b4e8`

- `b64b4e8` — Audit logging infrastructure (log entity changes to DB)
- Refresh-token stored in HTTP-only cookie; access-token in response body

---

## Hướng dẫn cập nhật CHANGELOG

### Khi tạo PR vào `develop`

1. Di chuyển nội dung `[Unreleased]` xuống thành section mới:
   ```
   ## [YYYY-MM-DD] PR #N — <tiêu đề ngắn gọn>
   > Merged: <ngày> | Merge commit: `<sha>` | Branch: `feature/<name>`
   > Commits: `<sha1>` · `<sha2>` · ...
   ```
2. Xoá nội dung `[Unreleased]` cũ (để trống cho commits tiếp theo).
3. Commit CHANGELOG cùng với commit cuối trên branch trước khi tạo PR.

### Khi làm tính năng mới (trên branch của mình)

- Thêm entries vào `[Unreleased]` ngay khi hoàn thành từng phần.
- Ghi rõ: loại thay đổi (`ADDED` / `UPDATED` / `FIXED` / `REMOVED`), file ảnh hưởng, mô tả ngắn.

### Lệnh tham chiếu nhanh

```bash
# Xem commits chưa merge vào develop
git log develop..HEAD --oneline

# Xem diff docs so với develop
git diff develop..HEAD -- docs/

# Xem diff tests so với develop
git diff develop..HEAD -- tests/docs/

# Xem tất cả PR merge commits trên develop (kèm timestamp)
git log --merges --first-parent develop --format="%h %ai %s"
```
