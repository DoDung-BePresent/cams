import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  Empty,
  Flex,
  Input,
  Pagination,
  Select,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { AppModal } from '@/shared/components';
import {
  AddTracksModal,
  getPlaylistColumns,
  PlaylistDetailsModal,
} from '@/shared/modules/playlists/components';
import {
  CreateSharedPlaylistDrawer,
  EditSharedPlaylistDrawer,
} from './components';
import {
  useDeletePlaylist,
  usePlaylists,
  useTogglePlaylistStatus,
} from '@/shared/modules/playlists/hooks';
import { useBrands } from '@/features/admin/hooks';
import { useMoods } from '@/shared/modules/moods/hooks';

import type {
  PlaylistFilter,
  PlaylistListItem,
} from '@/shared/modules/playlists/types';

const { Text, Title } = Typography;

const C = {
  surface: '#18181b',
  border: '#2d2528',
  red: '#ef4444',
  text: '#f8f7f7',
  muted: '#b7adb0',
  subtle: '#857b80',
};

export const PlaylistList = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [selectedMoodId, setSelectedMoodId] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const filter: PlaylistFilter = useMemo(
    () => ({
      page,
      pageSize,
      sortBy: 'createdAt',
      isAscending: false,
      search: search || undefined,
      brandId: selectedBrandId,
      moodId: selectedMoodId,
      status: selectedStatus,
      includeShared: true,
    }),
    [page, search, selectedBrandId, selectedMoodId, selectedStatus],
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addTracksOpen, setAddTracksOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>();

  const { data, isLoading, refetch } = usePlaylists(filter);
  const { data: brandsData } = useBrands({ page: 1, pageSize: 1000 });
  const { data: moodsData } = useMoods();
  const deletePlaylist = useDeletePlaylist();
  const toggleStatus = useTogglePlaylistStatus();

  const playlists = data?.items ?? [];
  const brandOptions = (brandsData?.items ?? []).map((brand) => ({
    label: brand.name || 'Unnamed brand',
    value: brand.id,
  }));
  const moodOptions = (moodsData ?? []).map((mood) => ({
    label: mood.name,
    value: mood.id,
  }));
  const brandMap = useMemo(
    () =>
      new Map(
        (brandsData?.items ?? []).map((brand) => [
          brand.id,
          brand.name || 'Unnamed brand',
        ]),
      ),
    [brandsData],
  );

  const handleView = (id: string) => {
    setSelectedPlaylistId(id);
    setDetailsOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedPlaylistId(id);
    setEditOpen(true);
  };

  const handleAddTracks = (id: string) => {
    setSelectedPlaylistId(id);
    setAddTracksOpen(true);
  };

  const handleDelete = (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    AppModal.confirm({
      title: 'Delete Playlist',
      content: (
        <div>
          <p>
            Delete <strong>"{playlist?.name}"</strong>?
          </p>
          <p style={{ color: '#e22134', marginTop: 8 }}>
            This action cannot be undone.
          </p>
        </div>
      ),
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: () => deletePlaylist.mutate(id, { onSuccess: () => refetch() }),
    });
  };

  const handleToggleStatus = (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    const action = playlist?.status === 1 ? 'deactivate' : 'activate';
    AppModal.warning({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Playlist`,
      content: `Are you sure you want to ${action} "${playlist?.name}"?`,
      okText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      okButtonProps: { danger: playlist?.status === 1 },
      onOk: () => toggleStatus.mutate(id, { onSuccess: () => refetch() }),
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBrandId(undefined);
    setSelectedMoodId(undefined);
    setSelectedStatus(undefined);
    setPage(1);
  };

  const basePlaylistColumns = getPlaylistColumns({
    onView: handleView,
    onEdit: handleEdit,
    onAddTracks: handleAddTracks,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDelete,
  });

  const playlistColumns = [
    ...basePlaylistColumns.slice(0, 2),
    {
      title: 'Owner',
      key: 'owner',
      width: 180,
      render: (_: unknown, record: PlaylistListItem) =>
        record.brandId ? (
          <Tag color='blue'>{brandMap.get(record.brandId) ?? 'Brand'}</Tag>
        ) : (
          <Tag color='purple'>System</Tag>
        ),
    },
    ...basePlaylistColumns.slice(2),
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'transparent',
        padding: '0 0 40px',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Flex
          align='center'
          justify='space-between'
          wrap='wrap'
          gap={12}
          style={{ marginBottom: 20 }}
        >
          <div>
            <nav style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <span
                onClick={() => navigate('/admin/dashboard')}
                style={{ color: C.muted, fontSize: 12, cursor: 'pointer' }}
              >
                Dashboard
              </span>
              <span style={{ color: C.subtle }}>/</span>
              <span style={{ color: C.text, fontSize: 12 }}>
                Playlist Library
              </span>
            </nav>
            <Title
              level={3}
              style={{ margin: 0, color: C.text, fontWeight: 800 }}
            >
              Playlist Library
            </Title>
          </div>
          <Button
            type='primary'
            size='large'
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            style={{
              background: C.red,
              border: 'none',
              color: '#fff',
              fontWeight: 800,
            }}
          >
            Create Shared Playlist
          </Button>
        </Flex>

        <Flex
          gap={10}
          wrap='wrap'
          align='center'
        >
          <Input
            placeholder='Search playlists...'
            prefix={<SearchOutlined style={{ color: C.subtle }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
            style={{
              flex: 1,
              minWidth: 220,
              maxWidth: 340,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              height: 40,
            }}
          />
          <Select
            placeholder='Brand'
            options={brandOptions}
            value={selectedBrandId}
            onChange={(value) => {
              setSelectedBrandId(value);
              setPage(1);
            }}
            allowClear
            showSearch
            optionFilterProp='label'
            style={{ width: 200 }}
          />
          <Select
            placeholder='Mood'
            options={moodOptions}
            value={selectedMoodId}
            onChange={(value) => {
              setSelectedMoodId(value);
              setPage(1);
            }}
            allowClear
            style={{ width: 160 }}
          />
          <Select
            placeholder='Status'
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            value={selectedStatus}
            onChange={(value) => {
              setSelectedStatus(value);
              setPage(1);
            }}
            allowClear
            style={{ width: 130 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.muted,
            }}
          />
          {(search ||
            selectedBrandId ||
            selectedMoodId ||
            selectedStatus !== undefined) && (
            <Button
              onClick={clearFilters}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                color: C.muted,
              }}
            >
              Clear
            </Button>
          )}
        </Flex>
      </div>

      <Flex
        justify='space-between'
        align='center'
        style={{ marginBottom: 16 }}
      >
        <Text style={{ color: C.subtle, fontSize: 13 }}>
          {isLoading ? '...' : `${data?.totalItems ?? 0} playlists`}
        </Text>
      </Flex>

      {isLoading ? (
        <Skeleton
          active
          paragraph={{ rows: 8 }}
        />
      ) : playlists.length === 0 ? (
        <Flex
          justify='center'
          style={{ padding: 80 }}
        >
          <Empty
            description={
              <Text style={{ color: C.subtle }}>No playlists found</Text>
            }
          />
        </Flex>
      ) : (
        <Table
          rowKey='id'
          columns={playlistColumns}
          dataSource={playlists}
          pagination={false}
          scroll={{ x: 860 }}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        />
      )}

      {(data?.totalItems ?? 0) > pageSize && (
        <Flex
          justify='center'
          style={{ marginTop: 28 }}
        >
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.totalItems ?? 0}
            onChange={(nextPage) => setPage(nextPage)}
            showSizeChanger={false}
          />
        </Flex>
      )}

      <CreateSharedPlaylistDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />
      <EditSharedPlaylistDrawer
        open={editOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setEditOpen(false);
          setSelectedPlaylistId(undefined);
        }}
        onSuccess={() => refetch()}
      />
      <PlaylistDetailsModal
        open={detailsOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedPlaylistId(undefined);
        }}
      />
      <AddTracksModal
        open={addTracksOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setAddTracksOpen(false);
          setSelectedPlaylistId(undefined);
        }}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
