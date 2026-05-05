/**
 * Schedule Management Types
 * Based on calendar-note.md API documentation
 */

export interface ScheduleSlotDto {
  id: string;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  musicId: string; // Playlist ID (legacy naming from BE)
}

export interface SpaceScheduleDto {
  id: string;
  name: string;
  spaceId: string | null;
  slots: ScheduleSlotDto[];
  enabled: boolean;
  sourceId: string | null;
  sourceLabel: string | null;
  updatedAt: string;
}

export interface ScheduleSourceDto {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  type: 'template' | 'library';
  schedule: SpaceScheduleDto;
  isUserCreated: boolean;
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
  draftSchedule: SpaceScheduleDto;
  librarySources: ScheduleSourceDto[];
  templateSources: ScheduleSourceDto[];
  musicCatalog: ScheduleMusicItemDto[];
}

export interface UpsertScheduleSlotRequest {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  playlistId: string;
}

export interface SaveToLibraryRequest {
  title: string;
  subtitle?: string;
}

export interface ApplySourceRequest {
  sourceId: string;
}

export interface ToggleScheduleRequest {
  enabled: boolean;
}
