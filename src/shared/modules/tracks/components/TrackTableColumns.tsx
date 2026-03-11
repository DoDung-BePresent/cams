import { Space, Tag, Image, Dropdown, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import { MusicIcon } from 'lucide-react';
import { formatDuration } from '@/shared/utils/uploadHelpers';
import { formatDateTime } from '@/shared/utils/formHelpers';
import { ENTITY_STATUS_LABELS, ENTITY_STATUS_COLORS } from '@/shared/constants';
import { MUSIC_PROVIDER_LABELS, MUSIC_PROVIDER_COLORS } from '../constants';
import type { TrackListItem } from '../types';

interface TrackColumnActions {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onPreview: (id: string) => void;
}

export const getTrackColumns = ({
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onPreview,
}: TrackColumnActions): ColumnsType<TrackListItem> => [
  {
    title: 'Cover',
    dataIndex: 'coverImageUrl',
    key: 'coverImageUrl',
    width: 80,
    render: (url: string) =>
      url ? (
        <Image
          src={url}
          alt='Cover'
          width={50}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
        />
      ) : (
        <div
          style={{
            width: 50,
            height: 50,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f0f0f0',
            borderRadius: 4,
          }}
        >
          <MusicIcon style={{ fontSize: 20, color: '#999' }} />
        </div>
      ),
  },
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    width: 250,
    sorter: true,
    render: (title: string, record: TrackListItem) => (
      <Space
        direction='vertical'
        size={0}
      >
        <span style={{ fontWeight: 500 }}>{title}</span>
        {record.artist && (
          <span style={{ fontSize: 12, color: '#999' }}>{record.artist}</span>
        )}
      </Space>
    ),
  },
  {
    title: 'Genre',
    dataIndex: 'genre',
    key: 'genre',
    width: 120,
    render: (genre: string) => genre && <Tag>{genre}</Tag>,
  },
  {
    title: 'Mood',
    dataIndex: 'moodName',
    key: 'moodName',
    width: 120,
    render: (moodName: string) =>
      moodName && <Tag color='blue'>{moodName}</Tag>,
  },
  {
    title: 'Duration',
    dataIndex: 'durationSec',
    key: 'durationSec',
    width: 100,
    sorter: true,
    render: (duration: number) => formatDuration(duration),
  },
  {
    title: 'Provider',
    dataIndex: 'provider',
    key: 'provider',
    width: 120,
    render: (provider: number) =>
      provider !== undefined && (
        <Tag color={MUSIC_PROVIDER_COLORS[provider]}>
          {MUSIC_PROVIDER_LABELS[provider]}
        </Tag>
      ),
  },
  {
    title: 'Plays',
    dataIndex: 'playCount',
    key: 'playCount',
    width: 100,
    sorter: true,
    align: 'right',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: number) => (
      <Tag color={ENTITY_STATUS_COLORS[status]}>
        {ENTITY_STATUS_LABELS[status]}
      </Tag>
    ),
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    sorter: true,
    render: (date: string) => formatDateTime(date),
  },
  {
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: 80,
    render: (_, record: TrackListItem) => (
      <Dropdown
        menu={{
          items: [
            {
              key: 'view',
              icon: <EyeOutlined />,
              label: 'View Details',
              onClick: () => onView(record.id),
            },
            {
              key: 'preview',
              icon: <PlayCircleOutlined />,
              label: 'Preview Audio',
              onClick: () => onPreview(record.id),
              disabled: !record.audioUrl,
            },
            { type: 'divider' },
            {
              key: 'edit',
              icon: <EditOutlined />,
              label: 'Edit',
              onClick: () => onEdit(record.id),
            },
            {
              key: 'toggle',
              icon: <PoweroffOutlined />,
              label: record.status === 1 ? 'Deactivate' : 'Activate',
              onClick: () => onToggleStatus(record.id),
            },
            { type: 'divider' },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: 'Delete',
              danger: true,
              onClick: () => onDelete(record.id),
            },
          ],
        }}
        trigger={['click']}
      >
        <Button
          type='text'
          icon={<MoreOutlined />}
        />
      </Dropdown>
    ),
  },
];
