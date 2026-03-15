import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

/**
 * Services
 */
import { accountService } from '@/features/admin/services';

/**
 * Types
 */
import type { AssignBrandRequest } from '@/features/admin/types';

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
      showErrorMessage(error, 'Failed to assign brand!');
    },
  });
};
