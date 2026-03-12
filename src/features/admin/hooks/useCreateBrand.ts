import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { brandService } from '../services';

/**
 * Shared
 */
import { showErrorMessage } from '@/shared/utils';

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => brandService.create(formData),
    onSuccess: (response) => {
      message.success(response.data.message || 'Brand created successfully!');
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to create brand!');
    },
  });
};
