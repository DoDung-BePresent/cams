import { Tag, Image, Dropdown, Button, type MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * Icons
 */
import {
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import { MusicIcon } from 'lucide-react';
import { TitleCell } from './TitleCell';

/**
 * Utils
 */
import { formatDuration } from '@/shared/utils';

/**
 * Constants
 */

import {
  COPYRIGHT_CLEARANCE_COLORS,
  COPYRIGHT_CLEARANCE_LABELS,
} from '@/shared/modules/tracks/constants';

/**
 * Types
 */
import type {
  TrackCopyrightClearanceStatus,
  TrackListItem,
} from '@/shared/modules/tracks/types';

interface TrackColumnActions {
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onPreview?: (id: string) => void;
  /** If provided, edit/delete/toggle actions are only shown when this returns true */
  isActionAllowed?: (record: TrackListItem) => boolean;
}

const MOOD_COLORS = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
];

const getMoodColor = (mood: string) => {
  if (!mood) return 'default';

  const lowerMood = mood.toLowerCase();
  if (lowerMood.includes('social') || lowerMood.includes('party'))
    return 'volcano';
  if (lowerMood.includes('romant') || lowerMood.includes('love'))
    return 'magenta';
  if (lowerMood.includes('focus') || lowerMood.includes('study'))
    return 'geekblue';
  if (lowerMood.includes('calm') || lowerMood.includes('relax')) return 'green';
  if (lowerMood.includes('sad') || lowerMood.includes('chill')) return 'purple';
  if (lowerMood.includes('happy') || lowerMood.includes('joy')) return 'gold';
  if (lowerMood.includes('energ') || lowerMood.includes('workout'))
    return 'orange';

  let hash = 0;
  for (let i = 0; i < mood.length; i++) {
    hash = mood.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MOOD_COLORS[Math.abs(hash) % MOOD_COLORS.length];
};

export const getTrackColumns = ({
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  isActionAllowed,
}: TrackColumnActions): ColumnsType<TrackListItem> => [
  {
    title: 'No.',
    key: 'index',
    width: 70,
    render: (_text, _record, index) => index + 1,
  },
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
    width: 280,
    sorter: true,
    render: (_title: string, record: TrackListItem) => (
      <TitleCell record={record} />
    ),
  },
  {
    title: 'Mood',
    dataIndex: 'moodName',
    key: 'moodName',
    width: 120,
    render: (moodName: string) =>
      moodName && <Tag color={getMoodColor(moodName)}>{moodName}</Tag>,
  },
  {
    title: 'Duration',
    dataIndex: 'durationSec',
    key: 'durationSec',
    width: 120,
    sorter: true,
    render: (duration: number) => formatDuration(duration),
  },
  {
    title: 'Copyright',
    dataIndex: 'copyrightClearanceStatus',
    key: 'copyrightClearanceStatus',
    width: 140,
    render: (status: TrackCopyrightClearanceStatus) => (
      <Tag color={COPYRIGHT_CLEARANCE_COLORS[status]}>
        {COPYRIGHT_CLEARANCE_LABELS[status]}
      </Tag>
    ),
  },

  {
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: 100,
    render: (_, record: TrackListItem) => {
      const menuItems: MenuProps['items'] = [
        {
          key: 'view',
          icon: <EyeOutlined />,
          label: 'View Details',
          onClick: () => onView(record.id),
        },
      ];

      const actionAllowed = !isActionAllowed || isActionAllowed(record);

      if (onEdit || onToggleStatus || onDelete) {
        if (actionAllowed) menuItems.push({ type: 'divider' });
      }

      if (onEdit && actionAllowed) {
        menuItems.push({
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Edit',
          onClick: () => onEdit(record.id),
        });
      }

      if (onToggleStatus && actionAllowed) {
        menuItems.push({
          key: 'toggle',
          icon: <PoweroffOutlined />,
          label: record.status === 1 ? 'Deactivate' : 'Activate',
          onClick: () => onToggleStatus(record.id),
        });
      }

      if (onDelete && actionAllowed) {
        if (onEdit || onToggleStatus) {
          menuItems.push({ type: 'divider' });
        }
        menuItems.push({
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Delete',
          danger: true,
          onClick: () => onDelete(record.id),
        });
      }

      return (
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
        >
          <Button
            type='text'
            icon={<MoreOutlined />}
          />
        </Dropdown>
      );
    },
  },
];
