export type ScheduleSlotItem = {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  playlistId: string;
};

export type ScheduleSlotApiItem = {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  musicId?: string;
};

export type SpaceScheduleItem = {
  id: string;
  name: string;
  spaceId?: string | null;
  slots: ScheduleSlotItem[];
  enabled: boolean;
  sourceId?: string | null;
  sourceLabel?: string | null;
  updatedAt: string;
};

export type ScheduleSourceType = 'library' | 'template';

export type SpaceScheduleApiItem = Omit<SpaceScheduleItem, 'slots'> & {
  slots: ScheduleSlotApiItem[];
};

export type ScheduleSourceItem = {
  id: string;
  title: string;
  subtitle: string;
  description?: string | null;
  type: ScheduleSourceType;
  schedule: SpaceScheduleItem;
  isUserCreated: boolean;
};

export type ScheduleSourceApiItem = Omit<ScheduleSourceItem, 'schedule'> & {
  schedule: SpaceScheduleApiItem;
};

export type ScheduleMusicItem = {
  id: string;
  title: string;
  artist: string;
  collection?: string | null;
  artworkLabel: string;
  primaryHex: string;
  secondaryHex: string;
};

export type SpaceScheduleBootstrap = {
  draftSchedule?: SpaceScheduleItem | null;
  librarySources: ScheduleSourceItem[];
  templateSources: ScheduleSourceItem[];
  musicCatalog: ScheduleMusicItem[];
};

export type SpaceScheduleBootstrapApi = {
  draftSchedule?: SpaceScheduleApiItem | null;
  librarySources: ScheduleSourceApiItem[];
  templateSources: ScheduleSourceApiItem[];
  musicCatalog: ScheduleMusicItem[];
};

export type UpsertScheduleSlotRequest = {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  playlistId: string;
};

export type ApplyScheduleSourceRequest = {
  sourceId: string;
};

export type SaveScheduleToLibraryRequest = {
  title: string;
  subtitle?: string;
};

export type ToggleSpaceScheduleRequest = {
  enabled: boolean;
};
