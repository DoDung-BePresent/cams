import type { BasePaginationFilter } from '@/shared/types';

export enum IotCommandAction {
  GetInfo = 1,
  Status = 2,
  Restart = 3,
  FactoryReset = 4,
  StopBle = 5,
  DisableDevice = 6,
  EnableDevice = 7,
}

export enum IotCommandStatus {
  Pending = 1,
  Published = 2,
  Accepted = 3,
  Ok = 4,
  Error = 5,
  Timeout = 6,
  PublishFailed = 7,
}

export enum IotHealthStatus {
  NoDevice = 1,
  Online = 2,
  Offline = 3,
  Stale = 4,
  Unknown = 5,
}

export interface AdminIotSpaceFilter extends BasePaginationFilter {
  brandId?: string;
  storeId?: string;
  spaceId?: string;
  healthStatus?: IotHealthStatus;
  latestCommandStatus?: IotCommandStatus;
  isAssigned?: boolean;
}

export interface AdminIotSummary {
  totalSpaces: number;
  assignedDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  staleDevices: number;
  noDeviceSpaces: number;
  pendingCommands: number;
  failedCommands24h: number;
  generatedAtUtc: string;
}

export interface AdminIotSpaceListItem {
  brandId: string;
  brandName: string;
  storeId: string;
  storeName: string;
  spaceId: string;
  spaceName: string;
  spaceType: number;
  deviceId?: string | null;
  isAssigned: boolean;
  healthStatus: IotHealthStatus;
  healthReason: number;
  lastTelemetryAtUtc?: string | null;
  telemetryAgeSeconds?: number | null;
  peopleCount?: number | null;
  noiseDecibel?: number | null;
  location?: string | null;
  latestCommandStatus?: IotCommandStatus | null;
  latestCommandAction?: IotCommandAction | null;
  latestCommandAtUtc?: string | null;
}

export interface AdminIotCommandHistoryItem {
  requestId: string;
  brandId: string;
  brandName: string;
  storeId: string;
  storeName: string;
  spaceId: string;
  spaceName: string;
  deviceId: string;
  action: IotCommandAction;
  status: IotCommandStatus;
  reason?: string | null;
  message?: string | null;
  requestedByUserId: string;
  requestedByUserName?: string | null;
  requestedAtUtc?: string | null;
  publishedAtUtc?: string | null;
  completedAtUtc?: string | null;
  timedOutAtUtc?: string | null;
}

export interface AdminIotSpaceDetail {
  space: AdminIotSpaceListItem;
  recentCommands: AdminIotCommandHistoryItem[];
}

export interface SendAdminIotCommandRequest {
  action: IotCommandAction;
  reason?: string;
}
