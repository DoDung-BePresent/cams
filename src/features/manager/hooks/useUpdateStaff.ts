import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { staffService } from '../services/staffService';
import { showErrorMessage } from '@/shared/utils/errorHandler';

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      staffService.update(id, formData),
    onSuccess: (response, variables) => {
      message.success(response.data.message || 'Staff updated successfully!');
      queryClient.invalidateQueries({
        queryKey: ['staff-detail', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update staff!');
    },
  });
};
