import { useQuery } from '@tanstack/react-query';
import type { ScheduleBootstrapData } from '../types/schedule.types';
import { api } from '@/config';

/**
 * Fetch schedule bootstrap data for a space
 *
 * Returns:
 * - draftSchedule: Current space schedule with slots
 * - librarySources: Reusable library templates (type='library')
 * - templateSources: Brand templates for StrictSync (type='template')
 * - musicCatalog: Available playlists
 *
 * API: GET /api/cms/schedule/spaces/{spaceId}/bootstrap
 */
export const useScheduleBootstrap = (spaceId: string) => {
  return useQuery({
    queryKey: ['schedule', 'bootstrap', spaceId],
    queryFn: async () => {
      const response = await api.get<ScheduleBootstrapData>(
        `/cms/schedule/spaces/${spaceId}/bootstrap`,
      );
      return response.data;
    },
    enabled: !!spaceId && spaceId !== 'temp-space-id',
    staleTime: 30000, // 30 seconds
  });
};
