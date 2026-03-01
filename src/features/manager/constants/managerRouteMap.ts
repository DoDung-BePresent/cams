/**
 * Manager route mapping (menu key -> route path)
 * Used for menu navigation and active state detection
 */
export const MANAGER_ROUTE_MAP: Record<string, string> = {
  dashboard: '/manager/dashboard',
  spaces: '/manager/spaces',
  devices: '/manager/devices',
  'auto-manual-mode': '/manager/music-control/mode',
  'playback-control': '/manager/music-control/playback',
  'time-based-rules': '/manager/schedule/time-based',
  'event-based-rules': '/manager/schedule/event-based',
  'music-vs-sales': '/manager/reports/music-sales',
  'customer-engagement': '/manager/reports/engagement',
  'playback-history': '/manager/reports/history',
  settings: '/manager/settings',
} as const;
