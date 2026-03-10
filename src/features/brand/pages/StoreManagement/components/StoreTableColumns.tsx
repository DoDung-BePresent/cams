import { Tag, Space, Dropdown, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { StoreListItem } from '@/features/brand/types/storeTypes';
import { EntityStatusEnum } from '@/shared/types/commonTypes';
import {
  STORE_STATUS_COLORS,
  STORE_STATUS_LABELS,
} from '@/features/brand/constants/storeStatusConstants';

type StoreColumnsProps = {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
};

export const getStoreColumns = ({
  onView,
  onEdit,
  onToggleStatus,
}: StoreColumnsProps): ColumnsType<StoreListItem> => {
  const getActionItems = (record: StoreListItem) => {
    const items: any[] = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => onView(record.id),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        onClick: () => onEdit(record.id),
      },
      {
        type: 'divider',
      },
    ];

    // Toggle status
    if (record.status === EntityStatusEnum.Active) {
      items.push({
        key: 'deactivate',
        label: 'Deactivate',
        icon: <PoweroffOutlined />,
        onClick: () => onToggleStatus(record.id),
        danger: true,
      });
    } else {
      items.push({
        key: 'activate',
        label: 'Activate',
        icon: <CheckCircleOutlined />,
        onClick: () => onToggleStatus(record.id),
      });
    }

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
      title: 'Store Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <div>
          {record.address && <div>{record.address}</div>}
          {(record.district || record.city) && (
            <div className='text-sm text-gray-500'>
              {[record.district, record.city].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'contactNumber',
      key: 'contactNumber',
      render: (contact: string | null) => contact || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EntityStatusEnum) => (
        <Tag color={STORE_STATUS_COLORS[status]}>
          {STORE_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionItems(record) }}
          trigger={['click']}
          placement='bottomRight'
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
