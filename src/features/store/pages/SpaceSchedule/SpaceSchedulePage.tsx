import { useMemo, useState } from 'react';
import { Button, Empty, Segmented, Space, Switch, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import type { ColumnsType } from 'antd/es/table';

import { AppModal, DataTable, PageHeader } from '@/shared/components';
import { useAuth } from '@/providers';
import { RoleEnum } from '@/shared/types';
import { useSpace } from '@/shared/modules/spaces/hooks';
import {
  useApplyScheduleSource,
  useDeleteScheduleSlot,
  useSaveScheduleToLibrary,
  useSpaceScheduleBootstrap,
  useToggleSpaceSchedule,
  useUpsertScheduleSlot,
} from '@/shared/modules/schedules/hooks';
import type { ScheduleSlotItem } from '@/shared/modules/schedules/types';
import { usePlaylistOptionsForStore } from '@/shared/modules/playlists/hooks';
import {
  SaveToLibraryModal,
  ScheduleSourcePickerModal,
  UpsertScheduleSlotDrawer,
} from './components';

type ScheduleStage = 'welcome' | 'editor';

const dayOptions = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
] as const;

const makeClientGuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });

const minutesFromTime = (value: string) => {
  const [hourString, minuteString] = value.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);
  return hour * 60 + minute;
};

export const SpaceSchedulePage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();

  const spaceId = params.spaceId;
  const [stage, setStage] = useState<ScheduleStage>('welcome');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [slotDrawerOpen, setSlotDrawerOpen] = useState(false);
  const [saveLibraryOpen, setSaveLibraryOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlotItem | null>(null);

  const { data: spaceDetail } = useSpace(spaceId, !!spaceId);
  const { data: bootstrap, isLoading } = useSpaceScheduleBootstrap(
    spaceId,
    !!spaceId,
  );
  const { data: playlistOptions = [] } = usePlaylistOptionsForStore(
    user?.storeId ?? undefined,
  );

  const applySourceMutation = useApplyScheduleSource(spaceId);
  const upsertSlotMutation = useUpsertScheduleSlot(spaceId);
  const deleteSlotMutation = useDeleteScheduleSlot(spaceId);
  const saveLibraryMutation = useSaveScheduleToLibrary(spaceId);
  const toggleScheduleMutation = useToggleSpaceSchedule(spaceId);

  const activeSchedule = bootstrap?.draftSchedule;
  const canSaveToLibrary =
    !!user?.roles?.includes(RoleEnum.SystemAdmin) ||
    !!user?.roles?.includes(RoleEnum.BrandManager);

  const slotsOfDay = useMemo(() => {
    const slots = activeSchedule?.slots || [];
    return slots
      .filter((slot) => slot.daysOfWeek.includes(selectedDay))
      .slice()
      .sort(
        (a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime),
      );
  }, [activeSchedule?.slots, selectedDay]);

  const playlistLabelMap = useMemo(() => {
    return new Map(
      (playlistOptions || []).map((item) => [
        String(item.value),
        item.label || '-',
      ]),
    );
  }, [playlistOptions]);

  const onLoadSchedule = () => {
    setSourcePickerOpen(true);
  };

  const onCreateNew = () => {
    setStage('editor');
  };

  const ensureNoOverlap = (
    candidate: { id: string; day: number; startTime: string; endTime: string },
    allSlots: ScheduleSlotItem[],
  ) => {
    const candidateStart = minutesFromTime(candidate.startTime);
    const candidateEnd = minutesFromTime(candidate.endTime);

    return !allSlots.some((slot) => {
      if (slot.id === candidate.id) {
        return false;
      }
      if (!slot.daysOfWeek.includes(candidate.day)) {
        return false;
      }

      const otherStart = minutesFromTime(slot.startTime);
      const otherEnd = minutesFromTime(slot.endTime);
      return (
        Math.max(candidateStart, otherStart) < Math.min(candidateEnd, otherEnd)
      );
    });
  };

  const slotColumns: ColumnsType<ScheduleSlotItem> = [
    {
      title: 'Time Window',
      key: 'timeWindow',
      render: (_, record) => (
        <Space
          direction='vertical'
          size={0}
        >
          <strong>
            {record.startTime} - {record.endTime}
          </strong>
          <span>
            Day: {dayOptions.find((item) => item.value === selectedDay)?.label}
          </span>
        </Space>
      ),
    },
    {
      title: 'Playlist',
      key: 'playlist',
      render: (_, record) =>
        playlistLabelMap.get(record.playlistId) || record.playlistId || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size='large'
            onClick={() => {
              setEditingSlot(record);
              setSlotDrawerOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size='large'
            danger
            onClick={() => {
              AppModal.confirm({
                title: 'Delete schedule slot',
                content: `Remove slot ${record.startTime} - ${record.endTime}?`,
                okText: 'Delete',
                okButtonProps: { danger: true },
                onOk: () => deleteSlotMutation.mutate(record.id),
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title='Space Schedule'
        breadcrumbs={[
          {
            title: 'Space Management',
            onClick: () => navigate('/store/spaces'),
            className: 'cursor-pointer',
          },
          { title: spaceDetail?.name || 'Space' },
          { title: 'Schedule' },
        ]}
        seo={{
          description: 'Manage weekly schedule at space level.',
          keywords: 'space, schedule, playlist, weekly',
        }}
      />

      {stage === 'welcome' && !activeSchedule && (
        <Space
          direction='vertical'
          size='middle'
          style={{ width: '100%' }}
        >
          <Typography.Title level={3}>
            First schedule, let&apos;s go.
          </Typography.Title>
          <Space>
            <Button
              size='large'
              type='primary'
              icon={<CalendarOutlined />}
              onClick={onLoadSchedule}
            >
              Load schedule
            </Button>
            <Button
              size='large'
              icon={<PlusOutlined />}
              onClick={onCreateNew}
            >
              Create new
            </Button>
          </Space>
        </Space>
      )}

      {(stage === 'editor' || !!activeSchedule) && (
        <Space
          direction='vertical'
          size='middle'
          style={{ width: '100%' }}
        >
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Segmented<number>
              value={selectedDay}
              onChange={(value) => setSelectedDay(value)}
              options={dayOptions.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
            />
            <Space>
              <Button
                size='large'
                onClick={onLoadSchedule}
              >
                Load Schedule
              </Button>
              <Button
                size='large'
                icon={<SaveOutlined />}
                disabled={!canSaveToLibrary || !activeSchedule}
                onClick={() => setSaveLibraryOpen(true)}
              >
                Save to Library
              </Button>
              <Button
                size='large'
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingSlot(null);
                  setSlotDrawerOpen(true);
                }}
              >
                Add Slot
              </Button>
            </Space>
          </Space>

          <Space>
            <Tag color='blue'>Space-level scheduling</Tag>
            <Switch
              checked={!!activeSchedule?.enabled}
              disabled={!activeSchedule}
              loading={toggleScheduleMutation.isPending}
              checkedChildren='Enabled'
              unCheckedChildren='Disabled'
              onChange={(checked) => {
                toggleScheduleMutation.mutate({ enabled: checked });
              }}
            />
          </Space>

          {slotsOfDay.length === 0 ? (
            <Empty
              description='No schedule slots for selected day.'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <DataTable<ScheduleSlotItem>
              rowKey='id'
              columns={slotColumns}
              dataSource={slotsOfDay}
              loading={
                isLoading ||
                upsertSlotMutation.isPending ||
                deleteSlotMutation.isPending
              }
              pagination={false}
            />
          )}
        </Space>
      )}

      <ScheduleSourcePickerModal
        open={sourcePickerOpen}
        loading={isLoading || applySourceMutation.isPending}
        librarySources={bootstrap?.librarySources || []}
        templateSources={bootstrap?.templateSources || []}
        showTemplates={false}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={(sourceId) => {
          applySourceMutation.mutate(
            { sourceId },
            {
              onSuccess: () => {
                setStage('editor');
                setSourcePickerOpen(false);
              },
            },
          );
        }}
      />

      <UpsertScheduleSlotDrawer
        open={slotDrawerOpen}
        slot={editingSlot}
        selectedDay={selectedDay}
        playlistOptions={(playlistOptions || []).map((item) => ({
          label: item.label,
          value: String(item.value),
        }))}
        loading={upsertSlotMutation.isPending}
        onClose={() => {
          setSlotDrawerOpen(false);
          setEditingSlot(null);
        }}
        onSubmit={(payload) => {
          const slotId = payload.id || makeClientGuid();
          const allSlots = activeSchedule?.slots || [];

          if (
            !ensureNoOverlap(
              {
                id: slotId,
                day: payload.daysOfWeek[0],
                startTime: payload.startTime,
                endTime: payload.endTime,
              },
              allSlots,
            )
          ) {
            AppModal.error({
              title: 'Invalid slot',
              content:
                'This time overlaps another schedule slot on the same day.',
            });
            return;
          }

          upsertSlotMutation.mutate(
            {
              slotId,
              body: {
                daysOfWeek: payload.daysOfWeek,
                startTime: payload.startTime,
                endTime: payload.endTime,
                playlistId: payload.playlistId,
              },
            },
            {
              onSuccess: () => {
                setStage('editor');
                setSlotDrawerOpen(false);
                setEditingSlot(null);
              },
            },
          );
        }}
      />

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
