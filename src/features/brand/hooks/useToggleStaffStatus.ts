import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { staffService } from '../services/staffService';
import { showErrorMessage } from '@/shared/utils';

export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffService.toggleStatus(id),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Staff status updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to toggle staff status!');
    },
  });
};
