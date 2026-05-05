import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import {
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Checkbox,
  Popconfirm,
} from 'antd';
import {
  DeleteOutlined,
  DragOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  SoundOutlined,
} from '@ant-design/icons';

const PLAYING_BARS_CSS = `
  @keyframes bounce {
    0%, 100% { height: 6px; }
    50% { height: 14px; }
  }
  .playing-bars span {
    animation: bounce 0.8s ease-in-out infinite;
  }
  .playing-bars span:nth-child(2) { animation-delay: 0.2s; }
  .playing-bars span:nth-child(3) { animation-delay: 0.4s; }
`;
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SpaceQueueItemResponse } from '../types';
import { QueueItemStatus, QueueItemSource } from '../types';
import {
  canPlayCamsQueueItem,
  canReorderCamsQueueItem,
  getCamsQueueStatusAntColor,
  getCamsQueueStatusDescription,
  getCamsQueueStatusLabel,
  getCamsQueueStatusTone,
} from '../utils';

const { Text } = Typography;

interface QueueListProps {
  items: SpaceQueueItemResponse[];
  loading?: boolean;
  onRemove: (queueItemId: string) => void;
  onRemoveMany?: (queueItemIds: string[]) => Promise<void> | void;
  onReorder?: (queueItemIds: string[]) => void;
  onSkipToTrack?: (queueItemId: string, trackId?: string) => void;
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

const getStatusLabel = (status: QueueItemStatus) =>
  getCamsQueueStatusLabel(status);

const getStatusColor = (status: QueueItemStatus) =>
  getCamsQueueStatusAntColor(status);

const getStatusDescription = (status: QueueItemStatus) =>
  getCamsQueueStatusDescription(status);

const getSourceLabel = (source: QueueItemSource) => {
  if (source === QueueItemSource.AI) return 'AI';
  if (source === QueueItemSource.Scheduling) return 'Schedule';
  return 'Manager';
};

const getSourceColor = (source: QueueItemSource) => {
  if (source === QueueItemSource.AI) return 'purple';
  if (source === QueueItemSource.Scheduling) return 'green';
  return 'blue';
};

// Visual clone rendered in DragOverlay â€” no sortable hooks, renders as portal above list
const DragOverlayItem = ({
  item,
  selected,
}: {
  item: SpaceQueueItemResponse;
  selected: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: selected ? 'rgba(29, 185, 84, 0.15)' : '#181818',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
      borderRadius: 8,
      border: `1px solid ${selected ? '#1db954' : '#2a2a2a'}`,
      cursor: 'grabbing',
      gap: 12,
    }}
  >
    <Space>
      <div style={{ display: 'flex', alignItems: 'center', width: 16 }}>
        <DragOutlined style={{ color: '#1890ff' }} />
      </div>
      <Checkbox
        checked={selected}
        style={{ pointerEvents: 'none' }}
      />
      {item.coverImageUrl ? (
        <img
          src={item.coverImageUrl}
          alt={item.trackName}
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            background: '#222222',
            borderRadius: 4,
          }}
        />
      )}
    </Space>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Space>
        {getStatusIcon(item.queueStatus)}
        <Text>{item.trackName}</Text>
      </Space>
      <div style={{ marginTop: 4 }}>
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
        </Space>
      </div>
    </div>
  </div>
);

// Sortable Item Component
interface SortableItemProps {
  item: SpaceQueueItemResponse;
  selected: boolean;
  onSelectChange: (queueItemId: string, checked: boolean) => void;
  onRemove: (queueItemId: string) => void;
  onSkipToTrack?: (queueItemId: string, trackId?: string) => void;
}

const SortableItem = memo(function SortableItem({
  item,
  selected,
  onSelectChange,
  onRemove,
  onSkipToTrack,
}: SortableItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isDraggable = canReorderCamsQueueItem(item.queueStatus);
  const canPlay =
    canPlayCamsQueueItem(item.queueStatus) && item.isReadyToStream;
  const statusTone = getCamsQueueStatusTone(item.queueStatus);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.queueItemId,
    disabled: !isDraggable,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '12px 16px',
    border: 'none',
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor:
      item.queueStatus === QueueItemStatus.Playing
        ? statusTone.bg
        : isHovered
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
    borderColor:
      item.queueStatus === QueueItemStatus.Playing
        ? statusTone.border
        : 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    opacity: isDragging ? 0 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  };

  const isPlaying = item.queueStatus === QueueItemStatus.Playing;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection / Checkbox - Subtle */}
      <div
        style={{
          opacity: selected || isHovered ? 1 : 0.2,
          transition: 'opacity 0.2s',
        }}
      >
        <Checkbox
          checked={selected}
          onChange={(e) => onSelectChange(item.queueItemId, e.target.checked)}
        />
      </div>

      {/* Artwork with Play Hover */}
      <div
        style={{
          position: 'relative',
          width: 52,
          height: 52,
          flexShrink: 0,
          cursor: canPlay ? 'pointer' : 'default',
        }}
        onClick={() =>
          canPlay && onSkipToTrack?.(item.queueItemId, item.trackId)
        }
      >
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt=''
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 6,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'rgba(59,130,246,0.14)',
              border: '1px solid rgba(59,130,246,0.16)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SoundOutlined style={{ color: '#64748b' }} />
          </div>
        )}
        {isHovered && canPlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayCircleOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
        )}
        {isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(16,185,129,0.16)',
              border: '2px solid #10b981',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className='playing-bars'>
              <span
                style={{
                  width: 2,
                  height: 8,
                  background: '#10b981',
                  margin: '0 1px',
                }}
              />
              <span
                style={{
                  width: 2,
                  height: 12,
                  background: '#10b981',
                  margin: '0 1px',
                }}
              />
              <span
                style={{
                  width: 2,
                  height: 6,
                  background: '#10b981',
                  margin: '0 1px',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: isPlaying ? '#10b981' : '#f8f7f7',
            fontSize: 15,
            fontWeight: isPlaying ? 800 : 650,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.trackName}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 2,
          }}
        >
          <Tag
            color={getStatusColor(item.queueStatus)}
            style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}
          >
            {getStatusLabel(item.queueStatus)}
          </Tag>
          <span
            style={{
              color: '#93c5fd',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {getSourceLabel(item.source)}
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: '#4b5563',
            }}
          />
          <span style={{ color: '#6b7280', fontSize: 11 }}>
            {getStatusDescription(item.queueStatus)}
          </span>
          {!item.isReadyToStream && (
            <Tag
              color='warning'
              style={{
                fontSize: 9,
                padding: '0 4px',
                margin: 0,
                lineHeight: '14px',
                height: '16px',
              }}
            >
              Readying...
            </Tag>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        {canPlay && (
          <Button
            type='text'
            icon={<PlayCircleOutlined />}
            size='small'
            disabled={!canPlay}
            onClick={() =>
              canPlay && onSkipToTrack?.(item.queueItemId, item.trackId)
            }
            style={{ background: 'transparent', color: '#60a5fa' }}
          />
        )}
        <div
          {...attributes}
          {...(isDraggable ? listeners : {})}
          title={
            isDraggable
              ? 'Drag to reorder pending tracks'
              : `${getStatusLabel(item.queueStatus)} tracks cannot be reordered`
          }
          style={{
            cursor: isDraggable ? 'grab' : 'not-allowed',
            padding: 8,
            color: isDraggable ? '#4b5563' : '#2f333a',
          }}
        >
          <DragOutlined />
        </div>
        <Button
          type='text'
          danger
          icon={<DeleteOutlined />}
          size='small'
          onClick={() => onRemove(item.queueItemId)}
          style={{ background: 'transparent' }}
        />
      </div>
    </div>
  );
});

export const QueueList = ({
  items,
  onRemove,
  onRemoveMany,
  onReorder,
  onSkipToTrack,
}: QueueListProps) => {
  const [selectedQueueItemIds, setSelectedQueueItemIds] = useState<string[]>(
    [],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<SpaceQueueItemResponse[]>(() =>
    [...items].sort((a, b) => a.position - b.position),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Sync from props only when not actively dragging â€” preserves optimistic order
  useEffect(() => {
    if (!activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalItems([...items].sort((a, b) => a.position - b.position));
    }
  }, [items, activeId]);

  const activeItem = useMemo(
    () => localItems.find((item) => item.queueItemId === activeId) ?? null,
    [localItems, activeId],
  );

  const visibleQueueItemIdSet = useMemo(
    () => new Set(localItems.map((item) => item.queueItemId)),
    [localItems],
  );

  const effectiveSelectedQueueItemIds = useMemo(
    () => selectedQueueItemIds.filter((id) => visibleQueueItemIdSet.has(id)),
    [selectedQueueItemIds, visibleQueueItemIdSet],
  );

  const handleSelectItem = useCallback(
    (queueItemId: string, checked: boolean) => {
      setSelectedQueueItemIds((prev) => {
        if (checked) {
          return prev.includes(queueItemId) ? prev : [...prev, queueItemId];
        }

        return prev.filter((id) => id !== queueItemId);
      });
    },
    [],
  );

  if (!items || items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description='No tracks in queue'
        style={{ padding: '40px 0' }}
      />
    );
  }

  const allSelected =
    localItems.length > 0 &&
    effectiveSelectedQueueItemIds.length === localItems.length;

  const handleSelectAll = (checked: boolean) => {
    setSelectedQueueItemIds(
      checked ? localItems.map((item) => item.queueItemId) : [],
    );
  };

  const handleRemoveSelected = async () => {
    if (!onRemoveMany || effectiveSelectedQueueItemIds.length === 0) {
      return;
    }

    await onRemoveMany(effectiveSelectedQueueItemIds);
    setSelectedQueueItemIds([]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !onReorder) {
      return;
    }

    const oldIndex = localItems.findIndex(
      (item) => item.queueItemId === active.id,
    );
    const newIndex = localItems.findIndex(
      (item) => item.queueItemId === over.id,
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const activeQueueItem = localItems[oldIndex];
    const overQueueItem = localItems[newIndex];
    if (
      activeQueueItem.queueStatus !== QueueItemStatus.Pending ||
      overQueueItem.queueStatus !== QueueItemStatus.Pending
    ) {
      return;
    }

    const reordered = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(reordered);
    onReorder(
      reordered
        .filter((item) => item.queueStatus === QueueItemStatus.Pending)
        .map((item) => item.queueItemId),
    );
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <Space
      direction='vertical'
      size='small'
      style={{ width: '100%' }}
    >
      <style>{PLAYING_BARS_CSS}</style>
      <Space
        align='center'
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <Checkbox
          checked={allSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Select all
        </Checkbox>

        {effectiveSelectedQueueItemIds.length > 0 && onRemoveMany && (
          <Popconfirm
            title='Remove selected tracks'
            description={`Remove ${effectiveSelectedQueueItemIds.length} selected track(s) from queue?`}
            onConfirm={handleRemoveSelected}
            okText='Remove'
            cancelText='Cancel'
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              size='small'
              icon={<DeleteOutlined />}
            >
              Remove ({effectiveSelectedQueueItemIds.length})
            </Button>
          </Popconfirm>
        )}
      </Space>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={localItems.map((item) => item.queueItemId)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {localItems.map((item) => (
              <SortableItem
                key={item.queueItemId}
                item={item}
                selected={effectiveSelectedQueueItemIds.includes(
                  item.queueItemId,
                )}
                onSelectChange={handleSelectItem}
                onRemove={onRemove}
                onSkipToTrack={onSkipToTrack}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeItem ? (
            <DragOverlayItem
              item={activeItem}
              selected={effectiveSelectedQueueItemIds.includes(
                activeItem.queueItemId,
              )}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Space>
  );
};
