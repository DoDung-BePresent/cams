import { Button, Dropdown, Tag } from 'antd';
import { EditOutlined, MoreOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import type { Space } from '@/features/manager/types/spaceTypes';
import {
  DEVICE_STATUS_COLORS,
  DEVICE_STATUS_LABELS,
} from '@/features/manager/constants/spaceConstants';

type GetColumnsProps = {
  onEdit: (space: Space) => void;
  onDelete: (spaceId: string) => void;
};

export const getSpaceColumns = ({
  onEdit,
  onDelete,
}: GetColumnsProps): ColumnsType<Space> => {
  const getActionMenuItems = (record: Space): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => onDelete(record.id),
      danger: true,
    },
  ];

  return [
    {
      title: 'No.',
      key: 'index',
      width: 70,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Space Name',
      dataIndex: 'space_name',
      key: 'space_name',
      sorter: (a, b) => a.space_name.localeCompare(b.space_name),
    },
    {
      title: 'Space Code',
      dataIndex: 'space_code',
      key: 'space_code',
      render: (code: string) => <Tag color='cyan'>{code}</Tag>,
    },
    {
      title: 'Device Status',
      key: 'device_status',
      render: (_, record) => {
        if (!record.device_id) {
          return <Tag color='default'>No Device</Tag>;
        }
        const status = record.device_status || 'disconnected';
        return (
          <Tag color={DEVICE_STATUS_COLORS[status]}>
            {DEVICE_STATUS_LABELS[status]}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          placement='bottomRight'
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
};
