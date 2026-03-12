import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Modal } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';
import { usePlaylists } from '@/shared/modules/playlists/hooks';
import { useDeletePlaylist } from '@/shared/modules/playlists/hooks';
import { useTogglePlaylistStatus } from '@/shared/modules/playlists/hooks';
import { useRetranscodePlaylist } from '@/shared/modules/playlists/hooks';
import { getPlaylistColumns } from '@/shared/modules/playlists/components/PlaylistTableColumns';
import { useStores } from '@/features/brand/hooks';
import { useMoods } from '@/shared/modules/moods/hooks';
import type {
  PlaylistFilter,
  PlaylistListItem,
} from '@/shared/modules/playlists/types';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import {
  PlaylistFilter as PlaylistFilterComponent,
  PlaylistDetailsDrawer,
  CreatePlaylistDrawer,
  EditPlaylistDrawer,
  AddTracksModal,
} from './components';

const { confirm } = Modal;

export const PlaylistList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PlaylistFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    isAscending: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [addTracksModalOpen, setAddTracksModalOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>();

  const { data, isLoading, refetch } = usePlaylists(filter);
  const { data: storesData } = useStores({
    page: 1,
    pageSize: 1000,
    status: 1,
  });
  const { data: moodsData } = useMoods();

  const deletePlaylist = useDeletePlaylist();
  const toggleStatus = useTogglePlaylistStatus();
  const retranscode = useRetranscodePlaylist();

  const handleSearch = (value: string) => {
    setFilter((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof PlaylistFilter, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<PlaylistListItem> | SorterResult<PlaylistListItem>[],
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
    setSelectedPlaylistId(id);
    setDetailsDrawerOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedPlaylistId(id);
    setEditDrawerOpen(true);
  };

  const handleAddTracks = (id: string) => {
    setSelectedPlaylistId(id);
    setAddTracksModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const playlist = data?.items.find((p) => p.id === id);

    confirm({
      title: 'Delete Playlist',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Are you sure you want to delete playlist{' '}
            <strong>"{playlist?.name}"</strong>?
          </p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            This action cannot be undone!
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deletePlaylist.mutate(id, {
          onSuccess: () => refetch(),
        });
      },
    });
  };

  const handleToggleStatus = (id: string) => {
    const playlist = data?.items.find((p) => p.id === id);
    const action = playlist?.status === 1 ? 'deactivate' : 'activate';

    confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Playlist`,
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to ${action} "${playlist?.name}"?`,
      okText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      onOk: () => {
        toggleStatus.mutate(id, {
          onSuccess: () => refetch(),
        });
      },
    });
  };

  const handleRetranscode = (id: string) => {
    const playlist = data?.items.find((p) => p.id === id);

    confirm({
      title: 'Re-transcode Playlist',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Re-transcode playlist <strong>"{playlist?.name}"</strong>?
          </p>
          <p style={{ color: '#1890ff', marginTop: 8 }}>
            This will regenerate the HLS stream. It may take several minutes.
          </p>
        </div>
      ),
      okText: 'Re-transcode',
      cancelText: 'Cancel',
      onOk: () => {
        retranscode.mutate(id, {
          onSuccess: () => refetch(),
        });
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
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Playlist Management',
    },
  ];

  const columns = getPlaylistColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onAddTracks: handleAddTracks,
    onRetranscode: handleRetranscode,
  });

  // Transform stores data to options
  const storeOptions = (storesData?.items || []).map((store) => ({
    label: store.name || 'Unnamed Store',
    value: store.id,
  }));

  // Transform moods data to options
  const moodOptions = (moodsData?.items || []).map((mood) => ({
    label: mood.name || 'Unnamed Mood',
    value: mood.id,
  }));

  // Get existing track IDs for AddTracksModal
  // const selectedPlaylist = data?.items.find((p) => p.id === selectedPlaylistId);
  const existingTrackIds: string[] = []; // Will be populated from playlist detail in modal

  return (
    <div>
      <PageHeader
        title='Playlist Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            type='primary'
            size='large'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            Create Playlist
          </Button>
        }
      />

      {/* Filter Component */}
      <DataTable<PlaylistListItem>
        filter={
          <PlaylistFilterComponent
            filter={filter}
            showAdvanced={showFilters}
            stores={storeOptions}
            moods={moodOptions}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            onRefresh={() => refetch()}
            onReset={handleReset}
          />
        }
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        rowKey='id'
        pagination={{
          current: filter.page,
          pageSize: filter.pageSize,
          total: data?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} playlists`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, size) => {
            setFilter((prev) => ({ ...prev, page, pageSize: size }));
          },
        }}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
      />

      {/* Create Playlist Drawer */}
      <CreatePlaylistDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Edit Playlist Drawer */}
      <EditPlaylistDrawer
        open={editDrawerOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedPlaylistId(undefined);
        }}
        onSuccess={() => refetch()}
      />

      {/* Details Drawer */}
      <PlaylistDetailsDrawer
        open={detailsDrawerOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedPlaylistId(undefined);
        }}
      />

      {/* Add Tracks Modal */}
      <AddTracksModal
        open={addTracksModalOpen}
        playlistId={selectedPlaylistId}
        existingTrackIds={existingTrackIds}
        onClose={() => {
          setAddTracksModalOpen(false);
          setSelectedPlaylistId(undefined);
        }}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
