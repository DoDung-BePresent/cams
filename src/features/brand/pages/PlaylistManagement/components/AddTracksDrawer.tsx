import { useState, useEffect } from 'react';
import {
  Drawer,
  Transfer,
  Button,
  Flex,
  Input,
  Space,
  Typography,
  Empty,
  Spin,
} from 'antd';

/**
 * Icons
 */
import { SearchOutlined } from '@ant-design/icons';

/**
 * Hooks
 */
import { useTracks } from '@/shared/modules/tracks/hooks';
import {
  usePlaylist,
  useAddTracksToPlaylist,
} from '@/shared/modules/playlists/hooks';

/**
 * Types
 */
import type { TransferProps } from 'antd';

const { Title, Text } = Typography;

interface AddTracksDrawerProps {
  open: boolean;
  playlistId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTracksDrawer = ({
  open,
  playlistId,
  onClose,
  onSuccess,
}: AddTracksDrawerProps) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const { data: playlist, isLoading: isLoadingPlaylist } = usePlaylist(
    playlistId,
    open,
  );

  const { data: tracksData, isLoading: isLoadingTracks } = useTracks({
    page: 1,
    pageSize: 1000,
    status: 1, // Only active tracks
    search: searchValue,
  });

  const addTracks = useAddTracksToPlaylist();

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedKeys([]);
      setSearchValue('');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!playlistId || selectedKeys.length === 0) {
      return;
    }

    addTracks.mutate(
      {
        id: playlistId,
        data: { trackIds: selectedKeys },
      },
      {
        onSuccess: () => {
          handleCancel();
          onSuccess?.();
        },
      },
    );
  };

  const handleCancel = () => {
    setSelectedKeys([]);
    setSearchValue('');
    onClose();
  };

  const handleTransferChange: TransferProps['onChange'] = (
    targetKeys,
    _direction,
    _moveKeys,
  ) => {
    setSelectedKeys(targetKeys as string[]);
  };

  // Get existing track IDs from playlist
  const existingTrackIds = playlist?.tracks?.map((t) => t.trackId) || [];

  // Transform tracks data for Transfer component
  const dataSource: TransferProps['dataSource'] = (tracksData?.items || [])
    .filter((track) => !existingTrackIds.includes(track.id)) // Exclude already added tracks
    .map((track) => ({
      key: track.id,
      title: track.title || 'Untitled',
      description: track.artist || '',
      disabled: false,
    }));

  const isLoading = isLoadingPlaylist || isLoadingTracks;

  return (
    <Drawer
      closeIcon={null}
      title='Add Tracks to Playlist'
      placement='right'
      width={900}
      open={open}
      onClose={handleCancel}
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
            disabled={selectedKeys.length === 0 || isLoading}
          >
            Add {selectedKeys.length} Track
            {selectedKeys.length !== 1 ? 's' : ''}
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
              Current tracks: <strong>{existingTrackIds.length}</strong>
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

          {/* Transfer Component */}
          {isLoadingTracks ? (
            <div className='flex h-96 items-center justify-center'>
              <Spin size='large' />
            </div>
          ) : dataSource.length === 0 ? (
            <Empty
              description='No available tracks to add'
              style={{ marginTop: 48 }}
            />
          ) : (
            <Transfer
              dataSource={dataSource}
              showSearch
              filterOption={(inputValue, option) =>
                option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                (option.description || '')
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
              targetKeys={selectedKeys}
              onChange={handleTransferChange}
              render={(item) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  {item.description && (
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              listStyle={{
                width: 400,
                height: 500,
              }}
              titles={['Available Tracks', 'Selected Tracks']}
              locale={{
                itemUnit: 'track',
                itemsUnit: 'tracks',
                searchPlaceholder: 'Search...',
              }}
            />
          )}
        </Space>
      )}
    </Drawer>
  );
};
