import { useQuery } from '@tanstack/react-query';
import { moodService } from '../services';
import { MOOD_QUERY_KEYS } from '../constants';
import type { MoodOption } from '../types';

/**
 * Hook to fetch mood list
 * Returns all active moods sorted by priority
 */
export const useMoods = () => {
  return useQuery({
    queryKey: MOOD_QUERY_KEYS.LIST,
    queryFn: async () => {
      const response = await moodService.getList();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (moods rarely change)
  });
};

/**
 * Hook to get mood options for Select component
 * Transforms MoodListItem[] to SelectOption[]
 */
export const useMoodOptions = (): {
  options: MoodOption[];
  isLoading: boolean;
} => {
  const { data: moods, isLoading } = useMoods();

  const options: MoodOption[] =
    moods?.map((mood) => ({
      label: mood.name,
      value: mood.id,
      moodType: mood.moodType,
      energyLevel: mood.energyLevel,
    })) || [];

  return { options, isLoading };
};
