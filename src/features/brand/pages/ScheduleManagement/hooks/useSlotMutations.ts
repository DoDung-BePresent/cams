import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import type { UpsertScheduleSlotRequest } from '../types/schedule.types';
import { api } from '@/config';

/**
 * Mutations for schedule slot operations
 *
 * All mutations invalidate the bootstrap query to refresh UI
 */
export const useSlotMutations = (spaceId: string) => {
  const queryClient = useQueryClient();

  const invalidateBootstrap = () => {
    queryClient.invalidateQueries({
      queryKey: ['schedule', 'bootstrap', spaceId],
    });
  };

  /**
   * Create a new slot
   * API: PUT /api/cms/schedule/spaces/{spaceId}/slots/{slotId}
   */
  const createSlot = useMutation({
    mutationFn: async ({
      slotId,
      data,
    }: {
      slotId: string;
      data: UpsertScheduleSlotRequest;
    }) => {
      const response = await api.put(
        `/cms/schedule/spaces/${spaceId}/slots/${slotId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Time slot created successfully');
      invalidateBootstrap();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Failed to create time slot',
      );
    },
  });

  /**
   * Update an existing slot
   * API: PUT /api/cms/schedule/spaces/{spaceId}/slots/{slotId}
   */
  const updateSlot = useMutation({
    mutationFn: async ({
      slotId,
      data,
    }: {
      slotId: string;
      data: UpsertScheduleSlotRequest;
    }) => {
      const response = await api.put(
        `/cms/schedule/spaces/${spaceId}/slots/${slotId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Time slot updated successfully');
      invalidateBootstrap();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Failed to update time slot',
      );
    },
  });

  /**
   * Delete a slot
   * API: DELETE /api/cms/schedule/spaces/{spaceId}/slots/{slotId}
   */
  const deleteSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await api.delete(
        `/cms/schedule/spaces/${spaceId}/slots/${slotId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Time slot deleted successfully');
      invalidateBootstrap();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Failed to delete time slot',
      );
    },
  });

  return {
    createSlot,
    updateSlot,
    deleteSlot,
  };
};
