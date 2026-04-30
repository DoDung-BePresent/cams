# CMS Scheduling API - Trace & Backend Behavior

Trace date: 2026-04-30  
Base route: `/api/cms/schedule`  
Controller: `src/LogAICAMS.API/Controllers/Cms/ScheduleController.cs`  
Architecture path: Controller -> `IMediator` -> command/query handler -> repositories/jobs.

This document describes the scheduling API surface, request/response fields, validation rules, business rules, and the backend side effects that happen after each API call.

## 1. Module Purpose

Scheduling controls when a space plays a specific brand playlist.

There are two scheduling ownership models:

| Model          | Backend owner                                        | Runtime job                        | Meaning                                                                     |
| -------------- | ---------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| Space schedule | `SpaceSchedule` + `ScheduleSlot`                     | `ExecuteScheduledPlaybackJob`      | The space has its own local schedule. Used in `Freedom` and `AIMode`.       |
| Brand schedule | `BrandScheduleSource` template + `BrandScheduleSlot` | `ExecuteBrandScheduledPlaybackJob` | Brand controls schedule execution for spaces in a store under `StrictSync`. |

Important distinction:

- A `library` source is copied into a space schedule by `POST /spaces/{spaceId}/apply-source`.
- A `template` source is not copied by that endpoint. It is linked to spaces through the related governance API `PATCH /api/cms/config/stores/governance-mode` when `mode = StrictSync`.

## 2. Common Response Envelope

All endpoints in `ScheduleController` return `Result<T>` and use `result.GetHttpStatusCode()`.

```json
{
  "isSuccess": true,
  "message": "Success",
  "data": {}
}
```

Failure shape:

```json
{
  "isSuccess": false,
  "message": "Error message",
  "errors": ["optional validation details"],
  "errorCode": "InvalidInput"
}
```

Current runtime status behavior:

| Case                       | Status                                                    |
| -------------------------- | --------------------------------------------------------- |
| Success                    | `200 OK`                                                  |
| Accepted result            | `202 Accepted`                                            |
| Validation / invalid input | Usually `400 Bad Request`                                 |
| Unauthorized session/token | `401 Unauthorized`                                        |
| Forbidden role/scope       | `403 Forbidden`                                           |
| Missing entity             | `404 Not Found`                                           |
| Business rule violation    | Usually `422 Unprocessable Entity` or mapped error status |

Note: some Swagger annotations say `201 Created`, but the current `ResultExtensions.GetHttpStatusCode()` returns `200 OK` for normal successful create commands.

## 3. Roles

| Role           | Scheduling permissions                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SystemAdmin`  | Can read/mutate space schedule endpoints where listed. Can save a space schedule to library. Cannot use BrandManager-only brand source management endpoints. |
| `BrandManager` | Can read/mutate space schedules for own brand, manage brand schedule sources and slots, save library entries, and operate under `StrictSync`.                |
| `StoreManager` | Can read/mutate allowed space schedule endpoints for own store unless governance blocks the operation. Cannot save to library or manage brand sources.       |

Space-level access always validates:

- User session is valid.
- `Space`, `Store`, and `Brand` are active.
- Store manager belongs to the target store.
- Brand manager belongs to the target brand.
- System admin is accepted for the space endpoints that allow it.

## 4. Governance Rules

The backend resolves `governance.mode` at Store scope:

| Mode         | Enum value | Scheduling mutation behavior                                                                                                                     |
| ------------ | ---------: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `StrictSync` |        `1` | Only `BrandManager` can mutate scheduling/queue-like state. Store-level sync suppresses space recurring jobs and registers brand recurring jobs. |
| `AIMode`     |        `2` | Space schedule mutations are allowed by governance; AI policy still applies elsewhere.                                                           |
| `Freedom`    |        `3` | Space schedule mutations are allowed.                                                                                                            |

Handlers use `EnsureQueueMutationAllowedByGovernanceAsync`.

For `StrictSync`:

- If caller is `BrandManager`, mutation may continue.
- If caller is `StoreManager` or other non-brand role, backend throws a business rule violation using `Cams_Governance_StrictSync_BrandManagerOnly`.

## 5. Core Data Model

### `space_schedules`

One active schedule row per `Space`.

| Field         | Type                           | Meaning                                                                                   |
| ------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `Id`          | `Guid`                         | Schedule id returned as `SpaceScheduleDto.id`.                                            |
| `SpaceId`     | `Guid`                         | Owning space. Unique index.                                                               |
| `Name`        | `string`, max 200              | Display name. Created as `Space {spaceId} schedule` or copied from source title.          |
| `Enabled`     | `bool`                         | Whether recurring execution jobs should exist for this space schedule.                    |
| `SourceId`    | `Guid?`                        | Optional linked `BrandScheduleSource`. Reserved for template-linked StrictSync schedules. |
| `SourceLabel` | `string?`, max 200             | Display label for linked source.                                                          |
| audit fields  | `CreatedAt`, `UpdatedAt`, etc. | Managed by base entity helpers.                                                           |

### `schedule_slots`

Time windows inside a space schedule.

| Field              | Type             | Meaning                                                                    |
| ------------------ | ---------------- | -------------------------------------------------------------------------- |
| `Id`               | `Guid`           | Slot id. Route `{slotId}` is used as id when creating/updating.            |
| `SpaceScheduleId`  | `Guid`           | Parent schedule.                                                           |
| `DaysOfWeekJson`   | `string`, max 64 | JSON array of weekday integers. `0=Sunday`, `1=Monday`, ..., `6=Saturday`. |
| `StartTime`        | `string`, max 5  | Local time in `HH:mm`.                                                     |
| `EndTime`          | `string`, max 5  | Local time in `HH:mm`. Must be after `StartTime`.                          |
| `PlaylistId`       | `Guid`           | Playlist played during the slot.                                           |
| `QueueEndBehavior` | enum int         | Runtime behavior when scheduled queue reaches the end. Defaults to `Stop`. |

### `brand_schedule_sources`

Reusable brand-level schedule source.

| Field           | Type                | Meaning                                                                 |
| --------------- | ------------------- | ----------------------------------------------------------------------- |
| `Id`            | `Guid`              | Source id.                                                              |
| `BrandId`       | `Guid`              | Owning brand.                                                           |
| `Title`         | `string`, max 200   | Display title.                                                          |
| `Subtitle`      | `string?`, max 300  | Secondary display text.                                                 |
| `Description`   | `string?`, max 2000 | Longer description.                                                     |
| `IsTemplate`    | `bool`              | `true` means StrictSync template; `false` means copyable library entry. |
| `IsUserCreated` | `bool`              | Marks user-created source.                                              |

### `brand_schedule_slots`

Slot definitions inside a brand source.

| Field                   | Type             | Meaning                                                             |
| ----------------------- | ---------------- | ------------------------------------------------------------------- |
| `Id`                    | `Guid`           | Brand slot id.                                                      |
| `BrandScheduleSourceId` | `Guid`           | Parent source.                                                      |
| `DaysOfWeekJson`        | `string`, max 64 | Same weekday convention as space slots.                             |
| `StartTime`             | `string`, max 5  | `HH:mm` local store time at execution.                              |
| `EndTime`               | `string`, max 5  | `HH:mm` local store time.                                           |
| `PlaylistId`            | `Guid`           | Brand playlist to play.                                             |
| `QueueEndBehavior`      | enum int         | Defaults to `Stop`; current API request does not expose this field. |

### Job Mapping Tables

| Table                           | Purpose                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `space_schedule_jobs`           | Maps `ScheduleSlot` to Hangfire recurring job id `schedule:{spaceId}:{slotId}`.                                              |
| `brand_schedule_execution_jobs` | Maps `BrandScheduleSlot` to per-space Hangfire recurring job id `brand-schedule:{spaceId}:{brandSlotId}` under `StrictSync`. |

## 6. DTO Field Contracts

### `ScheduleSlotDto`

| Field        | Type       | Description                                                                                |
| ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `id`         | `Guid`     | Slot id.                                                                                   |
| `daysOfWeek` | `number[]` | Sorted weekdays. `0=Sunday`, ..., `6=Saturday`.                                            |
| `startTime`  | `string`   | Start time as `HH:mm`.                                                                     |
| `endTime`    | `string`   | End time as `HH:mm`.                                                                       |
| `musicId`    | `string`   | Playlist id as string. Name is FE-facing legacy naming; backend maps it from `PlaylistId`. |

### `SpaceScheduleDto`

| Field         | Type                | Description                                                   |
| ------------- | ------------------- | ------------------------------------------------------------- |
| `id`          | `Guid`              | `SpaceSchedule.Id`.                                           |
| `name`        | `string`            | Schedule/source display name.                                 |
| `spaceId`     | `Guid?`             | Owning space id. `null` when nested under a brand source DTO. |
| `slots`       | `ScheduleSlotDto[]` | Slot list.                                                    |
| `enabled`     | `bool`              | Whether this schedule is enabled.                             |
| `sourceId`    | `Guid?`             | Linked source id, usually template link.                      |
| `sourceLabel` | `string?`           | Linked source title/label.                                    |
| `updatedAt`   | `DateTime`          | Last update timestamp.                                        |

### `ScheduleSourceDto`

| Field           | Type               | Description                                                      |
| --------------- | ------------------ | ---------------------------------------------------------------- | -------------------------- |
| `id`            | `Guid`             | Brand source id.                                                 |
| `title`         | `string`           | Source title.                                                    |
| `subtitle`      | `string`           | Source subtitle.                                                 |
| `description`   | `string?`          | Optional description.                                            |
| `type`          | `"template"        | "library"`                                                       | Derived from `IsTemplate`. |
| `schedule`      | `SpaceScheduleDto` | Source slots projected into a schedule-like object for UI reuse. |
| `isUserCreated` | `bool`             | Whether source was created by a user.                            |

### `ScheduleMusicItemDto`

This is a playlist catalog projection used by the schedule UI.

| Field          | Type      | Description                                                     |
| -------------- | --------- | --------------------------------------------------------------- |
| `id`           | `string`  | Playlist id as string.                                          |
| `title`        | `string`  | Playlist name.                                                  |
| `artist`       | `string`  | Currently hard-coded to `Brand Playlist`.                       |
| `collection`   | `string?` | Currently `Library`.                                            |
| `artworkLabel` | `string`  | First one or two words from playlist name, fallback `Playlist`. |
| `primaryHex`   | `string`  | UI color, currently `#4A2EA1`.                                  |
| `secondaryHex` | `string`  | UI color, currently `#4FB2D6`.                                  |

## 7. Endpoint Summary

| Method   | Endpoint                                    | Roles                                   | Purpose                                              |
| -------- | ------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| `GET`    | `/spaces/{spaceId}/bootstrap`               | SystemAdmin, BrandManager, StoreManager | Load schedule UI bootstrap data for a space.         |
| `PUT`    | `/spaces/{spaceId}/slots/{slotId}`          | SystemAdmin, BrandManager, StoreManager | Create or update one space schedule slot.            |
| `DELETE` | `/spaces/{spaceId}/slots/{slotId}`          | SystemAdmin, BrandManager, StoreManager | Delete one space schedule slot.                      |
| `PATCH`  | `/spaces/{spaceId}/toggle`                  | SystemAdmin, BrandManager, StoreManager | Enable/disable a space schedule.                     |
| `POST`   | `/spaces/{spaceId}/apply-source`            | SystemAdmin, BrandManager, StoreManager | Copy a library source into the space schedule.       |
| `POST`   | `/spaces/{spaceId}/save-to-library`         | SystemAdmin, BrandManager               | Save current space schedule as brand library source. |
| `GET`    | `/brands/{brandId}/library`                 | SystemAdmin, BrandManager, StoreManager | List non-template library sources.                   |
| `GET`    | `/brands/{brandId}/templates`               | SystemAdmin, BrandManager, StoreManager | List template sources.                               |
| `POST`   | `/brands/sources`                           | BrandManager                            | Create a brand source.                               |
| `PATCH`  | `/brands/sources/{sourceId}`                | BrandManager                            | Update source metadata.                              |
| `DELETE` | `/brands/sources/{sourceId}`                | BrandManager                            | Delete source if not linked by any space schedule.   |
| `PUT`    | `/brands/sources/{sourceId}/slots/{slotId}` | BrandManager                            | Create or update a slot inside a brand source.       |
| `DELETE` | `/brands/sources/{sourceId}/slots/{slotId}` | BrandManager                            | Delete a slot inside a brand source.                 |

## 8. Endpoint Details

### 8.1 Get Space Schedule Bootstrap

`GET /api/cms/schedule/spaces/{spaceId}/bootstrap`

Roles: `SystemAdmin`, `BrandManager`, `StoreManager`

Returns:

```json
{
  "isSuccess": true,
  "message": "Retrieved ...",
  "data": {
    "draftSchedule": {
      "id": "guid",
      "name": "Space schedule",
      "spaceId": "guid",
      "slots": [],
      "enabled": true,
      "sourceId": null,
      "sourceLabel": null,
      "updatedAt": "2026-04-30T00:00:00Z"
    },
    "librarySources": [],
    "templateSources": [],
    "musicCatalog": []
  }
}
```

Backend trace:

1. Validates session, role scope, and active `Space -> Store -> Brand`.
2. Loads the space's `SpaceSchedule` with slots, if any.
3. Loads brand library sources where `IsTemplate = false`, ordered by latest update.
4. Loads brand template sources where `IsTemplate = true`, ordered by title.
5. Loads all playlists in the brand and maps them to `musicCatalog`.

No DB mutation and no background job.

### 8.2 Upsert Space Schedule Slot

`PUT /api/cms/schedule/spaces/{spaceId}/slots/{slotId}`

Roles: `SystemAdmin`, `BrandManager`, `StoreManager`

Request body: `UpsertScheduleSlotRequest`

```json
{
  "daysOfWeek": [1, 2, 3, 4, 5],
  "startTime": "09:00",
  "endTime": "18:00",
  "playlistId": "guid"
}
```

Field rules:

| Field        | Required | Rules                                                                             |
| ------------ | -------- | --------------------------------------------------------------------------------- |
| `daysOfWeek` | Yes      | Non-empty, max 7 items, unique, sorted ascending, each value between `0` and `6`. |
| `startTime`  | Yes      | `HH:mm`, 24-hour time.                                                            |
| `endTime`    | Yes      | `HH:mm`, 24-hour time, must be after `startTime`.                                 |
| `playlistId` | Yes      | Existing playlist id.                                                             |

Business rules:

1. Space access must be valid.
2. Governance must allow mutation. In `StrictSync`, only `BrandManager` passes.
3. Playlist must exist.
4. If playlist has `BrandId`, it must equal the space brand id.
5. If caller is `StoreManager`, playlist must be in the allowed override policy list when such a list is resolved.
6. Slot time must stay within effective operating hours (`ops.openTime` and `ops.closeTime`) resolved for the space/store/brand.

Backend effect:

1. Loads or creates `SpaceSchedule` for the space.
2. Loads slot by `{slotId}` under that schedule.
3. If not found, creates `ScheduleSlot` with route slot id. If route id is empty GUID, generates a new GUID.
4. Maps request:
   - `daysOfWeek` -> distinct sorted JSON in `DaysOfWeekJson`
   - `startTime` -> `StartTime`
   - `endTime` -> `EndTime`
   - `playlistId` -> `PlaylistId`
5. Updates schedule audit timestamp.
6. Saves DB changes.
7. Enqueues `IBackgroundScheduleJobService.EnqueueSync(spaceId, actorId)`.

Response data: slot id.

Important runtime side effect:

- In non-StrictSync modes, the sync job registers/updates Hangfire recurring job `schedule:{spaceId}:{slotId}`.
- If the slot is active at the moment of sync, `ExecuteScheduledPlaybackJob` is enqueued immediately so the schedule can take over mid-window.
- In `StrictSync`, the sync is escalated to store-level sync and space recurring jobs are suppressed.

### 8.3 Delete Space Schedule Slot

`DELETE /api/cms/schedule/spaces/{spaceId}/slots/{slotId}`

Roles: `SystemAdmin`, `BrandManager`, `StoreManager`

Business rules:

1. Space access must be valid.
2. Governance must allow mutation.
3. Existing `SpaceSchedule` is required.
4. Slot must exist under that schedule.

Backend effect:

1. Deletes `ScheduleSlot`.
2. Saves DB changes.
3. Enqueues `EnqueueSync(spaceId)`.

Response data: deleted slot id.

Runtime side effect:

- Sync removes obsolete Hangfire recurring job and `SpaceScheduleJob` row for that slot.

### 8.4 Toggle Space Schedule

`PATCH /api/cms/schedule/spaces/{spaceId}/toggle`

Roles: `SystemAdmin`, `BrandManager`, `StoreManager`

Request body:

```json
{
  "enabled": false
}
```

Field:

| Field     | Required | Meaning                                                                                            |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `enabled` | Yes      | `true` means the schedule should be synced into recurring jobs; `false` means remove-only cleanup. |

Business rules:

1. Space access must be valid.
2. Governance must allow mutation.
3. Existing `SpaceSchedule` is required.

Backend effect:

1. Updates `SpaceSchedule.Enabled`.
2. Saves DB changes.
3. Enqueues `EnqueueSync(spaceId, actorId)`.

Runtime side effect:

- If `enabled = false`, `SyncSpaceScheduleJobsJob` removes all recurring Hangfire jobs for this schedule and deletes `SpaceScheduleJob` rows.
- If `enabled = true`, sync registers recurring jobs for current slots and may trigger immediate activation for currently active slots.

### 8.5 Apply Schedule Source to Space

`POST /api/cms/schedule/spaces/{spaceId}/apply-source`

Roles: `SystemAdmin`, `BrandManager`, `StoreManager`

Request body:

```json
{
  "sourceId": "guid"
}
```

Field:

| Field      | Required | Meaning                                                                       |
| ---------- | -------- | ----------------------------------------------------------------------------- |
| `sourceId` | Yes      | Brand schedule source to copy from. Must be a library source, not a template. |

Business rules:

1. Space access must be valid.
2. Governance must allow mutation.
3. Source must exist and belong to the same brand.
4. `source.IsTemplate` must be `false`. Template sources are reserved for StrictSync linking.
5. If caller is `StoreManager`, every playlist used by the source slots must be allowed by override policy when an allowed list exists.
6. All copied slots must fit within effective operating hours.

Backend effect:

1. Loads `BrandScheduleSource` with slots.
2. Loads or creates `SpaceSchedule`.
3. If schedule exists, deletes all current `ScheduleSlot` rows for that schedule.
4. Copies each `BrandScheduleSlot` into a new `ScheduleSlot`.
5. Sets schedule `Name` from source title.
6. Does not set `SpaceSchedule.SourceId` or `SourceLabel`. This is intentional because this endpoint is a copy operation, not a template link.
7. Saves DB changes.
8. Enqueues `EnqueueSync(spaceId, actorId)`.

Response data: space schedule id.

### 8.6 Save Space Schedule to Library

`POST /api/cms/schedule/spaces/{spaceId}/save-to-library`

Roles: `SystemAdmin`, `BrandManager`

Request body:

```json
{
  "title": "Weekday Morning",
  "subtitle": "Lobby default"
}
```

Field rules:

| Field      | Required | Rules                                                                                                                         |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `title`    | Yes      | Max 255 by current validator. DB column max is 200, so callers should keep it at 200 or lower until validator/db are aligned. |
| `subtitle` | No       | Max 255 by current validator. DB column max is 300.                                                                           |

Business rules:

1. Space access must be valid.
2. Governance must allow mutation.
3. Caller must be `BrandManager` or `SystemAdmin`.
4. Space must already have a `SpaceSchedule`.

Backend effect:

1. Loads `SpaceSchedule` with slots.
2. Creates `BrandScheduleSource`:
   - `BrandId = space brand id`
   - `Title = request.title`
   - `Subtitle = request.subtitle`
   - `Description = "Saved from space schedule"`
   - `IsTemplate = false`
   - `IsUserCreated = true`
3. Copies all space slots to `BrandScheduleSlot`.
4. Saves DB changes.

No schedule sync job is enqueued because runtime execution for the current space is unchanged. This endpoint only creates a reusable library source.

Response data: created source id.

### 8.7 Get Brand Schedule Library

`GET /api/cms/schedule/brands/{brandId}/library`

Roles: `SystemAdmin`, `BrandManager`, `StoreManager`

Returns: `Result<List<ScheduleSourceDto>>` where every source has `type = "library"`.

Backend trace:

1. Validates current user session.
2. If caller is `BrandManager` or `StoreManager`, ignores route brand id and uses `user.BrandId`.
3. `SystemAdmin` can use the route brand id.
4. Loads sources with `IsTemplate = false`, includes slots, orders by latest update.

No DB mutation and no background job.

### 8.8 Get Brand Schedule Templates

`GET /api/cms/schedule/brands/{brandId}/templates`

Roles: `SystemAdmin`, `BrandManager`, `StoreManager`

Returns: `Result<List<ScheduleSourceDto>>` where every source has `type = "template"`.

Backend trace:

1. Validates current user session.
2. If caller is `BrandManager` or `StoreManager`, ignores route brand id and uses `user.BrandId`.
3. `SystemAdmin` can use the route brand id.
4. Loads sources with `IsTemplate = true`, includes slots, orders by title.

No DB mutation and no background job.

### 8.9 Create Brand Schedule Source

`POST /api/cms/schedule/brands/sources`

Roles: `BrandManager`

Request body: `CreateBrandScheduleSourceRequest`

```json
{
  "title": "Brand Weekday Template",
  "subtitle": "Default for all stores",
  "description": "Main office-hours schedule",
  "isTemplate": true
}
```

Fields:

| Field         | Required  | Meaning                                                                                 |
| ------------- | --------- | --------------------------------------------------------------------------------------- |
| `title`       | Yes by DB | Source title. DB max 200. Current handler does not trim or validate length before save. |
| `subtitle`    | No        | DB max 300.                                                                             |
| `description` | No        | DB max 2000.                                                                            |
| `isTemplate`  | No        | Defaults to `true`. `true` creates StrictSync template; `false` creates library source. |

Business rules:

1. Current session must be valid.
2. Caller must have `BrandManager`.
3. Caller must have `user.BrandId`.

Backend effect:

1. Maps request to `BrandScheduleSource`.
2. Sets `BrandId` from session.
3. Sets `IsUserCreated = true`.
4. Creates source without slots.
5. Saves DB changes.

No sync job is enqueued. Add slots separately through `PUT /brands/sources/{sourceId}/slots/{slotId}`.

Response data: created source id.

### 8.10 Update Brand Schedule Source

`PATCH /api/cms/schedule/brands/sources/{sourceId}`

Roles: `BrandManager`

Request body:

```json
{
  "title": "Updated title",
  "subtitle": "Updated subtitle",
  "description": "Updated description"
}
```

Fields:

| Field         | Required  | Meaning                                          |
| ------------- | --------- | ------------------------------------------------ |
| `title`       | Yes by DB | Handler trims it before save.                    |
| `subtitle`    | No        | Handler trims, or stores empty string when null. |
| `description` | No        | Handler trims, or stores empty string when null. |

Business rules:

1. Current session must be valid.
2. Caller must be `BrandManager`.
3. Caller must own the source brand.
4. Source must exist.

Backend effect:

1. Updates metadata only.
2. Saves DB changes.

No sync job is enqueued. If this source is already linked to spaces, metadata changes do not directly rebuild Hangfire jobs because cron behavior is not affected.

Response data: source id.

### 8.11 Delete Brand Schedule Source

`DELETE /api/cms/schedule/brands/sources/{sourceId}`

Roles: `BrandManager`

Business rules:

1. Current session must be valid.
2. Caller must be `BrandManager`.
3. Caller must own the source brand.
4. Source must exist.
5. No `SpaceSchedule` may currently reference this source through `SourceId`.

Backend effect:

1. Loads source with slots.
2. Checks `SpaceSchedule.Any(x => x.SourceId == sourceId)`.
3. If in use, throws business rule violation `Schedule_Source_InUseBySpace`.
4. Deletes source. Slots are cascade-deleted by FK.
5. Saves DB changes.

No sync job is enqueued.

Response data: source id.

### 8.12 Upsert Brand Schedule Source Slot

`PUT /api/cms/schedule/brands/sources/{sourceId}/slots/{slotId}`

Roles: `BrandManager`

Request body: `UpsertBrandScheduleSlotRequest`

```json
{
  "daysOfWeek": [0, 6],
  "startTime": "10:00",
  "endTime": "22:00",
  "playlistId": "guid"
}
```

Expected fields:

| Field        | Required       | Meaning                                                           |
| ------------ | -------------- | ----------------------------------------------------------------- |
| `daysOfWeek` | Expected       | Weekdays `0..6`. The mapping normalizes with distinct + sorted.   |
| `startTime`  | Expected       | `HH:mm`.                                                          |
| `endTime`    | Expected       | `HH:mm`.                                                          |
| `playlistId` | Yes by handler | Must exist and belong to caller brand if playlist has a brand id. |

Current validation note:

- Unlike space slot upsert, this command currently has no `*Validator.cs` wrapper in `Features/Schedule`.
- The handler validates session, role, source ownership, playlist existence, and playlist ownership.
- It does not currently enforce operating-hours bounds for brand source slots.
- It does not currently enforce `startTime < endTime`, sorted weekdays, or `0..6` before mapping, unless another global validation layer is added outside this feature.

Backend effect:

1. Validates session and `BrandManager`.
2. Loads source and checks brand ownership.
3. Loads playlist and checks brand ownership.
4. Loads existing brand slot by `{slotId}` and `{sourceId}`.
5. Creates slot if missing, using route slot id or new id when empty GUID.
6. Maps request into slot.
7. Updates source `UpdatedAt` and `UpdatedBy`.
8. Saves DB changes.

No sync job is enqueued directly. StrictSync execution jobs are refreshed by store/brand governance sync flows.

Response data: slot id.

### 8.13 Delete Brand Schedule Source Slot

`DELETE /api/cms/schedule/brands/sources/{sourceId}/slots/{slotId}`

Roles: `BrandManager`

Business rules:

1. Current session must be valid.
2. Caller must be `BrandManager`.
3. Caller must own the source brand.
4. Source must exist.
5. Slot must exist under the source.

Backend effect:

1. Deletes `BrandScheduleSlot`.
2. Saves DB changes.

No sync job is enqueued directly.

Response data: deleted slot id.

## 9. Related API for StrictSync Template Application

This endpoint is not in `ScheduleController`, but it is required for understanding how template schedule sources become runtime brand schedules.

`PATCH /api/cms/config/stores/governance-mode`

Roles: `BrandManager`

Request:

```json
{
  "storeIds": ["guid"],
  "mode": 1,
  "sourceId": "template-source-guid"
}
```

Fields:

| Field      | Meaning                                                                            |
| ---------- | ---------------------------------------------------------------------------------- |
| `storeIds` | Stores to update. All must belong to caller brand.                                 |
| `mode`     | `1=StrictSync`, `2=AIMode`, `3=Freedom`.                                           |
| `sourceId` | Optional. When `mode=StrictSync`, must be a template source owned by caller brand. |

Backend effect when `mode = StrictSync` and `sourceId` is present:

1. Upserts `ConfigValue` key `governance.mode` at Store scope.
2. Loads template `BrandScheduleSource`.
3. Updates existing `SpaceSchedule.SourceId` and `SourceLabel` for spaces in target stores.
4. Enqueues `EnqueueSyncByStore(storeId, actorId)` for each store.
5. `SyncStoreScheduleJobsJob` removes space recurring jobs and registers `brand-schedule:{spaceId}:{brandSlotId}` jobs.

Backend effect when switching away from `StrictSync`:

1. Removes brand recurring Hangfire registrations.
2. Keeps currently active brand scheduling windows protected until their window guard finishes.
3. Restores space recurring jobs for non-protected spaces.

## 10. Background Job Pipeline

### 10.1 `EnqueueSync(spaceId, actorId)`

Called by:

- Upsert space slot.
- Delete space slot.
- Toggle space schedule.
- Apply library source.

It enqueues `SyncSpaceScheduleJobsJob` through Hangfire. If Hangfire enqueue fails or is unavailable, it falls back to `Task.Run`.

### 10.2 `SyncSpaceScheduleJobsJob`

Purpose: reconcile one space's schedule slots into recurring Hangfire jobs.

Flow:

1. Loads space context and store timezone.
2. Resolves store governance mode.
3. If `StrictSync`, delegates to `SyncStoreScheduleJobsJob` and returns.
4. Loads `SpaceSchedule` with slots and existing job mappings.
5. If schedule is disabled:
   - removes recurring Hangfire jobs.
   - deletes `SpaceScheduleJob` rows.
6. If schedule is enabled:
   - normalizes days/start/end/timezone into a `ScheduleSignature`.
   - builds cron from `StartTime` and `DaysOfWeek`.
   - adds/updates recurring jobs `schedule:{spaceId}:{slotId}`.
   - removes obsolete jobs.
   - writes `SpaceScheduleJob` rows.
7. After commit, checks active slots and enqueues `ExecuteScheduledPlaybackJob` immediately for active windows.

### 10.3 `SyncStoreScheduleJobsJob`

Purpose: reconcile all schedules in a store.

In `StrictSync`:

1. Removes all space-level recurring Hangfire jobs for the store.
2. Keeps `SpaceScheduleJob` DB rows so they can be restored later.
3. If spaces are currently playing space-origin scheduled music, clears their pending scheduling queue and clears scheduling metadata without cutting the currently playing item.
4. Loads space schedules linked to template sources (`SourceId != null` and `Source.IsTemplate = true`).
5. Registers brand recurring jobs `brand-schedule:{spaceId}:{brandSlotId}`.
6. Writes `BrandScheduleExecutionJob` rows.

In `AIMode` or `Freedom`:

1. Removes brand recurring Hangfire registrations.
2. Protects spaces still inside an active brand-origin scheduling window.
3. Deletes brand execution rows for non-protected spaces.
4. Restores space recurring jobs for non-protected schedules.

### 10.4 Runtime Execution Job

`ExecuteScheduledPlaybackJob` runs for space-owned slots.  
`ExecuteBrandScheduledPlaybackJob` runs for brand-owned StrictSync slots.

Both jobs:

1. Validate slot exists.
2. Validate space/store/brand are active.
3. Validate current UTC time falls inside the local store-timezone slot window.
4. Load or create `SpaceMusicState`.
5. Clear manual pause if needed and mark paused queue item as skipped.
6. Set:
   - `IsScheduling = true`
   - `SchedulingSlotId = slot id`
   - `SchedulingSlotOrigin = Space` or `Brand`
   - `SchedulingEndsAtUtc = resolved end time`
7. Seed `QueueEndBehavior` from the slot on first activation or pause recovery.
8. Flush pending AI queue items when scheduling first takes over.
9. Flush pending scheduling queue items when ownership switches between brand and space.
10. Save DB changes.
11. Broadcast state through SignalR.
12. Schedule `SchedulingWindowGuardJob` for the slot end.
13. If `EnableSchedulingAutoFillCanary` is enabled, enqueue `SchedulingAutoFillKickoffJob`.

### 10.5 Window Guard

`SchedulingWindowGuardJob` runs at `SchedulingEndsAtUtc`.

Flow:

1. Loads `SpaceMusicState`.
2. Exits if state is missing or no longer scheduling.
3. Exits if the expected end time is stale.
4. Resolves playlist id from current scheduling slot.
5. Clears scheduling metadata.
6. Flushes pending scheduling queue items, preserving the currently playing item.
7. Broadcasts state through SignalR.
8. If the finished window was brand-origin and the store has moved out of `StrictSync`, enqueues store sync to restore space jobs.

## 11. Practical FE Notes

1. Use `GET /spaces/{spaceId}/bootstrap` as the schedule screen bootstrap. It returns the current draft schedule, reusable library sources, template sources, and playlist catalog.
2. For a new space slot, generate a client GUID for `{slotId}` or send the empty GUID route if the client supports that convention.
3. Use playlist id as `playlistId` in write requests, but expect `musicId` in read DTOs.
4. Send `daysOfWeek` sorted ascending and unique. Example weekdays: `[1,2,3,4,5]`.
5. Times are `HH:mm` and are interpreted using the store timezone when Hangfire jobs are registered/executed.
6. Use `apply-source` only for `type = "library"`.
7. Use templates together with the governance endpoint for `StrictSync`, not `apply-source`.
8. Space schedule mutations may return before Hangfire reconciliation finishes. Treat the API response as "DB updated and sync enqueued", not "runtime job fully reconciled".

## 12. Files Traced

| File                                                                            | What it contributed                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/LogAICAMS.API/Controllers/Cms/ScheduleController.cs`                       | Endpoint routes, roles, MediatR dispatch.                    |
| `src/LogAICAMS.Application/Common/DTOs/Schedule/ScheduleDtos.cs`                | Request/response contracts.                                  |
| `src/LogAICAMS.Application/Common/Mappings/ScheduleMappingProfile.cs`           | DTO/entity mapping and `musicId`/playlist mapping.           |
| `src/LogAICAMS.Application/Common/Validators/SharedScheduleRequestValidator.cs` | Space slot, apply source, save library validation.           |
| `src/LogAICAMS.Application/Features/Schedule/**/**Handler.cs`                   | Command/query business behavior.                             |
| `src/LogAICAMS.Application/Common/Extensions/SpaceExtensions.cs`                | Space access, operating-hour guard, allowed playlist policy. |
| `src/LogAICAMS.Application/Common/Extensions/ConfigExtensions.cs`               | Governance resolution and mutation permission guard.         |
| `src/LogAICAMS.Infrastructure/Context/LogAICAMSDbContext.cs`                    | Table names, column lengths, indexes, FK behavior.           |
| `src/LogAICAMS.Infrastructure/Services/BackgroundScheduleJobService.cs`         | Enqueue and fallback behavior.                               |
| `src/LogAICAMS.Infrastructure/Jobs/SyncSpaceScheduleJobsJob.cs`                 | Space recurring job reconciliation.                          |
| `src/LogAICAMS.Infrastructure/Jobs/SyncStoreScheduleJobsJob.cs`                 | StrictSync brand job reconciliation and recovery.            |
| `src/LogAICAMS.Infrastructure/Jobs/ExecuteScheduledPlaybackJob.cs`              | Space schedule runtime activation.                           |
| `src/LogAICAMS.Infrastructure/Jobs/ExecuteBrandScheduledPlaybackJob.cs`         | Brand StrictSync runtime activation.                         |
| `src/LogAICAMS.Infrastructure/Jobs/SchedulingWindowGuardJob.cs`                 | End-of-window cleanup and recovery.                          |
| `src/LogAICAMS.Application/Features/Config/Commands/SetStoreGovernanceMode/*`   | Template source linking for StrictSync.                      |
