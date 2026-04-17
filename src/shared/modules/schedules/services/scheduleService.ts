import { api } from '@/config';
import type { Result } from '@/shared/types';
import type {
  ApplyScheduleSourceRequest,
  SaveScheduleToLibraryRequest,
  ScheduleSlotApiItem,
  ScheduleSlotItem,
  SpaceScheduleApiItem,
  SpaceScheduleBootstrapApi,
  SpaceScheduleBootstrap,
  SpaceScheduleItem,
  ToggleSpaceScheduleRequest,
  UpsertScheduleSlotRequest,
} from '@/shared/modules/schedules/types';

const SCHEDULE_ENDPOINTS = {
  bootstrap: (spaceId: string) =>
    `/api/cms/schedule/spaces/${spaceId}/bootstrap`,
  upsertSlot: (spaceId: string, slotId: string) =>
    `/api/cms/schedule/spaces/${spaceId}/slots/${slotId}`,
  deleteSlot: (spaceId: string, slotId: string) =>
    `/api/cms/schedule/spaces/${spaceId}/slots/${slotId}`,
  applySource: (spaceId: string) =>
    `/api/cms/schedule/spaces/${spaceId}/apply-source`,
  saveToLibrary: (spaceId: string) =>
    `/api/cms/schedule/spaces/${spaceId}/save-to-library`,
  toggle: (spaceId: string) => `/api/cms/schedule/spaces/${spaceId}/toggle`,
} as const;

const normalizeSlot = (slot: ScheduleSlotApiItem): ScheduleSlotItem => ({
  id: slot.id,
  daysOfWeek: slot.daysOfWeek,
  startTime: slot.startTime,
  endTime: slot.endTime,
  playlistId: slot.musicId || '',
});

const normalizeSchedule = (
  schedule: SpaceScheduleApiItem,
): SpaceScheduleItem => ({
  ...schedule,
  slots: (schedule.slots || []).map(normalizeSlot),
});

const normalizeBootstrap = (
  data?: SpaceScheduleBootstrapApi,
): SpaceScheduleBootstrap => {
  if (!data) {
    return {
      draftSchedule: null,
      librarySources: [],
      templateSources: [],
      musicCatalog: [],
    };
  }

  return {
    draftSchedule: data.draftSchedule
      ? normalizeSchedule(data.draftSchedule)
      : null,
    librarySources: (data.librarySources || []).map((source) => ({
      ...source,
      schedule: normalizeSchedule(source.schedule),
    })),
    templateSources: (data.templateSources || []).map((source) => ({
      ...source,
      schedule: normalizeSchedule(source.schedule),
    })),
    musicCatalog: data.musicCatalog || [],
  };
};

export const scheduleService = {
  getBootstrap: async (spaceId: string) => {
    const response = await api.get<Result<SpaceScheduleBootstrapApi>>(
      SCHEDULE_ENDPOINTS.bootstrap(spaceId),
    );

    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeBootstrap(response.data.data),
      },
    };
  },

  upsertSlot: (
    spaceId: string,
    slotId: string,
    body: UpsertScheduleSlotRequest,
  ) =>
    api.put<Result<string>>(
      SCHEDULE_ENDPOINTS.upsertSlot(spaceId, slotId),
      body,
    ),

  deleteSlot: (spaceId: string, slotId: string) =>
    api.delete<Result<string>>(SCHEDULE_ENDPOINTS.deleteSlot(spaceId, slotId)),

  applySource: (spaceId: string, body: ApplyScheduleSourceRequest) =>
    api.post<Result<string>>(SCHEDULE_ENDPOINTS.applySource(spaceId), body),

  saveToLibrary: (spaceId: string, body: SaveScheduleToLibraryRequest) =>
    api.post<Result<string>>(SCHEDULE_ENDPOINTS.saveToLibrary(spaceId), body),

  toggle: (spaceId: string, body: ToggleSpaceScheduleRequest) =>
    api.patch<Result<string>>(SCHEDULE_ENDPOINTS.toggle(spaceId), body),
};
