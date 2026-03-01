/**
 * Admin route mapping (menu key -> route path)
 * Used for menu navigation and active state detection
 */
export const ADMIN_ROUTE_MAP: Record<string, string> = {
  'admin-dashboard': '/admin/dashboard',
  'brand-management': '/admin/brands',
  'account-management': '/admin/accounts',
  'music-library': '/admin/music',
  'playlist-templates': '/admin/playlists',
  'mood-genre-tags': '/admin/tags',
  'rule-settings': '/admin/ai/rules',
  'external-ai-music-api': '/admin/ai/api',
  'data-mapping': '/admin/pos/mapping',
  'sync-status': '/admin/pos/sync',
  'music-decision-logs': '/admin/logs/music-decisions',
  'api-call-logs': '/admin/logs/api-calls',
  'error-logs': '/admin/logs/errors',
} as const;
