# Plan: Manual Override (Latest Implemented)

## 1. Objective

Chuẩn hóa luồng override theo mô hình queue-first, đồng bộ với implementation hiện tại.

## 2. Current Contract

Request `OverrideSpaceMoodRequest`:

- `trackIds` hoặc `playlistId` hoặc `moodId` (bắt buộc đúng 1 nguồn)
- `isClearManagerSelectedQueues` (optional, default false)
- `reason` (optional, max 500)

Response `SpaceOverrideResponse`:

- chỉ trả `spaceId`

Không còn `playNow`.

## 3. Current Runtime Rules

1. Validate đúng 1 nguồn (`trackIds` | `playlistId` | `moodId`).
2. Resolve danh sách track theo nguồn:

- `trackIds`: giữ thứ tự caller, lọc track hợp lệ theo scope.
- `playlistId`: expand playlist tracks theo order.
- `moodId`: chọn track theo mood, giới hạn 20, có cooldown theo playback history.

3. Nếu không resolve được track hợp lệ: throw business exception với key `Cams_Error_NoOverrideProvided`.
4. Set manual override metadata trên `SpaceMusicState`.
5. Clear queue theo policy:

- `isClearManagerSelectedQueues=true`: clear toàn bộ pending queue.
- `false`: chỉ clear pending queue có source AI.

6. Luôn prepend danh sách track override vào đầu queue.
7. Luôn transition ngay sang track kế tiếp (hard switch).
8. Persist bằng single `SaveChangesAsync` để đảm bảo atomic.
9. Audit chỉ log success/failure quanh SaveChanges (không log lỗi do user behavior).

## 4. Files Of Record

- `src/LogAICAMS.Application/Common/DTOs/CAMS/OverrideSpaceMoodRequest.cs`
- `src/LogAICAMS.Application/Common/DTOs/CAMS/SpaceOverrideResponse.cs`
- `src/LogAICAMS.Application/Features/CAMS/Commands/OverrideSpaceMood/OverrideSpaceMoodCommandValidator.cs`
- `src/LogAICAMS.Application/Features/CAMS/Commands/OverrideSpaceMood/OverrideSpaceMoodCommandHandler.cs`
- `src/LogAICAMS.Application/Common/Extensions/SpaceQueueExtensions.cs`

## 5. Validation Checklist

1. Build solution pass.
2. API docs/Postman phản ánh payload mới (không còn `playNow`).
3. Response mẫu override chỉ còn `spaceId`.
4. Error localization dùng `ErrorMessages` cho business errors (`Cams_Error_*`).
