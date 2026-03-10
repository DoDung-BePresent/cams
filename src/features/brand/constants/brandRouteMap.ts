/**
 * Manager route mapping (menu key -> route path)
 * Used for BrandManager dashboard navigation
 */
export const BRAND_ROUTE_MAP: Record<string, string> = {
  dashboard: '/brand/dashboard',
  stores: '/brand/stores',
  staff: '/brand/staff',
  spaces: '/brand/spaces',
  devices: '/brand/devices',
  'auto-manual-mode': '/brand/music-control/mode',
  'playback-control': '/brand/music-control/playback',
  'time-based-rules': '/brand/schedule/time-based',
  'event-based-rules': '/brand/schedule/event-based',
  'music-vs-sales': '/brand/reports/music-sales',
  'customer-engagement': '/brand/reports/engagement',
  'playback-history': '/brand/reports/history',
  settings: '/brand/settings',
} as const;
