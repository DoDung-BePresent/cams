import { useState } from 'react';
import { Button, Tabs, Space, Typography, Row, Col } from 'antd';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import {
  PlusOutlined,
  TableOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

/**
 * Types
 */
import type { SpaceListItem, SpaceFilter } from '@/features/store/types';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

/**
 * Hooks
 */
import {
  useSpaces,
  useDeleteSpace,
  useToggleSpaceStatus,
} from '@/features/store/hooks';
import { useStoreHub } from '@/shared/modules/cams/hooks';
import { useAuth } from '@/providers';

/**
 * Components
 */
import { DataTable, PageHeader, AppModal } from '@/shared/components';
import {
  getSpaceColumns,
  CreateSpaceDrawer,
  EditSpaceDrawer,
  SpaceFilter as SpaceFilterComponent,
  SpacePlayerCard,
} from './components';

/**
 * Constants
 */
import { PAGINATION_SIZES } from '@/shared/constants';

const { Title, Text } = Typography;

type ViewMode = 'table' | 'player';

export const SpaceList = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filter, setFilter] = useState<SpaceFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    isAscending: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  const [playStreamTrigger, setPlayStreamTrigger] = useState(0);
  const [playbackCommandTrigger, setPlaybackCommandTrigger] = useState(0);

  const { data, isLoading, refetch } = useSpaces(filter);

  const deleteSpace = useDeleteSpace();
  const toggleStatus = useToggleSpaceStatus();

  // Connect to SignalR StoreHub for real-time updates
  const { isConnected, isConnecting } = useStoreHub(
    '482f64a2-6b0a-43b8-a150-87f68bd7838c',
    accessToken,
    {
      onPlayStream: (payload) => {
        console.log('🎵 PlayStream event received:', payload);
        setPlayStreamTrigger((prev) => prev + 1);
        refetch();
      },
      onPlaybackStateChanged: (payload) => {
        console.log('⏯️ PlaybackStateChanged event received:', payload);
        setPlaybackCommandTrigger((prev) => prev + 1);
      },
      onSpaceStateSync: (spaceId, state) => {
        console.log('🔄 SpaceStateSync event received:', spaceId, state);
        refetch();
      },
    },
  );

  const handleSearch = (value: string) => {
    setFilter((prev) => ({ ...prev, search: value, page: 1 }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFilterChange = (key: keyof SpaceFilter, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<SpaceListItem> | SorterResult<SpaceListItem>[],
  ) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    setFilter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sortBy: currentSorter.field ? String(currentSorter.field) : 'createdAt',
      isAscending: currentSorter.order === 'ascend',
    }));
  };

  const handleView = (spaceId: string) => {
    console.log('View space:', spaceId);
  };

  const handleEdit = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setEditDrawerOpen(true);
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

    AppModal.confirm({
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

  const handleReset = () => {
    setFilter({
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      isAscending: false,
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

  const columns = getSpaceColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <div>
      <PageHeader
        title='Space Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Manage all spaces in your store',
          keywords: 'space, management, store, locations',
        }}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            Create Space
          </Button>
        }
      />

      {/* View Mode Tabs */}
      <Tabs
        activeKey={viewMode}
        onChange={(key) => setViewMode(key as ViewMode)}
        items={[
          {
            key: 'table',
            label: (
              <span>
                <TableOutlined /> Table View
              </span>
            ),
          },
          {
            key: 'player',
            label: (
              <span>
                <PlayCircleOutlined /> Player View
              </span>
            ),
          },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* Table View */}
      {viewMode === 'table' && (
        <DataTable<SpaceListItem>
          filter={
            <SpaceFilterComponent
              filter={filter}
              showAdvanced={showFilters}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              onToggleAdvanced={() => setShowFilters(!showFilters)}
              onRefresh={() => refetch()}
              onReset={handleReset}
            />
          }
          columns={columns}
          dataSource={data?.items || []}
          rowKey='id'
          loading={isLoading}
          pagination={{
            current: filter.page,
            pageSize: filter.pageSize,
            total: data?.totalItems || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} spaces`,
            pageSizeOptions: PAGINATION_SIZES,
            onChange: (page, size) => {
              setFilter((prev) => ({ ...prev, page, pageSize: size }));
            },
          }}
          onChange={handleTableChange}
        />
      )}

      {/* Player View */}
      {viewMode === 'player' && (
        <Space
          direction='vertical'
          size='large'
          style={{ width: '100%' }}
        >
          {/* Connection Status */}
          {isConnecting && (
            <div
              style={{ padding: 16, background: '#e6f7ff', borderRadius: 8 }}
            >
              <Text>Connecting to music system...</Text>
            </div>
          )}
          {!isConnected && !isConnecting && (
            <div
              style={{ padding: 16, background: '#fff7e6', borderRadius: 8 }}
            >
              <Text type='warning'>
                Not connected to music system. Real-time updates disabled.
              </Text>
            </div>
          )}
          {isConnected && (
            <div
              style={{ padding: 16, background: '#f6ffed', borderRadius: 8 }}
            >
              <Text type='success'>
                ✅ Connected to music system. Real-time sync active.
              </Text>
            </div>
          )}

          {/* Space Players */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Title level={4}>Loading spaces...</Title>
            </div>
          ) : data?.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Title level={4}>No spaces found</Title>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setCreateDrawerOpen(true)}
              >
                Create Your First Space
              </Button>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {(data?.items || []).map((space) => (
                <Col span={12}>
                  <SpacePlayerCard
                    key={space.id}
                    space={space}
                    storeId={'482f64a2-6b0a-43b8-a150-87f68bd7838c'}
                    // ✅ Pass SignalR event triggers
                    onPlayStreamReceived={
                      playStreamTrigger > 0 ? () => {} : undefined
                    }
                    onPlaybackCommandReceived={
                      playbackCommandTrigger > 0 ? () => {} : undefined
                    }
                  />
                </Col>
              ))}
            </Row>
          )}
        </Space>
      )}

      <CreateSpaceDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          setCreateDrawerOpen(false);
          refetch();
        }}
      />

      <EditSpaceDrawer
        open={editDrawerOpen}
        spaceId={selectedSpaceId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedSpaceId(null);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setSelectedSpaceId(null);
          refetch();
        }}
      />
    </div>
  );
};

export default SpaceList;
