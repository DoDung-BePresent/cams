import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { playlistService } from '@/shared/modules/playlists/services';

export const usePlaylist = (id?: string, enabled = true) => {
  return useQuery({
    queryKey: ['playlists', id],
    queryFn: async () => {
      if (!id) throw new Error('Playlist ID is required');
      const response = await playlistService.getById(id);
      return response.data.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};
