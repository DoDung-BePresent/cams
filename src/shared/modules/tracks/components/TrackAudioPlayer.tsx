import { useRef, useState, useEffect } from 'react';
import { Button, Typography, Flex, Card, Avatar } from 'antd';
import WaveSurfer from 'wavesurfer.js';
import { PauseIcon, PlayIcon } from 'lucide-react';

/**
 * Icons
 */
import { SoundOutlined } from '@ant-design/icons';

/**
 * Utils
 */
import { formatDuration } from '@/shared/utils';

const { Text } = Typography;

interface TrackAudioPlayerProps {
  audioUrl?: string;
  title?: string;
  artist?: string;
  coverImageUrl?: string;
  shouldStop?: boolean;
}

export const TrackAudioPlayer = ({
  audioUrl,
  title,
  artist,
  coverImageUrl,
  shouldStop = false,
}: TrackAudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!shouldStop || !wavesurferRef.current) return;
    wavesurferRef.current.pause();
    const timer = setTimeout(() => setIsPlaying(false), 0);
    return () => clearTimeout(timer);
  }, [shouldStop]);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(183,173,176,0.35)',
      progressColor: '#ef4444',
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
      if (wavesurfer) {
        wavesurfer.pause();
        wavesurfer.destroy();
      }
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
    <Card
      style={{
        background: 'linear-gradient(145deg, #1c1820 0%, #141318 100%)',
        border: '1px solid rgba(239,68,68,0.12)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
      }}
      styles={{ body: { padding: '18px 20px' } }}
    >
      <Flex
        align='center'
        gap={16}
      >
        {/* Cover Image */}
        {coverImageUrl ? (
          <Avatar
            shape='square'
            size={84}
            src={coverImageUrl}
            alt={title}
            style={{
              borderRadius: 12,
              flexShrink: 0,
              boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            }}
          />
        ) : (
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 12,
              background:
                'linear-gradient(135deg, rgba(239,68,68,0.28) 0%, rgba(100,20,20,0.2) 100%)',
              border: '1px solid rgba(248,113,113,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 8px 20px rgba(239,68,68,0.1)',
            }}
          >
            <SoundOutlined style={{ fontSize: 30, color: '#f87171' }} />
          </div>
        )}

        {/* Track Info, Waveform & Controls */}
        <Flex
          align='center'
          gap={16}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Flex
            vertical
            gap={6}
            style={{ flex: 1, minWidth: 0 }}
          >
            {/* Track Title & Artist */}
            {(title || artist) && (
              <Flex
                vertical
                gap={2}
              >
                {title && (
                  <Text
                    strong
                    ellipsis
                    style={{
                      fontSize: 16,
                      color: '#f5f5f5',
                      letterSpacing: 0.2,
                      lineHeight: 1.4,
                    }}
                  >
                    {title}
                  </Text>
                )}
                {artist && (
                  <Text
                    ellipsis
                    style={{ fontSize: 12, color: '#9ca3af' }}
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
                borderRadius: 6,
                overflow: 'hidden',
                minHeight: 50,
              }}
            >
              {isLoading && (
                <div
                  style={{
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: 12,
                    letterSpacing: 0.5,
                  }}
                >
                  Loading audio…
                </div>
              )}
            </div>

            {/* Time Display */}
            <Flex justify='space-between'>
              <Text
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatDuration(currentTime)}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatDuration(duration)}
              </Text>
            </Flex>
          </Flex>

          {/* Play/Pause Button */}
          <Button
            shape='circle'
            type='primary'
            icon={isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            onClick={togglePlayPause}
            disabled={isLoading}
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #f87171, #dc2626)',
              border: 'none',
              boxShadow: '0 6px 24px rgba(239,68,68,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Flex>
      </Flex>
    </Card>
  );
};
