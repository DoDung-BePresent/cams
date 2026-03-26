import { useMemo } from 'react';
import { Empty, Spin, Divider } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { SunoGenerationCard } from './SunoGenerationCard';
import { useSunoGenerationHistory } from '../hooks';
import type { SunoGenerationStatusDto } from '../types';

interface SunoPromptHistoryProps {
  pageSize?: number;
}

export const SunoPromptHistory = ({
  pageSize = 10,
}: SunoPromptHistoryProps) => {
  const { data, isLoading } = useSunoGenerationHistory(1, pageSize);
  const generations = useMemo(() => {
    return (data?.items ?? []) as SunoGenerationStatusDto[];
  }, [data]);

  if (isLoading && generations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin size='large' />
      </div>
    );
  }

  if (!generations.length) {
    return (
      <>
        <Divider />
        <Empty
          image={<SoundOutlined style={{ fontSize: 64, color: '#999' }} />}
          description='No generations yet.'
        />
      </>
    );
  }

  return (
    <>
      <Divider orientation='left'>Prompt History</Divider>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {generations.map((generation) => (
          <SunoGenerationCard
            key={generation.id}
            generation={generation}
          />
        ))}
      </div>
    </>
  );
};
