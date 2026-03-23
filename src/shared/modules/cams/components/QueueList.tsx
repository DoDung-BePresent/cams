import { List, Tag, Button, Space, Typography, Empty, Tooltip } from 'antd';
import {
  DeleteOutlined,
  DragOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { SpaceQueueItemResponse } from '../types';
import { QueueItemStatus, QueueItemSource } from '../types';

const { Text } = Typography;

interface QueueListProps {
  items: SpaceQueueItemResponse[];
  loading?: boolean;
  onRemove: (queueItemId: string) => void;
  onReorder?: (queueItemIds: string[]) => void;
}

const getStatusIcon = (status: QueueItemStatus) => {
  switch (status) {
    case QueueItemStatus.Playing:
      return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
    case QueueItemStatus.Pending:
      return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    case QueueItemStatus.Played:
      return <CheckCircleOutlined style={{ color: '#8c8c8c' }} />;
    case QueueItemStatus.Skipped:
      return <StopOutlined style={{ color: '#ff4d4f' }} />;
    default:
      return null;
  }
};

const getStatusLabel = (status: QueueItemStatus) => {
  switch (status) {
    case QueueItemStatus.Playing:
      return 'Playing';
    case QueueItemStatus.Pending:
      return 'Pending';
    case QueueItemStatus.Played:
      return 'Played';
    case QueueItemStatus.Skipped:
      return 'Skipped';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: QueueItemStatus) => {
  switch (status) {
    case QueueItemStatus.Playing:
      return 'success';
    case QueueItemStatus.Pending:
      return 'processing';
    case QueueItemStatus.Played:
      return 'default';
    case QueueItemStatus.Skipped:
      return 'error';
    default:
      return 'default';
  }
};

const getSourceLabel = (source: QueueItemSource) => {
  return source === QueueItemSource.AI ? 'AI' : 'Manager';
};

const getSourceColor = (source: QueueItemSource) => {
  return source === QueueItemSource.AI ? 'purple' : 'blue';
};

export const QueueList = ({ items, loading, onRemove }: QueueListProps) => {
  if (!items || items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description='No tracks in queue'
        style={{ padding: '40px 0' }}
      />
    );
  }

  // Sort by position
  const sortedItems = [...items].sort((a, b) => a.position - b.position);

  return (
    <List
      loading={loading}
      dataSource={sortedItems}
      renderItem={(item) => (
        <List.Item
          key={item.queueItemId}
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor:
              item.queueStatus === QueueItemStatus.Playing
                ? '#f6ffed'
                : 'transparent',
          }}
          actions={[
            <Tooltip
              key='remove'
              title='Remove from queue'
            >
              <Button
                type='text'
                size='small'
                danger
                icon={<DeleteOutlined />}
                onClick={() => onRemove(item.queueItemId)}
                disabled={item.queueStatus === QueueItemStatus.Playing}
              />
            </Tooltip>,
          ]}
        >
          <List.Item.Meta
            avatar={
              <Space>
                <DragOutlined style={{ color: '#8c8c8c', cursor: 'move' }} />
                <Text
                  type='secondary'
                  style={{ fontSize: 12, minWidth: 20 }}
                >
                  #{item.position}
                </Text>
              </Space>
            }
            title={
              <Space>
                {getStatusIcon(item.queueStatus)}
                <Text strong={item.queueStatus === QueueItemStatus.Playing}>
                  {item.trackName}
                </Text>
              </Space>
            }
            description={
              <Space size='small'>
                <Tag
                  color={getStatusColor(item.queueStatus)}
                  style={{ fontSize: 11 }}
                >
                  {getStatusLabel(item.queueStatus)}
                </Tag>
                <Tag
                  color={getSourceColor(item.source)}
                  style={{ fontSize: 11 }}
                >
                  {getSourceLabel(item.source)}
                </Tag>
                {!item.isReadyToStream && (
                  <Tag
                    color='warning'
                    style={{ fontSize: 11 }}
                  >
                    Transcoding...
                  </Tag>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
};
