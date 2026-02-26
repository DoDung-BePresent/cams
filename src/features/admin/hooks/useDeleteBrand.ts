import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { brandService } from '../services/brandService';

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandService.delete(id),
    onSuccess: (response) => {
      message.success(response.data.message || 'Brand deleted successfully!');
      // Invalidate brands list
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to delete brand!';
      message.error(errorMessage);
    },
  });
};
