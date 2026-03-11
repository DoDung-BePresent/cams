import { useRef, useState, useEffect } from 'react';
import { Slider, Button, Space, Typography } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { formatDuration } from '@/shared/utils/uploadHelpers';

const { Text } = Typography;

interface TrackAudioPlayerProps {
  audioUrl?: string;
  title?: string;
  artist?: string;
}

export const TrackAudioPlayer = ({
  audioUrl,
  title,
  artist,
}: TrackAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  if (!audioUrl) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        Audio file not available
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload='metadata'
      />

      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size='small'
      >
        {(title || artist) && (
          <div>
            {title && <Text strong>{title}</Text>}
            {artist && <Text type='secondary'> • {artist}</Text>}
          </div>
        )}

        <Space style={{ width: '100%' }}>
          <Button
            type='text'
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={togglePlayPause}
            size='large'
          />

          <div style={{ flex: 1 }}>
            <Slider
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              tooltip={{ formatter: (value) => formatDuration(value) }}
            />
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text
                type='secondary'
                style={{ fontSize: 12 }}
              >
                {formatDuration(currentTime)}
              </Text>
              <Text
                type='secondary'
                style={{ fontSize: 12 }}
              >
                {formatDuration(duration)}
              </Text>
            </Space>
          </div>

          <Space size='small'>
            <SoundOutlined />
            <Slider
              min={0}
              max={100}
              value={volume}
              onChange={setVolume}
              style={{ width: 80 }}
            />
          </Space>
        </Space>
      </Space>
    </div>
  );
};
