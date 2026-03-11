import { Tag, Avatar, Dropdown, Button } from 'antd';

/**
 * Icons
 */
import {
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  KeyOutlined,
  UserOutlined,
} from '@ant-design/icons';

/**
 * Types
 */
import type { ColumnsType } from 'antd/es/table';
import type { StaffListItem } from '@/features/brand/types/staffTypes';
import { EntityStatusEnum } from '@/shared/types/commonTypes';

/**
 * Constants
 */
import {
  STAFF_STATUS_COLORS,
  STAFF_STATUS_LABELS,
  STAFF_ROLE_LABEL,
  STAFF_ROLE_COLOR,
} from '@/shared/constants/staffConstants';

type StaffColumnsProps = {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onAssignStore: (id: string) => void;
  onResetPassword: (id: string) => void;
  onToggleStatus: (id: string) => void;
};

export const getStaffColumns = ({
  onView,
  onEdit,
  onAssignStore,
  onResetPassword,
  onToggleStatus,
}: StaffColumnsProps): ColumnsType<StaffListItem> => {
  const getActionItems = (record: StaffListItem) => {
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
        key: 'assign-store',
        label: 'Assign Store',
        icon: <SwapOutlined />,
        onClick: () => onAssignStore(record.id),
      },
      {
        key: 'reset-password',
        label: 'Reset Password',
        icon: <KeyOutlined />,
        onClick: () => onResetPassword(record.id),
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
      title: 'Staff Member',
      key: 'staff',
      render: (_, record) => (
        <div className='flex items-center gap-3'>
          <Avatar
            size={60}
            shape='square'
            style={{
              borderRadius: 5,
            }}
            src={record.avatarUrl}
            icon={<UserOutlined />}
          />
          <div>
            <div className='font-medium'>{record.fullName}</div>
            <div className='text-sm text-gray-500'>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phone: string | null) => phone || '-',
    },
    {
      title: 'Role',
      key: 'role',
      width: 150,
      render: () => <Tag color={STAFF_ROLE_COLOR}>{STAFF_ROLE_LABEL}</Tag>,
    },
    {
      title: 'Assigned Store',
      key: 'store',
      render: (_, record) =>
        record.storeName ? (
          <div>
            <div className='font-medium'>{record.storeName}</div>
          </div>
        ) : (
          <Tag color='default'>Not Assigned</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EntityStatusEnum) => (
        <Tag color={STAFF_STATUS_COLORS[status]}>
          {STAFF_STATUS_LABELS[status]}
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
