import { useState } from 'react';
import { Modal, Transfer, message, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTracks } from '@/shared/modules/tracks/hooks';
import { useAddTracksToPlaylist } from '@/shared/modules/playlists/hooks';
import type { TransferProps } from 'antd';

interface AddTracksModalProps {
  open: boolean;
  playlistId?: string;
  existingTrackIds?: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTracksModal = ({
  open,
  playlistId,
  existingTrackIds = [],
  onClose,
  onSuccess,
}: AddTracksModalProps) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const { data: tracksData, isLoading } = useTracks({
    page: 1,
    pageSize: 1000,
    status: 1, // Only active tracks
    search: searchValue,
  });

  const addTracks = useAddTracksToPlaylist();

  const handleOk = () => {
    if (!playlistId || selectedKeys.length === 0) {
      message.warning('Please select at least one track!');
      return;
    }

    addTracks.mutate(
      {
        id: playlistId,
        data: { trackIds: selectedKeys },
      },
      {
        onSuccess: () => {
          setSelectedKeys([]);
          setSearchValue('');
          onSuccess?.();
          onClose();
        },
      },
    );
  };

  const handleCancel = () => {
    setSelectedKeys([]);
    setSearchValue('');
    onClose();
  };

  // Transform tracks data for Transfer component
  const dataSource: TransferProps['dataSource'] = (tracksData?.items || [])
    .filter((track) => !existingTrackIds.includes(track.id)) // Exclude already added tracks
    .map((track) => ({
      key: track.id,
      title: track.title || 'Untitled',
      description: track.artist || '',
      disabled: false,
    }));

  return (
    <Modal
      title='Add Tracks to Playlist'
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      confirmLoading={addTracks.isPending}
      okText={`Add ${selectedKeys.length} Track${selectedKeys.length !== 1 ? 's' : ''}`}
      okButtonProps={{ disabled: selectedKeys.length === 0 }}
    >
      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size='large'
      >
        <Input
          size='large'
          placeholder='Search tracks...'
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
        />

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
          onChange={setSelectedKeys}
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
            width: 350,
            height: 400,
          }}
          loading={isLoading}
        />
      </Space>
    </Modal>
  );
};
