import type {
  ScheduleSlotItem,
  ScheduleSourceItem,
} from '@/shared/modules/schedules/types';

export interface SpaceScheduleDto {
  id: string;
  name: string;
  spaceId: string | null;
  slots: ScheduleSlotItem[];
  enabled: boolean;
  sourceId: string | null;
  sourceLabel: string | null;
  updatedAt: string;
}

export interface ScheduleMusicItemDto {
  id: string;
  title: string;
  artist: string;
  collection: string | null;
  artworkLabel: string;
  primaryHex: string;
  secondaryHex: string;
}

export interface ScheduleBootstrapData {
  draftSchedule: SpaceScheduleDto | null;
  librarySources: ScheduleSourceItem[];
  templateSources: ScheduleSourceItem[];
  musicCatalog: ScheduleMusicItemDto[];
}
