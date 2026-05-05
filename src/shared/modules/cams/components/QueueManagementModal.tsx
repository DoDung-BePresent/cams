import { useState, useEffect } from 'react';
import {
  Modal,
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
  CloseOutlined,
} from '@ant-design/icons';
import { Flex } from 'antd';
import {
  useSpaceQueue,
  useSpaceState,
  useClearQueue,
  useRemoveQueueItem,
  useRemoveQueueItems,
  useUpdateAudioState,
  useReorderQueue,
  usePlaybackControl,
} from '../hooks';
import { QueueList } from './QueueList';
import { AudioMixerControls } from './AudioMixerControls';
import { AddToQueueModal } from './AddToQueueModal';
import { PlaybackCommand, type QueueEndBehavior } from '../types';

const { Title, Text } = Typography;

interface QueueManagementModalProps {
  open: boolean;
  spaceId: string;
  storeId: string;
  onClose: () => void;
}

export const QueueManagementModal = ({
  open,
  spaceId,
  storeId,
  onClose,
}: QueueManagementModalProps) => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [localVolume, setLocalVolume] = useState<number>(100);

  // Fetch queue data
  const { data: queueData, isLoading, refetch } = useSpaceQueue(spaceId, open);

  // Fetch space state for audio mixer
  const { data: spaceState } = useSpaceState(spaceId, open);

  // Mutations
  const clearQueue = useClearQueue();
  const removeQueueItem = useRemoveQueueItem();
  const removeQueueItems = useRemoveQueueItems();
  const updateAudioState = useUpdateAudioState();
  const reorderQueue = useReorderQueue();
  const playbackControl = usePlaybackControl();

  // Get current audio state from space state or defaults
  const volumePercent = spaceState?.volumePercent ?? 100;
  const isMuted = spaceState?.isMuted ?? false;
  const queueEndBehavior = spaceState?.queueEndBehavior ?? 0;
  const queueSyncSignature =
    spaceState?.spaceQueueItems
      ?.map((item) => `${item.queueItemId}:${item.orderIndex ?? ''}`)
      .join('|') ?? '';

  // Sync local volume with server state when spaceState changes
  useEffect(() => {
    if (spaceState?.volumePercent !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalVolume(spaceState.volumePercent);
    }
  }, [spaceState?.volumePercent]);

  useEffect(() => {
    if (!open) return;

    void refetch();
  }, [
    open,
    refetch,
    spaceState?.currentQueueItemId,
    spaceState?.pendingQueueItemId,
    queueSyncSignature,
  ]);

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

  // Update local state while dragging (no API call)
  const handleVolumeChange = (volume: number) => {
    setLocalVolume(volume);
  };

  // Only call API when user releases the slider
  const handleVolumeChangeComplete = async (volume: number) => {
    try {
      await updateAudioState.mutateAsync({
        spaceId,
        data: { volumePercent: volume },
      });
    } catch (error) {
      console.error('Failed to update volume:', error);
      // Revert to server value on error
      setLocalVolume(volumePercent);
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

  const handleReorder = async (queueItemIds: string[]) => {
    try {
      await reorderQueue.mutateAsync({
        spaceId,
        data: { queueItemIds },
      });
    } catch (error) {
      console.error('Failed to reorder queue:', error);
    }
  };

  const handleRemoveItems = async (queueItemIds: string[]) => {
    try {
      await removeQueueItems.mutateAsync({
        spaceId,
        queueItemIds,
      });
    } catch (error) {
      console.error('Failed to remove queue items:', error);
    }
  };

  const handleSkipToTrack = async (queueItemId: string) => {
    try {
      await playbackControl.mutateAsync({
        spaceId,
        command: PlaybackCommand.SkipToTrack,
        targetQueueItemId: queueItemId,
      });
      await refetch();
    } catch (error) {
      console.error('Failed to skip to queue item:', error);
    }
  };

  return (
    <>
      <Modal
        className='cams-queue-management-modal'
        title={
          <Flex
            justify='space-between'
            align='center'
            gap={16}
            wrap
            style={{ paddingRight: 36 }}
          >
            <div>
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: '#f8f7f7',
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                Queue Management
              </Title>
              <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                Control playback queue and output behavior
              </Text>
            </div>
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                style={{
                  background: '#18181b',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: '#f8f7f7',
                  fontWeight: 700,
                }}
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
                  style={{
                    background: 'rgba(248, 64, 72, 0.08)',
                    borderColor: 'rgba(248, 64, 72, 0.55)',
                    color: '#ff6b72',
                    fontWeight: 700,
                  }}
                >
                  Clear All
                </Button>
              </Popconfirm>
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setAddModalOpen(true)}
                style={{
                  background: '#f84048',
                  borderColor: '#f84048',
                  color: '#fff',
                  fontWeight: 800,
                  boxShadow: '0 10px 28px rgba(248, 64, 72, 0.26)',
                }}
              >
                Add to Queue
              </Button>
            </Space>
          </Flex>
        }
        centered
        destroyOnClose
        width={760}
        open={open}
        onCancel={onClose}
        footer={null}
        closeIcon={<CloseOutlined style={{ color: '#9ca3af' }} />}
        styles={{
          header: {
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '22px 28px 18px',
            margin: 0,
          },
          body: {
            padding: '22px 28px 28px',
            background:
              'radial-gradient(circle at 8% 0%, rgba(248,64,72,0.12), transparent 32%), transparent',
          },
        }}
      >
        <style>
          {`
            .cams-queue-management-modal .ant-modal-content {
              background: linear-gradient(145deg, #171719 0%, #111113 54%, #0b0b0d 100%);
              border: 1px solid rgba(248, 64, 72, 0.18);
              border-radius: 14px;
              box-shadow: 0 22px 70px rgba(0, 0, 0, 0.62);
              padding: 0;
              overflow: hidden;
            }
          `}
        </style>
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='large'
        >
          {/* Audio Mixer Controls */}
          <AudioMixerControls
            volumePercent={localVolume}
            isMuted={isMuted}
            queueEndBehavior={queueEndBehavior}
            loading={updateAudioState.isPending}
            onVolumeChange={handleVolumeChange}
            onVolumeChangeComplete={handleVolumeChangeComplete}
            onMuteToggle={handleMuteToggle}
            onQueueEndBehaviorChange={handleQueueEndBehaviorChange}
          />

          <Divider
            style={{ margin: 0, borderColor: 'rgba(255,255,255,0.08)' }}
          />

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
                  style={{ margin: 0, color: '#f8f7f7', fontWeight: 800 }}
                >
                  Queue Items
                </Title>
                <Text style={{ color: '#9ca3af', fontWeight: 700 }}>
                  {queueData?.length || 0} track
                  {queueData?.length !== 1 ? 's' : ''}
                </Text>
              </Space>
              <QueueList
                items={queueData || []}
                loading={isLoading}
                onRemove={handleRemoveItem}
                onRemoveMany={handleRemoveItems}
                onReorder={handleReorder}
                onSkipToTrack={handleSkipToTrack}
              />
            </Space>
          </div>
        </Space>
      </Modal>

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
