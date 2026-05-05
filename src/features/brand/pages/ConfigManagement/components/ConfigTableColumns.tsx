import { Button, Dropdown, Tag, Tooltip } from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  MoreOutlined,
  NumberOutlined,
  FontSizeOutlined,
  CheckSquareOutlined,
  FieldNumberOutlined,
} from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_SCOPE_LABELS,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
} from '@/features/brand/constants/configConstants';
import { CONFIG_KEY_META } from '@/features/admin/constants';
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
  currentPage: number;
  pageSize: number;
};

const getValueTypeIcon = (valueType: ConfigValueTypeEnum) => {
  switch (valueType) {
    case 1: // String
      return <FontSizeOutlined style={{ color: '#722ed1' }} />;
    case 2: // Number
      return <NumberOutlined style={{ color: '#1890ff' }} />;
    case 3: // Boolean
      return <CheckSquareOutlined style={{ color: '#fa8c16' }} />;
    case 4: // DateTime
      return <FieldNumberOutlined style={{ color: '#52c41a' }} />;
    default:
      return null;
  }
};

export const getConfigColumns = ({
  onView,
  onEditBrandValue,
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
      key: 'edit-brand-value',
      label: 'Edit Value',
      icon: <EditOutlined />,
      onClick: () => onEditBrandValue(record),
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
      title: 'Config',
      dataIndex: 'key',
      key: 'key',
      sorter: true,
      width: 300,
      ellipsis: true,
      render: (value: string) => {
        const meta = CONFIG_KEY_META[value];
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>{meta?.label ?? value}</span>
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
      title: 'Default Type',
      dataIndex: 'policyDefaultValueType',
      key: 'policyDefaultValueType',
      width: 130,
      render: (valueType?: ConfigValueTypeEnum | null) => {
        if (valueType === null || valueType === undefined) {
          return '—';
        }
        return (
          <Tooltip title={CONFIG_VALUE_TYPE_LABELS[valueType]}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {getValueTypeIcon(valueType)}
              <span>{CONFIG_VALUE_TYPE_LABELS[valueType]}</span>
            </span>
          </Tooltip>
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
