import type { SpaceTypeEnum } from '@/shared/modules/spaces/types';
import type { GovernanceModeEnum } from './configTypes';

export enum BrandDashboardPeriodEnum {
  Day = 1,
  Week = 2,
  Month = 3,
  Year = 4,
  Custom = 5,
}

export enum IotHealthStatusEnum {
  NoDevice = 1,
  Online = 2,
  Offline = 3,
  Stale = 4,
  Unknown = 5,
}

export enum IotHealthReasonEnum {
  NoDeviceAssigned = 1,
  TelemetryMissing = 2,
  TelemetryError = 3,
  DeviceReportedOffline = 4,
  TelemetryStale = 5,
  TelemetryFresh = 6,
}

export enum BrandStoreHealthStatusEnum {
  Healthy = 1,
  Attention = 2,
  Inactive = 3,
}

export enum BrandStoreHealthReasonEnum {
  StoreOperational = 1,
  StoreInactive = 2,
  IotOfflineSpaceDetected = 3,
  IotStaleSpaceDetected = 4,
  IotUnknownSpaceDetected = 5,
  NoActivePlayback = 6,
}

export enum TrackScopeEnum {
  Global = 1,
  BrandOwned = 2,
  Unknown = 3,
}

export enum WalletLockStatusEnum {
  None = 0,
  AutoLocked = 1,
  AdminLocked = 2,
}

export enum BrandDashboardChangedAreaEnum {
  StoreHealth = 1,
  Playback = 2,
  IoT = 3,
  Context = 4,
  Billing = 5,
  AiGeneration = 6,
  Schedule = 7,
  Config = 8,
}

export type BrandDashboardFilter = {
  period?: BrandDashboardPeriodEnum;
  fromUtc?: string;
  toUtc?: string;
  top?: number;
};

export type BrandDashboardResponse = {
  brandId: string;
  brandName: string;
  period: BrandDashboardPeriodEnum;
  fromUtc: string;
  toUtc: string;
  generatedAtUtc: string;
  overview: BrandDashboardOverview;
  storeHealth: BrandStoreHealthItem[];
  livePlayback: BrandLivePlaybackSummary;
  iotSpaceHealth: BrandDashboardIotSpaceHealthItem[];
  contextIntelligence: BrandContextIntelligenceSummary;
  topTracks: BrandDashboardTopTrackItem[];
  topMoods: BrandDashboardTopMoodItem[];
  billing: BrandBillingSummary;
  aiGeneration: BrandAiGenerationSummary;
};

export type BrandDashboardOverview = {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  totalStoresTrend: BrandDashboardMetricTrend;
  totalSpaces: number;
  activeSpaces: number;
  totalSpacesTrend: BrandDashboardMetricTrend;
  spacesCurrentlyPlaying: number;
  spacesPaused: number;
  spacesManualOverride: number;
  totalPlays: number;
  totalPlaysTrend: BrandDashboardMetricTrend;
  distinctTracksPlayed: number;
  totalPlaybackMinutes: number;
  iotOnlineSpaces: number;
  iotOfflineSpaces: number;
  iotStaleSpaces: number;
  iotUnknownSpaces: number;
};

export type BrandDashboardMetricTrend = {
  currentValue: number;
  previousValue: number;
  delta: number;
  percentChange?: number | null;
};

export type BrandStoreHealthItem = {
  storeId: string;
  storeName: string;
  storeAddress?: string | null;
  city?: string | null;
  district?: string | null;
  totalSpaces: number;
  activeSpaces: number;
  playingSpaces: number;
  pausedSpaces: number;
  manualOverrideSpaces: number;
  iotOnlineSpaces: number;
  iotOfflineSpaces: number;
  iotStaleSpaces: number;
  iotUnknownSpaces: number;
  lastPlaybackAtUtc?: string | null;
  governanceMode: GovernanceModeEnum;
  healthStatus: BrandStoreHealthStatusEnum;
  healthReason: BrandStoreHealthReasonEnum;
};

export type BrandLivePlaybackSummary = {
  currentlyPlayingSpaces: number;
  pausedSpaces: number;
  manualOverrideSpaces: number;
  items: BrandLivePlaybackSpaceItem[];
};

export type BrandLivePlaybackQueueItem = {
  queueItemId?: string | null;
  trackId?: string | null;
  trackName?: string | null;
  artist?: string | null;
  position?: number | null;
  queueStatus?: number | null;
  source?: number | null;
  hlsUrl?: string | null;
  isReadyToStream?: boolean | null;
  coverImageUrl?: string | null;
};

export type BrandLivePlaybackSpaceItem = {
  storeId: string;
  storeName: string;
  storeAddress?: string | null;
  spaceId: string;
  spaceName: string;
  spaceType: SpaceTypeEnum;
  governanceMode: GovernanceModeEnum;
  trackId?: string | null;
  trackName?: string | null;
  artist?: string | null;
  moodName?: string | null;
  startedAtUtc?: string | null;
  expectedEndAtUtc?: string | null;
  isPaused?: boolean;
  isManualOverride?: boolean;
  volumePercent?: number;
  isMuted?: boolean;
  queueItems?: BrandLivePlaybackQueueItem[] | null;
};

export type BrandDashboardIotSpaceHealthItem = {
  storeId: string;
  storeName: string;
  storeAddress?: string | null;
  spaceId: string;
  spaceName: string;
  spaceType: SpaceTypeEnum;
  governanceMode: GovernanceModeEnum;
  iotDeviceId?: string | null;
  isAssigned: boolean;
  isOnline: boolean;
  isOffline: boolean;
  isStale: boolean;
  lastTelemetryAtUtc?: string | null;
  telemetryAgeSeconds?: number | null;
  peopleCount?: number | null;
  noiseDecibel?: number | null;
  location?: string | null;
  deviceStatus: IotHealthStatusEnum;
  healthStatus: IotHealthStatusEnum;
  healthReason: IotHealthReasonEnum;
};

export type BrandContextIntelligenceSummary = {
  averagePeopleCount?: number | null;
  totalPeopleCount?: number | null;
  averageNoiseDecibel?: number | null;
  averageFuzzyConfidence?: number | null;
  storesWithTelemetry: number;
  samples: number;
  peopleTrend: BrandDashboardDoubleMetricTrend;
  noiseTrend: BrandDashboardDoubleMetricTrend;
  fuzzyConfidenceTrend: BrandDashboardDoubleMetricTrend;
};

export type BrandDashboardDoubleMetricTrend = {
  currentValue?: number | null;
  previousValue?: number | null;
  delta?: number | null;
  percentChange?: number | null;
};

export type BrandDashboardTopTrackItem = {
  trackId?: string | null;
  trackName: string;
  artist?: string | null;
  scope: TrackScopeEnum;
  plays: number;
  totalMinutes: number;
  lastPlayedAtUtc?: string | null;
  moodName?: string | null;
  isAiGenerated: boolean;
};

export type BrandDashboardTopMoodItem = {
  moodId?: string | null;
  moodName: string;
  plays: number;
  totalMinutes: number;
};

export type BrandBillingSummary = {
  balanceTokens: number;
  lockStatus: WalletLockStatusEnum;
  rangeUsageTokens: number;
  rangeUsageTrend: BrandDashboardTokenMetricTrend;
  todayUsageTokens: number;
  lastSettlementAtUtc?: string | null;
  lastDebtBusinessDate?: string | null;
};

export type BrandDashboardTokenMetricTrend = {
  currentValue: number;
  previousValue: number;
  delta: number;
  percentChange?: number | null;
};

export type BrandAiGenerationSummary = {
  totalInRange: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  latestRequestedAtUtc?: string | null;
  latestCompletedAtUtc?: string | null;
};

export type BrandDashboardChangedDto = {
  brandId: string;
  changedArea: BrandDashboardChangedAreaEnum;
  affectedStoreIds: string[];
  affectedSpaceIds: string[];
  occurredAtUtc: string;
  reason?: string | null;
};
