import { Button, Dropdown, Tag, Tooltip } from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  NumberOutlined,
  FontSizeOutlined,
  CheckSquareOutlined,
  FieldNumberOutlined,
} from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
  getConfigKeyLabel,
} from '@/features/admin/constants';
import {
  ConfigValueTypeEnum,
  type ConfigDomainEnum,
  type ConfigPolicyRowItem,
  type ConfigTierEnum,
} from '@/features/admin/types';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

type GetPolicyColumnsProps = {
  onView: (record: ConfigPolicyRowItem) => void;
  onEdit: (record: ConfigPolicyRowItem) => void;
};

const getValueTypeIcon = (valueType: ConfigValueTypeEnum) => {
  switch (valueType) {
    case ConfigValueTypeEnum.String:
      return <FontSizeOutlined style={{ color: '#722ed1' }} />;
    case ConfigValueTypeEnum.Number:
      return <NumberOutlined style={{ color: '#1890ff' }} />;
    case ConfigValueTypeEnum.Boolean:
      return <CheckSquareOutlined style={{ color: '#fa8c16' }} />;
    case ConfigValueTypeEnum.DateTime:
      return <FieldNumberOutlined style={{ color: '#52c41a' }} />;
    default:
      return null;
  }
};

export const getConfigPolicyColumns = ({
  onView,
  onEdit,
}: GetPolicyColumnsProps): ColumnsType<ConfigPolicyRowItem> => {
  const getActionMenuItems = (
    record: ConfigPolicyRowItem,
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
      key: 'edit',
      label: 'Edit Policy',
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
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
      width: 300,
      ellipsis: true,
      render: (value: string) => {
        const label = getConfigKeyLabel(value);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 500 }}>{value}</span>
            {label && value !== label && (
              <Tag style={{ marginInlineEnd: 0 }}>{label}</Tag>
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
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
      render: (tier: ConfigTierEnum) => (
        <Tag color={tier === 0 ? 'red' : 'gold'}>
          {CONFIG_TIER_LABELS[tier]}
        </Tag>
      ),
    },
    {
      title: 'Default Type',
      dataIndex: 'defaultValueType',
      key: 'defaultValueType',
      width: 100,
      render: (valueType: ConfigValueTypeEnum) => (
        <Tooltip title={CONFIG_VALUE_TYPE_LABELS[valueType]}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {getValueTypeIcon(valueType)}
            <span>{CONFIG_VALUE_TYPE_LABELS[valueType]}</span>
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Default Value',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: 100,
      ellipsis: true,
      render: (value?: string | null) => value || '—',
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
