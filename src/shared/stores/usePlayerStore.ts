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
  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  playTrackInQueue: (track, queue) => {
    const index = queue.findIndex((t) => t.id === track.id);
    set({
      currentTrack: track,
      isPlaying: true,
      trackQueue: queue,
      queueIndex: index,
    });
  },
  pauseTrack: () => set({ isPlaying: false }),
  resumeTrack: () => set({ isPlaying: true }),
  stopTrack: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      trackQueue: [],
      queueIndex: -1,
    }),
  nextTrack: () => {
    const { trackQueue, queueIndex } = get();
    if (queueIndex < trackQueue.length - 1) {
      const next = trackQueue[queueIndex + 1];
      set({ currentTrack: next, isPlaying: true, queueIndex: queueIndex + 1 });
    }
  },
  prevTrack: () => {
    const { trackQueue, queueIndex } = get();
    if (queueIndex > 0) {
      const prev = trackQueue[queueIndex - 1];
      set({ currentTrack: prev, isPlaying: true, queueIndex: queueIndex - 1 });
    }
  },
}));
