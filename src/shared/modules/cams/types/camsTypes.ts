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
 * Space state DTO (from SIGNALR_STOREHUB.md § 2.3)
 * Used in SignalR events only
 */
export interface SpaceStateDto {
  spaceId: string;
  currentPlaylistId: string | null;
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number;
  currentPositionSeconds: number;
  playbackMode: PlaybackMode;
  repeatMode: RepeatMode;
  lastUpdated: string;
}

/**
 * Play stream payload (from SIGNALR_STOREHUB.md § 1.1)
 */
export interface PlayStreamPayload {
  spaceId: string;
  hlsUrl: string;
  currentTrackId: string;
  currentPlaylistId: string;
  transitionType: TransitionType;
}

/**
 * Playback state changed payload (from SIGNALR_STOREHUB.md § 1.2)
 */
export interface PlaybackStateChangedPayload {
  spaceId: string;
  command: PlaybackCommand;
  seekPositionSeconds: number | null;
  targetTrackId: string | null;
}

/**
 * Override playlist request (from API_CAMS.md § 4.1)
 * Mode 1: Playlist override (provide playlistId only)
 * Mode 2: Mood override (provide moodId only)
 */
export interface OverridePlaylistRequest {
  playlistId?: string | null;
  moodId?: string | null;
}

/**
 * Playback control request (from API_CAMS.md § 4.2)
 */
export interface PlaybackControlRequest {
  command: PlaybackCommand;
  seekPositionSeconds?: number | null;
  targetTrackId?: string | null;
}

/**
 * Space state response (from API_CAMS.md § 4.3)
 * REST API GET /api/cams/spaces/{id}/state
 */
export interface SpaceStateResponse {
  spaceId: string;
  currentPlaylistId: string | null;
  currentPlaylistName: string | null;
  hlsUrl: string | null;
  moodName: string | null;
  isManualOverride: boolean;
  overrideMode: OverrideMode | null;
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
  seekOffsetSeconds: number | null;
}
