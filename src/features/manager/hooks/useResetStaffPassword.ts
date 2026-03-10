import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { staffService } from '../services/staffService';
import { showErrorMessage } from '@/shared/utils/errorHandler';
import type { ResetStaffPasswordRequest } from '../types/staffTypes';

export const useResetStaffPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ResetStaffPasswordRequest;
    }) => staffService.resetPassword(id, data),
    onSuccess: (response, variables) => {
      message.success(response.data.message || 'Password reset successfully!');
      queryClient.invalidateQueries({
        queryKey: ['staff-detail', variables.id],
      });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to reset password!');
    },
  });
};
