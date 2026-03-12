import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { brandService } from '../services';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandService.delete(id),
    onSuccess: (response) => {
      message.success(response.data.message || 'Brand deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to delete brand!');
    },
  });
};
