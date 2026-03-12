import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { staffService } from '../services/staffService';
import { showErrorMessage } from '@/shared/utils';

export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => staffService.create(formData),
    onSuccess: (response) => {
      message.success(response.data.message || 'Staff created successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to create staff!');
    },
  });
};
