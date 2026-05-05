export type DashboardPeriod = 1 | 2 | 3 | 4 | 5;

export interface MetricTrend {
  currentValue: number;
  previousValue: number;
  delta: number;
  percentChange: number | null;
}

export interface TokenMetricTrend {
  currentValue: number;
  previousValue: number;
  delta: number;
  percentChange: number | null;
}

export interface AdminDashboardFilter {
  period?: DashboardPeriod;
  fromUtc?: string;
  toUtc?: string;
  top?: number;
}

export interface AdminDashboardOverview {
  totalBrands: number;
  activeBrands: number;
  totalBrandsTrend: MetricTrend;
  totalStores: number;
  activeStores: number;
  totalStoresTrend: MetricTrend;
  totalSpaces: number;
  activeSpaces: number;
  totalSpacesTrend: MetricTrend;
  spacesCurrentlyPlaying: number;
  spacesPaused: number;
  spacesManualOverride: number;
  totalPlays: number;
  totalPlaysTrend: MetricTrend;
}

export interface AdminBrandHealthItem {
  brandId: string;
  brandName: string;
  stores: number;
  spaces: number;
  playingSpaces: number;
  assignedDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  balanceTokens: number;
  lastPlaybackAtUtc?: string | null;
}

export interface AdminLivePlaybackItem {
  brandId: string;
  brandName: string;
  storeId: string;
  storeName: string;
  spaceId: string;
  spaceName: string;
  governanceMode: number;
  trackName?: string | null;
  artist?: string | null;
  isPaused: boolean;
  isManualOverride: boolean;
  startedAtUtc?: string | null;
  expectedEndAtUtc?: string | null;
}

export interface AdminLivePlaybackSummary {
  currentlyPlayingSpaces: number;
  pausedSpaces: number;
  manualOverrideSpaces: number;
  items: AdminLivePlaybackItem[];
}

export interface AdminDashboardTopTrackItem {
  trackId?: string | null;
  trackName: string;
  artist?: string | null;
  brandName?: string | null;
  scope: number;
  plays: number;
  lastPlayedAtUtc?: string | null;
}

export interface AdminBillingPlatformSummary {
  totalBalanceTokens: number;
  rangeUsageTokens: number;
  rangeUsageTrend: TokenMetricTrend;
  lockedWallets: number;
}

export interface AdminAiGenerationPlatformSummary {
  totalInRange: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  latestRequestedAtUtc?: string | null;
}

export interface AdminDashboardResponse {
  period: DashboardPeriod;
  fromUtc: string;
  toUtc: string;
  generatedAtUtc: string;
  overview: AdminDashboardOverview;
  brandHealth: AdminBrandHealthItem[];
  livePlayback: AdminLivePlaybackSummary;
  iotHealth: import('./adminIotTypes').AdminIotSummary;
  topTracks: AdminDashboardTopTrackItem[];
  billing: AdminBillingPlatformSummary;
  aiGeneration: AdminAiGenerationPlatformSummary;
}
