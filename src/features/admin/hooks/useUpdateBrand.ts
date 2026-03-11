import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { brandService } from '../services/brandService';

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      brandService.update(id, formData),
    onSuccess: (response, variables) => {
      message.success(response.data.message || 'Brand updated successfully!');
      // Invalidate specific brand + list
      queryClient.invalidateQueries({ queryKey: ['brand', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update brand!';
      message.error(errorMessage);
    },
  });
};
