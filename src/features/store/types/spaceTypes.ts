import type {
  BaseResponse,
  PaginationResult,
} from '@/shared/types/commonTypes';
import type { BasePaginationFilter } from '@/shared/types/commonTypes';

/**
 * Space Type Enum (from API_Spaces.md §4.5)
 */
export enum SpaceTypeEnum {
  Counter = 1,
  Hall = 2,
  Entrance = 3,
  Outdoor = 4,
  Kitchen = 5,
  Restroom = 6,
}

/**
 * Space List Item (from API_Spaces.md §4.3)
 * Inherits from BaseResponse
 */
export interface SpaceListItem extends BaseResponse {
  storeId: string;
  name: string;
  type: SpaceTypeEnum;
  description?: string;
}

/**
 * Space Detail Response (from API_Spaces.md §4.4)
 * Inherits from SpaceListItem
 */
export interface SpaceDetailResponse extends SpaceListItem {
  cameraId?: string;
  roiCoordinates?: string;
  maxOccupancy?: number;
  criticalQueueThreshold?: number;
  wiFiSensorId?: string;
  currentPlaylistId?: string; // 🔒 Read-only (set by AI pipeline)
}

/**
 * Create Space Request (from API_Spaces.md §4.1)
 * StoreManager: storeId is ignored (auto-filled from user.StoreId)
 */
export interface CreateSpaceRequest {
  name: string; // Required
  type: SpaceTypeEnum; // Required
  description?: string;
  cameraId?: string;
  roiCoordinates?: string;
  maxOccupancy?: number;
  criticalQueueThreshold?: number;
  wiFiSensorId?: string;
}

/**
 * Update Space Request (from API_Spaces.md §4.1)
 * Partial update - all fields optional
 */
export interface UpdateSpaceRequest {
  name?: string;
  type?: SpaceTypeEnum;
  description?: string;
  cameraId?: string;
  roiCoordinates?: string;
  maxOccupancy?: number;
  criticalQueueThreshold?: number;
  wiFiSensorId?: string;
}

/**
 * Space Filter (from API_Spaces.md §4.2)
 * Extends BasePaginationFilter
 * Note: storeId is auto-overridden to user.StoreId for StoreManager
 */
export interface SpaceFilter extends BasePaginationFilter {
  type?: SpaceTypeEnum;
  createdFrom?: string; // ISO 8601 datetime
  createdTo?: string; // ISO 8601 datetime
}

/**
 * Pagination Result for Space List
 */
export type SpacePaginationResult = PaginationResult<SpaceListItem>;
