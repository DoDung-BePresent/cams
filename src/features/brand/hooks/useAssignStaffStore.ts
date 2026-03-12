import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';


import { staffService } from '../services/staffService';
import { showErrorMessage } from '@/shared/utils';
import type { AssignStaffStoreRequest } from '../types/staffTypes';

export const useAssignStaffStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignStaffStoreRequest }) =>
      staffService.assignStore(id, data),
    onSuccess: (response, variables) => {
      message.success(
        response.data.message || 'Store assignment updated successfully!',
      );
      queryClient.invalidateQueries({
        queryKey: ['staff-detail', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update store assignment!');
    },
  });
};
