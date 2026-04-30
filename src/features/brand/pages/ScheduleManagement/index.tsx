import { useState } from 'react';
import { Card, Flex } from 'antd';
import type { DateSelectArg } from '@fullcalendar/core';
import dayjs from 'dayjs';

import { PageHeader } from '@/shared/components';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { ScheduleSidebar } from './components/ScheduleSidebar';
import { CreateSlotDrawer } from './components/CreateSlotDrawer';
import { SaveToLibraryModal } from './components/SaveToLibraryModal';
import { useScheduleBootstrap } from './hooks/useScheduleBootstrap';
import './ScheduleManagement.css';

/**
 * Schedule Management Page
 *
 * Features:
 * - Weekly calendar view with time slots
 * - Drag & drop to create/edit slots
 * - Sidebar with music catalog and templates
 * - Save schedule to library
 *
 * TODO: Waiting for BE
 * - [ ] Slot color field (currently hardcoded to #4A2EA1)
 * - [ ] Bulk slot operations (currently sequential API calls)
 * - [ ] Overlap validation from BE (currently client-side only)
 */
export const ScheduleManagement = () => {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [prefilledTime, setPrefilledTime] = useState<{
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  } | null>(null);

  // TODO: Get spaceId from route params or context
  const spaceId = 'temp-space-id';

  const { data: bootstrap, isLoading } = useScheduleBootstrap(spaceId);

  const handleCreateSlot = (selectInfo?: DateSelectArg) => {
    setSelectedSlot(null);

    if (selectInfo) {
      // Pre-fill time from calendar selection
      const startTime = dayjs(selectInfo.start).format('HH:mm');
      const endTime = dayjs(selectInfo.end).format('HH:mm');
      const dayOfWeek = selectInfo.start.getDay(); // 0=Sunday, 1=Monday, etc.

      setPrefilledTime({
        startTime,
        endTime,
        daysOfWeek: [dayOfWeek],
      });
    } else {
      setPrefilledTime(null);
    }

    setCreateDrawerOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditSlot = (slot: any) => {
    setSelectedSlot(slot);
    setPrefilledTime(null);
    setCreateDrawerOpen(true);
  };

  // const handleSaveToLibrary = () => {
  //   if (!bootstrap?.draftSchedule?.slots?.length) {
  //     message.warning('No slots to save. Add some slots first.');
  //     return;
  //   }
  //   setSaveModalOpen(true);
  // };

  const breadcrumbs = [{ title: 'Brand' }, { title: 'Schedule Management' }];

  return (
    <div>
      <PageHeader
        title='Schedule Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Manage music schedule for your spaces',
          keywords: 'schedule, calendar, music, playlist',
        }}
      />

      <Flex gap='middle'>
        {/* Sidebar - 300px fixed width */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <ScheduleSidebar
            bootstrap={bootstrap}
            isLoading={isLoading}
            spaceId={spaceId}
          />
        </div>

        {/* Main Calendar Area */}
        <div style={{ flex: 1 }}>
          <Card>
            {/* Calendar */}
            <ScheduleCalendar
              bootstrap={bootstrap}
              isLoading={isLoading}
              spaceId={spaceId}
              onEditSlot={handleEditSlot}
              onCreateSlot={handleCreateSlot}
            />
          </Card>
        </div>
      </Flex>

      {/* Drawers & Modals */}
      <CreateSlotDrawer
        open={createDrawerOpen}
        onClose={() => {
          setCreateDrawerOpen(false);
          setPrefilledTime(null);
        }}
        spaceId={spaceId}
        slot={selectedSlot}
        prefilledTime={prefilledTime}
        musicCatalog={bootstrap?.musicCatalog || []}
      />

      <SaveToLibraryModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        spaceId={spaceId}
      />
    </div>
  );
};
