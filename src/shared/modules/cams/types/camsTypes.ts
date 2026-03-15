/**
 * Playback command enum (from SIGNALR_STOREHUB.md § 2.1)
 */
export enum PlaybackCommand {
  Pause = 0,
  Resume = 1,
  SkipToNext = 2,
  SkipToPrevious = 3,
}

/**
 * Transition type enum (from SIGNALR_STOREHUB.md § 2.2)
 */
export enum TransitionType {
  Manual = 0,
  AutoNext = 1,
  Scheduled = 2,
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
 * Space state DTO (from SIGNALR_STOREHUB.md § 2.3)
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
  isPlaying: boolean;
  currentPositionSeconds: number;
}

/**
 * Override playlist request (from API_CAMS.md § 4.1)
 */
export interface OverridePlaylistRequest {
  newPlaylistId: string;
}

/**
 * Playback control request (from API_CAMS.md § 4.2)
 */
export interface PlaybackControlRequest {
  command: PlaybackCommand;
}

/**
 * Space state response (from API_CAMS.md § 4.3)
 */
export interface SpaceStateResponse extends SpaceStateDto {
  spaceName: string;
  playlistName: string | null;
  trackTitle: string | null;
}
