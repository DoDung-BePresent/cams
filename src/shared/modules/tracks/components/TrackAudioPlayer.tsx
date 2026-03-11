import { useRef, useState, useEffect } from 'react';
import { Button, Typography, Flex, Card, Avatar } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import WaveSurfer from 'wavesurfer.js';
import { formatDuration } from '@/shared/utils/uploadHelpers';
import { PauseIcon, PlayIcon } from 'lucide-react';

const { Text } = Typography;

interface TrackAudioPlayerProps {
  audioUrl?: string;
  title?: string;
  artist?: string;
  coverImageUrl?: string;
}

export const TrackAudioPlayer = ({
  audioUrl,
  title,
  artist,
  coverImageUrl,
}: TrackAudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#d9d9d9',
      progressColor: '#1890ff',
      cursorColor: 'transparent',
      barWidth: 3,
      barGap: 1,
      barRadius: 2,
      height: 50,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurfer.load(audioUrl);

    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
      setIsLoading(false);
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      setIsLoading(false);
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;

    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!audioUrl) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        <SoundOutlined style={{ fontSize: 24, marginBottom: 8 }} />
        <div>Audio file not available</div>
      </div>
    );
  }

  return (
    <Card>
      <Flex
        align='start'
        gap='middle'
      >
        {/* Cover Image */}
        {coverImageUrl && (
          <Avatar
            shape='square'
            size={120}
            src={coverImageUrl}
            alt={title}
            className='rounded-lg! shrink-0!'
          />
        )}
        <Flex align='center' gap="large" className='w-full!'>
          {/* Track Info & Waveform */}
          <Flex
            vertical
            gap={4}
            style={{ flex: 1, minWidth: 0 }}
          >
            {/* Track Title & Artist */}
            {(title || artist) && (
              <Flex
                gap={2}
                align='start'
                vertical
              >
                {title && (
                  <Text
                    strong
                    ellipsis
                    style={{ fontSize: 14 }}
                  >
                    {title}
                  </Text>
                )}
                {artist && (
                  <Text
                    type='secondary'
                    ellipsis
                    style={{ fontSize: 13 }}
                  >
                    {artist}
                  </Text>
                )}
              </Flex>
            )}

            {/* Waveform */}
            <div
              ref={containerRef}
              style={{
                cursor: 'pointer',
                borderRadius: 4,
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                minHeight: 40,
              }}
            >
              {isLoading && (
                <div
                  style={{
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                  }}
                >
                  Loading...
                </div>
              )}
            </div>

            {/* Time Display */}
            <Text
              type='secondary'
              style={{ fontSize: 12 }}
            >
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </Text>
          </Flex>

          {/* Play/Pause Button */}
          <Button
            shape='circle'
            type='primary'
            icon={
              isPlaying ? (
                <PauseIcon className='size-8' />
              ) : (
                <PlayIcon className='size-8' />
              )
            }
            onClick={togglePlayPause}
            disabled={isLoading}
            className='size-20! shrink-0! [&>span]:size-8!'
          />
        </Flex>
      </Flex>
    </Card>
  );
};
