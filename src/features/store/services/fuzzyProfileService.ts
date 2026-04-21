import { api } from '@/config';

import type { FuzzyMusicProfileDto } from '@/features/store/types';
import type { Result } from '@/shared/types';

const FUZZY_PROFILE_ENDPOINTS = {
  byStore: (storeId: string) => `/api/fuzzy-music-profiles/store/${storeId}`,
  byStoreSelf: `/api/fuzzy-music-profiles/store`,
  // StoreManager: session-resolved, no profileId needed
  autoVolumeByStore: `/api/fuzzy-music-profiles/store/auto-volume`,
  // BrandManager: profileId identifies the brand-level profile
  autoVolumeByBrand: (profileId: string) =>
    `/api/fuzzy-music-profiles/brand/${profileId}/auto-volume`,
  // Space-level (with store→brand fallback for GET)
  bySpace: (spaceId: string) => `/api/fuzzy-music-profiles/space/${spaceId}`,
  autoVolumeBySpace: (spaceId: string) =>
    `/api/fuzzy-music-profiles/space/${spaceId}/auto-volume`,
} as const;

export const fuzzyProfileService = {
  getByStore: (storeId: string) =>
    api.get<Result<FuzzyMusicProfileDto>>(
      FUZZY_PROFILE_ENDPOINTS.byStore(storeId),
    ),

  // StoreManager: session-resolved (no storeId in URL)
  getByStoreSelf: () =>
    api.get<Result<FuzzyMusicProfileDto>>(FUZZY_PROFILE_ENDPOINTS.byStoreSelf),

  // StoreManager: PATCH store/auto-volume (storeId session-resolved)
  patchAutoVolumeByStore: (enabled: boolean) =>
    api.patch<Result>(FUZZY_PROFILE_ENDPOINTS.autoVolumeByStore, { enabled }),

  // BrandManager: PATCH brand/{profileId}/auto-volume
  patchAutoVolumeByBrand: (profileId: string, enabled: boolean) =>
    api.patch<Result>(FUZZY_PROFILE_ENDPOINTS.autoVolumeByBrand(profileId), {
      enabled,
    }),

  // Space-level: GET with store→brand fallback, PATCH space-override only
  getBySpace: (spaceId: string) =>
    api.get<Result<FuzzyMusicProfileDto>>(
      FUZZY_PROFILE_ENDPOINTS.bySpace(spaceId),
    ),

  patchAutoVolumeBySpace: (spaceId: string, enabled: boolean) =>
    api.patch<Result>(FUZZY_PROFILE_ENDPOINTS.autoVolumeBySpace(spaceId), {
      enabled,
    }),
};
