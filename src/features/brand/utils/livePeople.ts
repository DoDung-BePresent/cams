import dayjs from 'dayjs';

import type { StoreContextRawLogItem } from '@/features/brand/types';
import type { SpaceListItem } from '@/shared/modules/spaces/types';

export type LivePeopleSpaceSample = {
  spaceId: string;
  people: number | null;
  samples: number;
  measuredAtUtc: string | null;
};

export const buildLatestContextLogBySpace = (
  items: StoreContextRawLogItem[] = [],
) => {
  const latestLogBySpaceId = new Map<string, StoreContextRawLogItem>();

  for (const item of items) {
    const key = item.spaceId || item.spaceName;
    const existing = latestLogBySpaceId.get(key);
    if (
      !existing ||
      dayjs(item.measuredAtUtc).valueOf() >
        dayjs(existing.measuredAtUtc).valueOf()
    ) {
      latestLogBySpaceId.set(key, item);
    }
  }

  return latestLogBySpaceId;
};

export const getLatestContextLogForSpace = (
  latestLogBySpaceId: Map<string, StoreContextRawLogItem>,
  space: Pick<SpaceListItem, 'id' | 'name'>,
) => latestLogBySpaceId.get(space.id) ?? latestLogBySpaceId.get(space.name);

export const getLivePeopleForSpaces = (
  items: StoreContextRawLogItem[] = [],
  spaces: Array<Pick<SpaceListItem, 'id' | 'name'>> = [],
): LivePeopleSpaceSample[] => {
  const latestLogBySpaceId = buildLatestContextLogBySpace(items);

  return spaces.map((space) => {
    const latest = getLatestContextLogForSpace(latestLogBySpaceId, space);

    return {
      spaceId: space.id,
      people:
        latest?.crowdDensity == null ? null : Math.round(latest.crowdDensity),
      samples: latest?.crowdDensity == null ? 0 : 1,
      measuredAtUtc: latest?.measuredAtUtc ?? null,
    };
  });
};

export const sumLivePeopleSamples = (samples: LivePeopleSpaceSample[]) =>
  samples.reduce((sum, sample) => sum + (sample.people ?? 0), 0);

export const sumLivePeopleRows = (
  rows: Array<{ people?: number | null; peopleNow?: number | null }>,
) => rows.reduce((sum, row) => sum + (row.people ?? row.peopleNow ?? 0), 0);
