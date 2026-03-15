import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { brandService } from '@/features/admin/services';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      brandService.update(id, formData),
    onSuccess: (response, variables) => {
      message.success(response.data.message || 'Brand updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['brand', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update brand!');
    },
  });
};
