import { Tag, Button, Space, Tooltip } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

/**
 * Types
 */
import type { SpaceListItem } from '@/features/store/types';
import { EntityStatusEnum } from '@/shared/types/commonTypes';

/**
 * Constants
 */
import {
  SPACE_TYPE_LABELS,
  SPACE_TYPE_COLORS,
} from '@/features/store/constants';

type SpaceColumnActions = {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
};

export const getSpaceColumns = ({
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: SpaceColumnActions): ColumnsType<SpaceListItem> => [
  {
    title: 'Space Name',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    fixed: 'left',
    sorter: true,
    render: (name: string) => <strong>{name}</strong>,
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    width: 120,
    render: (type: number) => (
      <Tag color={SPACE_TYPE_COLORS[type]}>{SPACE_TYPE_LABELS[type]}</Tag>
    ),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    width: 250,
    ellipsis: true,
    render: (description?: string) => description || '-',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: EntityStatusEnum) => (
      <Tag color={status === EntityStatusEnum.Active ? 'success' : 'default'}>
        {status === EntityStatusEnum.Active ? 'Active' : 'Inactive'}
      </Tag>
    ),
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 150,
    sorter: true,
    render: (date: string) => dayjs(date).format('MMM D, YYYY'),
  },
  {
    title: 'Updated At',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 150,
    sorter: true,
    render: (date: string) => dayjs(date).format('MMM D, YYYY'),
  },
  {
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: 200,
    render: (_, record) => (
      <Space size='small'>
        <Tooltip title='View Details'>
          <Button
            type='text'
            size='small'
            icon={<EyeOutlined />}
            onClick={() => onView(record.id)}
          />
        </Tooltip>
        <Tooltip title='Edit Space'>
          <Button
            type='text'
            size='small'
            icon={<EditOutlined />}
            onClick={() => onEdit(record.id)}
          />
        </Tooltip>
        <Tooltip title='Toggle Status'>
          <Button
            type='text'
            size='small'
            icon={<PoweroffOutlined />}
            onClick={() => onToggleStatus(record.id)}
            danger={record.status === EntityStatusEnum.Active}
          />
        </Tooltip>
        <Tooltip title='Delete Space'>
          <Button
            type='text'
            size='small'
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record.id)}
            danger
          />
        </Tooltip>
      </Space>
    ),
  },
];
