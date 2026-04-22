import { Button, Dropdown, Tag, Tooltip } from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  MoreOutlined,
} from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_SCOPE_LABELS,
  CONFIG_TIER_LABELS,
} from '@/features/store/constants/configConstants';
import { CONFIG_KEY_META } from '@/features/admin/constants';
import type {
  ConfigDomainEnum,
  ConfigFlatRowItem,
  ConfigScopeTypeEnum,
  ConfigTierEnum,
} from '@/features/store/types';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

type GetColumnsProps = {
  onView: (record: ConfigFlatRowItem) => void;
  onEditStoreValue: (record: ConfigFlatRowItem) => void;
  currentPage: number;
  pageSize: number;
};

export const getConfigColumns = ({
  onView,
  onEditStoreValue,
  currentPage,
  pageSize,
}: GetColumnsProps): ColumnsType<ConfigFlatRowItem> => {
  const getActionMenuItems = (
    record: ConfigFlatRowItem,
  ): MenuProps['items'] => [
    {
      key: 'view',
      label: 'View Details',
      icon: <EyeOutlined />,
      onClick: () => onView(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'edit-store-value',
      label: 'Upsert Store Value',
      icon: <EditOutlined />,
      onClick: () => onEditStoreValue(record),
    },
  ];

  return [
    {
      title: 'No.',
      key: 'index',
      width: 70,
      render: (_text, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Setting',
      dataIndex: 'key',
      key: 'key',
      sorter: true,
      width: 300,
      ellipsis: true,
      render: (value: string) => {
        const meta = CONFIG_KEY_META[value];
        return (
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 500 }}>{meta?.label || value}</span>
              {meta?.hardLocked && (
                <Tooltip title='Hard-locked - only writable by System Admin via policy'>
                  <LockOutlined style={{ color: '#ff4d4f' }} />
                </Tooltip>
              )}
            </span>
            {meta?.label && meta.label !== value && (
              <span style={{ fontSize: 12, color: '#999' }}>{value}</span>
            )}
          </span>
        );
      },
    },
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      width: 130,
      render: (domain: ConfigDomainEnum) => CONFIG_DOMAIN_LABELS[domain],
    },
    {
      title: 'Scope',
      dataIndex: 'scopeType',
      key: 'scopeType',
      width: 110,
      render: (scopeType: ConfigScopeTypeEnum) => (
        <Tag color='blue'>{CONFIG_SCOPE_LABELS[scopeType]}</Tag>
      ),
    },
    {
      title: 'Store Value',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      ellipsis: true,
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Policy Tier',
      dataIndex: 'policyTier',
      key: 'policyTier',
      width: 120,
      render: (tier?: ConfigTierEnum | null) => {
        if (tier === null || tier === undefined) {
          return '-';
        }
        return (
          <Tag color={tier === 0 ? 'red' : 'gold'}>
            {CONFIG_TIER_LABELS[tier]}
          </Tag>
        );
      },
    },
    {
      title: 'Policy Default',
      dataIndex: 'policyDefaultValue',
      key: 'policyDefaultValue',
      width: 120,
      ellipsis: true,
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Allow Space Override',
      dataIndex: 'allowSpaceOverride',
      key: 'allowSpaceOverride',
      width: 160,
      render: (value?: boolean | null) => {
        if (value === null || value === undefined) {
          return '-';
        }
        return (
          <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
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
