import { Button, Dropdown, Tag } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import type { StoreUser } from '@/features/admin/types/userTypes';
import {
  USER_STATUS_COLORS,
  USER_STATUS_LABELS,
} from '@/features/admin/constants/userConstants';

type GetColumnsProps = {
  onResendInvite: (userId: string) => void;
  onChangeRole: (userId: string) => void;
  onSuspend: (userId: string) => void;
  onReactivate: (userId: string) => void;
};

export const getStoreManagersColumns = ({
  onResendInvite,
  onChangeRole,
  onSuspend,
  onReactivate,
}: GetColumnsProps): ColumnsType<StoreUser> => {
  const getActionMenuItems = (record: StoreUser): MenuProps['items'] => {
    const baseItems: MenuProps['items'] = [
      {
        key: 'change-role',
        label: 'Change Role',
        onClick: () => onChangeRole(record.id),
      },
    ];

    if (record.status === 'INVITED') {
      baseItems.unshift({
        key: 'resend-invite',
        label: 'Resend Invite',
        onClick: () => onResendInvite(record.id),
      });
    }

    if (record.status === 'ACTIVE') {
      baseItems.push({
        key: 'suspend',
        label: 'Suspend',
        onClick: () => onSuspend(record.id),
        danger: true,
      });
    }

    if (record.status === 'SUSPENDED') {
      baseItems.push({
        key: 'reactivate',
        label: 'Reactivate',
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => name || record.email.split('@')[0],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color='blue'>
          {role === 'STORE_MANAGER' ? 'Store Manager' : 'Branch Manager'}
        </Tag>
      ),
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
