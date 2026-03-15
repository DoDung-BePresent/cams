import { useEffect, useRef, useState } from 'react';
import {
  Card,
  Slider,
  Button,
  Space,
  Typography,
  Flex,
  Tag,
  message,
} from 'antd';
import Hls from 'hls.js';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { HLS_PLAYER_CONFIG } from '../constants';
import { formatPlaybackTime, volumeToAudioLevel } from '../utils';
import type { SpaceStateResponse } from '../types';
import { PlaybackCommand } from '../types';

const { Text } = Typography;

interface SpacePlayerProps {
  spaceId: string;
  hlsUrl: string | null;
  state: SpaceStateResponse | null;
  isLoading?: boolean;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onSeek?: (seconds: number) => void;
  onVolumeChange?: (volume: number) => void;
}

export const SpacePlayer = ({
  spaceId,
  hlsUrl,
  state,
  isLoading = false,
  onPlayPause,
  onSkipNext,
  onSkipPrevious,
  onSeek,
  onVolumeChange,
}: SpacePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(state?.volume ?? 75);
  const [isBuffering, setIsBuffering] = useState(false);

  // Initialize HLS player
  useEffect(() => {
    if (!hlsUrl || !audioRef.current) {
      return;
    }

    const audio = audioRef.current;

    // Check if HLS.js is supported
    if (Hls.isSupported()) {
      const hls = new Hls(HLS_PLAYER_CONFIG);
      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(audio);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');
        // Auto-play if state says it should be playing
        if (state?.isPlaying) {
          audio.play().catch((err) => {
            console.error('Auto-play failed:', err);
            message.warning('Click play to start playback');
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              message.error('Network error loading stream');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              message.error('Media error. Attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              message.error('Fatal error occurred. Please refresh.');
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      audio.src = hlsUrl;
      if (state?.isPlaying) {
        audio.play().catch((err) => {
          console.error('Auto-play failed:', err);
        });
      }
    } else {
      message.error('HLS playback not supported in this browser');
    }
  }, [hlsUrl, state?.isPlaying]);

  // Sync audio playback state with backend state
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (state?.isPlaying && audio.paused) {
      audio.play().catch(console.error);
    } else if (!state?.isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [state?.isPlaying]);

  // Sync volume
  useEffect(() => {
    if (!audioRef.current || state?.volume === undefined) return;
    audioRef.current.volume = volumeToAudioLevel(state.volume);
    setVolume(state.volume);
  }, [state?.volume]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleEnded = () => {
      // Track ended, backend should trigger next track via SignalR
      console.log('Track ended');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle seek
  const handleSeek = (value: number) => {
    if (!audioRef.current) return;
    const seekTime = (value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    onSeek?.(seekTime);
  };

  // Handle volume change
  const handleVolumeChange = (value: number) => {
    if (!audioRef.current) return;
    setVolume(value);
    audioRef.current.volume = volumeToAudioLevel(value);
    onVolumeChange?.(value);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card>
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size='middle'
      >
        {/* Track Info */}
        <div>
          <Text
            strong
            style={{ fontSize: 16, display: 'block' }}
          >
            {state?.trackTitle || 'No track playing'}
          </Text>
          <Text
            type='secondary'
            style={{ fontSize: 14 }}
          >
            {state?.playlistName || 'No playlist selected'}
          </Text>
          {state?.isPlaying && (
            <Tag
              color='processing'
              style={{ marginLeft: 8 }}
            >
              Playing
            </Tag>
          )}
          {isBuffering && (
            <Tag
              color='warning'
              style={{ marginLeft: 8 }}
            >
              Buffering...
            </Tag>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <Slider
            value={progress}
            onChange={handleSeek}
            tooltip={{
              formatter: (value) => {
                const seconds = ((value ?? 0) / 100) * duration;
                return formatPlaybackTime(seconds);
              },
            }}
            disabled={!hlsUrl || isLoading}
          />
          <Flex justify='space-between'>
            <Text
              type='secondary'
              style={{ fontSize: 12 }}
            >
              {formatPlaybackTime(currentTime)}
            </Text>
            <Text
              type='secondary'
              style={{ fontSize: 12 }}
            >
              {formatPlaybackTime(duration)}
            </Text>
          </Flex>
        </div>

        {/* Playback Controls */}
        <Flex
          justify='center'
          align='center'
          gap='middle'
        >
          <Button
            type='text'
            icon={<StepBackwardOutlined />}
            onClick={onSkipPrevious}
            disabled={!state?.currentPlaylistId || isLoading}
            size='large'
          />
          <Button
            type='primary'
            shape='circle'
            size='large'
            icon={
              state?.isPlaying ? (
                <PauseCircleOutlined style={{ fontSize: 24 }} />
              ) : (
                <PlayCircleOutlined style={{ fontSize: 24 }} />
              )
            }
            onClick={onPlayPause}
            disabled={!hlsUrl || isLoading}
            loading={isBuffering}
            style={{ width: 56, height: 56 }}
          />
          <Button
            type='text'
            icon={<StepForwardOutlined />}
            onClick={onSkipNext}
            disabled={!state?.currentPlaylistId || isLoading}
            size='large'
          />
        </Flex>

        {/* Volume Control */}
        <Flex
          align='center'
          gap='middle'
        >
          <SoundOutlined style={{ fontSize: 16 }} />
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            style={{ flex: 1 }}
            tooltip={{ formatter: (value) => `${value}%` }}
          />
          <Text
            type='secondary'
            style={{ fontSize: 12, minWidth: 40 }}
          >
            {volume}%
          </Text>
        </Flex>
      </Space>
    </Card>
  );
};
