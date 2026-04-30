import { useState } from 'react';
import { Card, Flex, Button, Space, Alert } from 'antd';
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { DateSelectArg } from '@fullcalendar/core';
import dayjs from 'dayjs';

import { PageHeader } from '@/shared/components';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { QuickCreatePopover } from './components/QuickCreatePopover';
import { CreateSlotDrawer } from './components/CreateSlotDrawer';
import { CreateScheduleSourceDrawer } from './components/CreateScheduleSourceDrawer';
import { EditScheduleSourceDrawer } from './components/EditScheduleSourceDrawer';
import { ScheduleSourcePickerModal } from './components/ScheduleSourcePickerModal';
import { useScheduleBootstrap } from './hooks/useScheduleBootstrap';
import {
  useCreateBrandScheduleSource,
  useUpdateBrandScheduleSource,
  useDeleteBrandScheduleSource,
  useBrandScheduleLibrary,
  useBrandScheduleTemplates,
} from '@/features/brand/hooks';
import { useAuth } from '@/providers';
import type {
  ScheduleSourceType,
  ScheduleSourceItem,
} from '@/shared/modules/schedules/types';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createSourceDrawerOpen, setCreateSourceDrawerOpen] = useState(false);
  const [editSourceDrawerOpen, setEditSourceDrawerOpen] = useState(false);
  const [loadScheduleModalOpen, setLoadScheduleModalOpen] = useState(false);
  const [createType, setCreateType] = useState<ScheduleSourceType>('template');
  const [selectedSource, setSelectedSource] = useState<
    ScheduleSourceItem | undefined
  >();
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

  const createSourceMutation = useCreateBrandScheduleSource();
  const updateSourceMutation = useUpdateBrandScheduleSource();
  const deleteSourceMutation = useDeleteBrandScheduleSource();

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
    console.log('Load schedule source:', sourceId);
    // TODO: Implement apply source to space
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditSlot = (slot: any) => {
    setSelectedSlot(slot);
    setPrefilledTime(null);
    setDrawerOpen(true);
  };

  const handleClosePopover = () => {
    setPopoverOpen(false);
    setPopoverPosition(null);
    setPopoverTimeInfo(null);
  };

  const breadcrumbs = [{ title: 'Brand' }, { title: 'Schedule Management' }];

  const hasTemplate = bootstrap?.draftSchedule?.slots?.length;

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

      {!hasTemplate && (
        <Alert
          type='info'
          showIcon
          message='Get started by creating a template or library, then add time slots to build your weekly schedule.'
          style={{ marginBottom: 16 }}
        />
      )}

      <Flex gap='middle'>
        {/* Main Calendar Area - Full width */}
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

      {/* Quick Create Popover */}
      <QuickCreatePopover
        open={popoverOpen}
        anchorPosition={popoverPosition}
        timeInfo={popoverTimeInfo}
        spaceId={spaceId}
        musicCatalog={bootstrap?.musicCatalog || []}
        onClose={handleClosePopover}
      />

      {/* Full Edit Drawer */}
      <CreateSlotDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setPrefilledTime(null);
        }}
        spaceId={spaceId}
        slot={selectedSlot}
        prefilledTime={prefilledTime}
        musicCatalog={bootstrap?.musicCatalog || []}
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
