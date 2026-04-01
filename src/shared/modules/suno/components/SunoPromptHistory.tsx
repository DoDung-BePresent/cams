import { useMemo } from 'react';
import { Empty, Spin, Divider } from 'antd';

/**
 * Assets
 */
import EmptyMedia from '@/assets/svg/image.svg?react';

/**
 * Components
 */
import { SunoGenerationCard } from './SunoGenerationCard';

/**
 * Hooks
 */
import { useSunoGenerationHistory } from '../hooks';

/**
 * Types
 */
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
          image={<EmptyMedia />}
          description='No generations yet.'
        />
      </>
    );
  }

  return (
    <>
      <Divider>Prompt History</Divider>
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
