import { create } from 'zustand';
import type { TrackListItem } from '@/shared/modules/tracks/types';

interface PlayerState {
  currentTrack: TrackListItem | null;
  isPlaying: boolean;
  trackQueue: TrackListItem[];
  queueIndex: number;
  playTrack: (track: TrackListItem) => void;
  playTrackInQueue: (track: TrackListItem, queue: TrackListItem[]) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  trackQueue: [],
  queueIndex: -1,
  playTrack: (track) => {
    console.debug('[PlayerStore] playTrack', {
      trackId: track.id,
      title: track.title,
    });
    set({ currentTrack: track, isPlaying: true });
  },
  playTrackInQueue: (track, queue) => {
    const index = queue.findIndex((t) => t.id === track.id);
    console.debug('[PlayerStore] playTrackInQueue', {
      trackId: track.id,
      title: track.title,
      queueIndex: index,
      queueLength: queue.length,
    });
    set({
      currentTrack: track,
      isPlaying: true,
      trackQueue: queue,
      queueIndex: index,
    });
  },
  pauseTrack: () => {
    console.debug('[PlayerStore] pauseTrack called', {
      stack: new Error().stack?.split('\n').slice(1, 4).join(' | '),
    });
    set({ isPlaying: false });
  },
  resumeTrack: () => {
    console.debug('[PlayerStore] resumeTrack called');
    set({ isPlaying: true });
  },
  stopTrack: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      trackQueue: [],
      queueIndex: -1,
    }),
  nextTrack: () => {
    const { trackQueue, queueIndex, isPlaying: wasPlaying } = get();
    console.debug('[PlayerStore] nextTrack', {
      queueIndex,
      queueLength: trackQueue.length,
      wasPlaying,
    });
    if (queueIndex < trackQueue.length - 1) {
      const next = trackQueue[queueIndex + 1];
      console.debug('[PlayerStore] nextTrack -> switching to', {
        trackId: next.id,
        title: next.title,
        newIndex: queueIndex + 1,
      });
      set({ currentTrack: next, isPlaying: true, queueIndex: queueIndex + 1 });
    } else {
      console.debug(
        '[PlayerStore] nextTrack -> already at end of queue, no-op',
      );
    }
  },
  prevTrack: () => {
    const { trackQueue, queueIndex, isPlaying: wasPlaying } = get();
    console.debug('[PlayerStore] prevTrack', { queueIndex, wasPlaying });
    if (queueIndex > 0) {
      const prev = trackQueue[queueIndex - 1];
      console.debug('[PlayerStore] prevTrack -> switching to', {
        trackId: prev.id,
        title: prev.title,
        newIndex: queueIndex - 1,
      });
      set({ currentTrack: prev, isPlaying: true, queueIndex: queueIndex - 1 });
    } else {
      console.debug(
        '[PlayerStore] prevTrack -> already at start of queue, no-op',
      );
    }
  },
}));
