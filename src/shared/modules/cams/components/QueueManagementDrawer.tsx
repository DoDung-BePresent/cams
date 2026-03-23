import { useState } from 'react';
import {
  Drawer,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { DRAWER_WIDTHS } from '@/config';
import {
  useSpaceQueue,
  useSpaceState,
  useClearQueue,
  useRemoveQueueItem,
  useUpdateAudioState,
} from '../hooks';
import { QueueList } from './QueueList';
import { AudioMixerControls } from './AudioMixerControls';
import { AddToQueueModal } from './AddToQueueModal';
import type { QueueEndBehavior } from '../types';

const { Title, Text } = Typography;

interface QueueManagementDrawerProps {
  open: boolean;
  spaceId: string;
  storeId: string;
  spaceName?: string;
  onClose: () => void;
}

export const QueueManagementDrawer = ({
  open,
  spaceId,
  storeId,
  spaceName,
  onClose,
}: QueueManagementDrawerProps) => {
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Fetch queue data
  const { data: queueData, isLoading, refetch } = useSpaceQueue(spaceId, open);

  // Fetch space state for audio mixer
  const { data: spaceState } = useSpaceState(spaceId, open);

  // Mutations
  const clearQueue = useClearQueue();
  const removeQueueItem = useRemoveQueueItem();
  const updateAudioState = useUpdateAudioState();

  // Get current audio state from space state or defaults
  const volumePercent = spaceState?.volumePercent ?? 100;
  const isMuted = spaceState?.isMuted ?? false;
  const queueEndBehavior = spaceState?.queueEndBehavior ?? 0;

  const handleClearQueue = async () => {
    try {
      await clearQueue.mutateAsync(spaceId);
      message.success('Queue cleared successfully');
    } catch (error) {
      // Error handled by mutation hook
      console.error('Failed to clear queue:', error);
    }
  };

  const handleRemoveItem = async (queueItemId: string) => {
    try {
      await removeQueueItem.mutateAsync({ spaceId, queueItemId });
    } catch (error) {
      // Error handled by mutation hook
      console.error('Failed to remove queue item:', error);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      await updateAudioState.mutateAsync({
        spaceId,
        data: { volumePercent: volume },
      });
    } catch (error) {
      console.error('Failed to update volume:', error);
    }
  };

  const handleMuteToggle = async (muted: boolean) => {
    try {
      await updateAudioState.mutateAsync({
        spaceId,
        data: { isMuted: muted },
      });
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleQueueEndBehaviorChange = async (behavior: QueueEndBehavior) => {
    try {
      await updateAudioState.mutateAsync({
        spaceId,
        data: { queueEndBehavior: behavior },
      });
    } catch (error) {
      console.error('Failed to update queue end behavior:', error);
    }
  };

  return (
    <>
      <Drawer
        title={
          <Space
            direction='vertical'
            size={0}
          >
            <Title
              level={4}
              style={{ margin: 0 }}
            >
              Queue Management
            </Title>
            {spaceName && (
              <Text
                type='secondary'
                style={{ fontSize: 14 }}
              >
                {spaceName}
              </Text>
            )}
          </Space>
        }
        placement='right'
        width={DRAWER_WIDTHS.large}
        open={open}
        onClose={onClose}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Popconfirm
              title='Clear Queue'
              description='Are you sure you want to clear the entire queue?'
              onConfirm={handleClearQueue}
              okText='Yes, Clear'
              cancelText='Cancel'
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={clearQueue.isPending}
                disabled={!queueData || queueData.length === 0}
              >
                Clear All
              </Button>
            </Popconfirm>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}
            >
              Add to Queue
            </Button>
          </Space>
        }
      >
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='large'
        >
          {/* Audio Mixer Controls */}
          <AudioMixerControls
            volumePercent={volumePercent}
            isMuted={isMuted}
            queueEndBehavior={queueEndBehavior}
            loading={updateAudioState.isPending}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            onQueueEndBehaviorChange={handleQueueEndBehaviorChange}
          />

          <Divider style={{ margin: 0 }} />

          {/* Queue List */}
          <div>
            <Space
              direction='vertical'
              size='small'
              style={{ width: '100%' }}
            >
              <Space
                align='center'
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <Title
                  level={5}
                  style={{ margin: 0 }}
                >
                  Queue Items
                </Title>
                <Text type='secondary'>
                  {queueData?.length || 0} track
                  {queueData?.length !== 1 ? 's' : ''}
                </Text>
              </Space>
              <QueueList
                items={queueData || []}
                loading={isLoading}
                onRemove={handleRemoveItem}
              />
            </Space>
          </div>
        </Space>
      </Drawer>

      <AddToQueueModal
        open={addModalOpen}
        spaceId={spaceId}
        storeId={storeId}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
};
