import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSignalR } from '@/shared/hooks';

const ADMIN_IOT_COMMAND_CHANGED = 'AdminIotCommandChanged';
const ADMIN_IOT_SUMMARY_CHANGED = 'AdminIotSummaryChanged';

export const useAdminIotRealtime = () => {
  const queryClient = useQueryClient();
  const { connection, isConnected, error } = useSignalR('/hubs/admin');

  useEffect(() => {
    if (!connection) return;

    const invalidateIotQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-iot-spaces'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-iot-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    };

    connection.on(ADMIN_IOT_COMMAND_CHANGED, invalidateIotQueries);
    connection.on(ADMIN_IOT_SUMMARY_CHANGED, invalidateIotQueries);

    return () => {
      connection.off(ADMIN_IOT_COMMAND_CHANGED, invalidateIotQueries);
      connection.off(ADMIN_IOT_SUMMARY_CHANGED, invalidateIotQueries);
    };
  }, [connection, queryClient]);

  return { isConnected, error };
};
