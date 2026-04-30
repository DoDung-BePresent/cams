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
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SoundOutlined,
  StopOutlined,
} from '@ant-design/icons';

import { AppModal } from '@/shared/components';
import {
  TrackDetailsDrawer,
  CreateSharedTrackDrawer,
  EditSharedTrackDrawer,
} from './components';
import { TrackCoverWithPlay } from '@/shared/modules/tracks/components/TrackCoverWithPlay';

import {
  useTracks,
  useDeleteTrack,
  useToggleTrackStatus,
  useBlockedTracksForAdmin,
} from '@/shared/modules/tracks/hooks';
import { useBrands } from '@/features/admin/hooks';
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

type TabKey = 'all' | 'blocked';

export const TrackList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const [allSearch, setAllSearch] = useState('');
  const [allMoodId, setAllMoodId] = useState<string | undefined>();
  const [allStatus, setAllStatus] = useState<number | undefined>();
  const [allPage, setAllPage] = useState(1);

  const [blockedSearch, setBlockedSearch] = useState('');
  const [blockedBrandId, setBlockedBrandId] = useState<string | undefined>();
  const [blockedPage, setBlockedPage] = useState(1);

  const PAGE_SIZE = 30;

  const allFilter: TrackFilter = useMemo(
    () => ({
      page: allPage,
      pageSize: PAGE_SIZE,
      sortBy: 'createdAt',
      isAscending: false,
      search: allSearch || undefined,
      moodId: allMoodId,
      status: allStatus,
    }),
    [allPage, allSearch, allMoodId, allStatus],
  );

  const blockedFilter: TrackFilter = useMemo(
    () => ({
      page: blockedPage,
      pageSize: PAGE_SIZE,
      sortBy: 'brandId',
      isAscending: true,
      search: blockedSearch || undefined,
      brandId: blockedBrandId,
    }),
    [blockedPage, blockedSearch, blockedBrandId],
  );

  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [editTrackId, setEditTrackId] = useState<string>();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const {
    data: allData,
    isLoading: allLoading,
    refetch: refetchAll,
  } = useTracks(allFilter);
  const {
    data: blockedData,
    isLoading: blockedLoading,
    refetch: refetchBlocked,
  } = useBlockedTracksForAdmin(blockedFilter);
  const { data: moodsData } = useMoods();
  const { data: brandsData } = useBrands({
    page: 1,
    pageSize: 500,
    sortBy: 'name',
    isAscending: true,
  });
  const deleteTrack = useDeleteTrack();
  const toggleStatus = useToggleTrackStatus();

  const handleView = (id: string) => {
    setSelectedTrackId(id);
    setDetailsDrawerOpen(true);
  };
  const handleEdit = (id: string) => {
    setEditTrackId(id);
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
      onOk: () => deleteTrack.mutate(id, { onSuccess: () => refetchAll() }),
    });
  };

  const handleToggleStatus = (id: string) => {
    AppModal.warning({
      title: 'Toggle Track Status',
      content: 'Are you sure you want to change the status of this track?',
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: () => toggleStatus.mutate(id, { onSuccess: () => refetchAll() }),
    });
  };

  const moodOptions = (moodsData || []).map((m) => ({
    label: m.name,
    value: m.id,
  }));
  const brandOptions = useMemo(
    () =>
      (brandsData?.items || []).map((b) => ({ label: b.name, value: b.id })),
    [brandsData],
  );
  const brandMap = useMemo(
    () =>
      new Map(
        (brandsData?.items || []).map((b) => [b.id, b.name || 'Unknown']),
      ),
    [brandsData],
  );

  const isAll = activeTab === 'all';
  const tracks = (isAll ? allData?.items : blockedData?.items) || [];
  const isLoading = isAll ? allLoading : blockedLoading;
  const totalItems = isAll
    ? (allData?.totalItems ?? 0)
    : (blockedData?.totalItems ?? 0);
  const page = isAll ? allPage : blockedPage;

  const gridCols = isAll
    ? '32px 40px 1fr 120px 80px 80px 100px'
    : '32px 40px 1fr 160px 120px 80px 100px';
  const headers = isAll
    ? ['#', '', 'TITLE', 'MOOD', 'BPM', 'DURATION', 'STATUS']
    : ['#', '', 'TITLE', 'BRAND', 'MOOD', 'DURATION', 'STATUS'];

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
              {[
                {
                  title: 'Dashboard',
                  onClick: () => navigate('/admin/dashboard'),
                },
                { title: 'Track Library' },
              ].map((b, i) => (
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
          {isAll && (
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
              Create Shared Track
            </Button>
          )}
        </div>

        {/* ── Tab switcher ─────────────────────────────────── */}
        <Flex
          gap={0}
          style={{ marginBottom: 20 }}
        >
          {(['all', 'blocked'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                background: activeTab === tab ? C.surface : 'transparent',
                border: `1px solid ${activeTab === tab ? C.border : 'transparent'}`,
                borderRadius: tab === 'all' ? '8px 0 0 8px' : '0 8px 8px 0',
                color: activeTab === tab ? C.text : C.textSubtle,
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {tab === 'blocked' && (
                <StopOutlined
                  style={{
                    fontSize: 12,
                    color: activeTab === 'blocked' ? '#ef4444' : C.textSubtle,
                  }}
                />
              )}
              {tab === 'all' ? 'All Tracks' : 'Blocked Tracks'}
              {tab === 'blocked' && (blockedData?.totalItems ?? 0) > 0 && (
                <span
                  style={{
                    background: '#ef444420',
                    color: '#ef4444',
                    border: '1px solid #ef444440',
                    borderRadius: 10,
                    padding: '0 6px',
                    fontSize: 11,
                  }}
                >
                  {blockedData?.totalItems}
                </span>
              )}
            </button>
          ))}
        </Flex>

        {/* ── Filter bar ───────────────────────────────────── */}
        <Flex
          gap={10}
          wrap='wrap'
          align='center'
        >
          <Input
            placeholder='Search tracks...'
            prefix={<SearchOutlined style={{ color: C.textSubtle }} />}
            value={isAll ? allSearch : blockedSearch}
            onChange={(e) => {
              if (isAll) {
                setAllSearch(e.target.value);
                setAllPage(1);
              } else {
                setBlockedSearch(e.target.value);
                setBlockedPage(1);
              }
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
          {isAll ? (
            <>
              <Select
                placeholder='Mood'
                options={moodOptions}
                value={allMoodId}
                onChange={(v) => {
                  setAllMoodId(v);
                  setAllPage(1);
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
                value={allStatus}
                onChange={(v) => {
                  setAllStatus(v);
                  setAllPage(1);
                }}
                allowClear
                style={{ width: 120 }}
              />
            </>
          ) : (
            <Select
              placeholder='Brand'
              options={brandOptions}
              value={blockedBrandId}
              onChange={(v) => {
                setBlockedBrandId(v);
                setBlockedPage(1);
              }}
              allowClear
              showSearch
              optionFilterProp='label'
              style={{ width: 200 }}
            />
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => (isAll ? refetchAll() : refetchBlocked())}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.textMuted,
            }}
          />
          {isAll && (allSearch || allMoodId || allStatus !== undefined) && (
            <Button
              onClick={() => {
                setAllSearch('');
                setAllMoodId(undefined);
                setAllStatus(undefined);
                setAllPage(1);
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
          {!isAll && (blockedSearch || blockedBrandId) && (
            <Button
              onClick={() => {
                setBlockedSearch('');
                setBlockedBrandId(undefined);
                setBlockedPage(1);
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

      {/* ── Column headers ──────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 12,
          padding: '0 12px 10px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 4,
        }}
      >
        {headers.map((h, i) => (
          <Text
            key={i}
            style={{
              color: C.textSubtle,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {h}
          </Text>
        ))}
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
              <Text style={{ color: C.textSubtle }}>
                {isAll ? 'No tracks found' : 'No blocked tracks'}
              </Text>
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
            const isSystemTrack = !track.brandId;

            return (
              <div
                key={track.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
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
                    {isSystemTrack && (
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

                {/* Brand (blocked tab) or Mood (all tab) */}
                {!isAll ? (
                  <Text
                    style={{
                      color: C.textMuted,
                      fontSize: 12,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.brandId ? (brandMap.get(track.brandId) ?? '—') : '—'}
                  </Text>
                ) : null}

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

                {/* BPM (all tab only) */}
                {isAll && (
                  <Text style={{ color: C.textMuted, fontSize: 13 }}>—</Text>
                )}

                {/* Duration */}
                <Text style={{ color: C.textMuted, fontSize: 13 }}>
                  {formatDuration(duration)}
                </Text>

                {/* Status + actions on hover */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title={`Transcode: ${transcodeLabel}`}>
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: transcodeColor,
                        flexShrink: 0,
                      }}
                    />
                  </Tooltip>
                  {isHovered && (
                    <Flex gap={4}>
                      <Tooltip title='View Details'>
                        <button
                          onClick={() => handleView(track.id)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 4,
                            border: 'none',
                            background: '#2d2528',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                          }}
                        >
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      {isSystemTrack && isAll && (
                        <>
                          <Tooltip title='Edit'>
                            <button
                              onClick={() => handleEdit(track.id)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 4,
                                border: 'none',
                                background: '#2d2528',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                              }}
                            >
                              <EditOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title='Delete'>
                            <button
                              onClick={() => handleDelete(track.id)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 4,
                                border: 'none',
                                background: '#2d2528',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                              }}
                            >
                              <DeleteOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title={isActive ? 'Deactivate' : 'Activate'}>
                            <button
                              onClick={() => handleToggleStatus(track.id)}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 4,
                                border: 'none',
                                background: '#2d2528',
                                color: isActive ? '#f59e0b' : C.green,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                              }}
                            >
                              <StopOutlined />
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </Flex>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalItems > PAGE_SIZE && (
        <Flex
          justify='center'
          style={{ marginTop: 36 }}
        >
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={totalItems}
            onChange={(p) => (isAll ? setAllPage(p) : setBlockedPage(p))}
            showSizeChanger={false}
          />
        </Flex>
      )}

      <Flex
        justify='flex-end'
        style={{ marginTop: 12 }}
      >
        <Text style={{ color: C.textSubtle, fontSize: 12 }}>
          {totalItems} {isAll ? 'tracks' : 'blocked tracks'} total
        </Text>
      </Flex>

      {/* ── Drawers ─────────────────────────────────────────── */}
      <TrackDetailsDrawer
        open={detailsDrawerOpen}
        trackId={selectedTrackId}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedTrackId(undefined);
        }}
      />
      <CreateSharedTrackDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          setCreateDrawerOpen(false);
          refetchAll();
        }}
      />
      <EditSharedTrackDrawer
        open={editDrawerOpen}
        trackId={editTrackId}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditTrackId(undefined);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setEditTrackId(undefined);
          refetchAll();
        }}
      />
    </div>
  );
};
