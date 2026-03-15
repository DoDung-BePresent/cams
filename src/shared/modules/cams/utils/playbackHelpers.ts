/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export const formatPlaybackTime = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (
  currentSeconds: number,
  totalSeconds: number,
): number => {
  if (!totalSeconds || totalSeconds <= 0) return 0;
  return Math.min((currentSeconds / totalSeconds) * 100, 100);
};

/**
 * Convert volume (0-100) to audio element volume (0-1)
 */
export const volumeToAudioLevel = (volume: number): number => {
  return Math.max(0, Math.min(100, volume)) / 100;
};

/**
 * Convert audio element volume (0-1) to volume (0-100)
 */
export const audioLevelToVolume = (level: number): number => {
  return Math.round(Math.max(0, Math.min(1, level)) * 100);
};

/**
 * Check if space is currently playing
 * Based on startedAtUtc and expectedEndAtUtc
 */
export const isSpacePlaying = (state: {
  startedAtUtc: string | null;
  expectedEndAtUtc: string | null;
}): boolean => {
  if (!state.startedAtUtc || !state.expectedEndAtUtc) {
    return false;
  }

  const now = new Date();
  const startedAt = new Date(state.startedAtUtc);
  const expectedEndAt = new Date(state.expectedEndAtUtc);

  // Currently playing if now is between start and end
  return now >= startedAt && now <= expectedEndAt;
};

/**
 * Check if HLS is supported in current browser
 */
export const isHLSSupported = (): boolean => {
  const video = document.createElement('video');
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
};

/**
 * Get error message for HLS errors
 */
export const getHLSErrorMessage = (errorType: string): string => {
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    MEDIA_ERROR: 'Media error. The stream may be corrupted.',
    MUX_ERROR: 'Stream format error. Please contact support.',
    OTHER_ERROR: 'Playback error. Please try again.',
  };

  return errorMessages[errorType] || 'Unknown error occurred';
};
