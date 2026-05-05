import { useMemo, useState } from 'react';
import {
  Input,
  Space,
  Typography,
  Modal,
  Button,
  Flex,
  DatePicker,
  message,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs, { type Dayjs } from 'dayjs';

import { SettingSwitch } from '@/shared/components';
import { DRAWER_WIDTHS } from '@/config';
import { useMoods } from '@/shared/modules/moods/hooks';
import { usePlaylists } from '@/shared/modules/playlists/hooks';
import { useTracks } from '@/shared/modules/tracks/hooks';
import type { PlaylistFilter } from '@/shared/modules/playlists/types';
import {
  type TrackFilter,
  TrackCopyrightClearanceStatus,
} from '@/shared/modules/tracks/types';
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
    modalGrid: css`
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 16px;
      align-items: start;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    `,
    configPane: css`
      position: sticky;
      top: 0;

      @media (max-width: 960px) {
        position: static;
      }
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
  pageSize: 5,
  sortBy: 'createdAt',
  isAscending: false,
  status: 1,
  copyrightClearanceStatuses: [
    TrackCopyrightClearanceStatus.Cleared,
    TrackCopyrightClearanceStatus.NotApplicable,
  ],
};

const defaultPlaylistFilter: PlaylistFilter = {
  page: 1,
  pageSize: 5,
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
  const [manualOverrideExpiresAt, setManualOverrideExpiresAt] =
    useState<Dayjs | null>(null);

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

  const filteredMoods = useMemo(() => {
    const keyword = moodFilter.search?.trim().toLowerCase();

    return moods.filter((mood) => {
      const matchActive = mood.status === 1;
      const matchSearch = !keyword
        ? true
        : mood.name.toLowerCase().includes(keyword) ||
          mood.genre?.toLowerCase().includes(keyword);

      return matchActive && matchSearch;
    });
  }, [moodFilter.search, moods]);

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
    trackFilter.search || trackFilter.moodId || trackFilter.genre;

  const hasActivePlaylistFilters =
    playlistFilter.search ||
    playlistFilter.moodId ||
    playlistFilter.isDefault !== undefined;

  const hasActiveMoodFilters = moodFilter.search;

  const resetModalState = () => {
    setActiveTab('tracks');
    setShowTrackFilters(false);
    setShowPlaylistFilters(false);
    setShowMoodFilters(false);
    setReason('');
    setIsClearManagerSelectedQueues(false);
    setIsCutOver(false);
    setManualOverrideExpiresAt(null);

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
    if (manualOverrideExpiresAt && !manualOverrideExpiresAt.isAfter(dayjs())) {
      message.warning('Override expiry must be in the future.');
      return;
    }

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
        manualOverrideExpiresAtUtc: manualOverrideExpiresAt
          ? manualOverrideExpiresAt.toDate().toISOString()
          : undefined,
        reason: reason.trim() || undefined,
      });

      onSuccess?.();
      handleClose();
    } catch {
      // Errors are handled in mutation hook.
    }
  };

  return (
    <Modal
      open={open}
      title='Override Space Music'
      width={DRAWER_WIDTHS.extraLarge}
      onCancel={handleClose}
      destroyOnClose
      centered
      footer={
        <Flex
          justify='end'
          gap='small'
        >
          <Button
            size='large'
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            loading={overrideSpaceMusic.isPending}
            onClick={handleSubmit}
          >
            {isCutOver ? 'Apply & Cut Over' : 'Apply Override'}
          </Button>
        </Flex>
      }
    >
      <div className={styles.modalGrid}>
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
                  pageSize: pagination.pageSize || 5,
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
                  pageSize: pagination.pageSize || 5,
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
            }}
          />
        </div>

        <div className={styles.configPane}>
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

            <Space
              direction='vertical'
              size={4}
              style={{ width: '100%', marginBottom: 12 }}
            >
              <Text strong>Override expires at (optional)</Text>
              <Text type='secondary'>
                Applies to takeover-only, track, playlist, and mood overrides.
                Leave empty to let CAMS expire it after the playable queue
                finishes.
              </Text>
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format='YYYY-MM-DD HH:mm'
                value={manualOverrideExpiresAt}
                onChange={setManualOverrideExpiresAt}
                disabledDate={(current) =>
                  !!current && current < dayjs().startOf('day')
                }
                placeholder='Select expiry date and time'
                style={{ width: '100%', marginTop: 4 }}
              />
            </Space>

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
        </div>
      </div>
    </Modal>
  );
};
