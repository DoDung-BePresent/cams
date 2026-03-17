import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Utils
 */
import { handleApiError } from '@/shared/utils';

/**
 * Services
 */
import { brandService } from '../../services';

export const useToggleBrandStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      message.success('Brand status updated successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
