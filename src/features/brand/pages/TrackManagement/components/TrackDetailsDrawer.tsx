import {
  Drawer,
  Descriptions,
  Image,
  Tag,
  Progress,
  Space,
  Spin,
  Flex,
  Typography,
} from 'antd';
import { MusicIcon } from 'lucide-react';
import { useTrack } from '@/shared/modules/tracks/hooks';
import { TrackAudioPlayer } from '@/shared/modules/tracks/components';
import { formatDateTime } from '@/shared/utils/formHelpers';
import { formatDuration } from '@/shared/utils/uploadHelpers';
import { ENTITY_STATUS_LABELS, ENTITY_STATUS_COLORS } from '@/shared/constants';
import {
  MUSIC_PROVIDER_LABELS,
  MUSIC_PROVIDER_COLORS,
} from '@/shared/modules/tracks/constants';

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
  const { data: track, isLoading } = useTrack(trackId, open);

  return (
    <Drawer
      title='Track Details'
      placement='right'
      width={720}
      open={open}
      onClose={onClose}
    >
      {isLoading ? (
        <Flex
          justify='center'
          align='center'
          style={{ minHeight: 400 }}
        >
          <Spin size='large' />
        </Flex>
      ) : track ? (
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='large'
        >
          {/* Cover Image */}
          <div style={{ textAlign: 'center' }}>
            {track.coverImageUrl ? (
              <Image
                src={track.coverImageUrl}
                alt={track.title}
                style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 300,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#f0f0f0',
                  borderRadius: 8,
                }}
              >
                <MusicIcon style={{ fontSize: 80, color: '#999' }} />
              </div>
            )}
          </div>

          {/* Audio Player */}
          {track.audioUrl && (
            <div>
              <Title level={5}>Audio Player</Title>
              <TrackAudioPlayer
                audioUrl={track.audioUrl}
                title={track.title}
                artist={track.artist}
              />
            </div>
          )}

          {/* Basic Info */}
          <Descriptions
            title='Basic Information'
            column={1}
            bordered
          >
            <Descriptions.Item label='Title'>{track.title}</Descriptions.Item>
            <Descriptions.Item label='Artist'>
              {track.artist || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Genre'>
              {track.genre ? <Tag>{track.genre}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Mood'>
              {track.moodName ? <Tag color='blue'>{track.moodName}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Provider'>
              {track.provider !== undefined ? (
                <Tag color={MUSIC_PROVIDER_COLORS[track.provider]}>
                  {MUSIC_PROVIDER_LABELS[track.provider]}
                </Tag>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label='Status'>
              <Tag color={ENTITY_STATUS_COLORS[track.status]}>
                {ENTITY_STATUS_LABELS[track.status]}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {/* Audio Metadata */}
          <Descriptions
            title='Audio Metadata'
            column={1}
            bordered
          >
            <Descriptions.Item label='Duration'>
              {formatDuration(track.durationSec)}
            </Descriptions.Item>
            <Descriptions.Item label='BPM'>
              {track.bpm || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Energy Level'>
              {track.energyLevel !== undefined ? (
                <div>
                  <Progress
                    percent={track.energyLevel * 100}
                    format={(percent) => `${(percent! / 100).toFixed(1)}`}
                    strokeColor='#52c41a'
                  />
                </div>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label='Valence'>
              {track.valence !== undefined ? (
                <div>
                  <Progress
                    percent={track.valence * 100}
                    format={(percent) => `${(percent! / 100).toFixed(1)}`}
                    strokeColor='#1890ff'
                  />
                </div>
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>

          {/* Statistics */}
          <Descriptions
            title='Statistics'
            column={1}
            bordered
          >
            <Descriptions.Item label='Play Count'>
              {track.playCount}
            </Descriptions.Item>
            <Descriptions.Item label='Last Played'>
              {track.lastPlayedAt
                ? formatDateTime(track.lastPlayedAt)
                : 'Never'}
            </Descriptions.Item>
          </Descriptions>

          {/* AI Generated Info */}
          {track.isAiGenerated && (
            <Descriptions
              title='AI Generation Info'
              column={1}
              bordered
            >
              <Descriptions.Item label='Suno Clip ID'>
                {track.sunoClipId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Generation Prompt'>
                {track.generationPrompt || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Generated At'>
                {track.generatedAt ? formatDateTime(track.generatedAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Lyrics URL'>
                {track.lyricsUrl ? (
                  <a
                    href={track.lyricsUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    View Lyrics
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          )}

          {/* Timestamps */}
          <Descriptions
            title='Timestamps'
            column={1}
            bordered
          >
            <Descriptions.Item label='Created At'>
              {formatDateTime(track.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label='Updated At'>
              {track.updatedAt ? formatDateTime(track.updatedAt) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Created By'>
              {track.createdBy || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Updated By'>
              {track.updatedBy || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>Track not found</div>
      )}
    </Drawer>
  );
};
