import { useRef, useState, useEffect } from 'react';
import { Button, Typography, Slider, Avatar } from 'antd';
import Hls from 'hls.js';
import {
  PlayCircleFilled,
  PauseCircleFilled,
  CloseOutlined,
  SoundOutlined,
  MutedOutlined,
} from '@ant-design/icons';
import { MusicIcon, SkipBack, SkipForward } from 'lucide-react';

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
  const {
    currentTrack,
    isPlaying,
    trackQueue,
    queueIndex,
    pauseTrack,
    resumeTrack,
    stopTrack,
    nextTrack,
    prevTrack,
  } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hlsInitCountRef = useRef(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize HLS player
  useEffect(() => {
    if (!currentTrack?.hlsUrl || !audioRef.current) return;

    const runId = ++hlsInitCountRef.current;
    const audio = audioRef.current;
    console.debug(`[StickyPlayer] HLS init effect #${runId} fired`, {
      trackId: currentTrack.id,
      title: currentTrack.title,
      hlsUrl: currentTrack.hlsUrl,
      isPlaying_closure: isPlaying,
      audio_paused: audio.paused,
      audio_src: audio.src,
    });

    const timer = setTimeout(() => setIsLoading(true), 0);

    if (hlsRef.current) {
      console.debug(
        `[StickyPlayer] HLS init #${runId}: destroying previous HLS instance`,
      );
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(currentTrack.hlsUrl);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.debug(`[StickyPlayer] MANIFEST_PARSED #${runId}`, {
          isPlaying_closure: isPlaying,
          audio_paused: audio.paused,
          audio_readyState: audio.readyState,
        });
        setIsLoading(false);
        if (isPlaying) {
          console.debug(
            `[StickyPlayer] MANIFEST_PARSED #${runId}: calling audio.play()`,
          );
          audio
            .play()
            .then(() =>
              console.debug(
                `[StickyPlayer] MANIFEST_PARSED #${runId}: audio.play() resolved OK`,
              ),
            )
            .catch((err) =>
              console.warn(
                `[StickyPlayer] MANIFEST_PARSED #${runId}: audio.play() rejected`,
                err,
              ),
            );
        } else {
          console.warn(
            `[StickyPlayer] MANIFEST_PARSED #${runId}: isPlaying=false in closure -> NOT calling play()`,
          );
        }
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          console.error(`[StickyPlayer] HLS fatal error #${runId}`, data);
        }
      });
      hlsRef.current = hls;
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = currentTrack.hlsUrl;
      audio.addEventListener('loadedmetadata', () => {
        console.debug(`[StickyPlayer] loadedmetadata #${runId}`, {
          isPlaying_closure: isPlaying,
        });
        setIsLoading(false);
        if (isPlaying) {
          audio
            .play()
            .then(() =>
              console.debug(
                `[StickyPlayer] loadedmetadata #${runId}: audio.play() resolved OK`,
              ),
            )
            .catch((err) =>
              console.warn(
                `[StickyPlayer] loadedmetadata #${runId}: audio.play() rejected`,
                err,
              ),
            );
        }
      });
    }

    return () => {
      console.debug(`[StickyPlayer] HLS init effect #${runId} CLEANUP`, {
        reason: 'deps changed (currentTrack.hlsUrl or isPlaying)',
        isPlaying_at_cleanup: isPlaying,
      });
      clearTimeout(timer);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [currentTrack?.hlsUrl, isPlaying]); // Added isPlaying to dependencies

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    console.debug('[StickyPlayer] sync play/pause effect fired', {
      isPlaying,
      audio_paused: audio.paused,
      audio_readyState: audio.readyState,
      audio_src: audio.currentSrc,
    });
    if (isPlaying) {
      audio
        .play()
        .then(() =>
          console.debug('[StickyPlayer] sync effect: audio.play() resolved OK'),
        )
        .catch((err) =>
          console.warn(
            '[StickyPlayer] sync effect: audio.play() FAILED (likely autoplay or not ready)',
            err,
          ),
        );
    } else {
      audio.pause();
      console.debug('[StickyPlayer] sync effect: audio.pause() called');
    }
  }, [isPlaying]);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      console.debug('[StickyPlayer] audio ended event -> calling pauseTrack()');
      pauseTrack();
    };
    const handlePlay = () =>
      console.debug('[StickyPlayer] audio native PLAY event', {
        currentTime: audio.currentTime,
      });
    const handlePause = () =>
      console.debug('[StickyPlayer] audio native PAUSE event', {
        currentTime: audio.currentTime,
        ended: audio.ended,
        stack: new Error().stack?.split('\n').slice(1, 3).join(' | '),
      });
    const handleWaiting = () =>
      console.debug('[StickyPlayer] audio native WAITING event (buffering)');
    const handleCanPlay = () =>
      console.debug('[StickyPlayer] audio native CANPLAY event', {
        readyState: audio.readyState,
        paused: audio.paused,
      });
    const handleError = () =>
      console.error('[StickyPlayer] audio native ERROR event', audio.error);
    const handleStalled = () =>
      console.warn('[StickyPlayer] audio native STALLED event');

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [pauseTrack]); // Added pauseTrack to dependencies

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
        height: 96,
        background:
          'linear-gradient(135deg, rgba(24,24,27,0.94) 0%, rgba(42,23,27,0.9) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(80,45,50,0.75)',
        borderRadius: 16,
        padding: '0 24px',
        display: currentTrack ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
      }}
    >
      <style>
        {`
          .sticky-player-main-control .ant-btn-icon,
          .sticky-player-main-control .anticon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }

          .sticky-player-main-control .anticon svg {
            width: 44px;
            height: 44px;
          }
        `}
      </style>
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
                  background: '#202024',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MusicIcon
                  size={24}
                  color='#b7adb0'
                />
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  color: '#f8f7f7',
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
                  color: '#b7adb0',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <Button
                type='text'
                shape='circle'
                icon={
                  <SkipBack
                    size={30}
                    color={queueIndex > 0 ? '#e2dde0' : '#3d3740'}
                    fill={queueIndex > 0 ? '#e2dde0' : '#3d3740'}
                  />
                }
                onClick={prevTrack}
                disabled={queueIndex <= 0}
                style={{
                  height: 52,
                  width: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              <Button
                type='text'
                shape='circle'
                className='sticky-player-main-control'
                icon={
                  isPlaying ? (
                    <PauseCircleFilled
                      style={{ fontSize: 44, color: '#ffffff' }}
                    />
                  ) : (
                    <PlayCircleFilled
                      style={{ fontSize: 44, color: '#ffffff' }}
                    />
                  )
                }
                onClick={() => (isPlaying ? pauseTrack() : resumeTrack())}
                loading={isLoading}
                style={{
                  height: 56,
                  width: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              />
              <Button
                type='text'
                shape='circle'
                icon={
                  <SkipForward
                    size={30}
                    color={
                      queueIndex < trackQueue.length - 1 ? '#e2dde0' : '#3d3740'
                    }
                    fill={
                      queueIndex < trackQueue.length - 1 ? '#e2dde0' : '#3d3740'
                    }
                  />
                }
                onClick={nextTrack}
                disabled={queueIndex >= trackQueue.length - 1}
                style={{
                  height: 52,
                  width: 52,
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
                  color: '#b7adb0',
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
              <Text style={{ color: '#b7adb0', fontSize: 11, minWidth: 35 }}>
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
                    <MutedOutlined style={{ color: '#b7adb0' }} />
                  ) : (
                    <SoundOutlined style={{ color: '#b7adb0' }} />
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
              icon={<CloseOutlined style={{ color: '#b7adb0' }} />}
              onClick={stopTrack}
            />
          </div>
        </>
      )}
    </div>
  );
};
