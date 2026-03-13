import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { playlistService } from '@/shared/modules/playlists/services';

/**
 * Types
 */
import type { PlaylistFilter } from '@/shared/modules/playlists/types';

export const usePlaylists = (filter: PlaylistFilter = {}) => {
  return useQuery({
    queryKey: ['playlists', filter],
    queryFn: async () => {
      const response = await playlistService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
