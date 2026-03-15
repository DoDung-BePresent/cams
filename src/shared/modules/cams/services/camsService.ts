import { api } from '@/config';
import type { Result } from '@/shared/types';
import type {
  SpaceStateResponse,
  OverridePlaylistRequest,
  PlaybackControlRequest,
} from '../types';

/**
 * CAMS API endpoints
 */
const CAMS_ENDPOINTS = {
  spaceState: (spaceId: string) => `/api/cams/spaces/${spaceId}/state`,
  overridePlaylist: (spaceId: string) => `/api/cams/spaces/${spaceId}/override`,
  playbackControl: (spaceId: string) => `/api/cams/spaces/${spaceId}/playback`,
} as const;

/**
 * CAMS API Service
 * Handles REST API calls for CAMS operations
 */
export const camsService = {
  /**
   * Get space current state (§ 4.3)
   * GET /api/cams/spaces/{spaceId}/state
   */
  getSpaceState: (spaceId: string) =>
    api.get<Result<SpaceStateResponse>>(CAMS_ENDPOINTS.spaceState(spaceId)),

  /**
   * Override playlist for a space (§ 4.1)
   * POST /api/cams/spaces/{spaceId}/override
   *
   * Mode 1: Playlist override - send { playlistId: "guid" }
   * Mode 2: Mood override - send { moodId: "guid" }
   */
  overridePlaylist: (spaceId: string, data: OverridePlaylistRequest) =>
    api.post<Result>(CAMS_ENDPOINTS.overridePlaylist(spaceId), data),

  /**
   * Control playback (§ 4.2)
   * POST /api/cams/spaces/{spaceId}/playback
   */
  controlPlayback: (spaceId: string, data: PlaybackControlRequest) =>
    api.post<Result>(CAMS_ENDPOINTS.playbackControl(spaceId), data),
};
