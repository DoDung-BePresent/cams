import dayjs from 'dayjs';
import type { ScheduleSlotItem } from '@/shared/modules/schedules/types';
import type { ScheduleMusicItemDto } from '../types/schedule.types';

/**
 * Transform schedule slots to FullCalendar events
 * Each slot can span multiple days, so we create one event per day
 */
export const transformSlotsToEvents = (
  slots: ScheduleSlotItem[],
  musicCatalog: ScheduleMusicItemDto[],
  defaultColor: string,
) => {
  const events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    borderColor: string;
  }> = [];

  // Get the current week's Monday
  const weekStart = dayjs().startOf('week').add(1, 'day'); // Monday

  slots.forEach((slot) => {
    // Find playlist name from catalog
    const playlist = musicCatalog.find((m) => m.id === slot.playlistId);
    const title = playlist?.title || 'Unknown Playlist';

    // Create one event for each day in daysOfWeek
    slot.daysOfWeek.forEach((dayOfWeek) => {
      // Calculate the date for this day in the current week
      // dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
      // We need to map to the symbolic week starting Monday
      const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday-based offset
      const eventDate = weekStart.add(dayOffset, 'day');

      // Combine date with time
      const startDateTime = eventDate
        .hour(parseInt(slot.startTime.split(':')[0]))
        .minute(parseInt(slot.startTime.split(':')[1]))
        .second(0);

      const endDateTime = eventDate
        .hour(parseInt(slot.endTime.split(':')[0]))
        .minute(parseInt(slot.endTime.split(':')[1]))
        .second(0);

      events.push({
        id: slot.id,
        title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        backgroundColor: defaultColor,
        borderColor: defaultColor,
      });
    });
  });

  return events;
};
