import { useQuery } from '@tanstack/react-query';
import { trackService } from '../services';
import type { TrackFilter } from '../types';

export const useTracks = (filter: TrackFilter = {}) => {
  return useQuery({
    queryKey: ['tracks', filter],
    queryFn: () => trackService.getList(filter),
    staleTime: 5 * 60 * 1000,
  });
};
