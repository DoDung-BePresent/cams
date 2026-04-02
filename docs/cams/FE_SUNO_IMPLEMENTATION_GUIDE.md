# FE Suno Implementation Guide

Tài liệu này dành cho FE team (và AI coding assistant phía FE) để implement đầy đủ luồng Suno:

- Config prompt theo Brand
- Tạo generation job
- Theo dõi realtime tiến trình qua SignalR
- Nhận track đã tạo xong và cập nhật UI playlist/library

---

## 1) Backend contract tổng quan

Base API cho Suno:

- `GET /api/cms/suno/config`
- `PUT /api/cms/suno/config`
- `POST /api/cms/suno/generations`
- `GET /api/cms/suno/generations/{id}`
- `POST /api/cms/suno/generations/{id}/cancel`

SignalR Hub:

- URL: `/hubs/store`
- FE cần join group brand bằng method:
  - `JoinBrandManagerRoomAsync(brandId)`
- Event realtime:
  - `SunoGenerationStatusChanged`

---

## 2) Enum contract (quan trọng)

`SunoGenerationStatusEnum` là **number**:

- `0` = `Queued`
- `1` = `Generating`
- `2` = `Completed`
- `3` = `Failed`
- `4` = `Cancelled`

> FE phải parse theo số nguyên, không parse theo string.

---

## 3) DTO contract

## 3.1 Config

`GET /api/cms/suno/config` response data:

```json
{
  "brandId": "uuid",
  "sunoPromptTemplate": "string | null",
  "sunoDefaultPlaylistId": "uuid | null"
}
```

`PUT /api/cms/suno/config` request body:

```json
{
  "sunoPromptTemplate": "string | null",
  "sunoDefaultPlaylistId": "uuid | null"
}
```

## 3.2 Create generation

`POST /api/cms/suno/generations` request body:

```json
{
  "prompt": "string | null",
  "title": "string | null",
  "artist": "string | null",
  "moodId": "uuid | null",
  "targetPlaylistId": "uuid | null",
  "autoAddToTargetPlaylist": true
}
```

Response data (`202 Accepted`):

```json
{
  "id": "uuid",
  "brandId": "uuid",
  "generationStatus": 0,
  "progressPercent": 0,
  "prompt": "string",
  "title": "string",
  "artist": "string",
  "externalTaskId": null,
  "errorMessage": null,
  "outputAudioUrl": null,
  "generatedTrackId": null,
  "targetPlaylistId": "uuid | null",
  "completedAtUtc": null,
  "lastPolledAtUtc": null
}
```

## 3.3 Get generation status

`GET /api/cms/suno/generations/{id}` trả cùng schema `SunoGenerationStatusDto`.

---

## 4) SignalR realtime contract

Event: `SunoGenerationStatusChanged`

Payload:

```json
{
  "id": "uuid-request",
  "brandId": "uuid-brand",
  "generationStatus": 1,
  "progressPercent": 46,
  "errorMessage": null,
  "generatedTrackId": null
}
```

FE xử lý đề xuất:

- Nếu status `Queued`/`Generating`: cập nhật progress UI ngay.
- Nếu status `Completed`:
  - toast success
  - refresh generation detail (`GET /generations/{id}`)
  - nếu có `generatedTrackId` thì fetch track detail/list để append vào UI
- Nếu status `Failed`/`Cancelled`:
  - hiển thị lỗi từ `errorMessage`
  - cho phép retry (create generation mới)

---

## 5) FE state machine gợi ý

Local state cho 1 generation item:

- `idle`
- `queued`
- `generating`
- `completed`
- `failed`
- `cancelled`

Map từ backend:

- `0 -> queued`
- `1 -> generating`
- `2 -> completed`
- `3 -> failed`
- `4 -> cancelled`

Progress:

- dùng `progressPercent` từ API/SignalR
- clamp từ `0..100`

---

## 6) Recommended FE flow

## 6.1 Init screen

1. Load config: `GET /api/cms/suno/config`
2. Kết nối SignalR `/hubs/store`
3. Gọi `JoinBrandManagerRoomAsync(brandId)`

## 6.2 Save config

1. User edit prompt template + default playlist
2. `PUT /api/cms/suno/config`
3. cập nhật UI local từ response

## 6.3 Generate music

1. Build prompt (manual prompt hoặc từ template)
2. `POST /api/cms/suno/generations`
3. Render card generation mới ở trạng thái `Queued`
4. Chờ realtime `SunoGenerationStatusChanged`
5. Fallback poll mỗi 10-15s bằng `GET /generations/{id}` nếu mất websocket

## 6.4 Khi completed

1. Lấy lại generation detail để có `generatedTrackId`
2. Refresh track list/playlist view
3. Cho phép action:
   - mở track detail
   - play thử
   - generate again

---

## 7) TypeScript mẫu tối thiểu

```typescript
export enum SunoGenerationStatus {
  Queued = 0,
  Generating = 1,
  Completed = 2,
  Failed = 3,
  Cancelled = 4,
}

export interface SunoGenerationRealtimeDto {
  id: string;
  brandId: string;
  generationStatus: SunoGenerationStatus;
  progressPercent: number;
  errorMessage: string | null;
  generatedTrackId: string | null;
}

export interface SunoGenerationStatusDto extends SunoGenerationRealtimeDto {
  prompt: string | null;
  title: string | null;
  artist: string | null;
  externalTaskId: string | null;
  outputAudioUrl: string | null;
  targetPlaylistId: string | null;
  completedAtUtc: string | null;
  lastPolledAtUtc: string | null;
}
```

---

## 8) Checklist test cho FE

- [ ] Save config thành công và reload vẫn đúng
- [ ] Tạo generation mới trả `202` + hiển thị card
- [ ] Realtime nhận được event `SunoGenerationStatusChanged`
- [ ] UI chuyển đúng trạng thái `Queued -> Generating -> Completed`
- [ ] Trường hợp fail hiển thị được `errorMessage`
- [ ] Reload trang giữa chừng vẫn resume được trạng thái qua `GET /generations/{id}`
- [ ] Track mới xuất hiện trong list sau khi completed

---

## 9) Các lỗi thường gặp

- Không join brand room nên không thấy realtime:
  - thiếu `JoinBrandManagerRoomAsync(brandId)`
- Parse sai enum:
  - backend trả number, FE parse string
- Chỉ dựa realtime, không có poll fallback:
  - mất websocket sẽ làm UI đứng progress
- Dùng sai endpoint:
  - Suno endpoints ở `api/cms/suno/*`
