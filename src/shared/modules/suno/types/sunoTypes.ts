import type { BaseResponse } from '@/shared/types/commonTypes';

/**
 * Suno Generation Status Enum (from backend)
 * See: docs/cams/FE_SUNO_IMPLEMENTATION_GUIDE.md §2
 */
export enum SunoGenerationStatus {
  Queued = 0, // Job queued, waiting to start
  Generating = 1, // AI is generating music
  Completed = 2, // Generation completed successfully
  Failed = 3, // Generation failed
  Cancelled = 4, // Generation cancelled by user
}

/**
 * Suno Config Response (from backend)
 * GET /api/cms/suno/config
 */
export interface SunoConfigResponse {
  brandId: string;
  sunoPromptTemplate: string | null;
  sunoDefaultPlaylistId: string | null;
}

/**
 * Suno Config Update Request
 * PUT /api/cms/suno/config
 */
export interface SunoConfigUpdateRequest {
  sunoPromptTemplate?: string | null;
  sunoDefaultPlaylistId?: string | null;
}

/**
 * Suno Generation Create Request
 * POST /api/cms/suno/generations
 */
export interface SunoGenerationCreateRequest {
  prompt?: string | null;
  title?: string | null;
  artist?: string | null;
  moodId?: string | null;
  targetPlaylistId?: string | null;
  autoAddToTargetPlaylist?: boolean;
}

/**
 * Suno Generation Realtime DTO (SignalR event payload)
 * Event: SunoGenerationStatusChanged
 */
export interface SunoGenerationRealtimeDto {
  id: string;
  brandId: string;
  generationStatus: SunoGenerationStatus;
  progressPercent: number;
  errorMessage: string | null;
  generatedTrackId: string | null;
}

/**
 * Suno Generation Status DTO (full detail)
 * GET /api/cms/suno/generations/{id}
 * POST /api/cms/suno/generations (response)
 */
export interface SunoGenerationStatusDto
  extends SunoGenerationRealtimeDto, BaseResponse {
  prompt: string | null;
  title: string | null;
  artist: string | null;
  externalTaskId: string | null;
  outputAudioUrl: string | null;
  targetPlaylistId: string | null;
  completedAtUtc: string | null;
  lastPolledAtUtc: string | null;
}

/**
 * Local UI state for generation item
 */
export type SunoGenerationUIState =
  | 'idle'
  | 'queued'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Map backend status to UI state
 */
export const mapSunoStatusToUIState = (
  status: SunoGenerationStatus,
): SunoGenerationUIState => {
  switch (status) {
    case SunoGenerationStatus.Queued:
      return 'queued';
    case SunoGenerationStatus.Generating:
      return 'generating';
    case SunoGenerationStatus.Completed:
      return 'completed';
    case SunoGenerationStatus.Failed:
      return 'failed';
    case SunoGenerationStatus.Cancelled:
      return 'cancelled';
    default:
      return 'idle';
  }
};
