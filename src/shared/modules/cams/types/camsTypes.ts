/**
 * Playback command enum (from API_CAMS.md § 2)
 * ⚠️ Must match backend exactly!
 */
export enum PlaybackCommand {
  Pause = 1, // ✅ Backend definition
  Resume = 2,
  Seek = 3,
  SeekForward = 4,
  SeekBackward = 5,
  SkipNext = 6,
  SkipPrevious = 7,
  SkipToTrack = 8,
}

/**
 * Transition type enum (from SIGNALR_STOREHUB.md § 1)
 */
export enum TransitionType {
  Immediate = 1,
  Crossfade = 2,
  Pending = 3,
}

/**
 * Playback mode enum
 */
export enum PlaybackMode {
  Sequential = 0,
  Shuffle = 1,
}

/**
 * Repeat mode enum
 */
export enum RepeatMode {
  Off = 0,
  RepeatAll = 1,
  RepeatOne = 2,
}

/**
 * Override mode enum (from API_CAMS.md § 4.1)
 */
export enum OverrideMode {
  Playlist = 1,
  Mood = 2,
}

/**
 * Space state DTO (from SIGNALR_STOREHUB.md § 4)
 * Used in SignalR SpaceStateSync event
 * ⚠️ seekOffsetSeconds is always NULL in SignalR - client must calculate from startedAtUtc
 */
export interface SpaceStateDto {
  spaceId: string;
  storeId: string;
  brandId: string;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  hlsUrl: string | null;
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: OverrideMode | null;
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null; // Always null in SignalR
  isPaused: boolean;
  pausePositionSeconds: number | null;
  pendingPlaylistId: string | null;
  pendingOverrideReason: string | null;
}

/**
 * Play stream payload (from SIGNALR_STOREHUB.md § 3 - PlayStream event)
 */
export interface PlayStreamPayload {
  spaceId: string;
  hlsUrl: string;
  transitionType: TransitionType;
  playlistId: string;
  isManualOverride: boolean;
  startedAtUtc: string;
}

/**
 * Playback state changed payload (from SIGNALR_STOREHUB.md § 3 - PlaybackStateChanged event)
 */
export interface PlaybackStateChangedPayload {
  spaceId: string;
  command: PlaybackCommand;
  seekPositionSeconds: number | null;
  targetTrackId: string | null;
}

/**
 * Override playlist request (from API_CAMS.md § 3.1)
 * Mode 1: DirectPlaylist (provide playlistId only)
 * Mode 2: MoodOverride (provide moodId only)
 * ⚠️ Must provide exactly ONE of playlistId or moodId, not both
 */
export interface OverridePlaylistRequest {
  playlistId?: string | null;
  moodId?: string | null;
  reason?: string | null; // Optional reason for audit trail
}

/**
 * Playback control request (from API_CAMS.md § 3.3)
 */
export interface PlaybackControlRequest {
  command: PlaybackCommand;
  seekPositionSeconds?: number | null;
  targetTrackId?: string | null;
}

/**
 * Space state response (from API_CAMS.md § 3.4)
 * REST API GET /api/cams/spaces/{id}/state
 * ⚠️ seekOffsetSeconds is calculated server-side at REST call time
 */
export interface SpaceStateResponse {
  spaceId: string;
  storeId: string;
  brandId: string;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  hlsUrl: string | null;
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: OverrideMode | null;
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null; // Calculated server-side in REST
  isPaused: boolean;
  pausePositionSeconds: number | null;
  pendingPlaylistId: string | null;
  pendingOverrideReason: string | null;
}

/**
 * Pair code response (from API_CAMS.md § 4.1)
 * POST /api/cams/spaces/{spaceId}/pair-code
 */
export interface PairCodeResponse {
  code: string; // 6-character code (plain)
  displayCode: string; // Code with dash (e.g., "ABC-123")
  spaceId: string;
  spaceName: string;
  expiresAt: string; // ISO 8601 UTC
  expiresInSeconds: number;
}

/**
 * Pair device info response (from API_CAMS.md § 3.5)
 * GET /api/cams/spaces/{spaceId}/pair-device
 */
export interface PairDeviceInfoResponse {
  spaceId: string;
  storeId: string;
  brandId: string;
  deviceSessionId: string | null;
  isPlaybackDeviceCaller: boolean;
  manufacturer: string | null;
  model: string | null;
  osVersion: string | null;
  appVersion: string | null;
  deviceId: string | null;
  pairedAtUtc: string | null; // ISO 8601 UTC
  lastActiveAtUtc: string | null; // ISO 8601 UTC
}
