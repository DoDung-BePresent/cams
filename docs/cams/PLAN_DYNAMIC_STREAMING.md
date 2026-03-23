# MIGRATION PLAN: TRACK-LEVEL DYNAMIC STREAMING

## 1. Overview

The current architecture relies on "Playlist-level" HLS transcoding, where entire playlists are stitched together into a single static HLS stream. This plan details the transition to a modern "Track-level" dynamic streaming architecture with a real-time Space Queue. This unlocks gapless track transitions, inserting priority tracks, and real-time edits without requiring full playlist re-transcoding.

---

## 2. Core Architectural Decisions

### 2.1. Graceful Database Migration

- **No Data Loss**: The database will NOT be dropped. We will use Entity Framework Core `Add-Migration` to safely transition schemas.
- **Data Preservation**: Existing `Track` and `Playlist` basic metadata will remain intact.

### 2.2. Transcode Trigger & Locking Strategy

- **Immediate Trigger**: Transcoding on AWS MediaConvert is triggered _immediately_ when a track is created or its audio file is updated.
- **Versioning Strategy (`TranscodeVersion`)**:
  - Tracks will have a `TranscodeVersion` starting at `1`.
  - S3 paths will be versioned: `audio/tracks/{trackId}/v{Version}/`.
  - Benefit: If a track is currently streaming in a store (v1) and a manager uploads a better quality audio file (v2), the ongoing stream won't crash.
- **Partial Lock**:
  - If a track’s `TranscodeStatus` is `Pending` or `Processing`, users are **BLOCKED** (`409 Conflict`) from uploading a new audio file (to prevent AWS queue spam).
  - Users are **ALLOWED** to update metadata (Title, Artist, Mood) at any time.

---

## 3. Execution Phases (Backend Priority)

### PHASE 1: Domain Entities & Database Migration

**Objective**: Redefine the core boundaries. Move HLS responsibilities from `Playlist` to `Track`. Introduce the `SpaceQueueItem`.

1. **Update `Track.cs`**:
   - Add streaming fields: `HlsUrl`, `TranscodeStatus`, `TranscodeJobId`, `TranscodeRequestedAt`, `TranscodeCompletedAt`, `TranscodeErrorMessage`, `TranscodeVersion` (Default: 0).
2. **Update `Playlist.cs`**:
   - Remove streaming fields: `HlsUrl`, `TranscodeStatus`, `TranscodeJobId`, `TranscodeRequestedAt`, `TranscodeCompletedAt`, `TranscodeErrorMessage`, `TranscodeVersion`, `TotalDurationSeconds`.
   - _Note: Playlist becomes purely a structural "folder" containing tracks._
3. **Create `SpaceQueueItem.cs`**:
   - Properties: `Id`, `SpaceId`, `TrackId`, `Position` (or OrderIndex), `Status` (Enum: Pending, Playing, Played), `Source` (Enum: AI, Manager).
4. **Update `SpaceMusicState.cs`**:
   - Replace `CurrentPlaylistId` -> `CurrentTrackId` & `NextTrackId`.
5. **EF Core Migration**:
   - Execute: `dotnet ef migrations add TrackLevelHlsMigration`.
   - Execute: `dotnet ef database update`.

---

## PHASE 2: Track Service & MediaConvert Pipeline

**Objective**: Instruct AWS to process single files immediately instead of batching.

1. **Refactor Transcode Interfaces (`IBackgroundTranscodeService`)**:
   - Change method signatures to accept `TrackId` instead of `PlaylistId`.
   - Update S3 Path builder to use `audio/tracks/{trackId}/v{version}/`.
2. **Update `CreateTrackCommandHandler`**:
   - Upload raw file -> Save Track Entity (Version=1, Status=Pending) -> Trigger MediaConvert immediately.
3. **Update `UpdateTrackCommandHandler`**:
   - **Scenario A (Audio file included)**:
     - Check constraint: Is `TranscodeStatus` == `Pending` or `Processing`? If yes, throw conflict.
     - Process: Bump `TranscodeVersion++`, upload raw file, set Status=`Pending`, trigger MediaConvert.
   - **Scenario B (Metadata only)**:
     - Process: Update DB directly. Ignore AWS.
4. **Update Polling/Webhook Services**:
   - Ensure the job that checks AWS status updates the `Track.TranscodeStatus` to `Ready` and saves the `ActualDurationSec`.

---

## PHASE 3: CAMS AI & Queue Management

**Objective**: Change how the AI orchestrates playback. Instead of throwing a 3-hour playlist to the client, the AI generates batches of tracks and feeds a queue.

1. **Create `ISpaceQueueService`**:
   - Core functions: `EnqueueTracksAsync`, `InsertPriorityTrackAsync`, `ClearQueueAsync`, `PopNextTrackAsync`.
2. **Refactor `FuzzyLogicEngine` & `AnalyzeSpaceContextCommandHandler`**:
   - **Old Logic**: Analyze Mood -> Find Playlist A -> Start Playlist A.
   - **New Logic**: Analyze Mood -> Find Tracks matching Mood -> Enqueue 10-20 tracks to `SpaceQueueItem`.
   - _Smooth Transition_: When Mood changes, clear `Pending` items in the queue and inject the new tracks. The track currently `Playing` is undisturbed.
3. **Queue endpoints in `CamsController`**:
   - `GET /api/cams/spaces/{spaceId}/queue`
   - `POST /api/cams/spaces/{spaceId}/queue/reorder` (Optional, for Manager overrides)

---

## PHASE 4: API Presentation & SignalR Integration

**Objective**: Expose the new architecture to the frontend and manage the bidirectional playback loop with the tablet.

1. **Refactor Playlists/Tracks DTOs**:
   - Remove HLS fields from `PlaylistDetailResponse`.
   - Add HLS fields to `TrackListItem` and `TrackDetailResponse`.
2. **Refactor `ISignalRMusicService`**:
   - Update `PlaybackStateChanged` events.
   - Instead of sending a Playlist `.m3u8`, the server sends: `CurrentTrackHlsUrl` and `NextTrackHlsUrl` (for client-side pre-buffering).
3. **Implement Client Feedback Loop**:
   - Create an endpoint or SignalR receiver: `POST /api/cams/spaces/{spaceId}/track-ended`.
   - **Server Action**: When the client reports a track has finished:
     1. Mark `SpaceQueueItem` as `Played`.
     2. Pop the next track.
     3. Check queue length. If `< 3` tracks pending, trigger AI to append more tracks.
     4. Broadcast new `Current` and `Next` tracks to the client.

---

## 4. Risks & Mitigations

| Risk                                                            | Mitigation                                                                                                                                  |
| :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| AWS MediaConvert cost spike due to individual track processing. | None. This is standard industry practice. Short files process much faster and are generally cheaper to compute than massive stitched files. |
| Gap/Silence between tracks.                                     | Mitigated by providing `NextTrackHlsUrl`. The frontend tablet player MUST implement a dual-player/prefetch logic.                           |
| Existing S3 artifacts from old Playlists become orphaned.       | We will create a background cleanup script to run asynchronously after the migration is stable.                                             |
