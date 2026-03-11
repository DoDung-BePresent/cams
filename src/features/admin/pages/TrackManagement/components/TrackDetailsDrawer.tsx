import {
  Drawer,
  Descriptions,
  Tag,
  Spin,
  Alert,
  Space,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTrack } from '@/shared/modules/tracks/hooks';
import { TrackAudioPlayer } from '@/shared/modules/tracks/components';
import {
  MUSIC_PROVIDER_LABELS,
  MUSIC_PROVIDER_COLORS,
} from '@/shared/modules/tracks/constants';
import { ENTITY_STATUS_LABELS } from '@/shared/constants';
import { formatDate } from '@/shared/utils/formHelpers';

const { Title } = Typography;

interface TrackDetailsDrawerProps {
  open: boolean;
  trackId?: string;
  onClose: () => void;
}

export const TrackDetailsDrawer = ({
  open,
  trackId,
  onClose,
}: TrackDetailsDrawerProps) => {
  const { data: track, isLoading, error } = useTrack(trackId, open);

  return (
    <Drawer
      title='Track Details'
      placement='right'
      width={720}
      open={open}
      onClose={onClose}
    >
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size='large' />
        </div>
      )}

      {error && (
        <Alert
          message='Error'
          description='Failed to load track details. Please try again.'
          type='error'
          showIcon
        />
      )}

      {track && (
        <Space
          direction='vertical'
          size='large'
          style={{ width: '100%' }}
        >
          {/* Audio Player */}
          <TrackAudioPlayer
            audioUrl={track.audioUrl}
            title={track.title}
            artist={track.artist}
            coverImageUrl={track.coverImageUrl}
          />

          {/* Basic Information */}
          <div>
            <Title level={5}>Basic Information</Title>
            <Descriptions
              column={1}
              bordered
            >
              <Descriptions.Item label='Title'>{track.title}</Descriptions.Item>
              <Descriptions.Item label='Artist'>
                {track.artist || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Genre'>
                {track.genre || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Mood'>
                {track.moodName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Provider'>
                <Tag color={MUSIC_PROVIDER_COLORS[track.provider || 0]}>
                  {MUSIC_PROVIDER_LABELS[track.provider || 0]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label='Type'>
                <Tag
                  icon={
                    track.isAiGenerated ? <RobotOutlined /> : <UserOutlined />
                  }
                  color={track.isAiGenerated ? 'purple' : 'blue'}
                >
                  {track.isAiGenerated ? 'AI Generated' : 'Custom Upload'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label='Status'>
                <Tag
                  icon={
                    track.status === 1 ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )
                  }
                  color={track.status === 1 ? 'success' : 'default'}
                >
                  {ENTITY_STATUS_LABELS[track.status]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Audio Metadata */}
          <div>
            <Title level={5}>Audio Metadata</Title>
            <Descriptions
              column={2}
              bordered
            >
              <Descriptions.Item label='Duration'>
                {track.durationSec
                  ? `${Math.floor(track.durationSec / 60)}:${(
                      track.durationSec % 60
                    )
                      .toString()
                      .padStart(2, '0')}`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label='BPM'>
                {track.bpm || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Energy Level'>
                {track.energyLevel?.toFixed(2) || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Valence'>
                {track.valence?.toFixed(2) || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Play Count'>
                {track.playCount}
              </Descriptions.Item>
              <Descriptions.Item label='Last Played'>
                {track.lastPlayedAt ? formatDate(track.lastPlayedAt) : 'Never'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* AI Generation Info (if applicable) */}
          {track.isAiGenerated && (
            <div>
              <Title level={5}>AI Generation Info</Title>
              <Descriptions
                column={1}
                bordered
              >
                <Descriptions.Item label='Suno Clip ID'>
                  {track.sunoClipId || '—'}
                </Descriptions.Item>
                <Descriptions.Item label='Generation Prompt'>
                  {track.generationPrompt || '—'}
                </Descriptions.Item>
                <Descriptions.Item label='Generated At'>
                  {track.generatedAt ? formatDate(track.generatedAt) : '—'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {/* System Information */}
          <div>
            <Title level={5}>System Information</Title>
            <Descriptions
              column={1}
              bordered
            >
              <Descriptions.Item label='Created At'>
                {formatDate(track.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label='Updated At'>
                {track.updatedAt ? formatDate(track.updatedAt) : '—'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Space>
      )}
    </Drawer>
  );
};
