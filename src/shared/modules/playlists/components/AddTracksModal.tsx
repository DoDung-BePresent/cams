import { useState } from 'react';
import {
  Modal,
  Button,
  Flex,
  Input,
  Space,
  Typography,
  Empty,
  Spin,
  Segmented,
  List,
  Checkbox,
  Avatar,
  Tag,
  message,
} from 'antd';

/**
 * Icons
 */
import { SearchOutlined } from '@ant-design/icons';
import { MusicIcon } from 'lucide-react';

/**
 * Hooks
 */
import { useTracks } from '@/shared/modules/tracks/hooks';
import { usePlaylist, useAddTracksToPlaylist } from '../hooks';

/**
 * Types
 */
import type { TrackListItem } from '@/shared/modules/tracks/types';

/**
 * Configs
 */
import { DRAWER_WIDTHS } from '@/config';

/**
 * Utils
 */
import { formatDuration, handleApiError } from '@/shared/utils';
import { ErrorCodeEnum } from '@/shared/types';

const { Title, Text } = Typography;

interface AddTracksModalProps {
  open: boolean;
  playlistId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type ViewMode = 'available' | 'selected';

export const AddTracksModal = ({
  open,
  playlistId,
  onClose,
  onSuccess,
}: AddTracksModalProps) => {
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('available');

  // Reset state when drawer opens (render-phase adjustment avoids setState-in-effect lint rule)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setSelectedTrackIds([]);
      setSearchValue('');
      setViewMode('available');
    }
  }

  const { data: playlist, isLoading: isLoadingPlaylist } = usePlaylist(
    playlistId,
    open,
  );

  const { data: tracksData, isLoading: isLoadingTracks } = useTracks({
    page: 1,
    pageSize: 1000,
    status: 1,
    search: searchValue,
  });

  const addTracks = useAddTracksToPlaylist();

  const handleSubmit = () => {
    if (!playlistId || selectedTrackIds.length === 0) {
      return;
    }

    addTracks.mutate(
      {
        id: playlistId,
        data: { trackIds: selectedTrackIds },
      },
      {
        onSuccess: () => {
          handleCancel();
          onSuccess?.();
        },
        onError: (error: unknown) => {
          const axiosError = error as {
            response?: { data?: { errorCode?: string; message?: string } };
          };
          const errorCode = axiosError.response?.data?.errorCode;
          const errorMessage = axiosError.response?.data?.message;

          if (errorCode === ErrorCodeEnum.Forbidden) {
            if (errorMessage === 'Exception_Playlist_Modify_ActiveStream') {
              message.error(
                'Cannot modify playlist while it is actively streaming. Please stop playback first.',
                5,
              );
              return;
            }
            message.error(errorMessage);
          }
          handleApiError(error, {}, 'Failed to add tracks. Please try again.');
        },
      },
    );
  };

  const handleCancel = () => {
    setSelectedTrackIds([]);
    setSearchValue('');
    setViewMode('available');
    onClose();
  };

  const handleToggleTrack = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId],
    );
  };

  // Get existing track IDs from playlist
  const existingTrackIds = playlist?.tracks?.map((t) => t.trackId) || [];

  // Filter available tracks (not in playlist)
  const availableTracks = (tracksData?.items || []).filter(
    (track) => !existingTrackIds.includes(track.id),
  );

  // For shared playlists, only allow shared tracks (brandId=null)
  const isSharedPlaylist = !playlist?.brandId;
  const filteredAvailableTracks = isSharedPlaylist
    ? availableTracks.filter((t) => !t.brandId)
    : availableTracks;

  // Get selected tracks details
  const selectedTracks = filteredAvailableTracks.filter((track) =>
    selectedTrackIds.includes(track.id),
  );

  const isLoading = isLoadingPlaylist || isLoadingTracks;

  // Render track item
  const renderTrackItem = (track: TrackListItem) => {
    const isSelected = selectedTrackIds.includes(track.id);

    return (
      <List.Item
        onClick={() => handleToggleTrack(track.id)}
        style={{ cursor: 'pointer', paddingLeft: 16, paddingRight: 16 }}
      >
        <List.Item.Meta
          avatar={
            <Checkbox
              checked={isSelected}
              onChange={() => handleToggleTrack(track.id)}
            />
          }
          title={
            <Space>
              <Avatar
                src={track.coverImageUrl}
                icon={<MusicIcon />}
                size={40}
                shape='square'
              />
              <div>
                <div style={{ fontWeight: 500 }}>
                  {track.title || 'Untitled'}
                </div>
                <Text
                  type='secondary'
                  style={{ fontSize: 12 }}
                >
                  {track.artist || 'Unknown Artist'}
                </Text>
              </div>
            </Space>
          }
          description={
            <Space size={4}>
              {track.genre && <Tag>{track.genre}</Tag>}
              {track.moodName && <Tag color='blue'>{track.moodName}</Tag>}
              {track.durationSec && (
                <Text
                  type='secondary'
                  style={{ fontSize: 12 }}
                >
                  {formatDuration(track.durationSec)}
                </Text>
              )}
            </Space>
          }
        />
      </List.Item>
    );
  };

  return (
    <Modal
      title='Add Tracks to Playlist'
      width={DRAWER_WIDTHS.medium}
      open={open}
      onCancel={handleCancel}
      destroyOnClose
      centered
      footer={
        <Flex
          justify='end'
          gap='small'
        >
          <Button
            size='large'
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={handleSubmit}
            loading={addTracks.isPending}
            disabled={selectedTrackIds.length === 0 || isLoading}
          >
            Add {selectedTrackIds.length} Track
            {selectedTrackIds.length !== 1 ? 's' : ''}
          </Button>
        </Flex>
      }
    >
      {isLoadingPlaylist ? (
        <div className='flex h-96 items-center justify-center'>
          <Spin size='large' />
        </div>
      ) : (
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='large'
        >
          {/* Playlist Info */}
          <div>
            <Title
              level={5}
              style={{ marginBottom: 8 }}
            >
              {playlist?.name}
            </Title>
            <Text type='secondary'>
              Current tracks: <strong>{existingTrackIds.length}</strong> |
              Selected: <strong>{selectedTrackIds.length}</strong>
            </Text>
          </div>

          {/* Search Input */}
          <Input
            size='large'
            placeholder='Search tracks by title or artist...'
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
          />

          {/* View Mode Segmented */}
          <Segmented
            size='large'
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              {
                label: `Available Tracks (${filteredAvailableTracks.length})`,
                value: 'available',
              },
              {
                label: `Selected Tracks (${selectedTrackIds.length})`,
                value: 'selected',
              },
            ]}
            block
          />

          {/* Track List */}
          {isLoadingTracks ? (
            <div className='flex h-96 items-center justify-center'>
              <Spin size='large' />
            </div>
          ) : viewMode === 'available' ? (
            filteredAvailableTracks.length === 0 ? (
              <Empty
                description='No available tracks to add'
                style={{ marginTop: 48 }}
              />
            ) : (
              <List
                dataSource={filteredAvailableTracks}
                renderItem={renderTrackItem}
                style={{
                  maxHeight: 500,
                  overflowY: 'auto',
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                }}
              />
            )
          ) : selectedTracks.length === 0 ? (
            <Empty
              description='No tracks selected yet'
              style={{ marginTop: 48 }}
            />
          ) : (
            <List
              dataSource={selectedTracks}
              renderItem={renderTrackItem}
              style={{
                maxHeight: 500,
                overflowY: 'auto',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
              }}
            />
          )}
        </Space>
      )}
    </Modal>
  );
};
