import { api } from '@/config';
import type {
  CreateBrandScheduleSourceRequest,
  UpdateBrandScheduleSourceRequest,
  UpsertBrandScheduleSlotRequest,
} from '@/features/brand/types';
import type { Result } from '@/shared/types';
import type {
  ScheduleSlotApiItem,
  ScheduleSlotItem,
  ScheduleSourceApiItem,
  ScheduleSourceItem,
  SpaceScheduleApiItem,
  SpaceScheduleItem,
} from '@/shared/modules/schedules/types';

const SCHEDULE_ENDPOINTS = {
  library: (brandId: string) => `/api/cms/schedule/brands/${brandId}/library`,
  templates: (brandId: string) =>
    `/api/cms/schedule/brands/${brandId}/templates`,
  createSource: '/api/cms/schedule/brands/sources',
  deleteSource: (sourceId: string) =>
    `/api/cms/schedule/brands/sources/${sourceId}`,
  updateSource: (sourceId: string) =>
    `/api/cms/schedule/brands/sources/${sourceId}`,
  upsertSlot: (sourceId: string, slotId: string) =>
    `/api/cms/schedule/brands/sources/${sourceId}/slots/${slotId}`,
  deleteSlot: (sourceId: string, slotId: string) =>
    `/api/cms/schedule/brands/sources/${sourceId}/slots/${slotId}`,
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

const normalizeSource = (
  source: ScheduleSourceApiItem,
): ScheduleSourceItem => ({
  ...source,
  schedule: normalizeSchedule(source.schedule),
});

const normalizeSourceList = (sources?: ScheduleSourceApiItem[]) =>
  (sources || []).map(normalizeSource);

export const scheduleService = {
  getLibrary: async (brandId: string) => {
    const response = await api.get<Result<ScheduleSourceApiItem[]>>(
      SCHEDULE_ENDPOINTS.library(brandId),
    );

    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeSourceList(response.data.data),
      },
    };
  },

  getTemplates: async (brandId: string) => {
    const response = await api.get<Result<ScheduleSourceApiItem[]>>(
      SCHEDULE_ENDPOINTS.templates(brandId),
    );

    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeSourceList(response.data.data),
      },
    };
  },

  createSource: (data: CreateBrandScheduleSourceRequest) =>
    api.post<Result<string>>(SCHEDULE_ENDPOINTS.createSource, data),

  deleteSource: (sourceId: string) =>
    api.delete<Result<string>>(SCHEDULE_ENDPOINTS.deleteSource(sourceId)),

  updateSource: (sourceId: string, data: UpdateBrandScheduleSourceRequest) =>
    api.patch<Result<string>>(SCHEDULE_ENDPOINTS.updateSource(sourceId), data),

  upsertSlot: (
    sourceId: string,
    slotId: string,
    body: UpsertBrandScheduleSlotRequest,
  ) =>
    api.put<Result<string>>(
      SCHEDULE_ENDPOINTS.upsertSlot(sourceId, slotId),
      body,
    ),

  deleteSlot: (sourceId: string, slotId: string) =>
    api.delete<Result<string>>(SCHEDULE_ENDPOINTS.deleteSlot(sourceId, slotId)),
};
