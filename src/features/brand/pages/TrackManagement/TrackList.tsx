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
  Tag,
  Tooltip,
  Typography,
} from 'antd';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  SearchOutlined,
  SoundOutlined,
} from '@ant-design/icons';

import { AppModal } from '@/shared/components';
import {
  CreateTrackDrawer,
  EditTrackDrawer,
  TrackDetailsDrawer,
} from './components';
import { TrackCoverWithPlay } from '@/shared/modules/tracks/components/TrackCoverWithPlay';

import {
  useDeleteTrack,
  useTracks,
  useToggleTrackStatus,
} from '@/shared/modules/tracks/hooks';
import { useMoods } from '@/shared/modules/moods/hooks';

import type { TrackFilter } from '@/shared/modules/tracks/types';
import { TranscodeStatusEnum } from '@/shared/modules/tracks/types';

const { Text, Title } = Typography;

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

const formatDuration = (sec?: number | null) => {
  if (!sec) return '--';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getTranscodeColor = (status?: TranscodeStatusEnum) => {
  switch (status) {
    case TranscodeStatusEnum.Ready:
      return C.green;
    case TranscodeStatusEnum.Processing:
      return '#f59e0b';
    case TranscodeStatusEnum.Pending:
      return '#3b82f6';
    case TranscodeStatusEnum.Failed:
      return '#ef4444';
    default:
      return C.textSubtle;
  }
};

const getTranscodeLabel = (status?: TranscodeStatusEnum) => {
  switch (status) {
    case TranscodeStatusEnum.Ready:
      return 'Ready';
    case TranscodeStatusEnum.Processing:
      return 'Processing';
    case TranscodeStatusEnum.Pending:
      return 'Pending';
    case TranscodeStatusEnum.Failed:
      return 'Failed';
    default:
      return 'None';
  }
};

const statusPillStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 72,
  height: 24,
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 700,
  background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.12)',
  border: isActive
    ? '1px solid rgba(134,239,172,0.24)'
    : '1px solid rgba(203,213,225,0.18)',
  color: isActive ? '#86efac' : '#cbd5e1',
});

const headerCellStyle = (
  align: 'left' | 'center' = 'left',
): React.CSSProperties => ({
  color: C.textSubtle,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1,
  textAlign: align,
});

const SkeletonRow = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 12px',
    }}
  >
    <div style={{ width: 24, textAlign: 'center' }}>
      <Skeleton.Button
        active
        size='small'
        style={{ width: 16 }}
      />
    </div>
    <Skeleton.Avatar
      active
      shape='square'
      size={40}
      style={{ borderRadius: 4 }}
    />
    <div style={{ flex: 1 }}>
      <Skeleton
        active
        paragraph={{ rows: 1 }}
        title={{ width: '40%' }}
      />
    </div>
    <Skeleton.Button
      active
      size='small'
      style={{ width: 60 }}
    />
  </div>
);

export const TrackList = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedMoodId, setSelectedMoodId] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  const filter: TrackFilter = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'createdAt',
      isAscending: false,
      search: search || undefined,
      moodId: selectedMoodId,
      status: selectedStatus,
    }),
    [page, search, selectedMoodId, selectedStatus],
  );

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useTracks(filter);
  const { data: moodsData } = useMoods();
  const deleteTrack = useDeleteTrack();
  const toggleStatus = useToggleTrackStatus();

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
      okButtonProps: { danger: true },
      onOk: () => deleteTrack.mutate(id, { onSuccess: () => refetch() }),
    });
  };

  const handleToggleStatus = (id: string) => {
    const track = data?.items.find((t) => t.id === id);
    const action = track?.status === 1 ? 'deactivate' : 'activate';
    AppModal.warning({
      title: 'Toggle Track Status',
      content: `${action.charAt(0).toUpperCase() + action.slice(1)} this track?`,
      okText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      okButtonProps: { danger: track?.status === 1 },
      onOk: () => toggleStatus.mutate(id, { onSuccess: () => refetch() }),
    });
  };

  const moodOptions = (moodsData || []).map((m) => ({
    label: m.name,
    value: m.id,
  }));
  const tracks = data?.items || [];

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    { title: 'Track Library' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'transparent',
        padding: '0 0 40px',
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <nav style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {breadcrumbs.map((b, i) => (
                <span
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {i > 0 && <span style={{ color: C.textSubtle }}>/</span>}
                  <span
                    onClick={b.onClick}
                    style={{
                      color: b.onClick ? C.textMuted : C.text,
                      fontSize: 12,
                      cursor: b.onClick ? 'pointer' : 'default',
                    }}
                  >
                    {b.title}
                  </span>
                </span>
              ))}
            </nav>
            <Title
              level={3}
              style={{ margin: 0, color: C.text, fontWeight: 700 }}
            >
              Track Library
            </Title>
          </div>
          <Button
            type='primary'
            size='large'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
            style={{
              background: C.green,
              border: 'none',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Upload Track
          </Button>
        </div>

        {/* Filter bar */}
        <Flex
          gap={10}
          wrap='wrap'
          align='center'
        >
          <Input
            placeholder='Search tracks...'
            prefix={<SearchOutlined style={{ color: C.textSubtle }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
            style={{
              flex: 1,
              minWidth: 200,
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
            onChange={(v) => {
              setSelectedMoodId(v);
              setPage(1);
            }}
            allowClear
            style={{ width: 150 }}
          />
          <Select
            placeholder='Status'
            options={[
              { label: 'Active', value: 1 },
              { label: 'Inactive', value: 0 },
            ]}
            value={selectedStatus}
            onChange={(v) => {
              setSelectedStatus(v);
              setPage(1);
            }}
            allowClear
            style={{ width: 120 }}
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
          {(search || selectedMoodId || selectedStatus !== undefined) && (
            <Button
              onClick={() => {
                setSearch('');
                setSelectedMoodId(undefined);
                setSelectedStatus(undefined);
                setPage(1);
              }}
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
      </div>

      {/* ── Column headers (Soundtrack-style) ──────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '32px 40px minmax(180px, 1fr) 110px 64px 72px 96px 96px 104px',
          gap: 12,
          padding: '0 12px 10px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 4,
        }}
      >
        <Text style={headerCellStyle('center')}>#</Text>
        <span />
        <Text style={headerCellStyle()}>TITLE</Text>
        <Text style={headerCellStyle()}>MOOD</Text>
        <Text style={headerCellStyle('center')}>BPM</Text>
        <Text style={headerCellStyle('center')}>DURATION</Text>
        <Text style={headerCellStyle('center')}>STATUS</Text>
        <Text style={headerCellStyle('center')}>TRANSCODE</Text>
        <Text style={headerCellStyle('center')}>ACTIONS</Text>
      </div>

      {/* ── Track Rows ────────────────────────────────────────── */}
      {isLoading ? (
        <div>
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <Flex
          justify='center'
          style={{ padding: 80 }}
        >
          <Empty
            description={
              <Text style={{ color: C.textSubtle }}>No tracks found</Text>
            }
          />
        </Flex>
      ) : (
        <div>
          {tracks.map((track, index) => {
            const isActive = track.status === 1;
            const isHovered = hoveredId === track.id;
            const duration = track.actualDurationSec ?? track.durationSec;
            const transcodeColor = getTranscodeColor(track.transcodeStatus);
            const transcodeLabel = getTranscodeLabel(track.transcodeStatus);
            const globalIndex = (page - 1) * PAGE_SIZE + index + 1;

            return (
              <div
                key={track.id}
                className='soundtrack-track-row'
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '32px 40px minmax(180px, 1fr) 110px 64px 72px 96px 96px 104px',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  alignItems: 'center',
                  background: isHovered ? C.surfaceHover : 'transparent',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredId(track.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleView(track.id)}
              >
                {/* Index */}
                <div style={{ textAlign: 'center' }}>
                  {isHovered ? (
                    <SoundOutlined style={{ color: C.green, fontSize: 14 }} />
                  ) : (
                    <Text style={{ color: C.textSubtle, fontSize: 13 }}>
                      {globalIndex}
                    </Text>
                  )}
                </div>

                {/* Cover */}
                <TrackCoverWithPlay
                  track={track}
                  queue={tracks}
                  size={40}
                />

                {/* Title + Artist */}
                <div style={{ overflow: 'hidden' }}>
                  <Text
                    strong
                    style={{
                      color: isActive ? C.text : C.textSubtle,
                      fontSize: 14,
                      display: 'block',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.title}
                  </Text>
                  <Text style={{ color: C.textSubtle, fontSize: 12 }}>
                    {track.artist || 'Unknown Artist'}
                    {track.isAiGenerated && (
                      <Tag
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          padding: '0 4px',
                          background: 'rgba(239,68,68,0.15)',
                          color: C.green,
                          border: `1px solid ${C.green}40`,
                        }}
                      >
                        AI
                      </Tag>
                    )}
                    {!track.brandId && (
                      <Tag
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          padding: '0 4px',
                          background: 'rgba(160,174,192,0.15)',
                          color: '#a0aec0',
                          border: '1px solid #a0aec030',
                        }}
                      >
                        SYSTEM
                      </Tag>
                    )}
                  </Text>
                </div>

                {/* Mood */}
                <div>
                  {track.moodName ? (
                    <Tag style={{ fontSize: 11, margin: 0 }}>
                      {track.moodName}
                    </Tag>
                  ) : (
                    <Text style={{ color: C.textSubtle, fontSize: 12 }}>—</Text>
                  )}
                </div>

                {/* BPM */}
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {/* BPM shown in detail */}—
                </Text>

                {/* Duration */}
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {formatDuration(duration)}
                </Text>

                {/* Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={statusPillStyle(isActive)}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Transcode */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Tooltip title={`Transcode: ${transcodeLabel}`}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        height: 24,
                        padding: '0 9px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: C.textMuted,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: transcodeColor,
                          flexShrink: 0,
                        }}
                      />
                      {transcodeLabel}
                    </span>
                  </Tooltip>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: isHovered ? 1 : 0,
                    pointerEvents: isHovered ? 'auto' : 'none',
                    transition: 'opacity 0.15s ease',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Flex gap={4}>
                    <Tooltip title='Edit'>
                      <button
                        onClick={() => handleEdit(track.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: 'none',
                          background: '#202024',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                        }}
                      >
                        <EditOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title={isActive ? 'Deactivate' : 'Activate'}>
                      <button
                        onClick={() => handleToggleStatus(track.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: 'none',
                          background: '#202024',
                          color: isActive ? '#fbbf24' : '#86efac',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                        }}
                      >
                        <PoweroffOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title='Delete'>
                      <button
                        onClick={() => handleDelete(track.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: 'none',
                          background: '#202024',
                          color: '#fca5a5',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </Tooltip>
                  </Flex>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {(data?.totalItems ?? 0) > PAGE_SIZE && (
        <Flex
          justify='center'
          style={{ marginTop: 36 }}
        >
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={data?.totalItems ?? 0}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </Flex>
      )}

      <Flex
        justify='flex-end'
        style={{ marginTop: 12 }}
      >
        <Text style={{ color: C.textSubtle, fontSize: 12 }}>
          {data?.totalItems ?? 0} tracks total
        </Text>
      </Flex>

      {/* ── Drawers ─────────────────────────────────────────── */}
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
