import { Badge, Space, Tag, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { TrackDetailResponse, TrackListItem } from '../types';
import { TrackMetadataStatus } from '../types';
import {
  getTrackMetadataStatus,
  getMetadataStatusText,
  formatBpm,
  formatEnergyLevel,
  formatValence,
} from '../utils';

interface MetadataStatusBadgeProps {
  track: TrackListItem | TrackDetailResponse;
  showDetails?: boolean; // Show BPM, Energy, Valence tags when ready
}

export const MetadataStatusBadge = ({
  track,
  showDetails = false,
}: MetadataStatusBadgeProps) => {
  const status = getTrackMetadataStatus(track);
  const detailTrack = track as TrackDetailResponse;

  // Ready status with details
  if (status === TrackMetadataStatus.Ready && showDetails) {
    return (
      <Space size='small'>
        <Tooltip title='Metadata extraction completed'>
          <Tag
            icon={<CheckCircleOutlined />}
            color='success'
          >
            BPM: {formatBpm(detailTrack.bpm)}
          </Tag>
        </Tooltip>
        <Tooltip title='Energy level (0.0 = calm, 1.0 = energetic)'>
          <Tag color='blue'>
            Energy: {formatEnergyLevel(detailTrack.energyLevel)}
          </Tag>
        </Tooltip>
        <Tooltip title='Valence (0.0 = sad, 1.0 = happy)'>
          <Tag color='cyan'>Valence: {formatValence(detailTrack.valence)}</Tag>
        </Tooltip>
      </Space>
    );
  }

  // Ready status without details
  if (status === TrackMetadataStatus.Ready) {
    return (
      <Tooltip title={getMetadataStatusText(status)}>
        <Badge
          status='success'
          text='Metadata Ready'
        />
      </Tooltip>
    );
  }

  // Pending status
  if (status === TrackMetadataStatus.Pending) {
    return (
      <Tooltip title='Metadata extraction in progress (may take 30-120 seconds)'>
        <Badge
          status='processing'
          text={
            <Space size={4}>
              <ClockCircleOutlined />
              <span>Extracting...</span>
            </Space>
          }
        />
      </Tooltip>
    );
  }

  // Partial status
  if (status === TrackMetadataStatus.Partial) {
    return (
      <Tooltip title='Some metadata fields are missing'>
        <Badge
          status='warning'
          text={
            <Space size={4}>
              <WarningOutlined />
              <span>Partial Metadata</span>
            </Space>
          }
        />
      </Tooltip>
    );
  }

  // Unknown status
  return (
    <Tooltip title='Metadata extraction failed or timed out'>
      <Badge
        status='error'
        text={
          <Space size={4}>
            <ExclamationCircleOutlined />
            <span>No Metadata</span>
          </Space>
        }
      />
    </Tooltip>
  );
};
