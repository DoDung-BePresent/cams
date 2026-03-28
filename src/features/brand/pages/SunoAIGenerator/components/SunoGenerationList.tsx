import { useEffect, useMemo } from 'react';
import { Row, Col, Empty, Spin } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { SunoGenerationCard } from '@/shared/modules/suno/components';
import {
  useCancelSunoGeneration,
  useUpdateGenerationFromSignalR,
  useSunoGenerationStatus,
  useSunoGenerationHistory,
} from '@/shared/modules/suno/hooks';
import type {
  SunoGenerationRealtimeDto,
  SunoGenerationStatusDto,
} from '@/shared/modules/suno/types';
import { useAuth } from '@/providers';
import { useSignalR } from '@/shared/hooks';
import { useQueryClient } from '@tanstack/react-query';

interface SunoGenerationListProps {
  generationId?: string;
}

export const SunoGenerationList = ({
  generationId,
}: SunoGenerationListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cancelGeneration = useCancelSunoGeneration();
  const updateFromSignalR = useUpdateGenerationFromSignalR();

  const { data: historyResponse, isLoading: isHistoryLoading } =
    useSunoGenerationHistory(1, 20);

  // Poll fallback for the latest created generation.
  // This makes History tab usable even if SignalR is slow/missed.
  const { data: polledGeneration } = useSunoGenerationStatus(generationId, {
    enabled: !!generationId,
    refetchInterval: 5000,
  });

  // SignalR connection
  const { connection, isConnected } = useSignalR('/hubs/store');

  // Join brand room when connected
  useEffect(() => {
    if (isConnected && connection && user?.brandId) {
      connection
        .invoke('JoinBrandManagerRoomAsync', user.brandId)
        .catch((err) => console.error('Failed to join brand room:', err));
    }
  }, [isConnected, connection, user?.brandId]);

  // Listen for generation status updates
  useEffect(() => {
    if (!connection) return;

    const handleStatusChanged = (data: SunoGenerationRealtimeDto) => {
      console.log('Suno generation status changed:', data);

      // Update React Query cache
      updateFromSignalR(data as SunoGenerationStatusDto);

      // Also refresh history list so cards update on reload/poll.
      queryClient.invalidateQueries({
        queryKey: ['suno', 'generations', 'history'],
      });
    };

    connection.on('SunoGenerationStatusChanged', handleStatusChanged);

    return () => {
      connection.off('SunoGenerationStatusChanged', handleStatusChanged);
    };
  }, [connection, updateFromSignalR, queryClient]);

  const generations = useMemo(() => {
    const base = historyResponse?.items ? [...historyResponse.items] : [];

    if (!polledGeneration) return base.slice(0, 10);

    const index = base.findIndex((g) => g.id === polledGeneration.id);
    if (index >= 0) {
      base[index] = { ...base[index], ...polledGeneration };
    } else {
      base.unshift(polledGeneration);
    }

    return base.slice(0, 10);
  }, [historyResponse, polledGeneration]);

  const handleCancel = async (id: string) => {
    await cancelGeneration.mutateAsync(id);
  };

  const handleViewTrack = (trackId: string) => {
    // Navigate to track details or open drawer
    window.open(`/brand/tracks?id=${trackId}`, '_blank');
  };

  const handleRetry = () => {
    // Could implement retry logic here
    console.log('Retry generation');
  };

  if (isHistoryLoading && generations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size='large' />
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <Empty
        image={<SoundOutlined style={{ fontSize: 64, color: '#999' }} />}
        description='No generations yet. Start by generating your first AI music!'
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {generations.map((generation) => (
        <Col
          key={generation.id}
          xs={24}
          sm={12}
          lg={8}
          xl={6}
        >
          <SunoGenerationCard
            generation={generation}
            onCancel={handleCancel}
            onViewTrack={handleViewTrack}
            onRetry={handleRetry}
          />
        </Col>
      ))}
    </Row>
  );
};
