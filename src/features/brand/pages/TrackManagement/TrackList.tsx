import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Card, Input, Space, Flex, Select, Tag, Row, Col } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';
import { AppModal } from '@/shared/components/ui/AppModal';
import {
  useTracks,
  useDeleteTrack,
  useToggleTrackStatus,
} from '@/shared/modules/tracks/hooks';
import { getTrackColumns } from '@/shared/modules/tracks/components';
import {
  GENRE_OPTIONS,
  MUSIC_PROVIDER_OPTIONS,
} from '@/shared/modules/tracks/constants';
import { ENTITY_STATUS_OPTIONS } from '@/shared/constants';
import type { TrackFilter, TrackListItem } from '@/shared/modules/tracks/types';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import {
  CreateTrackDrawer,
  EditTrackDrawer,
  TrackDetailsDrawer,
} from './components';

export const TrackList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TrackFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    isAscending: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>();

  const { data, isLoading, refetch } = useTracks(filter);
  const deleteTrack = useDeleteTrack();
  const toggleStatus = useToggleTrackStatus();

  const handleSearch = (value: string) => {
    setFilter((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof TrackFilter, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<TrackListItem> | SorterResult<TrackListItem>[],
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

  const handleView = (id: string) => {
    setSelectedTrackId(id);
    setDetailsDrawerOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedTrackId(id);
    setEditDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    AppModal.confirm({
      title: 'Delete Track',
      content:
        'Are you sure you want to delete this track? This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        deleteTrack.mutate(id, {
          onSuccess: () => refetch(),
        });
      },
    });
  };

  const handleToggleStatus = (id: string) => {
    AppModal.confirm({
      title: 'Toggle Track Status',
      content: 'Are you sure you want to change this track status?',
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: () => {
        toggleStatus.mutate(id, {
          onSuccess: () => refetch(),
        });
      },
    });
  };

  const handlePreview = (id: string) => {
    setSelectedTrackId(id);
    setDetailsDrawerOpen(true);
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
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Track Management',
    },
  ];

  const columns = getTrackColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onPreview: handlePreview,
  });

  return (
    <div>
      <PageHeader
        title='Track Library'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            Upload Track
          </Button>
        }
      />

      {/* Search & Filters Card */}
      <Card className='rounded-b-none!'>
        <Space
          direction='vertical'
          size='middle'
          style={{ width: '100%' }}
        >
          <Flex
            justify='space-between'
            wrap='wrap'
          >
            <Input
              size='large'
              placeholder='Search by title or artist...'
              prefix={<SearchOutlined />}
              value={filter.search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />

            <Space>
              <Button
                size='large'
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>

              <Button
                size='large'
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
              {(filter.search ||
                filter.genre ||
                filter.moodId ||
                filter.provider !== undefined ||
                filter.status !== undefined) && (
                <Button onClick={handleReset}>Reset Filters</Button>
              )}
            </Space>
          </Flex>

          {/* Advanced Filters */}
          {showFilters && (
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Select
                  size='large'
                  placeholder='Filter by Genre'
                  options={GENRE_OPTIONS}
                  value={filter.genre}
                  onChange={(value) => handleFilterChange('genre', value)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  size='large'
                  placeholder='Filter by Provider'
                  options={MUSIC_PROVIDER_OPTIONS}
                  value={filter.provider}
                  onChange={(value) => handleFilterChange('provider', value)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  size='large'
                  placeholder='Filter by Status'
                  options={ENTITY_STATUS_OPTIONS}
                  value={filter.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  size='large'
                  placeholder='AI Generated'
                  options={[
                    { label: 'All', value: undefined },
                    { label: 'AI Generated', value: true },
                    { label: 'Custom Upload', value: false },
                  ]}
                  value={filter.isAiGenerated}
                  onChange={(value) =>
                    handleFilterChange('isAiGenerated', value)
                  }
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
            </Row>
          )}

          {/* Active Filters Display */}
          {(filter.genre ||
            filter.provider !== undefined ||
            filter.status !== undefined) && (
            <Space wrap>
              {filter.genre && (
                <Tag
                  closable
                  onClose={() => handleFilterChange('genre', undefined)}
                >
                  Genre: {filter.genre}
                </Tag>
              )}
              {filter.provider !== undefined && (
                <Tag
                  closable
                  onClose={() => handleFilterChange('provider', undefined)}
                >
                  Provider:{' '}
                  {
                    MUSIC_PROVIDER_OPTIONS.find(
                      (o) => o.value === filter.provider,
                    )?.label
                  }
                </Tag>
              )}
              {filter.status !== undefined && (
                <Tag
                  closable
                  onClose={() => handleFilterChange('status', undefined)}
                >
                  Status:{' '}
                  {
                    ENTITY_STATUS_OPTIONS.find((o) => o.value === filter.status)
                      ?.label
                  }
                </Tag>
              )}
            </Space>
          )}
        </Space>
      </Card>

      {/* Data Table */}
      <DataTable<TrackListItem>
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        rowKey='id'
        pagination={{
          current: filter.page,
          pageSize: filter.pageSize,
          total: data?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tracks`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, size) => {
            setFilter((prev) => ({ ...prev, page, pageSize: size }));
          },
        }}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
        className='rounded-t-none! border-t-0!'
      />

      {/* Drawers */}
      <CreateTrackDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditTrackDrawer
        open={editDrawerOpen}
        trackId={selectedTrackId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedTrackId(undefined);
        }}
        onSuccess={() => refetch()}
      />

      <TrackDetailsDrawer
        open={detailsDrawerOpen}
        trackId={selectedTrackId}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedTrackId(undefined);
        }}
      />
    </div>
  );
};
