import { Button, Dropdown, Tag } from 'antd';
import {
  EyeOutlined,
  MailOutlined,
  MoreOutlined,
  StopOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import type { User } from '@/features/admin/types/userTypes';
import {
  USER_STATUS_COLORS,
  USER_STATUS_LABELS,
} from '@/features/admin/constants/userConstants';

type GetColumnsProps = {
  onViewDetail: (userId: string) => void;
  onResendInvite: (userId: string) => void;
  onSuspend: (userId: string) => void;
  onReactivate: (userId: string) => void;
};

export const getUserColumns = ({
  onViewDetail,
  onResendInvite,
  onSuspend,
  onReactivate,
}: GetColumnsProps): ColumnsType<User> => {
  const getActionMenuItems = (record: User): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => onViewDetail(record.id),
      },
    ];

    if (record.status === 'INVITED') {
      baseItems.push({
        key: 'resend-invite',
        label: 'Resend Invite',
        icon: <MailOutlined />,
        onClick: () => onResendInvite(record.id),
      });
    }

    if (record.status === 'ACTIVE') {
      baseItems.push({
        key: 'suspend',
        label: 'Suspend',
        icon: <StopOutlined />,
        onClick: () => onSuspend(record.id),
        danger: true,
      });
    }

    if (record.status === 'SUSPENDED') {
      baseItems.push({
        key: 'reactivate',
        label: 'Reactivate',
        icon: <UndoOutlined />,
        onClick: () => onReactivate(record.id),
      });
    }

    return baseItems;
  };

  return [
    {
      title: 'No.',
      key: 'index',
      width: 70,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => name || record.email.split('@')[0],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap = {
          ADMIN: 'Admin',
          STORE_MANAGER: 'Store Manager',
          BRANCH_MANAGER: 'Branch Manager',
        };
        return <Tag color='blue'>{roleMap[role as keyof typeof roleMap]}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof USER_STATUS_COLORS) => (
        <Tag color={USER_STATUS_COLORS[status]}>
          {USER_STATUS_LABELS[status]}
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
