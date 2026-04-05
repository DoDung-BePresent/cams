import { useMemo, useState } from 'react';
import { Flex, Input, Space, Tag, Typography } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';

import { AppModal, SettingSwitch } from '@/shared/components';
import { MODAL_WIDTHS } from '@/config';
import { useMoods } from '@/shared/modules/moods/hooks';
import { usePlaylists } from '@/shared/modules/playlists/hooks';
import { useTracks } from '@/shared/modules/tracks/hooks';
import type { PlaylistFilter } from '@/shared/modules/playlists/types';
import type { TrackFilter } from '@/shared/modules/tracks/types';
import { isTrackPlaybackBlockedByCopyright } from '@/shared/modules/tracks/utils';
import { useOverridePlaylist } from '../hooks';
import {
  OverrideMusicSourceSelector,
  type MoodSelectorFilter,
  type OverrideSourceTab,
} from './OverrideMusicSourceSelector';

const { Text } = Typography;
const { TextArea } = Input;

const useStyle = createStyles(({ css }) => {
  return {
    selectorBlock: css`
      border: 1px solid var(--ant-color-border-secondary);
      border-radius: 12px;
      background: var(--ant-color-bg-container);
      padding: 10px;
    `,
    statusStrip: css`
      border: 1px solid var(--ant-color-border-secondary);
      border-radius: 12px;
      background: var(--ant-color-fill-tertiary);
      padding: 10px 12px;
    `,
    sectionCard: css`
      border: 1px solid var(--ant-color-border-secondary);
      border-radius: 12px;
      background: var(--ant-color-bg-container);
      padding: 12px;
    `,
  };
});

interface OverrideSpaceMusicModalProps {
  open: boolean;
  spaceId: string;
  storeId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const defaultTrackFilter: TrackFilter = {
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  isAscending: false,
  status: 1,
};

const defaultPlaylistFilter: PlaylistFilter = {
  page: 1,
  pageSize: 10,
  sortBy: 'createdAt',
  isAscending: false,
  status: 1,
};

const defaultMoodFilter: MoodSelectorFilter = {
  page: 1,
  pageSize: 10,
};

export const OverrideSpaceMusicModal = ({
  open,
  spaceId,
  storeId,
  onClose,
  onSuccess,
}: OverrideSpaceMusicModalProps) => {
  const { styles } = useStyle();
  const [activeTab, setActiveTab] = useState<OverrideSourceTab>('tracks');
  const [showTrackFilters, setShowTrackFilters] = useState(false);
  const [showPlaylistFilters, setShowPlaylistFilters] = useState(false);
  const [showMoodFilters, setShowMoodFilters] = useState(false);
  const [reason, setReason] = useState('');
  const [isClearManagerSelectedQueues, setIsClearManagerSelectedQueues] =
    useState(false);
  const [isCutOver, setIsCutOver] = useState(false);

  const [trackFilter, setTrackFilter] =
    useState<TrackFilter>(defaultTrackFilter);
  const [playlistFilter, setPlaylistFilter] = useState<PlaylistFilter>(
    defaultPlaylistFilter,
  );
  const [moodFilter, setMoodFilter] =
    useState<MoodSelectorFilter>(defaultMoodFilter);

  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>();
  const [selectedMoodId, setSelectedMoodId] = useState<string>();

  const overrideSpaceMusic = useOverridePlaylist();

  const {
    data: trackData,
    isLoading: isLoadingTracks,
    refetch: refetchTracks,
  } = useTracks(trackFilter);
  const {
    data: playlistData,
    isLoading: isLoadingPlaylists,
    refetch: refetchPlaylists,
  } = usePlaylists({
    ...playlistFilter,
    storeId,
  });
  const {
    data: moods = [],
    isLoading: isLoadingMoods,
    refetch: refetchMoods,
  } = useMoods();

  const moodOptions = useMemo(
    () =>
      moods.map((mood) => ({
        label: mood.name,
        value: mood.id,
      })),
    [moods],
  );

  const moodTypeOptions = useMemo(() => {
    const uniqueMoodTypes = [
      ...new Set(moods.map((m) => m.moodType).filter(Boolean)),
    ];
    return uniqueMoodTypes.map((moodType) => ({
      label: `Type ${moodType}`,
      value: moodType as number,
    }));
  }, [moods]);

  const filteredMoods = useMemo(() => {
    const keyword = moodFilter.search?.trim().toLowerCase();

    return moods.filter((mood) => {
      const matchActive = mood.status === 1;
      const matchSearch = !keyword
        ? true
        : mood.name.toLowerCase().includes(keyword) ||
          mood.genre?.toLowerCase().includes(keyword);

      const matchType = moodFilter.moodType
        ? mood.moodType === moodFilter.moodType
        : true;

      return matchActive && matchSearch && matchType;
    });
  }, [moodFilter.moodType, moodFilter.search, moods]);

  const selectableTracks = useMemo(
    () =>
      (trackData?.items || []).filter(
        (track) =>
          !isTrackPlaybackBlockedByCopyright(track.copyrightClearanceStatus),
      ),
    [trackData?.items],
  );

  const paginatedMoods = useMemo(() => {
    const start = (moodFilter.page - 1) * moodFilter.pageSize;
    const end = start + moodFilter.pageSize;
    return filteredMoods.slice(start, end);
  }, [filteredMoods, moodFilter.page, moodFilter.pageSize]);

  const hasActiveTrackFilters =
    trackFilter.search ||
    trackFilter.genre ||
    trackFilter.provider !== undefined ||
    trackFilter.isAiGenerated !== undefined;

  const hasActivePlaylistFilters =
    playlistFilter.search ||
    playlistFilter.moodId ||
    playlistFilter.isDefault !== undefined;

  const hasActiveMoodFilters = moodFilter.search || moodFilter.moodType;

  const resetModalState = () => {
    setActiveTab('tracks');
    setShowTrackFilters(false);
    setShowPlaylistFilters(false);
    setShowMoodFilters(false);
    setReason('');
    setIsClearManagerSelectedQueues(false);
    setIsCutOver(false);

    setTrackFilter(defaultTrackFilter);
    setPlaylistFilter(defaultPlaylistFilter);
    setMoodFilter(defaultMoodFilter);

    setSelectedTrackIds([]);
    setSelectedPlaylistId(undefined);
    setSelectedMoodId(undefined);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      await overrideSpaceMusic.mutateAsync({
        spaceId,
        trackIds:
          activeTab === 'tracks' && selectedTrackIds.length > 0
            ? selectedTrackIds
            : undefined,
        playlistId:
          activeTab === 'playlist' && selectedPlaylistId
            ? selectedPlaylistId
            : undefined,
        moodId:
          activeTab === 'mood' && selectedMoodId ? selectedMoodId : undefined,
        isClearManagerSelectedQueues,
        isCutOver,
        reason: reason.trim() || undefined,
      });

      onSuccess?.();
      handleClose();
    } catch {
      // Errors are handled in mutation hook.
    }
  };

  return (
    <AppModal
      open={open}
      title='Override Space Music'
      size='large'
      width={MODAL_WIDTHS.large}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={isCutOver ? 'Apply & Cut Over' : 'Apply Override'}
      confirmLoading={overrideSpaceMusic.isPending}
      destroyOnHidden
    >
      <Space
        direction='vertical'
        size='large'
        style={{ width: '100%' }}
      >
        <div className={styles.selectorBlock}>
          <OverrideMusicSourceSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            track={{
              filter: trackFilter,
              setFilter: setTrackFilter,
              showFilters: showTrackFilters,
              setShowFilters: setShowTrackFilters,
              hasActiveFilters: !!hasActiveTrackFilters,
              data: selectableTracks,
              total: trackData?.totalItems || 0,
              isLoading: isLoadingTracks,
              refetch: refetchTracks,
              selectedTrackIds,
              setSelectedTrackIds,
              defaultFilter: defaultTrackFilter,
              onTableChange: (pagination, _filters, sorter) => {
                const currentSorter = Array.isArray(sorter)
                  ? sorter[0]
                  : sorter;

                setTrackFilter((prev) => ({
                  ...prev,
                  page: pagination.current || 1,
                  pageSize: pagination.pageSize || 10,
                  sortBy: currentSorter.field
                    ? String(currentSorter.field)
                    : 'createdAt',
                  isAscending: currentSorter.order === 'ascend',
                }));
              },
            }}
            playlist={{
              filter: playlistFilter,
              setFilter: setPlaylistFilter,
              showFilters: showPlaylistFilters,
              setShowFilters: setShowPlaylistFilters,
              hasActiveFilters: !!hasActivePlaylistFilters,
              data: playlistData?.items || [],
              total: playlistData?.totalItems || 0,
              isLoading: isLoadingPlaylists,
              refetch: refetchPlaylists,
              selectedPlaylistId,
              setSelectedPlaylistId,
              defaultFilter: defaultPlaylistFilter,
              moodOptions,
              onTableChange: (pagination, _filters, sorter) => {
                const currentSorter = Array.isArray(sorter)
                  ? sorter[0]
                  : sorter;

                setPlaylistFilter((prev) => ({
                  ...prev,
                  page: pagination.current || 1,
                  pageSize: pagination.pageSize || 10,
                  sortBy: currentSorter.field
                    ? String(currentSorter.field)
                    : 'createdAt',
                  isAscending: currentSorter.order === 'ascend',
                }));
              },
            }}
            mood={{
              filter: moodFilter,
              setFilter: setMoodFilter,
              showFilters: showMoodFilters,
              setShowFilters: setShowMoodFilters,
              hasActiveFilters: !!hasActiveMoodFilters,
              data: paginatedMoods,
              total: filteredMoods.length,
              isLoading: isLoadingMoods,
              refetch: refetchMoods,
              selectedMoodId,
              setSelectedMoodId,
              defaultFilter: defaultMoodFilter,
              moodTypeOptions,
            }}
          />
        </div>

        <div className={styles.statusStrip}>
          <Flex
            justify='space-between'
            align='center'
            wrap='wrap'
            gap={8}
          >
            <Tag
              icon={<UnorderedListOutlined />}
              color='processing'
            >
              {activeTab === 'tracks'
                ? `${selectedTrackIds.length} track(s) selected`
                : activeTab === 'playlist'
                  ? selectedPlaylistId
                    ? '1 playlist selected'
                    : 'No playlist selected'
                  : selectedMoodId
                    ? '1 mood selected'
                    : 'No mood selected'}
            </Tag>
          </Flex>
        </div>

        <div className={styles.sectionCard}>
          <SettingSwitch
            label='Clear manager-selected queue items'
            description='Enable to clear current manager-selected queue before applying override.'
            value={isClearManagerSelectedQueues}
            onChange={setIsClearManagerSelectedQueues}
          />

          <SettingSwitch
            label='Cut over immediately'
            description='Enable to skip the currently playing track and start the new override list now.'
            value={isCutOver}
            onChange={setIsCutOver}
          />

          <Text strong>Reason (optional)</Text>
          <TextArea
            size='large'
            placeholder='Add a short reason for this manual override...'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            style={{ marginTop: 8 }}
          />
        </div>
      </Space>
    </AppModal>
  );
};
