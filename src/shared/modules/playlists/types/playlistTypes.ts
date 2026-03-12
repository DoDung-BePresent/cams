import type {
  BaseResponse,
  PaginationResult,
} from '@/shared/types/commonTypes';

// ============================================================================
// Enums
// ============================================================================

export enum PlaylistTypeEnum {
  Static = 0,
  Dynamic = 1,
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreatePlaylistRequest {
  name: string;
  storeId: string;
  moodId?: string;
  description?: string;
  isDynamic?: boolean;
  isDefault?: boolean;
  hlsUrl?: string;
  totalDurationSeconds?: number;
  trackIds?: string[];
}

export interface UpdatePlaylistRequest {
  name?: string;
  moodId?: string;
  description?: string;
  isDynamic?: boolean;
  isDefault?: boolean;
  hlsUrl?: string;
  totalDurationSeconds?: number;
  trackIds?: string[] | null; // null = no change; [] = clear all; [...] = sync
}

export interface AddTracksToPlaylistRequest {
  trackIds: string[];
}

// ============================================================================
// Filter
// ============================================================================

export interface PlaylistFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  status?: number;
  brandId?: string;
  storeId?: string;
  moodId?: string;
  isDynamic?: boolean;
  isDefault?: boolean;
  createdFrom?: string;
  createdTo?: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface PlaylistListItem extends BaseResponse {
  brandId?: string;
  storeId?: string;
  storeName?: string;
  moodId?: string;
  moodName?: string;
  name?: string;
  description?: string;
  isDynamic?: boolean;
  isDefault?: boolean;
  hlsUrl?: string;
  totalDurationSeconds?: number;
  trackCount: number;
}

export interface PlaylistTrackItem {
  trackId: string;
  title?: string;
  artist?: string;
  durationSec?: number;
  orderIndex?: number;
  coverImageUrl?: string;
  actualDurationSec?: number;
  seekOffsetSeconds: number; // Server-calculated cumulative offset
}

export interface PlaylistDetailResponse extends PlaylistListItem {
  tracks: PlaylistTrackItem[];
}

// ============================================================================
// Pagination Result
// ============================================================================

export type PlaylistPaginationResult = PaginationResult<PlaylistListItem>;
