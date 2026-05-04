import { useState, useRef } from 'react';
import { Card, Flex, Button, Space, Alert, Switch, Tag } from 'antd';
import { FolderOpenOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams } from 'react-router';
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import type FullCalendar from '@fullcalendar/react';
import dayjs from 'dayjs';

import { PageHeader } from '@/shared/components';
import { useStoreNavigate } from '@/features/store/hooks';
import { useSpace } from '@/shared/modules/spaces/hooks';
import {
  useApplyScheduleSource,
  useSaveScheduleToLibrary,
  useSpaceScheduleBootstrap,
  useToggleSpaceSchedule,
  useUpsertScheduleSlot,
} from '@/shared/modules/schedules/hooks';
import type {
  ScheduleMusicItemDto,
  SpaceScheduleDto,
} from './types/schedule.types';
import {
  ScheduleCalendar,
  QuickCreatePopover,
  SlotActionsPopover,
  ScheduleSourcePickerModal,
  SaveToLibraryModal,
} from './components';
import './SpaceSchedule.css';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Space Schedule Page (Store Level)
 *
 * Features:
 * - Manage space-level schedule
 * - Load library sources (not templates - those are for StrictSync)
 * - Visual calendar interface for slot management
 * - Drag & drop to move/resize slots
 *
 * Flow:
 * 1. Load bootstrap data for the space
 * 2. Create slots or load from library
 * 3. Add/edit/delete slots via calendar
 * 4. Slots are saved to space schedule
 */
export const SpaceSchedulePage = () => {
  const navigate = useStoreNavigate();
  const params = useParams();
  const spaceId = params.spaceId;
  const calendarRef = useRef<FullCalendar | null>(null);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [popoverTimeInfo, setPopoverTimeInfo] = useState<{
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    dayName: string;
  } | null>(null);
  const [slotActionsOpen, setSlotActionsOpen] = useState(false);
  const [slotActionsPosition, setSlotActionsPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [slotActionsSlot, setSlotActionsSlot] = useState<{
    id: string;
    playlistId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  } | null>(null);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [saveLibraryOpen, setSaveLibraryOpen] = useState(false);

  // Load data
  const { data: spaceDetail } = useSpace(spaceId, !!spaceId);
  const { data: bootstrap, isLoading } = useSpaceScheduleBootstrap(
    spaceId,
    !!spaceId,
  );

  const applySourceMutation = useApplyScheduleSource(spaceId);
  const saveLibraryMutation = useSaveScheduleToLibrary(spaceId);
  const toggleScheduleMutation = useToggleSpaceSchedule(spaceId);
  const updateSlotMutation = useUpsertScheduleSlot(spaceId);

  const activeSchedule = bootstrap?.draftSchedule;
  // Store Manager layout: No elevated permissions, even for Brand Manager
  // If Brand Manager wants more features, they should use Brand Dashboard
  const canSaveToLibrary = false;

  // Transform playlists to music catalog format
  const musicCatalog: ScheduleMusicItemDto[] =
    bootstrap?.musicCatalog?.map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      artist: playlist.artist || 'Brand Playlist',
      collection: playlist.collection ?? null,
      artworkLabel: playlist.artworkLabel,
      primaryHex: playlist.primaryHex || '#4A2EA1',
      secondaryHex: playlist.secondaryHex || '#4FB2D6',
    })) || [];

  const handleLoadSchedule = () => {
    setSourcePickerOpen(true);
  };

  const handleApplySource = (sourceId: string) => {
    applySourceMutation.mutate(
      { sourceId },
      {
        onSuccess: () => {
          setSourcePickerOpen(false);
        },
      },
    );
  };

  const handleCreateSlot = (selectInfo?: DateSelectArg) => {
    if (selectInfo) {
      // Show quick create popover
      const startTime = dayjs(selectInfo.start).format('HH:mm');
      const endTime = dayjs(selectInfo.end).format('HH:mm');
      const dayOfWeek = selectInfo.start.getDay();
      const dayName = WEEKDAY_NAMES[dayOfWeek];

      // Get mouse position from the jsEvent
      const mouseEvent = selectInfo.jsEvent as MouseEvent;
      setPopoverPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
      });

      setPopoverTimeInfo({
        startTime,
        endTime,
        dayOfWeek,
        dayName,
      });

      setPopoverOpen(true);
    }
  };

  const handleSlotClick = (clickInfo: EventClickArg) => {
    const slot = activeSchedule?.slots.find((s) => s.id === clickInfo.event.id);

    if (!slot) return;

    // Get mouse position from the jsEvent
    const mouseEvent = clickInfo.jsEvent as MouseEvent;
    setSlotActionsPosition({
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
    });

    setSlotActionsSlot({
      id: slot.id,
      playlistId: slot.playlistId,
      daysOfWeek: slot.daysOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

    setSlotActionsOpen(true);
  };

  const handleSlotChange = async (
    slotId: string,
    updates: { daysOfWeek: number[]; startTime: string; endTime: string },
  ) => {
    if (!spaceId) return;

    const slot = activeSchedule?.slots.find((s) => s.id === slotId);
    if (!slot) return;

    // Update the slot with new time/day via API (silent mode for drag)
    await updateSlotMutation.mutateAsync({
      slotId,
      body: {
        daysOfWeek: updates.daysOfWeek,
        startTime: updates.startTime,
        endTime: updates.endTime,
        playlistId: slot.playlistId, // Keep existing playlist
      },
      silent: true, // Don't show success message for drag operations
    });
  };

  const handleCloseSlotActions = () => {
    setSlotActionsOpen(false);
    setSlotActionsPosition(null);
    setSlotActionsSlot(null);
  };

  const handleClosePopover = () => {
    setPopoverOpen(false);
    setPopoverPosition(null);
    setPopoverTimeInfo(null);
  };

  const breadcrumbs = [
    {
      title: 'Space Management',
      onClick: () => navigate('/store/spaces'),
      className: 'cursor-pointer',
    },
    { title: spaceDetail?.name || 'Space' },
    { title: 'Schedule' },
  ];

  return (
    <div>
      <PageHeader
        title='Space Schedule'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Manage weekly schedule at space level',
          keywords: 'space, schedule, playlist, weekly',
        }}
        extra={
          <Space>
            <Button
              size='large'
              icon={<FolderOpenOutlined />}
              onClick={handleLoadSchedule}
            >
              Load Schedule
            </Button>
            {canSaveToLibrary && (
              <Button
                size='large'
                icon={<SaveOutlined />}
                disabled={!activeSchedule}
                onClick={() => setSaveLibraryOpen(true)}
              >
                Save to Library
              </Button>
            )}
          </Space>
        }
      />

      {!activeSchedule && (
        <Alert
          type='info'
          showIcon
          description='Get started by loading a schedule from library or create slots directly on the calendar.'
          style={{ marginBottom: 16 }}
        />
      )}

      {activeSchedule && (
        <Space style={{ marginBottom: 16 }}>
          <Tag color='blue'>Space-level scheduling</Tag>
          <Switch
            checked={!!activeSchedule?.enabled}
            loading={toggleScheduleMutation.isPending}
            checkedChildren='Enabled'
            unCheckedChildren='Disabled'
            onChange={(checked) => {
              toggleScheduleMutation.mutate({ enabled: checked });
            }}
          />
        </Space>
      )}

      <Flex gap='middle'>
        {/* Main Calendar Area - Full width */}
        <div style={{ flex: 1 }}>
          <Card>
            {/* Calendar */}
            <ScheduleCalendar
              bootstrap={{
                draftSchedule:
                  (activeSchedule as unknown as SpaceScheduleDto) || null,
                librarySources: [],
                templateSources: [],
                musicCatalog: isLoading ? [] : musicCatalog,
              }}
              isLoading={isLoading}
              spaceId={spaceId ?? null}
              onCreateSlot={handleCreateSlot}
              onSlotClick={handleSlotClick}
              onSlotChange={handleSlotChange}
              onCalendarReady={(ref) => {
                calendarRef.current = ref;
              }}
            />
          </Card>
        </div>
      </Flex>

      {/* Quick Create Popover */}
      <QuickCreatePopover
        open={popoverOpen}
        anchorPosition={popoverPosition}
        timeInfo={popoverTimeInfo}
        spaceId={spaceId ?? null}
        musicCatalog={musicCatalog}
        onClose={handleClosePopover}
        calendarRef={calendarRef}
      />

      {/* Slot Actions Popover */}
      <SlotActionsPopover
        open={slotActionsOpen}
        anchorPosition={slotActionsPosition}
        slot={slotActionsSlot}
        spaceId={spaceId ?? null}
        musicCatalog={musicCatalog}
        onClose={handleCloseSlotActions}
      />

      {/* Load Schedule Modal */}
      <ScheduleSourcePickerModal
        open={sourcePickerOpen}
        loading={isLoading || applySourceMutation.isPending}
        librarySources={bootstrap?.librarySources || []}
        templateSources={bootstrap?.templateSources || []}
        showTemplates={false}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={handleApplySource}
      />

      {/* Save to Library Modal */}
      <SaveToLibraryModal
        open={saveLibraryOpen}
        initialTitle={
          activeSchedule?.name || `${spaceDetail?.name || 'Space'} schedule`
        }
        loading={saveLibraryMutation.isPending}
        onClose={() => setSaveLibraryOpen(false)}
        onSubmit={(values) => {
          saveLibraryMutation.mutate(values, {
            onSuccess: () => setSaveLibraryOpen(false),
          });
        }}
      />
    </div>
  );
};
