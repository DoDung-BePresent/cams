import type { EventInput } from '@fullcalendar/core';
import type { ScheduleMusicItemDto } from '../types/schedule.types';
import type { ScheduleSlotItem } from '@/shared/modules/schedules/types';

/**
 * Transform BE schedule slots to FullCalendar events
 *
 * FullCalendar uses ISO weekday (1=Monday, 7=Sunday)
 * BE uses JS weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export const transformSlotsToEvents = (
  slots: ScheduleSlotItem[],
  musicCatalog: ScheduleMusicItemDto[],
  defaultColor: string,
): EventInput[] => {
  return slots.flatMap((slot) => {
    const music = musicCatalog.find((m) => m.id === slot.playlistId);
    const title = music?.title || `Unknown Playlist`;

    // Convert BE weekdays (0=Sun) to FullCalendar weekdays (1=Mon, 7=Sun)
    const fcDaysOfWeek = slot.daysOfWeek.map((day) => (day === 0 ? 7 : day));

    return {
      id: slot.id,
      title,
      daysOfWeek: fcDaysOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      backgroundColor: defaultColor,
      borderColor: defaultColor,
      extendedProps: {
        playlistId: slot.playlistId,
        timeRange: `${slot.startTime} - ${slot.endTime}`,
        daysOfWeekBE: slot.daysOfWeek, // Keep original for editing
      },
    };
  });
};

/**
 * Format time for API (HH:mm)
 */
export const formatTimeForAPI = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Check if two time slots overlap
 * Used for client-side validation (waiting for BE validation)
 */
export const checkSlotOverlap = (
  slot1: { daysOfWeek: number[]; startTime: string; endTime: string },
  slot2: { daysOfWeek: number[]; startTime: string; endTime: string },
): boolean => {
  // Check if they share any days
  const sharedDays = slot1.daysOfWeek.some((day) =>
    slot2.daysOfWeek.includes(day),
  );

  if (!sharedDays) return false;

  // Check if time ranges overlap
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  return start1 < end2 && start2 < end1;
};

/**
 * Convert HH:mm to minutes since midnight
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Get weekday name from number
 */
export const getWeekdayName = (day: number): string => {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[day] || '';
};

/**
 * Get full weekday name from number
 */
export const getFullWeekdayName = (day: number): string => {
  const names = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return names[day] || '';
};
