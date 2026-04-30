import { useState } from 'react';
import { Avatar, message } from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import { Play, Pause } from 'lucide-react';
import { usePlayerStore } from '@/shared/stores/usePlayerStore';
import type { TrackListItem } from '@/shared/modules/tracks/types';

interface TrackCoverWithPlayProps {
  track: TrackListItem;
  queue: TrackListItem[];
  size?: number;
}

export const TrackCoverWithPlay = ({
  track,
  queue,
  size = 40,
}: TrackCoverWithPlayProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { currentTrack, isPlaying, playTrackInQueue, pauseTrack, resumeTrack } =
    usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!track.hlsUrl) {
      message.warning(
        'This track is still processing and not ready for playback.',
      );
      return;
    }
    if (isCurrent && isPlaying) {
      pauseTrack();
    } else if (isCurrent && !isPlaying) {
      resumeTrack();
    } else {
      playTrackInQueue(track, queue);
    }
  };

  const moodN = (track.moodName || '').toLowerCase();
  let bg = 'linear-gradient(135deg, #0d2418 0%, #166534 100%)';
  if (moodN.includes('chill'))
    bg = 'linear-gradient(135deg, #0f2744 0%, #1e40af 100%)';
  else if (moodN.includes('focus'))
    bg = 'linear-gradient(135deg, #1e0a3c 0%, #6d28d9 100%)';
  else if (moodN.includes('energetic'))
    bg = 'linear-gradient(135deg, #431407 0%, #c2410c 100%)';

  const coverContent = track.coverImageUrl ? (
    <Avatar
      src={track.coverImageUrl}
      shape='square'
      size={size}
      style={{ borderRadius: 4, display: 'block' }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AudioOutlined
        style={{ fontSize: size * 0.4, color: 'rgba(255,255,255,0.5)' }}
      />
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 4,
        cursor: 'pointer',
        outline: isCurrent ? '2px solid #ef4444' : 'none',
        outlineOffset: 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {coverContent}

      {/* Hover overlay */}
      {(isHovered || isCurrent) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            background: isHovered ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease',
          }}
        >
          {isCurrent && isPlaying && !isHovered ? (
            // Subtle "now playing" bars indicator when playing but not hovered
            <div
              style={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-end',
                height: 14,
              }}
            >
              {[1, 0.6, 0.8].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: `${h * 100}%`,
                    background: '#ef4444',
                    borderRadius: 1,
                    animation: 'player-bar 0.8s ease-in-out infinite alternate',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          ) : isCurrent && isPlaying ? (
            <Pause
              size={16}
              color='#ffffff'
              fill='#ffffff'
            />
          ) : (
            <Play
              size={16}
              color='#ffffff'
              fill='#ffffff'
            />
          )}
        </div>
      )}
    </div>
  );
};
