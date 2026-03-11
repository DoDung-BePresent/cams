import type { Result } from '@/shared/types/commonTypes';
import { MOOD_ENDPOINTS } from '../constants';
import type { MoodListItem } from '../types';
import { api } from '@/config/api';

/**
 * Mood Service - API calls for mood management
 * Used by both Brand and Store roles
 */
export const moodService = {
  /**
   * Get all active moods (no pagination needed - small dataset)
   * Auth: SystemAdmin, BrandManager, StoreManager
   */
  getList: async (): Promise<Result<MoodListItem[]>> => {
    const response = await api.get<Result<MoodListItem[]>>(
      MOOD_ENDPOINTS.GET_LIST,
    );
    return response.data;
  },
};
