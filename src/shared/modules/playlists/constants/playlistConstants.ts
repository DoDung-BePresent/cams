export const PLAYLIST_ENDPOINTS = {
  list: '/api/playlists',
  create: '/api/playlists',
  detail: (id: string) => `/api/playlists/${id}`,
  update: (id: string) => `/api/playlists/${id}`,
  delete: (id: string) => `/api/playlists/${id}`,
  toggleStatus: (id: string) => `/api/playlists/${id}/toggle-status`,
  addTracks: (id: string) => `/api/playlists/${id}/tracks`,
  removeTrack: (id: string, trackId: string) =>
    `/api/playlists/${id}/tracks/${trackId}`,
  retranscode: (id: string) => `/api/playlists/${id}/retranscode`,
} as const;

export const PLAYLIST_TYPE_LABELS: Record<number, string> = {
  0: 'Static',
  1: 'Dynamic',
};

export const PLAYLIST_TYPE_COLORS: Record<number, string> = {
  0: 'blue',
  1: 'purple',
};

export const PLAYLIST_TYPE_OPTIONS = [
  { label: 'Static Playlist', value: 0 },
  { label: 'Dynamic Playlist', value: 1 },
];

export const DEFAULT_PLAYLIST_FILTER = {
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  isAscending: false,
};
