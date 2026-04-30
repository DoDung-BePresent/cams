import { Space, Button, message, Tag } from 'antd';
import { PlayCircleFilled, PauseCircleFilled } from '@ant-design/icons';
import { usePlayerStore } from '@/shared/stores/usePlayerStore';
import type { TrackListItem } from '@/shared/modules/tracks/types';

export const TitleCell = ({ record }: { record: TrackListItem }) => {
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack } =
    usePlayerStore();
  const isCurrent = currentTrack?.id === record.id;

  return (
    <Space
      size={12}
      style={{ width: '100%' }}
    >
      <Button
        type='text'
        shape='circle'
        icon={
          isCurrent && isPlaying ? (
            <PauseCircleFilled style={{ fontSize: 24, color: '#f8f7f7' }} />
          ) : (
            <PlayCircleFilled
              style={{ fontSize: 24, color: isCurrent ? '#ef4444' : '#5f5f67' }}
            />
          )
        }
        onClick={(e) => {
          e.stopPropagation();
          if (isCurrent) {
            if (isPlaying) pauseTrack();
            else resumeTrack();
            return;
          }
          if (record.hlsUrl) {
            playTrack(record);
          } else {
            message.warning(
              'This track is still processing and not ready for playback.',
            );
          }
        }}
        className='play-button'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          height: 32,
          width: 32,
        }}
      />
      <Space
        direction='vertical'
        size={0}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Space
          size={4}
          style={{ width: '100%' }}
        >
          <span
            style={{
              fontWeight: 500,
              color: isCurrent ? '#ef4444' : 'inherit',
            }}
          >
            {record.title}
          </span>
          {!record.brandId && (
            <Tag
              color='purple'
              style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}
            >
              Shared
            </Tag>
          )}
        </Space>
        {record.artist && (
          <span style={{ fontSize: 12, color: '#999', display: 'block' }}>
            {record.artist}
          </span>
        )}
      </Space>
    </Space>
  );
};
