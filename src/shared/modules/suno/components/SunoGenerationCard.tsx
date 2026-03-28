import { Card, Progress, Badge, Space, Button, Typography, Alert } from 'antd';
import {
  ClockCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  EyeOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/shared/utils';
import {
  getSunoStatusBadgeColor,
  getSunoStatusText,
  isGenerationInProgress,
  isGenerationFinished,
  formatProgress,
} from '../utils';
import { SunoGenerationStatus } from '../types';
import type { SunoGenerationStatusDto } from '../types';

const { Text } = Typography;

interface SunoGenerationCardProps {
  generation: SunoGenerationStatusDto;
  onCancel?: (id: string) => void;
  onViewTrack?: (trackId: string) => void;
  onRetry?: () => void;
}

export const SunoGenerationCard = ({
  generation,
  onCancel,
  onViewTrack,
  onRetry,
}: SunoGenerationCardProps) => {
  const inProgress = isGenerationInProgress(generation.generationStatus);
  const finished = isGenerationFinished(generation.generationStatus);
  const isCompleted =
    generation.generationStatus === SunoGenerationStatus.Completed;
  const isFailed = generation.generationStatus === SunoGenerationStatus.Failed;

  const getStatusIcon = () => {
    switch (generation.generationStatus) {
      case SunoGenerationStatus.Queued:
        return <ClockCircleOutlined />;
      case SunoGenerationStatus.Generating:
        return <LoadingOutlined />;
      case SunoGenerationStatus.Completed:
        return <CheckCircleOutlined />;
      case SunoGenerationStatus.Failed:
        return <CloseCircleOutlined />;
      case SunoGenerationStatus.Cancelled:
        return <StopOutlined />;
      default:
        return null;
    }
  };

  return (
    <Card
      size='small'
      title={
        <Space>
          <SoundOutlined />
          <span>{generation.title || 'Untitled'}</span>
        </Space>
      }
      extra={
        <Badge
          status={getSunoStatusBadgeColor(generation.generationStatus)}
          text={getSunoStatusText(generation.generationStatus)}
        />
      }
      actions={[
        ...(inProgress && onCancel
          ? [
              <Button
                key='cancel'
                type='text'
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(generation.id)}
              >
                Cancel
              </Button>,
            ]
          : []),
        ...(isCompleted && generation.generatedTrackId && onViewTrack
          ? [
              <Button
                key='view'
                type='text'
                icon={<EyeOutlined />}
                onClick={() => onViewTrack(generation.generatedTrackId!)}
              >
                View Track
              </Button>,
            ]
          : []),
        ...(isFailed && onRetry
          ? [
              <Button
                key='retry'
                type='text'
                onClick={onRetry}
              >
                Retry
              </Button>,
            ]
          : []),
      ]}
    >
      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size='middle'
      >
        {/* Basic Info */}
        <Space
          direction='vertical'
          size='small'
          style={{ width: '100%' }}
        >
          {generation.artist && (
            <Text type='secondary'>Artist: {generation.artist}</Text>
          )}
          {generation.prompt && (
            <Text
              type='secondary'
              style={{ fontSize: 12 }}
            >
              Prompt: {generation.prompt}
            </Text>
          )}
        </Space>

        {/* Progress Bar */}
        {inProgress && (
          <Progress
            percent={generation.progressPercent}
            status='active'
            format={(percent) => formatProgress(percent || 0)}
          />
        )}

        {/* Status Icon & Message */}
        <Space>
          {getStatusIcon()}
          <Text>{getSunoStatusText(generation.generationStatus)}</Text>
        </Space>

        {/* Error Message */}
        {isFailed && generation.errorMessage && (
          <Alert
            message='Generation Failed'
            description={generation.errorMessage}
            type='error'
            showIcon
          />
        )}

        {/* Completion Info */}
        {finished && generation.completedAtUtc && (
          <Text
            type='secondary'
            style={{ fontSize: 12 }}
          >
            {isCompleted ? 'Completed' : 'Finished'} at{' '}
            {formatDateTime(generation.completedAtUtc)}
          </Text>
        )}

        {/* Created At */}
        <Text
          type='secondary'
          style={{ fontSize: 12 }}
        >
          Created: {formatDateTime(generation.createdAt)}
        </Text>
      </Space>
    </Card>
  );
};
