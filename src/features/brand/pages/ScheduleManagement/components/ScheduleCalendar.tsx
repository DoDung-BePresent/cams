import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  EventClickArg,
  DateSelectArg,
  EventChangeArg,
} from '@fullcalendar/core';
import { Spin } from 'antd';

import { AppModal } from '@/shared/components';
import { transformSlotsToEvents } from '../utils/calendarHelpers';
import type { ScheduleBootstrapData } from '../types/schedule.types';
// import { useSlotMutations } from '../hooks';

/**
 * TODO: Waiting for BE
 * - [ ] Slot color field - currently using hardcoded #4A2EA1
 * - [ ] BE overlap validation - currently client-side only
 */

const SLOT_COLOR = '#4A2EA1'; // TODO: Replace with slot.color when BE adds field

interface ScheduleCalendarProps {
  bootstrap: ScheduleBootstrapData | undefined;
  isLoading: boolean;
  spaceId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditSlot: (slot: any) => void;
  onCreateSlot: (selectInfo: DateSelectArg) => void;
}

export const ScheduleCalendar = ({
  bootstrap,
  isLoading,
  // spaceId,
  onEditSlot,
  onCreateSlot,
}: ScheduleCalendarProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  // const { updateSlot, deleteSlot } = useSlotMutations(spaceId);

  // Transform BE slots to FullCalendar events
  const events = bootstrap?.draftSchedule?.slots
    ? transformSlotsToEvents(
        bootstrap.draftSchedule.slots,
        bootstrap.musicCatalog,
        SLOT_COLOR,
      )
    : [];

  const handleEventClick = (clickInfo: EventClickArg) => {
    const slot = bootstrap?.draftSchedule?.slots.find(
      (s) => s.id === clickInfo.event.id,
    );

    if (!slot) return;

    AppModal.confirm({
      title: 'Manage Time Slot',
      content: `"${clickInfo.event.title}" - ${clickInfo.event.extendedProps.timeRange}`,
      okText: 'Edit',
      cancelText: 'Delete',
      okButtonProps: { type: 'primary' },
      cancelButtonProps: { danger: true },
      onOk: () => onEditSlot(slot),
      onCancel: () => {
        AppModal.confirm({
          title: 'Delete Time Slot',
          content: `Are you sure you want to delete "${clickInfo.event.title}"?`,
          okText: 'Delete',
          okButtonProps: { danger: true },
          // onOk: () => deleteSlot.mutate(slot.id),
        });
      },
    });
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    onCreateSlot(selectInfo);
  };

  const handleEventChange = (changeInfo: EventChangeArg) => {
    const { event } = changeInfo;

    // TODO: Implement drag to resize/move
    // Need to recalculate daysOfWeek if moved to different day
    console.log('Event changed:', event);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div className='schedule-calendar'>
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView='timeGridWeek'
        headerToolbar={{
          left: 'title',
          center: '',
          right: 'today prev,next',
        }}
        slotMinTime='00:00:00'
        slotMaxTime='24:00:00'
        allDaySlot={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventChange={handleEventChange}
        height='auto'
        slotDuration='00:30:00'
        snapDuration='00:15:00'
        eventContent={renderEventContent}
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
