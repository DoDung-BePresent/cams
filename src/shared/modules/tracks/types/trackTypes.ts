import type {
  BaseResponse,
  PaginationResult,
  BasePaginationFilter,
} from '@/shared/types/commonTypes';

/**
 * Music Provider Enum (from API_Tracks.md §4.5)
 */
export enum MusicProviderEnum {
  Custom = 0, // Manual upload (default)
  Suno = 1, // AI-generated from Suno
}

/**
 * Track List Item (from API_Tracks.md §4.3)
 * Used in GET /api/tracks response
 */
export interface TrackListItem extends BaseResponse {
  brandId?: string;
  title: string;
  artist?: string;
  moodId?: string;
  moodName?: string; // From Mood navigation
  genre?: string;
  provider?: MusicProviderEnum;
  durationSec?: number;
  audioUrl?: string; // Can be null if upload failed
  coverImageUrl?: string;
  playCount: number;
  isAiGenerated?: boolean;
}

/**
 * Track Detail Response (from API_Tracks.md §4.4)
 * Used in GET /api/tracks/{id} response
 */
export interface TrackDetailResponse extends TrackListItem {
  bpm?: number; // 20-300
  energyLevel?: number; // 0.0-1.0
  valence?: number; // 0.0-1.0
  sunoClipId?: string; // AI only
  generationPrompt?: string; // AI only
  generatedAt?: string; // AI only
  lyricsUrl?: string; // AI only
  lastPlayedAt?: string;
}

/**
 * Create Track Request (from API_Tracks.md §4.1)
 * Content-Type: multipart/form-data
 */
export interface CreateTrackRequest {
  title: string; // Required, max 255, unique per brand
  artist?: string; // Max 255
  moodId?: string;
  durationSec?: number; // > 0
  bpm?: number; // 20-300
  genre?: string;
  energyLevel?: number; // 0.0-1.0
  valence?: number; // 0.0-1.0
  provider?: MusicProviderEnum; // Default: Custom (0)
  audioFile: File; // Required, .mp3/.wav/.aac/.flac/.ogg/.m4a, max 50MB
  coverImageFile?: File; // Optional, .jpg/.jpeg/.png/.webp, max 5MB
}

/**
 * Update Track Request (from API_Tracks.md §4.1)
 * Content-Type: multipart/form-data
 * Partial update semantics - all fields optional
 */
export interface UpdateTrackRequest {
  title?: string;
  artist?: string;
  moodId?: string;
  durationSec?: number;
  bpm?: number;
  genre?: string;
  energyLevel?: number;
  valence?: number;
  audioFile?: File; // If null, keep existing
  coverImageFile?: File; // If null, keep existing
}

/**
 * Track Filter (from API_Tracks.md §4.2)
 * Extends BasePaginationFilter with track-specific filters
 */
export interface TrackFilter extends BasePaginationFilter {
  brandId?: string; // SystemAdmin only - BM/SM auto-scoped
  moodId?: string;
  genre?: string;
  provider?: MusicProviderEnum;
  isAiGenerated?: boolean;
  createdFrom?: string; // ISO 8601
  createdTo?: string; // ISO 8601
}

/**
 * Track Pagination Result
 * Used in GET /api/tracks response
 */
export type TrackPaginationResult = PaginationResult<TrackListItem>;
