import { useState } from 'react';
import { Card, Flex, Button, Space, Alert } from 'antd';
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { DateSelectArg } from '@fullcalendar/core';
import dayjs from 'dayjs';

import { PageHeader } from '@/shared/components';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { QuickCreatePopover } from './components/QuickCreatePopover';
import { SlotActionsPopover } from './components/SlotActionsPopover';
import { CreateScheduleSourceDrawer } from './components/CreateScheduleSourceDrawer';
import { EditScheduleSourceDrawer } from './components/EditScheduleSourceDrawer';
import { ScheduleSourcePickerModal } from './components/ScheduleSourcePickerModal';
import {
  useCreateBrandScheduleSource,
  useUpdateBrandScheduleSource,
  useDeleteBrandScheduleSource,
  useBrandScheduleLibrary,
  useBrandScheduleTemplates,
} from '@/features/brand/hooks';
import { useBrandSourceSlotMutations } from './hooks/useBrandSourceSlotMutations';
import { usePlaylists } from '@/shared/modules/playlists/hooks';
import { useAuth } from '@/providers';
import type {
  ScheduleSourceType,
  ScheduleSourceItem,
} from '@/shared/modules/schedules/types';
import type {
  SpaceScheduleDto,
  ScheduleMusicItemDto,
} from './types/schedule.types';
import type { EventClickArg } from '@fullcalendar/core';
import './ScheduleManagement.css';

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
 * Schedule Management Page (Brand Level)
 *
 * Features:
 * - Manage brand schedule sources (templates and library)
 * - Create/edit slots for each source
 * - Visual calendar interface for slot management
 *
 * Flow:
 * 1. Load templates and library sources
 * 2. Select a source to edit (or create new)
 * 3. Add/edit/delete slots for that source
 * 4. Slots are saved to brand source (not space)
 */
export const ScheduleManagement = () => {
  const { user } = useAuth();
  const brandId = user?.brandId;

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
  const [createSourceDrawerOpen, setCreateSourceDrawerOpen] = useState(false);
  const [editSourceDrawerOpen, setEditSourceDrawerOpen] = useState(false);
  const [loadScheduleModalOpen, setLoadScheduleModalOpen] = useState(false);
  const [createType, setCreateType] = useState<ScheduleSourceType>('template');
  const [currentSourceId, setCurrentSourceId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<
    ScheduleSourceItem | undefined
  >();

  // Load data
  const {
    data: librarySources = [],
    isLoading: isLoadingLibrary,
    refetch: refetchLibrary,
  } = useBrandScheduleLibrary(brandId ?? undefined, !!brandId);
  const {
    data: templateSources = [],
    isLoading: isLoadingTemplates,
    refetch: refetchTemplates,
  } = useBrandScheduleTemplates(brandId ?? undefined, !!brandId);
  const { data: playlistsData, isLoading: isLoadingPlaylists } = usePlaylists({
    page: 1,
    pageSize: 1000, // Load all playlists
    status: 1,
  });

  const createSourceMutation = useCreateBrandScheduleSource();
  const updateSourceMutation = useUpdateBrandScheduleSource();
  const deleteSourceMutation = useDeleteBrandScheduleSource();

  // Always call the hook, but pass empty string if no source selected
  // The mutations won't be used unless currentSourceId exists
  const { upsertSlot: updateSlotMutation } = useBrandSourceSlotMutations(
    currentSourceId || '',
    brandId || undefined,
  );

  // Get current source being edited
  const currentSource =
    librarySources.find((s) => s.id === currentSourceId) ||
    templateSources.find((s) => s.id === currentSourceId);

  // Transform playlists to music catalog format
  const musicCatalog: ScheduleMusicItemDto[] =
    playlistsData?.items
      .filter((playlist) => playlist.name) // Filter out playlists without name
      .map((playlist) => ({
        id: playlist.id,
        title: playlist.name!,
        artist: 'Brand Playlist',
        collection: (playlist.storeName ?? null) as string | null,
        artworkLabel:
          playlist.name!.split(' ').slice(0, 2).join(' ') || 'Playlist',
        primaryHex: '#4A2EA1',
        secondaryHex: '#4FB2D6',
      })) || [];

  const handleCreateTemplate = (type: ScheduleSourceType) => {
    setCreateType(type);
    setCreateSourceDrawerOpen(true);
  };

  const handleEditSource = (source: ScheduleSourceItem) => {
    setSelectedSource(source);
    setEditSourceDrawerOpen(true);
  };

  const handleDeleteSource = (sourceId: string) => {
    deleteSourceMutation.mutate(sourceId, {
      onSuccess: () => {
        refetchLibrary();
        refetchTemplates();
      },
    });
  };

  const handleLoadSchedule = (sourceId: string) => {
    setCurrentSourceId(sourceId);
    setLoadScheduleModalOpen(false);
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
    const slot = currentSource?.schedule?.slots.find(
      (s) => s.id === clickInfo.event.id,
    );

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
    if (!currentSourceId || !brandId) return;

    const slot = currentSource?.schedule?.slots.find((s) => s.id === slotId);
    if (!slot) return;

    // Update the slot with new time/day via API
    await updateSlotMutation.mutateAsync({
      slotId,
      data: {
        daysOfWeek: updates.daysOfWeek,
        startTime: updates.startTime,
        endTime: updates.endTime,
        playlistId: slot.playlistId, // Keep existing playlist
      },
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

  const breadcrumbs = [{ title: 'Brand' }, { title: 'Schedule Management' }];

  const isLoading =
    isLoadingLibrary || isLoadingTemplates || isLoadingPlaylists;

  return (
    <div>
      <PageHeader
        title='Schedule Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Manage music schedule for your spaces',
          keywords: 'schedule, calendar, music, playlist',
        }}
        extra={
          <Space>
            <Button
              size='large'
              icon={<FolderOpenOutlined />}
              onClick={() => setLoadScheduleModalOpen(true)}
            >
              Load Schedule
            </Button>
            <Button
              size='large'
              onClick={() => handleCreateTemplate('library')}
            >
              Create Library
            </Button>
            <Button
              size='large'
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => handleCreateTemplate('template')}
            >
              Create Template
            </Button>
          </Space>
        }
      />

      {!currentSourceId && (
        <Alert
          type='info'
          showIcon
          description='Get started by creating a template or library, or load an existing one to add time slots.'
          style={{ marginBottom: 16 }}
        />
      )}

      {currentSourceId && currentSource && (
        <Alert
          type='success'
          showIcon
          description={`Editing: ${currentSource.title} (${currentSource.type})`}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setCurrentSourceId(null)}
        />
      )}

      <Flex gap='middle'>
        {/* Main Calendar Area - Full width */}
        <div style={{ flex: 1 }}>
          <Card>
            {/* Calendar */}
            <ScheduleCalendar
              bootstrap={{
                draftSchedule:
                  (currentSource?.schedule as unknown as SpaceScheduleDto) || {
                    id: '',
                    name: '',
                    spaceId: null,
                    slots: [],
                    enabled: true,
                    sourceId: null,
                    sourceLabel: null,
                    updatedAt: new Date().toISOString(),
                  },
                librarySources: [],
                templateSources: [],
                musicCatalog: isLoadingPlaylists ? [] : musicCatalog,
              }}
              isLoading={isLoading}
              sourceId={currentSourceId}
              brandId={brandId ?? undefined}
              onCreateSlot={handleCreateSlot}
              onSlotClick={handleSlotClick}
              onSlotChange={handleSlotChange}
            />
          </Card>
        </div>
      </Flex>

      {/* Quick Create Popover */}
      <QuickCreatePopover
        open={popoverOpen}
        anchorPosition={popoverPosition}
        timeInfo={popoverTimeInfo}
        sourceId={currentSourceId}
        brandId={brandId ?? undefined}
        musicCatalog={musicCatalog}
        onClose={handleClosePopover}
      />

      {/* Slot Actions Popover */}
      <SlotActionsPopover
        open={slotActionsOpen}
        anchorPosition={slotActionsPosition}
        slot={slotActionsSlot}
        sourceId={currentSourceId}
        brandId={brandId ?? undefined}
        musicCatalog={musicCatalog}
        onClose={handleCloseSlotActions}
      />

      {/* Create Template/Library Drawer */}
      <CreateScheduleSourceDrawer
        open={createSourceDrawerOpen}
        initialType={createType}
        loading={createSourceMutation.isPending}
        onClose={() => setCreateSourceDrawerOpen(false)}
        onSubmit={(values) => {
          createSourceMutation.mutate(values, {
            onSuccess: () => {
              setCreateSourceDrawerOpen(false);
              refetchLibrary();
              refetchTemplates();
            },
          });
        }}
      />

      {/* Edit Schedule Source Drawer */}
      <EditScheduleSourceDrawer
        open={editSourceDrawerOpen}
        source={selectedSource}
        loading={updateSourceMutation.isPending}
        onClose={() => {
          setEditSourceDrawerOpen(false);
          setSelectedSource(undefined);
        }}
        onSubmit={(values) => {
          if (!selectedSource) return;
          updateSourceMutation.mutate(
            { sourceId: selectedSource.id, data: values },
            {
              onSuccess: () => {
                setEditSourceDrawerOpen(false);
                setSelectedSource(undefined);
                refetchLibrary();
                refetchTemplates();
              },
            },
          );
        }}
      />

      {/* Load Schedule Modal */}
      <ScheduleSourcePickerModal
        open={loadScheduleModalOpen}
        loading={isLoadingLibrary || isLoadingTemplates}
        librarySources={librarySources}
        templateSources={templateSources}
        onClose={() => setLoadScheduleModalOpen(false)}
        onSelect={handleLoadSchedule}
        onEdit={handleEditSource}
        onDelete={handleDeleteSource}
      />
    </div>
  );
};
