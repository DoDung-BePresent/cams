import type { SelectProps } from 'antd';

/**
 * Types
 */
import {
  PlaybackCommand,
  PlaybackMode,
  RepeatMode,
} from '@/shared/modules/cams/types';

/**
 * Playback command labels
 */
export const PLAYBACK_COMMAND_LABELS: Record<PlaybackCommand, string> = {
  [PlaybackCommand.Pause]: 'Pause',
  [PlaybackCommand.Resume]: 'Resume',
  [PlaybackCommand.SkipToNext]: 'Skip to Next',
  [PlaybackCommand.SkipToPrevious]: 'Skip to Previous',
};

/**
 * Playback mode labels
 */
export const PLAYBACK_MODE_LABELS: Record<PlaybackMode, string> = {
  [PlaybackMode.Sequential]: 'Sequential',
  [PlaybackMode.Shuffle]: 'Shuffle',
};

/**
 * Repeat mode labels
 */
export const REPEAT_MODE_LABELS: Record<RepeatMode, string> = {
  [RepeatMode.Off]: 'Off',
  [RepeatMode.RepeatAll]: 'Repeat All',
  [RepeatMode.RepeatOne]: 'Repeat One',
};

/**
 * Playback mode options for Select
 */
export const PLAYBACK_MODE_OPTIONS: SelectProps['options'] = [
  { label: 'Sequential', value: PlaybackMode.Sequential },
  { label: 'Shuffle', value: PlaybackMode.Shuffle },
];

/**
 * Repeat mode options for Select
 */
export const REPEAT_MODE_OPTIONS: SelectProps['options'] = [
  { label: 'Off', value: RepeatMode.Off },
  { label: 'Repeat All', value: RepeatMode.RepeatAll },
  { label: 'Repeat One', value: RepeatMode.RepeatOne },
];

/**
 * SignalR Hub URL
 */
export const STORE_HUB_URL = '/hubs/store';

/**
 * SignalR event names (from SIGNALR_STOREHUB.md)
 */
export const STORE_HUB_EVENTS = {
  // Server → Client events
  PLAY_STREAM: 'PlayStream',
  PLAYBACK_STATE_CHANGED: 'PlaybackStateChanged',
  SPACE_STATE_SYNC: 'SpaceStateSync',

  // Client → Server methods
  JOIN_STORE: 'JoinStore',
  LEAVE_STORE: 'LeaveStore',
  UPDATE_SPACE_MUSIC_STATE: 'UpdateSpaceMusicState',
  GET_SPACE_CURRENT_STATE: 'GetSpaceCurrentState',
  GET_STORE_SPACES_STATE: 'GetStoreSpacesState',
} as const;

/**
 * Default volume level (0-100)
 */
export const DEFAULT_VOLUME = 75;

/**
 * HLS player config
 */
export const HLS_PLAYER_CONFIG = {
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  maxBufferSize: 60 * 1000 * 1000, // 60MB
  maxBufferHole: 0.5,
  lowLatencyMode: true,
  backBufferLength: 90,
} as const;