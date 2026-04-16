import { useMemo, useState } from 'react';
import { Alert, Button, Empty, Segmented, Space, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { ColumnsType } from 'antd/es/table';

import {
  useBrandScheduleLibrary,
  useBrandScheduleTemplates,
  useCreateBrandScheduleSource,
  useDeleteBrandScheduleSlot,
  useDeleteBrandScheduleSource,
  useUpdateBrandScheduleSource,
  useUpsertBrandScheduleSlot,
} from '@/features/brand/hooks';
import { useAuth } from '@/providers';
import { usePlaylistOptions } from '@/shared/modules/playlists/hooks';
import type {
  ScheduleSlotItem,
  ScheduleSourceType,
} from '@/shared/modules/schedules/types';
import { AppModal, DataTable, PageHeader } from '@/shared/components';
import {
  CreateScheduleSourceDrawer,
  EditScheduleSourceDrawer,
  UpsertBrandScheduleSlotDrawer,
} from './components';
import { ScheduleSourcePickerModal } from './components/ScheduleSourcePickerModal';

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
  return Number(hourString) * 60 + Number(minuteString);
};

export const ScheduleList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const brandId = user?.brandId ?? undefined;

  const [stage, setStage] = useState<ScheduleStage>('welcome');
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [createType, setCreateType] = useState<ScheduleSourceType>('template');
  const [slotDrawerOpen, setSlotDrawerOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlotItem | null>(null);

  const {
    data: templateSources = [],
    isLoading: isLoadingTemplates,
    refetch: refetchTemplates,
  } = useBrandScheduleTemplates(brandId, !!brandId);
  const {
    data: librarySources = [],
    isLoading: isLoadingLibrary,
    refetch: refetchLibrary,
  } = useBrandScheduleLibrary(brandId, !!brandId);
  const { data: playlistOptions = [] } = usePlaylistOptions();

  const createSourceMutation = useCreateBrandScheduleSource();
  const deleteSourceMutation = useDeleteBrandScheduleSource();
  const updateSourceMutation = useUpdateBrandScheduleSource();
  const upsertSlotMutation = useUpsertBrandScheduleSlot();
  const deleteSlotMutation = useDeleteBrandScheduleSlot();

  const selectedSource = useMemo(
    () =>
      [...templateSources, ...librarySources].find(
        (source) => source.id === selectedSourceId,
      ),
    [librarySources, selectedSourceId, templateSources],
  );

  const slotsOfDay = useMemo(() => {
    const slots = selectedSource?.schedule?.slots || [];
    return slots
      .filter((slot) => slot.daysOfWeek.includes(selectedDay))
      .slice()
      .sort(
        (a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime),
      );
  }, [selectedDay, selectedSource?.schedule?.slots]);

  const playlistLabelMap = useMemo(
    () =>
      new Map(
        playlistOptions.map((option) => [
          String(option.value),
          option.label || '-',
        ]),
      ),
    [playlistOptions],
  );

  const isLoading =
    isLoadingTemplates ||
    isLoadingLibrary ||
    createSourceMutation.isPending ||
    updateSourceMutation.isPending ||
    upsertSlotMutation.isPending ||
    deleteSourceMutation.isPending ||
    deleteSlotMutation.isPending;

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
            {dayOptions.find((day) => day.value === selectedDay)?.label}
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
              if (!selectedSource) {
                return;
              }

              AppModal.confirm({
                title: 'Delete schedule slot',
                content: `Remove slot ${record.startTime} - ${record.endTime}?`,
                okText: 'Delete',
                okButtonProps: { danger: true },
                onOk: () =>
                  deleteSlotMutation.mutate({
                    sourceId: selectedSource.id,
                    slotId: record.id,
                  }),
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    { title: 'Schedule' },
  ];

  const openCreateDrawer = (type: ScheduleSourceType) => {
    setCreateType(type);
    setCreateDrawerOpen(true);
  };

  const onLoadSchedule = () => {
    setSourcePickerOpen(true);
  };

  const onCreateNew = (type: ScheduleSourceType) => {
    openCreateDrawer(type);
  };

  const handleRefresh = () => {
    refetchTemplates();
    refetchLibrary();
  };

  return (
    <div>
      <PageHeader
        title='Brand Schedule'
        breadcrumbs={breadcrumbs}
        seo={{
          description:
            'Create and manage reusable brand schedule templates and library entries.',
          keywords: 'brand, schedule, template, strict sync, playlists',
        }}
        extra={
          <Space wrap>
            <Button
              size='large'
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              size='large'
              onClick={onLoadSchedule}
            >
              Load Schedule
            </Button>
            <Button
              size='large'
              onClick={() => onCreateNew('library')}
            >
              Create Library Entry
            </Button>
            <Button
              icon={<PlusOutlined />}
              size='large'
              type='primary'
              onClick={() => onCreateNew('template')}
            >
              Create Template
            </Button>
          </Space>
        }
      />

      {!brandId ? (
        <Alert
          type='warning'
          showIcon
          message='Brand profile is missing. Schedule management requires a brand-scoped account.'
        />
      ) : (
        <Space
          direction='vertical'
          size='middle'
          style={{ width: '100%' }}
        >
          <Alert
            type='info'
            showIcon
            message='StrictSync stores read from brand schedule templates. Keep templates clean and versioned, and use library entries for manual variants.'
          />

          {stage === 'welcome' && !selectedSource && (
            <Space
              direction='vertical'
              size='middle'
              style={{ width: '100%' }}
            >
              <Typography.Title level={3}>
                First brand schedule, let&apos;s go.
              </Typography.Title>
              <Space wrap>
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
                  onClick={() => onCreateNew('template')}
                >
                  Create template
                </Button>
                <Button
                  size='large'
                  onClick={() => onCreateNew('library')}
                >
                  Create library entry
                </Button>
              </Space>
            </Space>
          )}

          {(stage === 'editor' || !!selectedSource) && (
            <Space
              direction='vertical'
              size='middle'
              style={{ width: '100%' }}
            >
              <Space
                style={{ justifyContent: 'space-between', width: '100%' }}
                wrap
              >
                <Segmented<number>
                  value={selectedDay}
                  onChange={(value) => setSelectedDay(value)}
                  options={dayOptions.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                />
                <Space wrap>
                  <Button
                    size='large'
                    onClick={onLoadSchedule}
                  >
                    Load Schedule
                  </Button>
                  <Button
                    size='large'
                    onClick={() => onCreateNew('library')}
                  >
                    Create Library Entry
                  </Button>
                  <Button
                    size='large'
                    type='primary'
                    icon={<PlusOutlined />}
                    disabled={!selectedSource}
                    onClick={() => {
                      setEditingSlot(null);
                      setSlotDrawerOpen(true);
                    }}
                  >
                    Add Slot
                  </Button>
                </Space>
              </Space>

              {selectedSource ? (
                <>
                  <Space wrap>
                    <Tag color='blue'>Brand-level scheduling</Tag>
                    <Tag
                      color={
                        selectedSource.type === 'template' ? 'cyan' : 'gold'
                      }
                    >
                      {selectedSource.type === 'template'
                        ? 'Template'
                        : 'Library'}
                    </Tag>
                    <Tag>
                      {selectedSource.schedule?.slots?.length || 0} slots
                    </Tag>
                    {selectedSource.isUserCreated && (
                      <Tag color='green'>Brand-owned</Tag>
                    )}
                  </Space>

                  <Space
                    direction='vertical'
                    size={2}
                  >
                    <Typography.Title
                      level={4}
                      style={{ margin: 0 }}
                    >
                      {selectedSource.title}
                    </Typography.Title>
                    <Typography.Text type='secondary'>
                      {selectedSource.subtitle || 'No subtitle'}
                    </Typography.Text>
                    {selectedSource.description && (
                      <Typography.Text type='secondary'>
                        {selectedSource.description}
                      </Typography.Text>
                    )}
                  </Space>

                  <Space wrap>
                    <Button
                      size='large'
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                    >
                      Refresh Sources
                    </Button>
                    <Button
                      size='large'
                      onClick={() => setEditDrawerOpen(true)}
                    >
                      Edit Details
                    </Button>
                    <Button
                      size='large'
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        AppModal.confirm({
                          title: 'Delete schedule source',
                          content: `Delete "${selectedSource.title}"? This also removes all nested slots.`,
                          okText: 'Delete',
                          okButtonProps: { danger: true },
                          onOk: () =>
                            deleteSourceMutation.mutate(selectedSource.id, {
                              onSuccess: () => {
                                setSelectedSourceId(undefined);
                                setStage('welcome');
                              },
                            }),
                        });
                      }}
                    >
                      Delete Source
                    </Button>
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
                      loading={isLoading}
                      pagination={false}
                    />
                  )}
                </>
              ) : (
                <Empty
                  description='Load a template or library entry to inspect and edit its slots.'
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Space>
          )}
        </Space>
      )}

      <ScheduleSourcePickerModal
        open={sourcePickerOpen}
        loading={isLoading}
        librarySources={librarySources}
        templateSources={templateSources}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={(sourceId) => {
          setSelectedSourceId(sourceId);
          setStage('editor');
          setSourcePickerOpen(false);
        }}
      />

      <CreateScheduleSourceDrawer
        open={createDrawerOpen}
        initialType={createType}
        loading={createSourceMutation.isPending}
        onClose={() => setCreateDrawerOpen(false)}
        onSubmit={(values) => {
          createSourceMutation.mutate(values, {
            onSuccess: (response) => {
              setSelectedSourceId(response.data.data || undefined);
              setStage('editor');
              setCreateDrawerOpen(false);
            },
          });
        }}
      />

      <EditScheduleSourceDrawer
        open={editDrawerOpen}
        source={selectedSource}
        loading={updateSourceMutation.isPending}
        onClose={() => setEditDrawerOpen(false)}
        onSubmit={(values) => {
          if (!selectedSource) {
            return;
          }

          updateSourceMutation.mutate(
            {
              sourceId: selectedSource.id,
              data: values,
            },
            {
              onSuccess: () => {
                setEditDrawerOpen(false);
              },
            },
          );
        }}
      />

      <UpsertBrandScheduleSlotDrawer
        open={slotDrawerOpen}
        slot={editingSlot}
        selectedDay={selectedDay}
        playlistOptions={playlistOptions.map((option) => ({
          label: option.label,
          value: String(option.value),
        }))}
        loading={upsertSlotMutation.isPending}
        onClose={() => {
          setSlotDrawerOpen(false);
          setEditingSlot(null);
        }}
        onSubmit={(payload) => {
          if (!selectedSource) {
            return;
          }

          const slotId = payload.id || makeClientGuid();
          const allSlots = selectedSource.schedule?.slots || [];
          const day = payload.daysOfWeek[0] ?? selectedDay;

          if (
            !ensureNoOverlap(
              {
                id: slotId,
                day,
                startTime: payload.startTime,
                endTime: payload.endTime,
              },
              allSlots,
            )
          ) {
            AppModal.error({
              title: 'Invalid slot',
              content: 'This time overlaps another slot on the same day.',
            });
            return;
          }

          upsertSlotMutation.mutate(
            {
              sourceId: selectedSource.id,
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
    </div>
  );
};
