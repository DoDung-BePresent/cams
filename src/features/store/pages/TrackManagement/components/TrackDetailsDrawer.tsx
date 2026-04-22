import {
  Drawer,
  Descriptions,
  Tag,
  Progress,
  Space,
  Spin,
  Flex,
  Alert,
  Typography,
  Card,
  Radio,
  Select,
  Button,
  Switch,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hooks
 */
import {
  useTrack,
  useTrackMetadataPolling,
} from '@/shared/modules/tracks/hooks';
import { useSpaces } from '@/shared/modules/spaces/hooks';

/**
 * Components
 */
import {
  HLSAudioPlayer,
  MetadataStatusBadge,
  MetadataPollingProgress,
} from '@/shared/modules/tracks/components';

/**
 * Utils
 */
import { formatDateTime, formatDuration } from '@/shared/utils';

/**
 * Constants
 */
import { ENTITY_STATUS_LABELS, ENTITY_STATUS_COLORS } from '@/shared/constants';
import {
  COPYRIGHT_CLEARANCE_COLORS,
  COPYRIGHT_CLEARANCE_LABELS,
  MUSIC_PROVIDER_LABELS,
  MUSIC_PROVIDER_COLORS,
} from '@/shared/modules/tracks/constants';
import { TrackCopyrightClearanceStatus } from '@/shared/modules/tracks/types';
import {
  getTrackPlaybackBlockedMessage,
  isTrackPlaybackBlockedByCopyright,
} from '@/shared/modules/tracks/utils';
import { QueueInsertMode } from '@/shared/modules/cams/types';

/**
 * Configs
 */
import { DRAWER_WIDTHS, QUERY_KEYS } from '@/config';
import { camsService } from '@/shared/modules/cams/services';
import { DeploymentUnitOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface TrackDetailsDrawerProps {
  open: boolean;
  trackId?: string;
  onClose: () => void;
}

export const TrackDetailsDrawer = ({
  open,
  trackId,
  onClose,
}: TrackDetailsDrawerProps) => {
  const queryClient = useQueryClient();
  const [queueMode, setQueueMode] = useState<QueueInsertMode>(
    QueueInsertMode.AddToQueue,
  );
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [clearExistingQueue, setClearExistingQueue] = useState(false);

  const { data: track, isLoading } = useTrack(trackId, open);
  const { data: spacesData } = useSpaces(
    {
      page: 1,
      pageSize: 100,
      status: 1,
      sortBy: 'name',
      isAscending: true,
    },
    open,
  );
  const isCopyrightBlocked = isTrackPlaybackBlockedByCopyright(
    track?.copyrightClearanceStatus,
  );
  const blockedMessage = getTrackPlaybackBlockedMessage(
    track?.copyrightClearanceStatus,
  );

  const { isPolling, attempts, maxAttempts, status } = useTrackMetadataPolling(
    trackId,
    {
      enabled: open && !!trackId,
    },
  );

  const spaceOptions = useMemo(
    () =>
      (spacesData?.items || []).map((space) => ({
        label: space.name,
        value: space.id,
      })),
    [spacesData?.items],
  );

  const canQueueTrack = !!track?.id && !isCopyrightBlocked;
  const hasSpaces = spaceOptions.length > 0;

  useEffect(() => {
    if (!open) {
      setQueueMode(QueueInsertMode.AddToQueue);
      setSelectedSpaceIds([]);
      setClearExistingQueue(false);
    }
  }, [open]);

  const addTrackToSpaces = useMutation({
    mutationFn: async (spaceIds: string[]) => {
      if (!track?.id) {
        throw new Error('Track not found');
      }

      const results = await Promise.allSettled(
        spaceIds.map((spaceId) =>
          camsService.addTracksToQueue(spaceId, {
            trackIds: [track.id],
            mode: queueMode,
            isClearExistingQueue: clearExistingQueue,
          }),
        ),
      );

      const successCount = results.filter(
        (result) => result.status === 'fulfilled',
      ).length;
      const failedCount = results.length - successCount;

      results.forEach((_result, index) => {
        const spaceId = spaceIds[index];
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.cams.queue(spaceId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.cams.spaceState(spaceId),
        });
      });

      return {
        successCount,
        failedCount,
      };
    },
    onSuccess: ({ successCount, failedCount }) => {
      if (successCount > 0 && failedCount === 0) {
        message.success(
          successCount === 1
            ? 'Track added to the selected space queue'
            : `Track added to ${successCount} space queues`,
        );
      } else if (successCount > 0) {
        message.warning(
          `Added to ${successCount} space queues. ${failedCount} failed.`,
        );
      } else {
        message.error('Failed to add track to queue');
      }
    },
    onError: () => {
      message.error('Failed to add track to queue');
    },
  });

  const handleQueueToSelectedSpaces = () => {
    if (!selectedSpaceIds.length) {
      message.warning('Please choose at least one space');
      return;
    }

    addTrackToSpaces.mutate(selectedSpaceIds);
  };

  const handleQueueToAllSpaces = () => {
    const allSpaceIds = spaceOptions.map((space) => space.value);

    if (!allSpaceIds.length) {
      message.warning('No active spaces available');
      return;
    }

    addTrackToSpaces.mutate(allSpaceIds);
  };

  return (
    <Drawer
      closeIcon={null}
      title='Track Details'
      placement='right'
      width={DRAWER_WIDTHS.medium}
      open={open}
      onClose={onClose}
    >
      {isLoading ? (
        <Flex
          justify='center'
          align='center'
          style={{ minHeight: 400 }}
        >
          <Spin size='large' />
        </Flex>
      ) : track ? (
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='large'
        >
          <MetadataPollingProgress
            isPolling={isPolling}
            attempts={attempts}
            maxAttempts={maxAttempts}
            status={status}
          />

          {isCopyrightBlocked && (
            <Alert
              type={
                track?.copyrightClearanceStatus ===
                TrackCopyrightClearanceStatus.PendingScan
                  ? 'warning'
                  : 'error'
              }
              showIcon
              message='Playback blocked by copyright policy'
              description={blockedMessage}
            />
          )}

          <div>
            <Title
              level={5}
              className='mb-4!'
            >
              Audio Player
            </Title>
            <HLSAudioPlayer
              hlsUrl={track.hlsUrl}
              title={track.title}
              artist={track.artist}
              coverImageUrl={track.coverImageUrl}
              shouldStop={!open}
              unavailableMessage={
                isCopyrightBlocked ? blockedMessage : undefined
              }
              disabled={isCopyrightBlocked}
            />
          </div>

          <Card>
            <Space
              direction='vertical'
              size='middle'
              style={{ width: '100%' }}
            >
              <div>
                <Title
                  level={5}
                  style={{ margin: 0 }}
                >
                  Add to Space Queue
                </Title>
                <Text type='secondary'>
                  Send this track to one space or every active space in the
                  store.
                </Text>
              </div>

              <div>
                <Text strong>Queue Mode</Text>
                <Radio.Group
                  style={{ display: 'flex', marginTop: 8, gap: 8, flexWrap: 'wrap' }}
                  value={queueMode}
                  onChange={(event) => setQueueMode(event.target.value)}
                  optionType='button'
                  buttonStyle='solid'
                  options={[
                    {
                      label: 'Play Now',
                      value: QueueInsertMode.PlayNow,
                    },
                    {
                      label: 'Play Next',
                      value: QueueInsertMode.PlayNext,
                    },
                    {
                      label: 'Add to Queue',
                      value: QueueInsertMode.AddToQueue,
                    },
                  ]}
                />
              </div>

              <div>
                <Text strong>Select Spaces</Text>
                <Select
                  mode='multiple'
                  allowClear
                  placeholder='Choose one or more spaces'
                  style={{ width: '100%', marginTop: 8 }}
                  options={spaceOptions}
                  value={selectedSpaceIds}
                  onChange={setSelectedSpaceIds}
                  disabled={!hasSpaces || !canQueueTrack}
                  optionFilterProp='label'
                />
              </div>

              <Flex
                justify='space-between'
                align='center'
              >
                <Space
                  direction='vertical'
                  size={2}
                >
                  <Text strong>Clear queue before adding</Text>
                  <Text type='secondary'>
                    Replace what is already queued in the target spaces.
                  </Text>
                </Space>
                <Switch
                  checked={clearExistingQueue}
                  onChange={setClearExistingQueue}
                  disabled={!canQueueTrack}
                />
              </Flex>

              {!hasSpaces && (
                <Alert
                  type='info'
                  showIcon
                  message='No active spaces available'
                  description='Create or activate a space before sending tracks to a queue.'
                />
              )}

              <Flex gap='small' wrap='wrap'>
                <Button
                  size='large'
                  type='primary'
                  icon={<PlusOutlined />}
                  onClick={handleQueueToSelectedSpaces}
                  loading={addTrackToSpaces.isPending}
                  disabled={!canQueueTrack || !selectedSpaceIds.length}
                >
                  Add to Selected Spaces
                </Button>
                <Button
                  size='large'
                  icon={<DeploymentUnitOutlined />}
                  onClick={handleQueueToAllSpaces}
                  loading={addTrackToSpaces.isPending}
                  disabled={!canQueueTrack || !hasSpaces}
                >
                  Add to All Spaces
                </Button>
              </Flex>
            </Space>
          </Card>

          <Descriptions
            title='Basic Information'
            column={1}
            bordered
          >
            <Descriptions.Item label='Title'>{track.title}</Descriptions.Item>
            <Descriptions.Item label='Artist'>
              {track.artist || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Genre'>
              {track.genre ? <Tag>{track.genre}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Mood'>
              {track.moodName ? <Tag color='blue'>{track.moodName}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Provider'>
              {track.provider !== undefined ? (
                <Tag color={MUSIC_PROVIDER_COLORS[track.provider]}>
                  {MUSIC_PROVIDER_LABELS[track.provider]}
                </Tag>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label='Status'>
              <Tag color={ENTITY_STATUS_COLORS[track.status]}>
                {ENTITY_STATUS_LABELS[track.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Copyright'>
              <Tag
                color={
                  COPYRIGHT_CLEARANCE_COLORS[
                    track.copyrightClearanceStatus ??
                      TrackCopyrightClearanceStatus.Cleared
                  ]
                }
              >
                {
                  COPYRIGHT_CLEARANCE_LABELS[
                    track.copyrightClearanceStatus ??
                      TrackCopyrightClearanceStatus.Cleared
                  ]
                }
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title='Audio Metadata'
            column={1}
            bordered
            extra={
              <MetadataStatusBadge
                track={track}
                showDetails
              />
            }
          >
            <Descriptions.Item label='Duration'>
              {formatDuration(track.durationSec)}
            </Descriptions.Item>
            <Descriptions.Item label='BPM'>
              {track.bpm || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Energy Level'>
              {track.energyLevel !== undefined ? (
                <div>
                  <Progress
                    percent={track.energyLevel * 100}
                    format={(percent) => `${(percent! / 100).toFixed(1)}`}
                    strokeColor='#52c41a'
                  />
                </div>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label='Valence'>
              {track.valence !== undefined ? (
                <div>
                  <Progress
                    percent={track.valence * 100}
                    format={(percent) => `${(percent! / 100).toFixed(1)}`}
                    strokeColor='#1890ff'
                  />
                </div>
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            title='Statistics'
            column={1}
            bordered
          >
            <Descriptions.Item label='Play Count'>
              {track.playCount}
            </Descriptions.Item>
            <Descriptions.Item label='Last Played'>
              {track.lastPlayedAt
                ? formatDateTime(track.lastPlayedAt)
                : 'Never'}
            </Descriptions.Item>
          </Descriptions>

          {track.isAiGenerated && (
            <Descriptions
              title='AI Generation Info'
              column={1}
              bordered
            >
              <Descriptions.Item label='Suno Clip ID'>
                {track.sunoClipId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Generation Prompt'>
                {track.generationPrompt || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Generated At'>
                {track.generatedAt ? formatDateTime(track.generatedAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label='Lyrics URL'>
                {track.lyricsUrl ? (
                  <a
                    href={track.lyricsUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    View Lyrics
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Descriptions
            title='Timestamps'
            column={1}
            bordered
          >
            <Descriptions.Item label='Created At'>
              {formatDateTime(track.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label='Updated At'>
              {track.updatedAt ? formatDateTime(track.updatedAt) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Created By'>
              {track.createdBy || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Updated By'>
              {track.updatedBy || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>Track not found</div>
      )}
    </Drawer>
  );
};
