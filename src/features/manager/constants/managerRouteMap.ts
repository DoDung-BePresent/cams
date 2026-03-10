/**
 * Manager route mapping (menu key -> route path)
 * Used for BrandManager dashboard navigation
 */
export const MANAGER_ROUTE_MAP: Record<string, string> = {
  dashboard: '/manager/dashboard',
  stores: '/manager/stores',
  staff: '/manager/staff',
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
