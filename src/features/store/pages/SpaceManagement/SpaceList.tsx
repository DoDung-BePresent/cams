import { useState, useMemo } from 'react';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Tag,
  Input,
  Spin,
  Empty,
  Typography,
  Dropdown,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  SoundOutlined,
  UnorderedListOutlined,
  QrcodeOutlined,
  ExperimentOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
  ShopOutlined,
  MoreOutlined,
} from '@ant-design/icons';

/**
 * Types
 */
import type { SpaceFilter } from '@/shared/modules/spaces/types';
import { EntityStatusEnum } from '@/shared/types';

/**
 * Hooks
 */
import {
  useSpaces,
  useDeleteSpace,
  useToggleSpaceStatus,
} from '@/shared/modules/spaces/hooks';
import { useAuth } from '@/providers';

/**
 * Components
 */
import { PageHeader, AppModal } from '@/shared/components';
import {
  CreateSpaceModal,
  EditSpaceModal,
  SpaceDetailModal,
  SpaceMusicModal,
} from './components';
import {
  PairDeviceModal,
  QueueManagementModal,
} from '@/shared/modules/cams/components';
import { useTriggerAnalysis } from '@/shared/modules/cams/hooks';

/**
 * Constants
 */
import {
  SPACE_TYPE_LABELS,
  SPACE_TYPE_COLORS,
} from '@/features/store/constants';
import type { ContextAnalysisResponse } from '@/shared/modules/cams/types';

const { Text, Title } = Typography;

const moodLabelMap: Record<number, string> = {
  0: 'Chill',
  1: 'Focus',
  2: 'Energetic',
};

const toMoodLabel = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return moodLabelMap[value] ?? String(value);
  return value;
};

// ─── Constants ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0f0f11',
  surface: '#18181b',
  surfaceHover: '#242126',
  border: '#2d2528',
  green: '#ef4444',
  text: '#f8f7f7',
  textMuted: '#b7adb0',
  textSubtle: '#857b80',
};

export const SpaceList = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user } = useAuth();
  const [filter] = useState<SpaceFilter>({
    page: 1,
    pageSize: 200,
    sortBy: 'createdAt',
    isAscending: false,
  });

  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [pairDeviceModalOpen, setPairDeviceModalOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<
    (ContextAnalysisResponse & { spaceName?: string }) | null
  >(null);

  const { data, isLoading, refetch } = useSpaces(filter);

  const deleteSpace = useDeleteSpace();
  const toggleStatus = useToggleSpaceStatus();
  const triggerAnalysis = useTriggerAnalysis();

  const handleView = (id: string) => {
    setSelectedSpaceId(id);
    setDetailsModalOpen(true);
  };

  const handleManageMusic = (id: string) => {
    navigate(`/store/spaces/${id}/music`);
  };

  const handleManageSchedule = (id: string) => {
    navigate(`/store/spaces/${id}/schedule`);
  };

  const handleManageQueue = (id: string) => {
    setSelectedSpaceId(id);
    setQueueModalOpen(true);
  };

  const handlePairDevice = (id: string) => {
    setSelectedSpaceId(id);
    setPairDeviceModalOpen(true);
  };

  const handleTriggerAnalysis = (spaceId: string) => {
    if (!user?.storeId || !user?.brandId) {
      message.warning(
        'Missing store or brand scope. Please re-login and try again.',
      );
      return;
    }

    triggerAnalysis.mutate(
      {
        spaceId,
        body: {
          storeId: user.storeId,
          brandId: user.brandId,
        },
      },
      {
        onSuccess: (response) => {
          const analysis = response.data.data;
          if (!analysis) return;
          const spaceName = data?.items.find((s) => s.id === spaceId)?.name;
          setLastAnalysis({
            ...analysis,
            spaceName,
          });
          setSelectedSpaceId(spaceId);
          setDetailsModalOpen(true);
        },
      },
    );
  };

  const handleEdit = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setEditModalOpen(true);
  };

  const handleDelete = (spaceId: string) => {
    const space = data?.items.find((s) => s.id === spaceId);

    AppModal.confirm({
      title: 'Delete Space',
      content: `Are you sure you want to delete "${space?.name}"? This action cannot be undone.`,
      okText: 'Yes, Delete',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        deleteSpace.mutate(spaceId);
      },
    });
  };

  const handleToggleStatus = (spaceId: string) => {
    const space = data?.items.find((s) => s.id === spaceId);
    const action = space?.status === 1 ? 'deactivate' : 'activate';

    AppModal.warning({
      title: 'Toggle Space Status',
      content: `Are you sure you want to ${action} "${space?.name}"?`,
      okText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      okButtonProps: {
        danger: space?.status === 1,
      },
      onOk: () => {
        toggleStatus.mutate(spaceId);
      },
    });
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/store/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Space Management',
    },
  ];

  // Filter spaces by search
  const filteredSpaces = useMemo(() => {
    if (!search) return data?.items || [];
    const q = search.toLowerCase();
    return (data?.items || []).filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }, [data?.items, search]);

  const activeCount = filteredSpaces.filter(
    (s) => s.status === EntityStatusEnum.Active,
  ).length;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'transparent',
        padding: '0 0 40px',
      }}
    >
      <PageHeader
        title='Space Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Manage all spaces in your store',
          keywords: 'space, management, store, locations',
        }}
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.textMuted,
              }}
            />
            <Button
              size='large'
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: C.green,
                border: 'none',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              Create Space
            </Button>
          </div>
        }
      />

      {lastAnalysis && (
        <Alert
          showIcon
          type='info'
          style={{
            marginBottom: 24,
            background: '#182b3a',
            border: '1px solid #164c7e',
            color: '#fff',
          }}
          message={
            <span style={{ color: '#fff', fontWeight: 600 }}>
              Last AI analysis: {lastAnalysis.spaceName ?? lastAnalysis.spaceId}
            </span>
          }
          action={
            <Button
              size='large'
              onClick={() => setLastAnalysis(null)}
              style={{
                background: 'transparent',
                color: '#fff',
                borderColor: '#164c7e',
              }}
            >
              Clear
            </Button>
          }
          description={
            <Descriptions
              size='small'
              column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
              style={{ marginTop: 8 }}
            >
              <Descriptions.Item
                label={<span style={{ color: '#5f5f67' }}>Mood</span>}
              >
                <Tag color='purple'>{toMoodLabel(lastAnalysis.targetMood)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#5f5f67' }}>Rule</span>}
              >
                <Tag color='blue'>
                  {lastAnalysis.triggeredRule || 'DEFAULT'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#5f5f67' }}>BPM Range</span>}
              >
                <span style={{ color: '#fff' }}>
                  {lastAnalysis.recommendedBpmMin} -{' '}
                  {lastAnalysis.recommendedBpmMax}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#5f5f67' }}>Target BPM</span>}
              >
                <span style={{ color: '#fff' }}>
                  {lastAnalysis.recommendedBpmTarget}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#5f5f67' }}>Mood Changed</span>}
              >
                <Tag color={lastAnalysis.moodChanged ? 'success' : 'default'}>
                  {lastAnalysis.moodChanged ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span style={{ color: '#5f5f67' }}>Analyzed At (UTC)</span>
                }
              >
                <span style={{ color: '#fff' }}>
                  {lastAnalysis.analyzedAtUtc
                    ? dayjs(lastAnalysis.analyzedAtUtc)
                        .utc()
                        .format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span style={{ color: '#5f5f67' }}>Reason</span>}
              >
                <span style={{ color: '#fff' }}>
                  {lastAnalysis.reason || '-'}
                </span>
              </Descriptions.Item>
            </Descriptions>
          }
        />
      )}

      {/* Search bar & Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        <Input
          placeholder='Search spaces by name, description...'
          prefix={<SearchOutlined style={{ color: C.textSubtle }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 400,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: '#fff',
            height: 48,
          }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              color: C.textMuted,
              fontSize: 13,
              background: C.surface,
              padding: '10px 16px',
              borderRadius: 8,
            }}
          >
            Total:{' '}
            <strong style={{ color: C.text }}>{filteredSpaces.length}</strong>
          </div>
          <div
            style={{
              color: C.textMuted,
              fontSize: 13,
              background: C.surface,
              padding: '10px 16px',
              borderRadius: 8,
            }}
          >
            Active: <strong style={{ color: C.green }}>{activeCount}</strong>
          </div>
        </div>
      </div>

      {/* ─── Grid View (Space cards) ─────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        {filteredSpaces.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80 }}>
            <Empty
              description={
                <Text style={{ color: C.textSubtle }}>No spaces found</Text>
              }
            />
          </div>
        ) : (
          filteredSpaces.map((space) => {
            const isActive = space.status === EntityStatusEnum.Active;

            const moreMenu: MenuProps['items'] = [
              {
                key: 'pair-device',
                icon: <QrcodeOutlined />,
                label: 'Pair Device',
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  handlePairDevice(space.id);
                },
              },
              {
                key: 'trigger-analysis',
                icon: <ExperimentOutlined />,
                label: 'Trigger AI Analysis',
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  handleTriggerAnalysis(space.id);
                },
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Space',
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  handleEdit(space.id);
                },
              },
              { type: 'divider' },
              {
                key: 'toggle-status',
                icon: <PoweroffOutlined />,
                label: isActive ? 'Deactivate' : 'Activate',
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  handleToggleStatus(space.id);
                },
                danger: isActive,
              },
              { type: 'divider' },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete Space',
                onClick: (e) => {
                  e.domEvent.stopPropagation();
                  handleDelete(space.id);
                },
                danger: true,
              },
            ];

            return (
              <div
                key={space.id}
                onClick={() => handleView(space.id)}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    'rgba(248,113,113,0.34)';
                  (e.currentTarget as HTMLDivElement).style.background =
                    C.surfaceHover;
                  (e.currentTarget as HTMLDivElement).style.transform =
                    'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    C.border;
                  (e.currentTarget as HTMLDivElement).style.background =
                    C.surface;
                  (e.currentTarget as HTMLDivElement).style.transform =
                    'translateY(0)';
                }}
              >
                {/* Status bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: isActive ? C.green : C.textSubtle,
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: isActive
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(83,83,83,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ShopOutlined
                        style={{
                          color: isActive ? C.green : C.textSubtle,
                          fontSize: 24,
                        }}
                      />
                    </div>
                    <div>
                      <Title
                        level={5}
                        style={{
                          margin: '0 0 4px',
                          color: C.text,
                          fontSize: 16,
                        }}
                      >
                        {space.name}
                      </Title>
                      <Tag
                        color={SPACE_TYPE_COLORS[space.type] as string}
                        style={{ margin: 0 }}
                      >
                        {SPACE_TYPE_LABELS[space.type]}
                      </Tag>
                    </div>
                  </div>

                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Tag
                      color={isActive ? 'success' : 'default'}
                      style={{ margin: 0 }}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </Tag>
                    <Dropdown
                      menu={{ items: moreMenu }}
                      trigger={['click']}
                      placement='bottomRight'
                    >
                      <Button
                        type='text'
                        icon={
                          <MoreOutlined
                            style={{ fontSize: 18, color: C.textMuted }}
                          />
                        }
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: '4px 8px', height: 'auto' }}
                      />
                    </Dropdown>
                  </div>
                </div>

                <div style={{ flex: 1, marginBottom: 20 }}>
                  <Text
                    style={{
                      color: C.textSubtle,
                      fontSize: 13,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {space.description || 'No description provided.'}
                  </Text>
                </div>

                {/* Primary Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 16,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {[
                    {
                      icon: <EyeOutlined />,
                      title: 'View Details',
                      color: '#fff',
                      onClick: () => handleView(space.id),
                    },
                    {
                      icon: <CalendarOutlined />,
                      title: 'Schedule',
                      color: '#a855f7',
                      onClick: () => handleManageSchedule(space.id),
                    },
                    {
                      icon: <SoundOutlined />,
                      title: 'Music',
                      color: '#3b82f6',
                      onClick: () => handleManageMusic(space.id),
                    },
                    {
                      icon: <UnorderedListOutlined />,
                      title: 'Queue',
                      color: '#f59e0b',
                      onClick: () => handleManageQueue(space.id),
                    },
                  ].map((btn, idx) => (
                    <Tooltip
                      key={idx}
                      title={btn.title}
                    >
                      <button
                        onClick={btn.onClick}
                        style={{
                          flex: 1,
                          height: 36,
                          borderRadius: 8,
                          border: 'none',
                          background: '#202024',
                          color: C.textMuted,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 15,
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = '#2d2528';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            btn.color;
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = '#202024';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            C.textMuted;
                        }}
                      >
                        {btn.icon}
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateSpaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />

      <EditSpaceModal
        open={editModalOpen}
        spaceId={selectedSpaceId}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedSpaceId(null);
        }}
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedSpaceId(null);
          refetch();
        }}
      />

      <SpaceDetailModal
        open={detailsModalOpen}
        spaceId={selectedSpaceId ?? undefined}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedSpaceId(null);
        }}
      />

      <SpaceMusicModal
        open={musicModalOpen}
        spaceId={selectedSpaceId}
        storeId={user?.storeId || ''}
        onClose={() => {
          setMusicModalOpen(false);
          setSelectedSpaceId(null);
        }}
      />

      <QueueManagementModal
        open={queueModalOpen}
        spaceId={selectedSpaceId || ''}
        storeId={user?.storeId || ''}
        onClose={() => {
          setQueueModalOpen(false);
          setSelectedSpaceId(null);
        }}
      />

      <PairDeviceModal
        open={pairDeviceModalOpen}
        spaceId={selectedSpaceId}
        onClose={() => {
          setPairDeviceModalOpen(false);
          setSelectedSpaceId(null);
        }}
      />
    </div>
  );
};

export default SpaceList;
