import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { accountService } from '../services/accountService';
import type { AssignBrandRequest } from '../types/accountTypes';

export const useAssignAccountBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignBrandRequest }) =>
      accountService.assignBrand(id, data),
    onSuccess: (response, variables) => {
      message.success(response.data.message || 'Brand assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to assign brand!';
      message.error(errorMessage);
    },
  });
};
