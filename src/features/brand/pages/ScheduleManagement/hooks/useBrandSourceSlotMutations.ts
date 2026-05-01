import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { api, QUERY_KEYS } from '@/config';
import type { UpsertBrandScheduleSlotRequest } from '@/features/brand/types';

/**
 * Mutations for brand schedule source slot operations
 *
 * All mutations invalidate library and templates queries to refresh UI
 */
export const useBrandSourceSlotMutations = (
  sourceId: string,
  brandId?: string,
) => {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.schedules.library(brandId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.schedules.templates(brandId),
    });
  };

  /**
   * Create or update a slot in brand source
   * API: PUT /api/cms/schedule/brands/sources/{sourceId}/slots/{slotId}
   */
  const upsertSlot = useMutation({
    mutationFn: async ({
      slotId,
      data,
    }: {
      slotId: string;
      data: UpsertBrandScheduleSlotRequest;
    }) => {
      const response = await api.put(
        `/api/cms/schedule/brands/sources/${sourceId}/slots/${slotId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Time slot saved successfully');
      invalidateQueries();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Failed to save time slot',
      );
    },
  });

  /**
   * Delete a slot from brand source
   * API: DELETE /api/cms/schedule/brands/sources/{sourceId}/slots/{slotId}
   */
  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await api.delete(
        `/api/cms/schedule/brands/sources/${sourceId}/slots/${slotId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Time slot deleted successfully');
      invalidateQueries();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Failed to delete time slot',
      );
    },
  });

  return {
    upsertSlot,
    deleteSlot,
  };
};
