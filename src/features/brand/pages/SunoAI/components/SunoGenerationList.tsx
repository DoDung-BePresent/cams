import { useState, useEffect } from 'react';
import { Row, Col, Empty, Spin } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { SunoGenerationCard } from '@/shared/modules/suno/components';
import {
  useCancelSunoGeneration,
  useUpdateGenerationFromSignalR,
} from '@/shared/modules/suno/hooks';
import type {
  SunoGenerationRealtimeDto,
  SunoGenerationStatusDto,
} from '@/shared/modules/suno/types';
import { useAuth } from '@/providers';
import { useSignalR } from '@/shared/hooks';

export const SunoGenerationList = () => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<SunoGenerationStatusDto[]>([]);

  const cancelGeneration = useCancelSunoGeneration();
  const updateFromSignalR = useUpdateGenerationFromSignalR();

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

      // Update local state
      setGenerations((prev) => {
        const index = prev.findIndex((g) => g.id === data.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        }
        // If not found, it's a new generation - will be fetched by polling
        return prev;
      });

      // Update React Query cache
      updateFromSignalR(data as SunoGenerationStatusDto);
    };

    connection.on('SunoGenerationStatusChanged', handleStatusChanged);

    return () => {
      connection.off('SunoGenerationStatusChanged', handleStatusChanged);
    };
  }, [connection, updateFromSignalR]);

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

  // TODO: Implement actual generation list fetching
  // For now, showing empty state
  const isLoading = false;

  if (isLoading) {
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
