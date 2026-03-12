export const PLAYLIST_ENDPOINTS = {
  list: '/playlists',
  create: '/playlists',
  detail: (id: string) => `/playlists/${id}`,
  update: (id: string) => `/playlists/${id}`,
  delete: (id: string) => `/playlists/${id}`,
  toggleStatus: (id: string) => `/playlists/${id}/toggle-status`,
  addTracks: (id: string) => `/playlists/${id}/tracks`,
  removeTrack: (id: string, trackId: string) =>
    `/playlists/${id}/tracks/${trackId}`,
  retranscode: (id: string) => `/playlists/${id}/retranscode`,
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
