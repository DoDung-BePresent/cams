import { Button, Dropdown, Tag, Tooltip } from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  MoreOutlined,
} from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_KEY_META,
  CONFIG_SCOPE_LABELS,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
} from '@/features/admin/constants';
import type {
  ConfigDomainEnum,
  ConfigFlatRowItem,
  ConfigScopeTypeEnum,
  ConfigTierEnum,
  ConfigValueTypeEnum,
} from '@/features/admin/types';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

type GetColumnsProps = {
  onView: (record: ConfigFlatRowItem) => void;
  onEditSystemValue: (record: ConfigFlatRowItem) => void;
  currentPage: number;
  pageSize: number;
};

export const getConfigColumns = ({
  onView,
  onEditSystemValue,
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
      key: 'edit-system-value',
      label: 'Edit System Value',
      icon: <EditOutlined />,
      onClick: () => onEditSystemValue(record),
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
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      sorter: true,
      width: 300,
      ellipsis: true,
      render: (value: string) => {
        const meta = CONFIG_KEY_META[value];
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 500 }}>{value}</span>
            {meta?.label && value !== meta.label && (
              <Tag style={{ marginInlineEnd: 0 }}>{meta.label}</Tag>
            )}
            {meta?.hardLocked && (
              <Tooltip title='Hard-locked — only writable by System Admin via policy'>
                <LockOutlined style={{ color: '#ff4d4f' }} />
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      width: 100,
      render: (domain: ConfigDomainEnum) => CONFIG_DOMAIN_LABELS[domain],
    },
    {
      title: 'Scope',
      dataIndex: 'scopeType',
      key: 'scopeType',
      width: 100,
      render: (scopeType: ConfigScopeTypeEnum) => (
        <Tag color='blue'>{CONFIG_SCOPE_LABELS[scopeType]}</Tag>
      ),
    },
    {
      title: 'System Value',
      dataIndex: 'value',
      key: 'value',
      width: 100,
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
      title: 'Default Type',
      dataIndex: 'policyDefaultValueType',
      key: 'policyDefaultValueType',
      width: 130,
      render: (valueType?: ConfigValueTypeEnum | null) => {
        if (valueType === null || valueType === undefined) {
          return '-';
        }
        return CONFIG_VALUE_TYPE_LABELS[valueType];
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
