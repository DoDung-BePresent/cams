import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { accountService } from '../services/accountService';
import type { ResetPasswordRequest } from '../types/accountTypes';

export const useResetAccountPassword = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetPasswordRequest }) =>
      accountService.resetPassword(id, data),
    onSuccess: (response) => {
      message.success(response.data.message || 'Password reset successfully!');
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to reset password!';
      message.error(errorMessage);
    },
  });
};
