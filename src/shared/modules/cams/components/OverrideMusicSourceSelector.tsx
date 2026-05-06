import { useState } from 'react';
import {
  Button,
  Descriptions,
  Flex,
  Input,
  Modal,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import {
  EyeOutlined,
  FireOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SoundOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { createStyles } from 'antd-style';

import { DataTable } from '@/shared/components';
import { PAGINATION_SIZES } from '@/shared/constants';
import { HLSAudioPlayer } from '@/shared/modules/tracks/components';
import { GENRE_OPTIONS } from '@/shared/modules/tracks/constants';
import {
  getTrackPlaybackBlockedMessage,
  isTrackPlaybackBlockedByCopyright,
} from '@/shared/modules/tracks/utils';
import type { MoodListItem } from '@/shared/modules/moods/types';
import { PlaylistDetailsModal } from '@/shared/modules/playlists/components';
import type {
  PlaylistFilter,
  PlaylistListItem,
} from '@/shared/modules/playlists/types';
import type { TrackFilter, TrackListItem } from '@/shared/modules/tracks/types';

export type OverrideSourceTab = 'tracks' | 'playlist' | 'mood';
const { Text } = Typography;

const useStyle = createStyles(({ css, prefixCls }) => {
  return {
    customTabs: css`
      .${prefixCls}-tabs-nav {
        margin-bottom: 0;
        .${prefixCls}-tabs-nav-wrap {
          .${prefixCls}-tabs-nav-list {
            width: 100%;
            gap: 8px;
            padding: 4px;
            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 14px;
            background: rgba(15, 15, 17, 0.7);
            .${prefixCls}-tabs-tab {
              min-height: 38px;
              border: 0;
              border-radius: 10px;
              justify-content: center;
              color: #a9a0a4;
              transition:
                background 160ms ease,
                color 160ms ease,
                box-shadow 160ms ease;
              &:hover {
                background: rgba(239, 68, 68, 0.1);
                color: #fff;
              }
            }
            .${prefixCls}-tabs-tab-active {
              background: linear-gradient(
                135deg,
                rgba(239, 68, 68, 0.22),
                rgba(59, 130, 246, 0.14)
              );
              box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.22);

              .${prefixCls}-tabs-tab-btn {
                color: #fff;
              }
            }
          }
        }
      }
    `,
    tabLabel: css`
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
    `,
    tabCount: css`
      min-width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      color: #f8f7f7;
      font-size: 11px;
    `,
    sourceFilterBar: css`
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      padding: 12px;
      border: 1px solid var(--ant-color-border-secondary);
      border-radius: 14px;
      background:
        radial-gradient(
          circle at top left,
          rgba(239, 68, 68, 0.1),
          transparent 34%
        ),
        color-mix(in srgb, var(--ant-color-bg-container), #000 12%);

      .${prefixCls}-input-affix-wrapper, .${prefixCls}-select-selector {
        background: rgba(23, 23, 26, 0.96) !important;
        border-color: rgba(148, 163, 184, 0.18) !important;
      }

      .${prefixCls}-input, .${prefixCls}-select-selection-item {
        color: #f3eeee !important;
        font-weight: 650;
      }

      .${prefixCls}-input::placeholder,
        .${prefixCls}-select-selection-placeholder {
        color: #b9aeb4 !important;
        font-weight: 600;
      }
    `,
    searchInput: css`
      flex: 1;
      min-width: 220px;
      max-width: 360px;
    `,
    filterSelect: css`
      width: 160px;
    `,
    pickerTable: css`
      .${prefixCls}-table {
        background: transparent;
      }

      .${prefixCls}-table-thead > tr > th {
        background: rgba(15, 15, 17, 0.96) !important;
        color: #aaa0a6 !important;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .${prefixCls}-table-tbody > tr {
        cursor: pointer;
      }

      .${prefixCls}-table-tbody > tr > td {
        color: #c8c0c5 !important;
        padding-top: 10px !important;
        padding-bottom: 10px !important;
        border-bottom-color: rgba(148, 163, 184, 0.1) !important;
      }

      .${prefixCls}-table-tbody > tr:hover > td {
        background: rgba(239, 68, 68, 0.1) !important;
      }

      .${prefixCls}-table-tbody > tr.${prefixCls}-table-row-selected > td {
        background: rgba(239, 68, 68, 0.18) !important;
      }
    `,
    mediaCell: css`
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    `,
    cover: css`
      width: 46px;
      height: 46px;
      flex: 0 0 46px;
      overflow: hidden;
      border-radius: 8px;
      background: linear-gradient(135deg, #311214, #10213f);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.28);
    `,
    coverImage: css`
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    `,
    iconCover: css`
      width: 46px;
      height: 46px;
      flex: 0 0 46px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.18),
        rgba(59, 130, 246, 0.16)
      );
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ff6b6b;
      font-size: 18px;
    `,
    metaStack: css`
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `,
    metaRow: css`
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    `,
    softTag: css`
      margin-inline-end: 0;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      line-height: 18px;
      padding: 0 7px;
    `,
    primaryText: css`
      color: #fffafa !important;
      font-size: 14px;
      font-weight: 850;
      line-height: 1.25;
      text-shadow: 0 1px 0 rgba(0, 0, 0, 0.28);
    `,
    secondaryText: css`
      color: #c9c0c6 !important;
      font-size: 13px;
      font-weight: 620;
      line-height: 1.3;
    `,
    valueText: css`
      color: #dcd5d9 !important;
      font-size: 13px;
      font-weight: 750;
    `,
    previewHeader: css`
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 14px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 16px;
      background:
        radial-gradient(
          circle at top left,
          rgba(239, 68, 68, 0.14),
          transparent 34%
        ),
        rgba(15, 15, 17, 0.72);
    `,
    previewCover: css`
      width: 84px;
      height: 84px;
      flex: 0 0 84px;
      overflow: hidden;
      border-radius: 14px;
      background: linear-gradient(135deg, #311214, #10213f);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 16px 34px rgba(0, 0, 0, 0.3);
    `,
    previewBody: css`
      .${prefixCls}-descriptions-view {
        border-color: rgba(148, 163, 184, 0.14);
      }

      .${prefixCls}-descriptions-item-label,
        .${prefixCls}-descriptions-item-content {
        background: rgba(15, 15, 17, 0.48) !important;
        border-color: rgba(148, 163, 184, 0.14) !important;
      }
    `,
  };
});

export type MoodSelectorFilter = {
  search?: string;
  page: number;
  pageSize: number;
};

type OverrideMusicSourceSelectorProps = {
  activeTab: OverrideSourceTab;
  onTabChange: (tab: OverrideSourceTab) => void;
  enabledTabs?: OverrideSourceTab[];
  track: {
    filter: TrackFilter;
    setFilter: React.Dispatch<React.SetStateAction<TrackFilter>>;
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    hasActiveFilters: boolean;
    data: TrackListItem[];
    total: number;
    isLoading: boolean;
    refetch: () => void;
    selectedTrackIds: string[];
    setSelectedTrackIds: React.Dispatch<React.SetStateAction<string[]>>;
    defaultFilter: TrackFilter;
    onTableChange: (
      pagination: TablePaginationConfig,
      filters: Record<string, unknown>,
      sorter: SorterResult<TrackListItem> | SorterResult<TrackListItem>[],
    ) => void;
  };
  playlist: {
    filter: PlaylistFilter;
    setFilter: React.Dispatch<React.SetStateAction<PlaylistFilter>>;
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    hasActiveFilters: boolean;
    data: PlaylistListItem[];
    total: number;
    isLoading: boolean;
    refetch: () => void;
    selectedPlaylistId?: string;
    setSelectedPlaylistId: React.Dispatch<
      React.SetStateAction<string | undefined>
    >;
    defaultFilter: PlaylistFilter;
    moodOptions: Array<{ label: string; value: string }>;
    onTableChange: (
      pagination: TablePaginationConfig,
      filters: Record<string, unknown>,
      sorter: SorterResult<PlaylistListItem> | SorterResult<PlaylistListItem>[],
    ) => void;
  };
  mood?: {
    filter: MoodSelectorFilter;
    setFilter: React.Dispatch<React.SetStateAction<MoodSelectorFilter>>;
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    hasActiveFilters: boolean;
    data: MoodListItem[];
    total: number;
    isLoading: boolean;
    refetch: () => void;
    selectedMoodId?: string;
    setSelectedMoodId: React.Dispatch<React.SetStateAction<string | undefined>>;
    defaultFilter: MoodSelectorFilter;
  };
};

const formatDuration = (sec?: number | null) => {
  if (!sec) return '--';

  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getPlaylistScopeLabel = (record: PlaylistListItem) => {
  if (record.storeId) return 'Store';
  if (record.brandId) return 'Brand';
  return 'Shared';
};

export const OverrideMusicSourceSelector = ({
  activeTab,
  onTabChange,
  enabledTabs,
  track,
  playlist,
  mood,
}: OverrideMusicSourceSelectorProps) => {
  const { styles } = useStyle();
  const [previewTrack, setPreviewTrack] = useState<TrackListItem>();
  const [previewPlaylistId, setPreviewPlaylistId] = useState<string>();
  const allowedTabs = enabledTabs ?? ['tracks', 'playlist', 'mood'];
  const isPreviewTrackSelected = previewTrack
    ? track.selectedTrackIds.includes(previewTrack.id)
    : false;
  const isPreviewTrackBlocked = isTrackPlaybackBlockedByCopyright(
    previewTrack?.copyrightClearanceStatus,
  );
  const previewBlockedMessage = getTrackPlaybackBlockedMessage(
    previewTrack?.copyrightClearanceStatus,
  );

  const toggleTrackSelection = (record: TrackListItem) => {
    track.setSelectedTrackIds((prev) =>
      prev.includes(record.id)
        ? prev.filter((id) => id !== record.id)
        : [...prev, record.id],
    );
  };

  const selectPreviewTrack = () => {
    if (!previewTrack) return;

    track.setSelectedTrackIds((prev) =>
      prev.includes(previewTrack.id) ? prev : [...prev, previewTrack.id],
    );
    setPreviewTrack(undefined);
  };

  const renderTabLabel = (
    icon: React.ReactNode,
    label: string,
    count?: number,
  ) => (
    <span className={styles.tabLabel}>
      {icon}
      <span>{label}</span>
      {!!count && <span className={styles.tabCount}>{count}</span>}
    </span>
  );

  const trackColumns: ColumnsType<TrackListItem> = [
    {
      title: 'Track',
      dataIndex: 'title',
      sorter: true,
      ellipsis: true,
      render: (_, record) => (
        <div className={styles.mediaCell}>
          <div className={styles.cover}>
            {record.coverImageUrl ? (
              <img
                className={styles.coverImage}
                src={record.coverImageUrl}
                alt={record.title}
                loading='lazy'
              />
            ) : (
              <div className={styles.iconCover}>
                <SoundOutlined />
              </div>
            )}
          </div>

          <div className={styles.metaStack}>
            <div className={styles.metaRow}>
              <Text
                strong
                ellipsis
                className={styles.primaryText}
                style={{ maxWidth: 260 }}
              >
                {record.title}
              </Text>
              {record.isAiGenerated && (
                <Tag
                  color='blue'
                  className={styles.softTag}
                >
                  AI
                </Tag>
              )}
              {!record.brandId && (
                <Tag
                  color='purple'
                  className={styles.softTag}
                >
                  Shared
                </Tag>
              )}
            </div>
            <Text
              type='secondary'
              ellipsis
              className={styles.secondaryText}
              style={{ maxWidth: 280 }}
            >
              {record.artist || 'Unknown artist'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '',
      width: 92,
      align: 'right',
      render: (_, record) => (
        <Button
          size='small'
          icon={<InfoCircleOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            setPreviewTrack(record);
          }}
        >
          Preview
        </Button>
      ),
    },
    {
      title: 'Mood',
      dataIndex: 'moodName',
      width: 150,
      render: (value) =>
        value ? (
          <Tag
            color='geekblue'
            className={styles.softTag}
          >
            {value}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Genre',
      dataIndex: 'genre',
      width: 130,
      render: (value) =>
        value ? <Text className={styles.valueText}>{value}</Text> : '-',
    },
    {
      title: 'Length',
      width: 96,
      align: 'right',
      render: (_, record) => (
        <Text className={styles.valueText}>
          {formatDuration(record.actualDurationSec ?? record.durationSec)}
        </Text>
      ),
    },
  ];

  const playlistColumns: ColumnsType<PlaylistListItem> = [
    {
      title: 'Playlist',
      dataIndex: 'name',
      sorter: true,
      ellipsis: true,
      render: (_, record) => (
        <div className={styles.mediaCell}>
          <div className={styles.iconCover}>
            <UnorderedListOutlined />
          </div>

          <div className={styles.metaStack}>
            <div className={styles.metaRow}>
              <Text
                strong
                ellipsis
                className={styles.primaryText}
                style={{ maxWidth: 280 }}
              >
                {record.name || 'Unnamed playlist'}
              </Text>
              <Tag
                color={
                  record.storeId ? 'cyan' : record.brandId ? 'red' : 'purple'
                }
                className={styles.softTag}
              >
                {getPlaylistScopeLabel(record)}
              </Tag>
              {record.isDefault && (
                <Tag
                  color='gold'
                  className={styles.softTag}
                >
                  Default
                </Tag>
              )}
            </div>
            <Text
              type='secondary'
              ellipsis
              className={styles.secondaryText}
              style={{ maxWidth: 320 }}
            >
              {record.description || record.moodName || 'No description'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Mood',
      dataIndex: 'moodName',
      width: 150,
      render: (value) =>
        value ? (
          <Tag
            color='geekblue'
            className={styles.softTag}
          >
            {value}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Tracks',
      dataIndex: 'trackCount',
      width: 110,
      sorter: true,
      render: (value: number) => (
        <Tag
          color='blue'
          className={styles.softTag}
        >
          {value} tracks
        </Tag>
      ),
    },
    {
      title: 'View',
      key: 'view',
      width: 84,
      align: 'center',
      render: (_, record) => (
        <Button
          type='text'
          icon={<EyeOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            setPreviewPlaylistId(record.id);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const moodColumns: ColumnsType<MoodListItem> = [
    {
      title: 'Mood',
      dataIndex: 'name',
      render: (_, record) => (
        <div className={styles.mediaCell}>
          <div className={styles.iconCover}>
            <FireOutlined />
          </div>

          <div className={styles.metaStack}>
            <div className={styles.metaRow}>
              <Text
                strong
                className={styles.primaryText}
              >
                {record.name}
              </Text>
              {record.genre && (
                <Tag
                  color='purple'
                  className={styles.softTag}
                >
                  {record.genre}
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'BPM',
      width: 140,
      render: (_, record) =>
        record.minBpm && record.maxBpm ? (
          <Tag
            color='orange'
            className={styles.softTag}
          >
            {record.minBpm} - {record.maxBpm}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Energy',
      dataIndex: 'energyLevel',
      width: 120,
      render: (value?: number) =>
        value !== undefined ? (
          <Text className={styles.valueText}>{Math.round(value * 100)}%</Text>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <>
      <Tabs
        className={styles.customTabs}
        styles={{
          item: {
            width: 'fit-content',
            paddingInline: 15,
          },
          content: {
            paddingTop: 20,
          },
        }}
        size='small'
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as OverrideSourceTab)}
        items={[
          ...(allowedTabs.includes('tracks')
            ? [
                {
                  key: 'tracks',
                  label: renderTabLabel(
                    <SoundOutlined />,
                    'Tracks',
                    track.selectedTrackIds.length,
                  ),
                  children: (
                    <DataTable<TrackListItem>
                      className={styles.pickerTable}
                      filter={
                        <Space
                          direction='vertical'
                          size='small'
                          style={{ width: '100%' }}
                        >
                          <Flex className={styles.sourceFilterBar}>
                            <Input
                              size='large'
                              placeholder='Search by title or artist...'
                              prefix={<SearchOutlined />}
                              value={track.filter.search}
                              onChange={(e) =>
                                track.setFilter((prev) => ({
                                  ...prev,
                                  search: e.target.value,
                                  page: 1,
                                }))
                              }
                              className={styles.searchInput}
                              allowClear
                            />
                            <Select
                              size='large'
                              placeholder='Mood'
                              options={playlist.moodOptions}
                              value={track.filter.moodId}
                              onChange={(value) =>
                                track.setFilter((prev) => ({
                                  ...prev,
                                  moodId: value,
                                  page: 1,
                                }))
                              }
                              className={styles.filterSelect}
                              allowClear
                              showSearch
                              optionFilterProp='label'
                            />
                            <Select
                              size='large'
                              placeholder='Genre'
                              options={GENRE_OPTIONS}
                              value={track.filter.genre}
                              onChange={(value) =>
                                track.setFilter((prev) => ({
                                  ...prev,
                                  genre: value,
                                  page: 1,
                                }))
                              }
                              className={styles.filterSelect}
                              allowClear
                            />
                            <Button
                              size='large'
                              icon={<ReloadOutlined />}
                              onClick={track.refetch}
                            />
                            {track.hasActiveFilters && (
                              <Button
                                size='large'
                                onClick={() =>
                                  track.setFilter(track.defaultFilter)
                                }
                              >
                                Clear
                              </Button>
                            )}
                          </Flex>

                          {track.hasActiveFilters && (
                            <Space wrap>
                              {track.filter.moodId && (
                                <Tag
                                  closable
                                  onClose={() =>
                                    track.setFilter((prev) => ({
                                      ...prev,
                                      moodId: undefined,
                                      page: 1,
                                    }))
                                  }
                                >
                                  Mood:{' '}
                                  {
                                    playlist.moodOptions.find(
                                      (x) => x.value === track.filter.moodId,
                                    )?.label
                                  }
                                </Tag>
                              )}
                              {track.filter.genre && (
                                <Tag
                                  closable
                                  onClose={() =>
                                    track.setFilter((prev) => ({
                                      ...prev,
                                      genre: undefined,
                                      page: 1,
                                    }))
                                  }
                                >
                                  Genre: {track.filter.genre}
                                </Tag>
                              )}
                            </Space>
                          )}
                        </Space>
                      }
                      rowKey='id'
                      columns={trackColumns}
                      dataSource={track.data}
                      loading={track.isLoading}
                      rowSelection={{
                        preserveSelectedRowKeys: true,
                        selectedRowKeys: track.selectedTrackIds,
                        onChange: (selectedRowKeys) =>
                          track.setSelectedTrackIds(
                            Array.from(new Set(selectedRowKeys as string[])),
                          ),
                      }}
                      onRow={(record) => ({
                        onClick: () => toggleTrackSelection(record),
                      })}
                      pagination={{
                        current: track.filter.page,
                        pageSize: track.filter.pageSize,
                        total: track.total,
                        showSizeChanger: true,
                        pageSizeOptions: PAGINATION_SIZES,
                        showTotal: (total) => `Total ${total} tracks`,
                        onChange: (page, pageSize) => {
                          track.setFilter((prev) => ({
                            ...prev,
                            page,
                            pageSize,
                          }));
                        },
                      }}
                      onChange={track.onTableChange}
                    />
                  ),
                },
              ]
            : []),
          ...(allowedTabs.includes('playlist')
            ? [
                {
                  key: 'playlist',
                  label: renderTabLabel(
                    <UnorderedListOutlined />,
                    'Playlists',
                    playlist.selectedPlaylistId ? 1 : undefined,
                  ),
                  children: (
                    <DataTable<PlaylistListItem>
                      className={styles.pickerTable}
                      filter={
                        <Space
                          direction='vertical'
                          size='small'
                          style={{ width: '100%' }}
                        >
                          <Flex className={styles.sourceFilterBar}>
                            <Input
                              size='large'
                              placeholder='Search by playlist name...'
                              prefix={<SearchOutlined />}
                              value={playlist.filter.search}
                              onChange={(e) =>
                                playlist.setFilter((prev) => ({
                                  ...prev,
                                  search: e.target.value,
                                  page: 1,
                                }))
                              }
                              className={styles.searchInput}
                              allowClear
                            />
                            <Select
                              size='large'
                              placeholder='Mood'
                              options={playlist.moodOptions}
                              value={playlist.filter.moodId}
                              onChange={(value) =>
                                playlist.setFilter((prev) => ({
                                  ...prev,
                                  moodId: value,
                                  page: 1,
                                }))
                              }
                              className={styles.filterSelect}
                              allowClear
                              showSearch
                              optionFilterProp='label'
                            />
                            <Select
                              size='large'
                              placeholder='Default'
                              options={[
                                { label: 'Default Only', value: true },
                                { label: 'Non-Default', value: false },
                              ]}
                              value={playlist.filter.isDefault}
                              onChange={(value) =>
                                playlist.setFilter((prev) => ({
                                  ...prev,
                                  isDefault: value,
                                  page: 1,
                                }))
                              }
                              className={styles.filterSelect}
                              allowClear
                            />
                            <Button
                              size='large'
                              icon={<ReloadOutlined />}
                              onClick={playlist.refetch}
                            />
                            {playlist.hasActiveFilters && (
                              <Button
                                size='large'
                                onClick={() =>
                                  playlist.setFilter(playlist.defaultFilter)
                                }
                              >
                                Clear
                              </Button>
                            )}
                          </Flex>

                          {playlist.hasActiveFilters && (
                            <Space wrap>
                              {playlist.filter.moodId && (
                                <Tag
                                  closable
                                  onClose={() =>
                                    playlist.setFilter((prev) => ({
                                      ...prev,
                                      moodId: undefined,
                                      page: 1,
                                    }))
                                  }
                                >
                                  Mood:{' '}
                                  {
                                    playlist.moodOptions.find(
                                      (x) => x.value === playlist.filter.moodId,
                                    )?.label
                                  }
                                </Tag>
                              )}
                              {playlist.filter.isDefault !== undefined && (
                                <Tag
                                  closable
                                  onClose={() =>
                                    playlist.setFilter((prev) => ({
                                      ...prev,
                                      isDefault: undefined,
                                      page: 1,
                                    }))
                                  }
                                >
                                  {playlist.filter.isDefault
                                    ? 'Default Only'
                                    : 'Non-Default'}
                                </Tag>
                              )}
                            </Space>
                          )}
                        </Space>
                      }
                      rowKey='id'
                      columns={playlistColumns}
                      dataSource={playlist.data}
                      loading={playlist.isLoading}
                      rowSelection={{
                        type: 'radio',
                        preserveSelectedRowKeys: true,
                        selectedRowKeys: playlist.selectedPlaylistId
                          ? [playlist.selectedPlaylistId]
                          : [],
                        onChange: (selectedRowKeys) =>
                          playlist.setSelectedPlaylistId(
                            selectedRowKeys[0] as string,
                          ),
                      }}
                      onRow={(record) => ({
                        onClick: () =>
                          playlist.setSelectedPlaylistId(record.id),
                      })}
                      pagination={{
                        current: playlist.filter.page,
                        pageSize: playlist.filter.pageSize,
                        total: playlist.total,
                        showSizeChanger: true,
                        pageSizeOptions: PAGINATION_SIZES,
                        showTotal: (total) => `Total ${total} playlists`,
                        onChange: (page, pageSize) => {
                          playlist.setFilter((prev) => ({
                            ...prev,
                            page,
                            pageSize,
                          }));
                        },
                      }}
                      onChange={playlist.onTableChange}
                    />
                  ),
                },
              ]
            : []),
          ...(allowedTabs.includes('mood') && mood
            ? [
                {
                  key: 'mood',
                  label: renderTabLabel(
                    <FireOutlined />,
                    'Moods',
                    mood.selectedMoodId ? 1 : undefined,
                  ),
                  children: (
                    <DataTable<MoodListItem>
                      className={styles.pickerTable}
                      filter={
                        <Space
                          direction='vertical'
                          size='small'
                          style={{ width: '100%' }}
                        >
                          <Flex className={styles.sourceFilterBar}>
                            <Input
                              size='large'
                              placeholder='Search by mood name or genre...'
                              prefix={<SearchOutlined />}
                              value={mood.filter.search}
                              onChange={(e) =>
                                mood.setFilter((prev) => ({
                                  ...prev,
                                  search: e.target.value,
                                  page: 1,
                                }))
                              }
                              className={styles.searchInput}
                              allowClear
                            />
                            <Button
                              size='large'
                              icon={<ReloadOutlined />}
                              onClick={mood.refetch}
                            />
                            {mood.hasActiveFilters && (
                              <Button
                                size='large'
                                onClick={() =>
                                  mood.setFilter(mood.defaultFilter)
                                }
                              >
                                Clear
                              </Button>
                            )}
                          </Flex>
                        </Space>
                      }
                      rowKey='id'
                      columns={moodColumns}
                      dataSource={mood.data}
                      loading={mood.isLoading}
                      rowSelection={{
                        type: 'radio',
                        preserveSelectedRowKeys: true,
                        selectedRowKeys: mood.selectedMoodId
                          ? [mood.selectedMoodId]
                          : [],
                        onChange: (selectedRowKeys) =>
                          mood.setSelectedMoodId(selectedRowKeys[0] as string),
                      }}
                      onRow={(record) => ({
                        onClick: () => mood.setSelectedMoodId(record.id),
                      })}
                      pagination={{
                        current: mood.filter.page,
                        pageSize: mood.filter.pageSize,
                        total: mood.total,
                        showSizeChanger: true,
                        pageSizeOptions: PAGINATION_SIZES,
                        showTotal: (total) => `Total ${total} moods`,
                        onChange: (page, pageSize) => {
                          mood.setFilter((prev) => ({
                            ...prev,
                            page,
                            pageSize,
                          }));
                        },
                      }}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />

      <PlaylistDetailsModal
        open={!!previewPlaylistId}
        playlistId={previewPlaylistId}
        onClose={() => setPreviewPlaylistId(undefined)}
        readOnly
      />

      <Modal
        open={!!previewTrack}
        title='Track Preview'
        width={680}
        onCancel={() => setPreviewTrack(undefined)}
        destroyOnClose
        footer={[
          <Button
            key='close'
            onClick={() => setPreviewTrack(undefined)}
          >
            Close
          </Button>,
          <Button
            key='select'
            type='primary'
            disabled={!previewTrack || isPreviewTrackSelected}
            onClick={selectPreviewTrack}
          >
            {isPreviewTrackSelected ? 'Selected' : 'Select track'}
          </Button>,
        ]}
      >
        {previewTrack && (
          <Space
            direction='vertical'
            size='middle'
            className={styles.previewBody}
            style={{ width: '100%' }}
          >
            <div className={styles.previewHeader}>
              <div className={styles.previewCover}>
                {previewTrack.coverImageUrl ? (
                  <img
                    className={styles.coverImage}
                    src={previewTrack.coverImageUrl}
                    alt={previewTrack.title}
                    loading='lazy'
                  />
                ) : (
                  <div className={styles.iconCover}>
                    <SoundOutlined />
                  </div>
                )}
              </div>

              <div className={styles.metaStack}>
                <div className={styles.metaRow}>
                  <Text
                    strong
                    style={{ fontSize: 20 }}
                  >
                    {previewTrack.title}
                  </Text>
                  {previewTrack.moodName && (
                    <Tag
                      color='geekblue'
                      className={styles.softTag}
                    >
                      {previewTrack.moodName}
                    </Tag>
                  )}
                  {previewTrack.isAiGenerated && (
                    <Tag
                      color='blue'
                      className={styles.softTag}
                    >
                      AI
                    </Tag>
                  )}
                </div>
                <Text type='secondary'>
                  {previewTrack.artist || 'Unknown artist'}
                </Text>
                <Text type='secondary'>
                  {previewTrack.genre || 'No genre'} ·{' '}
                  {formatDuration(
                    previewTrack.actualDurationSec ?? previewTrack.durationSec,
                  )}
                </Text>
              </div>
            </div>

            <HLSAudioPlayer
              hlsUrl={previewTrack.hlsUrl}
              title={previewTrack.title}
              artist={previewTrack.artist}
              coverImageUrl={previewTrack.coverImageUrl}
              disabled={isPreviewTrackBlocked}
              unavailableMessage={
                isPreviewTrackBlocked
                  ? previewBlockedMessage
                  : 'Audio stream is not ready yet.'
              }
            />

            <Descriptions
              size='small'
              bordered
              column={2}
            >
              <Descriptions.Item label='Mood'>
                {previewTrack.moodName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Genre'>
                {previewTrack.genre || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Duration'>
                {formatDuration(
                  previewTrack.actualDurationSec ?? previewTrack.durationSec,
                )}
              </Descriptions.Item>
              <Descriptions.Item label='Plays'>
                {previewTrack.playCount ?? 0}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </>
  );
};
