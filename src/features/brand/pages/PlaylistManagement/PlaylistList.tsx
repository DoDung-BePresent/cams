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
  useDeletePlaylist,
  usePlaylists,
  useTogglePlaylistStatus,
} from '@/shared/modules/playlists/hooks';
import { useStores } from '@/features/brand/hooks';
import { useMoods } from '@/shared/modules/moods/hooks';
import { CreatePlaylistDrawer, EditPlaylistDrawer } from './components';

import type { PlaylistFilter } from '@/shared/modules/playlists/types';

const { Text, Title } = Typography;

const C = {
  surface: '#18181b',
  border: '#2d2528',
  red: '#ef4444',
  text: '#f8f7f7',
  textMuted: '#b7adb0',
  textSubtle: '#857b80',
};

export const PlaylistList = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedMoodId, setSelectedMoodId] = useState<string | undefined>();
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>();
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
      moodId: selectedMoodId,
      storeId: selectedStoreId,
      status: selectedStatus,
      includeShared: true,
    }),
    [page, search, selectedMoodId, selectedStoreId, selectedStatus],
  );

  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [addTracksDrawerOpen, setAddTracksDrawerOpen] = useState(false);
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

  const playlists = data?.items || [];
  const storeOptions = (storesData?.items || []).map((store) => ({
    label: store.name,
    value: store.id,
  }));
  const moodOptions = (moodsData || []).map((mood) => ({
    label: mood.name,
    value: mood.id,
  }));

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
    setAddTracksDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    AppModal.confirm({
      title: 'Delete Playlist',
      content: (
        <div>
          <p>
            Are you sure you want to delete <strong>"{playlist?.name}"</strong>?
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

  const playlistColumns = getPlaylistColumns({
    onView: handleView,
    onEdit: handleEdit,
    onAddTracks: handleAddTracks,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDelete,
    isActionAllowed: (record) => Boolean(record.brandId),
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedMoodId(undefined);
    setSelectedStoreId(undefined);
    setSelectedStatus(undefined);
    setPage(1);
  };

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
                onClick={() => navigate('/brand/dashboard')}
                style={{ color: C.textMuted, fontSize: 12, cursor: 'pointer' }}
              >
                Dashboard
              </span>
              <span style={{ color: C.textSubtle }}>/</span>
              <span style={{ color: C.text, fontSize: 12 }}>
                Playlist Management
              </span>
            </nav>
            <Title
              level={3}
              style={{ margin: 0, color: C.text, fontWeight: 700 }}
            >
              Playlist Management
            </Title>
          </div>
          <Button
            type='primary'
            size='large'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
            style={{
              background: C.red,
              border: 'none',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            New Playlist
          </Button>
        </Flex>

        <Flex
          gap={10}
          wrap='wrap'
          align='center'
        >
          <Input
            placeholder='Search playlists...'
            prefix={<SearchOutlined style={{ color: C.textSubtle }} />}
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
            placeholder='Store'
            options={storeOptions}
            value={selectedStoreId}
            onChange={(value) => {
              setSelectedStoreId(value);
              setPage(1);
            }}
            allowClear
            showSearch
            optionFilterProp='label'
            style={{ width: 180 }}
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
              color: C.textMuted,
            }}
          />
          {(search ||
            selectedMoodId ||
            selectedStoreId ||
            selectedStatus !== undefined) && (
            <Button
              onClick={clearFilters}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                color: C.textMuted,
              }}
            >
              Clear
            </Button>
          )}
        </Flex>

        <Flex
          gap={6}
          wrap='wrap'
          style={{ marginTop: 10 }}
        >
          {selectedMoodId && (
            <Tag
              closable
              onClose={() => setSelectedMoodId(undefined)}
              color='purple'
            >
              {moodOptions.find((m) => m.value === selectedMoodId)?.label}
            </Tag>
          )}
          {selectedStoreId && (
            <Tag
              closable
              onClose={() => setSelectedStoreId(undefined)}
            >
              {storeOptions.find((s) => s.value === selectedStoreId)?.label}
            </Tag>
          )}
          {selectedStatus !== undefined && (
            <Tag
              closable
              onClose={() => setSelectedStatus(undefined)}
              color={selectedStatus === 1 ? 'success' : 'default'}
            >
              {selectedStatus === 1 ? 'Active' : 'Inactive'}
            </Tag>
          )}
        </Flex>
      </div>

      <Flex
        justify='space-between'
        align='center'
        style={{ marginBottom: 16 }}
      >
        <Text style={{ color: C.textSubtle, fontSize: 13 }}>
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
              <Text style={{ color: C.textSubtle }}>No playlists found</Text>
            }
          />
        </Flex>
      ) : (
        <Table
          rowKey='id'
          columns={playlistColumns}
          dataSource={playlists}
          pagination={false}
          scroll={{ x: 760 }}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
          onRow={(record) => ({
            onDoubleClick: () => handleView(record.id),
          })}
        />
      )}

      {(data?.totalItems ?? 0) > pageSize && (
        <Flex
          justify='center'
          style={{ marginTop: 36 }}
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

      <CreatePlaylistDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => refetch()}
      />
      <EditPlaylistDrawer
        open={editDrawerOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedPlaylistId(undefined);
        }}
        onSuccess={() => refetch()}
      />
      <PlaylistDetailsModal
        open={detailsDrawerOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedPlaylistId(undefined);
        }}
      />
      <AddTracksModal
        open={addTracksDrawerOpen}
        playlistId={selectedPlaylistId}
        onClose={() => {
          setAddTracksDrawerOpen(false);
          setSelectedPlaylistId(undefined);
        }}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
