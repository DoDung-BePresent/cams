import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  EventClickArg,
  DateSelectArg,
  EventChangeArg,
} from '@fullcalendar/core';
import { Spin } from 'antd';
import dayjs from 'dayjs';

import { transformSlotsToEvents } from '../utils/calendarHelpers';
import type { ScheduleBootstrapData } from '../types/schedule.types';
import type { ScheduleSlotItem } from '@/shared/modules/schedules/types';

const SLOT_COLOR = '#1db954'; // Spotify green

interface ScheduleCalendarProps {
  bootstrap: ScheduleBootstrapData | undefined;
  isLoading: boolean;
  spaceId: string | null;
  onCreateSlot: (selectInfo: DateSelectArg) => void;
  onSlotClick: (clickInfo: EventClickArg) => void;
  onSlotChange?: (
    slotId: string,
    updates: { daysOfWeek: number[]; startTime: string; endTime: string },
  ) => Promise<void>;
  onCalendarReady?: (ref: FullCalendar) => void;
}

export const ScheduleCalendar = ({
  bootstrap,
  isLoading,
  spaceId,
  onCreateSlot,
  onSlotClick,
  onSlotChange,
  onCalendarReady,
}: ScheduleCalendarProps) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Disable interactions if no space is selected
  const isDisabled = !spaceId;

  // Notify parent when calendar is ready
  useEffect(() => {
    if (calendarRef.current && onCalendarReady) {
      onCalendarReady(calendarRef.current);
    }
  }, [onCalendarReady]);

  // Transform BE slots to FullCalendar events
  const events = bootstrap?.draftSchedule?.slots
    ? transformSlotsToEvents(
        bootstrap.draftSchedule.slots as unknown as ScheduleSlotItem[],
        bootstrap.musicCatalog,
        SLOT_COLOR,
      )
    : [];

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (isDisabled) return;
    onSlotClick(clickInfo);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (isDisabled) return;
    onCreateSlot(selectInfo);
  };

  const handleEventChange = async (changeInfo: EventChangeArg) => {
    if (isDisabled) {
      changeInfo.revert();
      return;
    }

    const { event, revert } = changeInfo;

    if (!onSlotChange) {
      revert();
      return;
    }

    // Get the new start and end times
    const newStart = dayjs(event.start);
    const newEnd = dayjs(event.end);

    // Calculate which days this event now spans
    const daysOfWeek: number[] = [];
    let currentDay = newStart.clone();

    while (currentDay.isBefore(newEnd) || currentDay.isSame(newEnd, 'day')) {
      const dayOfWeek = currentDay.day();
      if (!daysOfWeek.includes(dayOfWeek)) {
        daysOfWeek.push(dayOfWeek);
      }
      currentDay = currentDay.add(1, 'day');
    }

    // Format times
    const startTime = newStart.format('HH:mm');
    const endTime = newEnd.format('HH:mm');

    try {
      // Optimistic update - keep the event in new position
      await onSlotChange(event.id, {
        daysOfWeek: daysOfWeek.sort((a, b) => a - b),
        startTime,
        endTime,
      });
    } catch {
      // If API fails, revert the change
      revert();
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div className={`schedule-calendar ${isDisabled ? 'disabled' : ''}`}>
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView='timeGridWeek'
        headerToolbar={false}
        firstDay={1} // Start week on Monday
        slotMinTime='07:00:00'
        slotMaxTime='23:00:00'
        allDaySlot={false}
        editable={!isDisabled}
        selectable={!isDisabled}
        selectMirror={true}
        unselectAuto={false}
        dayMaxEvents={true}
        weekends={true}
        nowIndicator={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventChange={handleEventChange}
        height='auto'
        slotDuration='00:30:00'
        snapDuration='00:15:00'
        eventContent={renderEventContent}
        dayHeaderFormat={{ weekday: 'short' }}
        validRange={{
          start: dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'), // Monday
          end: dayjs().endOf('week').add(2, 'day').format('YYYY-MM-DD'), // Next Monday
        }}
        eventClassNames={isDisabled ? 'fc-event-disabled' : ''}
      />
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEventContent = (eventInfo: any) => {
  return (
    <div style={{ padding: '4px 8px' }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>
        {eventInfo.event.title}
      </div>
      <div style={{ fontSize: 11, opacity: 0.9 }}>{eventInfo.timeText}</div>
    </div>
  );
};

export { type ScheduleCalendarProps };
