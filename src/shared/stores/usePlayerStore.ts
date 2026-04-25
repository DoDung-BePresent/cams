import { create } from 'zustand';
import type { TrackListItem } from '@/shared/modules/tracks/types';

interface PlayerState {
  currentTrack: TrackListItem | null;
  isPlaying: boolean;
  playTrack: (track: TrackListItem) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  pauseTrack: () => set({ isPlaying: false }),
  resumeTrack: () => set({ isPlaying: true }),
  stopTrack: () => set({ currentTrack: null, isPlaying: false }),
}));
