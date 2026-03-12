import { useQuery } from '@tanstack/react-query';
import { playlistService } from '../services';
import type { PlaylistFilter } from '../types';

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
