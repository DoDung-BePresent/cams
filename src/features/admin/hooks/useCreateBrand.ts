import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { brandService } from '../services/brandService';

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => brandService.create(formData),
    onSuccess: (response) => {
      message.success(response.data.message || 'Brand created successfully!');
      // Invalidate brands list to refetch
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to create brand!';
      message.error(errorMessage);
    },
  });
};
