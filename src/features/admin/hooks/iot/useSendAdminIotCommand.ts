import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminIotService } from '@/features/admin/services';
import type { SendAdminIotCommandRequest } from '@/features/admin/types';

export const useSendAdminIotCommand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spaceId,
      payload,
    }: {
      spaceId: string;
      payload: SendAdminIotCommandRequest;
    }) => adminIotService.sendCommand(spaceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-iot-spaces'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-iot-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};
