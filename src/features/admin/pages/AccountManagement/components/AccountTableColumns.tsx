import { Button, Dropdown, Tag, Avatar } from 'antd';

/**
 * Icons
 */
import {
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  LockOutlined,
  SwapOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  CrownOutlined,
} from '@ant-design/icons';

/**
 * Types
 */
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { EntityStatusEnum, RoleEnum } from '@/shared/types';
import type { AccountListItem } from '@/features/admin/types';

/**
 * Constants
 */
import {
  ACCOUNT_STATUS_COLORS,
  ACCOUNT_STATUS_LABELS,
} from '@/features/admin/constants';

type GetColumnsProps = {
  onView: (accountId: string) => void;
  onEdit: (account: AccountListItem) => void;
  onToggleStatus: (accountId: string) => void;
  onResetPassword: (accountId: string) => void;
  onAssignBrand: (accountId: string) => void;
};

export const getAccountColumns = ({
  onView,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onAssignBrand,
}: GetColumnsProps): ColumnsType<AccountListItem> => {
  const getActionMenuItems = (record: AccountListItem): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => onView(record.id),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'edit',
        label: 'Edit Profile',
        icon: <EditOutlined />,
        onClick: () => onEdit(record),
      },
      {
        key: 'reset-password',
        label: 'Reset Password',
        icon: <LockOutlined />,
        onClick: () => onResetPassword(record.id),
      },
    ];

    // Only show "Assign Brand" for BrandManager
    if (record.roles.includes(RoleEnum.BrandManager)) {
      items.push({
        key: 'assign-brand',
        label: 'Assign Brand',
        icon: <SwapOutlined />,
        onClick: () => onAssignBrand(record.id),
      });
    }

    items.push({
      type: 'divider' as const,
    });

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
      title: 'Account',
      key: 'account',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            src={record.avatarUrl}
            size={60}
            shape='square'
            style={{
              borderRadius: 5,
            }}
          >
            {record.firstName?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 500 }}>{record.fullName}</span>
              {record.isPrimaryOwner && (
                <Tag
                  icon={<CrownOutlined />}
                  color='gold'
                >
                  Primary Owner
                </Tag>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
            {record.phoneNumber && (
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                {record.phoneNumber}
              </div>
            )}
          </div>
        </div>
      ),
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Brand',
      dataIndex: 'brandName',
      key: 'brandName',
      width: 200,
      render: (name: string | null) =>
        name || <span style={{ color: '#8c8c8c' }}>Not Assigned</span>,
      sorter: (a, b) => (a.brandName || '').localeCompare(b.brandName || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EntityStatusEnum) => (
        <Tag color={ACCOUNT_STATUS_COLORS[status]}>
          {ACCOUNT_STATUS_LABELS[status]}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: EntityStatusEnum.Active },
        { text: 'Inactive', value: EntityStatusEnum.Inactive },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 150,
      render: (date: string | null) =>
        date ? (
          new Date(date).toLocaleDateString('en-GB')
        ) : (
          <span style={{ color: '#8c8c8c' }}>Never</span>
        ),
      sorter: (a, b) => {
        if (!a.lastLoginAt) return 1;
        if (!b.lastLoginAt) return -1;
        return (
          new Date(a.lastLoginAt).getTime() - new Date(b.lastLoginAt).getTime()
        );
      },
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
