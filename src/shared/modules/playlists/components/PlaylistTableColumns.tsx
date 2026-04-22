import { Space, Tag, Dropdown, Button, type MenuProps } from 'antd';

/**
 * Icons
 */
import {
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
  PlusOutlined,
} from '@ant-design/icons';

/**
 * Utils
 */
import { formatDateTime } from '@/shared/utils';

/**
 * Constants
 */
import { ENTITY_STATUS_LABELS, ENTITY_STATUS_COLORS } from '@/shared/constants';

/**
 * Types
 */
import type { ColumnsType } from 'antd/es/table';
import type { PlaylistListItem } from '@/shared/modules/playlists/types';
import type { EntityStatusEnum } from '@/shared/types';

interface PlaylistColumnActions {
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onAddTracks?: (id: string) => void;
  /** If provided, edit/delete/toggle/addTracks actions are only shown when this returns true */
  isActionAllowed?: (record: PlaylistListItem) => boolean;
  hiddenColumns?: Array<'default'>;
}

export const getPlaylistColumns = ({
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddTracks,
  isActionAllowed,
  hiddenColumns = [],
}: PlaylistColumnActions): ColumnsType<PlaylistListItem> => [
  {
    title: 'No.',
    key: 'index',
    width: 56,
    render: (_text, _record, index) => index + 1,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 220,
    sorter: true,
    render: (name: string, record: PlaylistListItem) => (
      <Space
        direction='vertical'
        size={0}
      >
        <span style={{ fontWeight: 500 }}>{name}</span>
        {!record.storeId && !record.brandId ? (
          <Tag
            color='purple'
            style={{ fontSize: 11, marginTop: 2 }}
          >
            Shared
          </Tag>
        ) : record.storeName ? (
          <span style={{ fontSize: 12, color: '#999' }}>
            Store: {record.storeName}
          </span>
        ) : null}
      </Space>
    ),
  },
  {
    title: 'Mood',
    dataIndex: 'moodName',
    key: 'moodName',
    width: 110,
    render: (moodName: string) =>
      moodName ? <Tag color='blue'>{moodName}</Tag> : '—',
  },
  {
    title: 'Tracks',
    dataIndex: 'trackCount',
    key: 'trackCount',
    width: 88,
    sorter: true,
    align: 'center',
    render: (count: number) => (
      <Tag color={count > 0 ? 'success' : 'default'}>{count}</Tag>
    ),
  },
  {
    title: 'Default',
    dataIndex: 'isDefault',
    key: 'isDefault',
    width: 96,
    align: 'center',
    hidden: hiddenColumns.includes('default'),
    render: (isDefault: boolean) =>
      isDefault ? <Tag color='gold'>Default</Tag> : '—',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 96,
    render: (status: EntityStatusEnum) => (
      <Tag color={ENTITY_STATUS_COLORS[status]}>
        {ENTITY_STATUS_LABELS[status]}
      </Tag>
    ),
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 144,
    sorter: true,
    render: (date: string) => formatDateTime(date),
  },
  {
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: 64,
    render: (_, record: PlaylistListItem) => {
      const menuItems: MenuProps['items'] = [
        {
          key: 'view',
          icon: <EyeOutlined />,
          label: 'View Details',
          onClick: () => onView(record.id),
        },
      ];

      const actionAllowed = !isActionAllowed || isActionAllowed(record);

      // Add management actions if handlers provided
      if (
        actionAllowed &&
        (onEdit || onAddTracks || onToggleStatus || onDelete)
      ) {
        menuItems.push({ type: 'divider' });
      }

      if (onEdit && actionAllowed) {
        menuItems.push({
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Edit',
          onClick: () => onEdit(record.id),
        });
      }

      if (onAddTracks && actionAllowed) {
        menuItems.push({
          key: 'add-tracks',
          icon: <PlusOutlined />,
          label: 'Add Tracks',
          onClick: () => onAddTracks(record.id),
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
        menuItems.push({ type: 'divider' });
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
