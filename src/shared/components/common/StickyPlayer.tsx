import { useRef, useState, useEffect } from 'react';
import { Button, Typography, Slider, Avatar } from 'antd';
import { useLocation } from 'react-router';
import Hls from 'hls.js';
import {
  PlayCircleFilled,
  PauseCircleFilled,
  CloseOutlined,
  SoundOutlined,
  MutedOutlined,
} from '@ant-design/icons';
import { MusicIcon } from 'lucide-react';

/**
 * Stores
 */
import { usePlayerStore } from '@/shared/stores/usePlayerStore';

/**
 * Utils
 */
import { formatDuration } from '@/shared/utils';

const { Text } = Typography;

export const StickyPlayer = () => {
  const location = useLocation();
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, stopTrack } =
    usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const isMusicPage = location.pathname.includes('/music');

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize HLS player
  useEffect(() => {
    if (!currentTrack?.hlsUrl || !audioRef.current) return;

    const audio = audioRef.current;
    const timer = setTimeout(() => setIsLoading(true), 0);

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(currentTrack.hlsUrl);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (isPlaying) audio.play().catch(console.error);
      });
      hlsRef.current = hls;
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = currentTrack.hlsUrl;
      audio.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (isPlaying) audio.play().catch(console.error);
      });
    }

    return () => {
      clearTimeout(timer);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [currentTrack?.hlsUrl, isPlaying]); // Added isPlaying to dependencies

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // May fail due to autoplay policy
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => pauseTrack();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [pauseTrack]); // Added pauseTrack to dependencies

  if (isMusicPage) {
    return null;
  }

  const handleSeek = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const displayDuration =
    duration ||
    currentTrack?.actualDurationSec ||
    currentTrack?.durationSec ||
    0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        height: 80,
        background: 'rgba(24, 24, 24, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '0 24px',
        display: currentTrack ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      }}
    >
      <audio ref={audioRef} />

      {currentTrack && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '30%',
              minWidth: 200,
            }}
          >
            {currentTrack.coverImageUrl ? (
              <Avatar
                src={currentTrack.coverImageUrl}
                shape='square'
                size={56}
                style={{ borderRadius: 4 }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: '#282828',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MusicIcon
                  size={24}
                  color='#b3b3b3'
                />
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentTrack.title}
              </div>
              <div
                style={{
                  color: '#b3b3b3',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentTrack.artist || 'Unknown Artist'}
              </div>
            </div>
          </div>

          {/* Controls & Progress */}
          <div
            style={{
              flex: 1,
              maxWidth: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Button
                type='text'
                shape='circle'
                size='large'
                icon={
                  isPlaying ? (
                    <PauseCircleFilled
                      style={{ fontSize: 36, color: '#fff' }}
                    />
                  ) : (
                    <PlayCircleFilled style={{ fontSize: 36, color: '#fff' }} />
                  )
                }
                onClick={() => (isPlaying ? pauseTrack() : resumeTrack())}
                loading={isLoading}
                style={{
                  height: 40,
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: '#b3b3b3',
                  fontSize: 11,
                  minWidth: 35,
                  textAlign: 'right',
                }}
              >
                {formatDuration(currentTime)}
              </Text>
              <Slider
                min={0}
                max={displayDuration || 100}
                value={currentTime}
                onChange={handleSeek}
                style={{ flex: 1, margin: '0 4px' }}
                tooltip={{ open: false }}
                disabled={!displayDuration}
              />
              <Text style={{ color: '#b3b3b3', fontSize: 11, minWidth: 35 }}>
                {formatDuration(displayDuration)}
              </Text>
            </div>
          </div>

          {/* Volume & Close */}
          <div
            style={{
              width: '30%',
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: 120,
              }}
            >
              <Button
                type='text'
                size='small'
                icon={
                  isMuted ? (
                    <MutedOutlined style={{ color: '#b3b3b3' }} />
                  ) : (
                    <SoundOutlined style={{ color: '#b3b3b3' }} />
                  )
                }
                onClick={toggleMute}
              />
              <Slider
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{ flex: 1, margin: 0 }}
                tooltip={{ open: false }}
              />
            </div>
            <Button
              type='text'
              icon={<CloseOutlined style={{ color: '#b3b3b3' }} />}
              onClick={stopTrack}
            />
          </div>
        </>
      )}
    </div>
  );
};
