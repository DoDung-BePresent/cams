import { Button, Dropdown, Tag, Avatar, Space } from 'antd';

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
  TeamOutlined,
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

/**
 * Configs
 */
import { AVATAR_SIZE } from '@/config';

type GetColumnsProps = {
  onView: (accountId: string) => void;
  onEdit: (account: AccountListItem) => void;
  onToggleStatus: (accountId: string) => void;
  onResetPassword: (accountId: string) => void;
  onAssignBrand: (accountId: string) => void;
};

const getActionMenuItems = (
  record: AccountListItem,
  handlers: GetColumnsProps,
): MenuProps['items'] => {
  const items: MenuProps['items'] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <EyeOutlined />,
      onClick: () => handlers.onView(record.id),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'edit',
      label: 'Edit Profile',
      icon: <EditOutlined />,
      onClick: () => handlers.onEdit(record),
    },
    {
      key: 'reset-password',
      label: 'Reset Password',
      icon: <LockOutlined />,
      onClick: () => handlers.onResetPassword(record.id),
    },
  ];

  // Only show "Assign Brand" for BrandManager
  if (record.roles.includes(RoleEnum.BrandManager)) {
    items.push({
      key: 'assign-brand',
      label: 'Assign Brand',
      icon: <SwapOutlined />,
      onClick: () => handlers.onAssignBrand(record.id),
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
      onClick: () => handlers.onToggleStatus(record.id),
      danger: true,
    });
  } else {
    items.push({
      key: 'activate',
      label: 'Activate',
      icon: <CheckCircleOutlined />,
      onClick: () => handlers.onToggleStatus(record.id),
    });
  }

  return items;
};

/**
 * Columns for GROUP ROWS (Brand summary)
 * Only show: No., Brand (logo + name + count)
 */
export const getGroupColumns = (): ColumnsType<AccountListItem> => [
  {
    title: 'No.',
    key: 'index',
    width: 70,
    render: (_text, _record, index) => index + 1,
  },
  {
    title: 'Brand',
    key: 'brand',
    render: (_, record) => (
      <Space size={12}>
        <Avatar
          src={record.brandLogoUrl}
          size={AVATAR_SIZE.medium}
          shape='square'
          style={{ borderRadius: 8 }}
        >
          {record.brandName?.charAt(0).toUpperCase() || '?'}
        </Avatar>
        <div>
          <div style={{ fontWeight: 500, fontSize: 16 }}>
            {record.brandName || 'Unassigned Accounts'}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            <TeamOutlined style={{ marginRight: 4 }} />
            {record.children?.length || 0}{' '}
            {record.children?.length === 1 ? 'manager' : 'managers'}
          </div>
        </div>
      </Space>
    ),
  },
];

/**
 * Columns for EXPANDED ROWS (Individual managers)
 */
export const getExpandedColumns = (
  handlers: GetColumnsProps,
): ColumnsType<AccountListItem> => [
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
          size={AVATAR_SIZE.medium}
          shape='square'
          style={{ borderRadius: 5 }}
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
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status: EntityStatusEnum) => (
      <Tag color={ACCOUNT_STATUS_COLORS[status]}>
        {ACCOUNT_STATUS_LABELS[status]}
      </Tag>
    ),
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
        menu={{ items: getActionMenuItems(record, handlers) }}
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
