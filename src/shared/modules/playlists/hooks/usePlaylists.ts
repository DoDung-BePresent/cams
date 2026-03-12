import { useQuery } from '@tanstack/react-query';
import { playlistService } from '../services';
import type { PlaylistFilter } from '../types';

export const usePlaylists = (filter: PlaylistFilter = {}) => {
  return useQuery({
    queryKey: ['playlists', filter],
    queryFn: () => playlistService.getList(filter),
    staleTime: 5 * 60 * 1000,
  });
};