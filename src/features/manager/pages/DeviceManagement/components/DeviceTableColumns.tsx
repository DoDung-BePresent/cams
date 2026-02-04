import { Button, Dropdown, Tag, Tooltip, Typography } from 'antd';
import {
  MoreOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import type { Device } from '@/features/manager/types/deviceTypes';
import {
  DEVICE_STATUS_COLORS,
  DEVICE_STATUS_LABELS,
} from '@/features/manager/constants/deviceConstants';

const { Text } = Typography;

type GetColumnsProps = {
  onUnpair: (deviceId: string) => void;
  onDelete: (deviceId: string) => void;
};

export const getDeviceColumns = ({
  onUnpair,
  onDelete,
}: GetColumnsProps): ColumnsType<Device> => {
  const getActionMenuItems = (record: Device): MenuProps['items'] => {
    const items: MenuProps['items'] = [];

    if (record.status === 'paired' || record.status === 'active') {
      items.push({
        key: 'unpair',
        label: 'Unpair Device',
        icon: <DisconnectOutlined />,
        onClick: () => onUnpair(record.id),
      });
    }

    items.push({
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => onDelete(record.id),
      danger: true,
    });

    return items;
  };

  return [
    {
      title: 'No.',
      key: 'index',
      width: 70,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Device ID',
      dataIndex: 'device_id',
      key: 'device_id',
      render: (id: string) => (
        <Tooltip title={id}>
          <code className='text-xs'>{id.substring(0, 12)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'device_type',
      key: 'device_type',
      render: (type: string) => (
        <Tag color={type === 'android' ? 'green' : 'blue'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Space',
      dataIndex: 'space_name',
      key: 'space_name',
      render: (name?: string) => name || <Text type='secondary'>-</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof DEVICE_STATUS_COLORS) => (
        <Tag
          icon={status === 'active' ? <WifiOutlined /> : undefined}
          color={DEVICE_STATUS_COLORS[status]}
        >
          {DEVICE_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: 'Last Connected',
      dataIndex: 'last_connected_at',
      key: 'last_connected_at',
      render: (date?: string) =>
        date ? (
          new Date(date).toLocaleString()
        ) : (
          <Text type='secondary'>Never</Text>
        ),
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
