import { Button, Dropdown, Tag } from 'antd';
import { EditOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_SCOPE_LABELS,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
} from '@/features/brand/constants/configConstants';
import type {
  ConfigDomainEnum,
  ConfigFlatRowItem,
  ConfigScopeTypeEnum,
  ConfigTierEnum,
  ConfigValueTypeEnum,
} from '@/features/brand/types';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

type GetColumnsProps = {
  onView: (record: ConfigFlatRowItem) => void;
  onEditBrandValue: (record: ConfigFlatRowItem) => void;
};

export const getConfigColumns = ({
  onView,
  onEditBrandValue,
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
      key: 'edit-brand-value',
      label: 'Upsert Brand Value',
      icon: <EditOutlined />,
      onClick: () => onEditBrandValue(record),
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
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      sorter: true,
      width: 280,
      ellipsis: true,
      render: (value: string) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
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
      title: 'Brand Value',
      dataIndex: 'value',
      key: 'value',
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
      ellipsis: true,
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Allow Store Override',
      dataIndex: 'allowStoreOverride',
      key: 'allowStoreOverride',
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
