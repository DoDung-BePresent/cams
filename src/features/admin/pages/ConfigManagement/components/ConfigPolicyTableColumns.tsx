import { Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
} from '@/features/admin/constants';
import type {
  ConfigDomainEnum,
  ConfigPolicyRowItem,
  ConfigTierEnum,
  ConfigValueTypeEnum,
} from '@/features/admin/types';
import type { ColumnsType } from 'antd/es/table';

type GetPolicyColumnsProps = {
  onEdit: (record: ConfigPolicyRowItem) => void;
};

export const getConfigPolicyColumns = ({
  onEdit,
}: GetPolicyColumnsProps): ColumnsType<ConfigPolicyRowItem> => {
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
      width: 320,
      ellipsis: true,
      render: (value: string) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      width: 140,
      render: (domain: ConfigDomainEnum) => CONFIG_DOMAIN_LABELS[domain],
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 120,
      render: (tier: ConfigTierEnum) => CONFIG_TIER_LABELS[tier],
    },
    {
      title: 'Default Type',
      dataIndex: 'defaultValueType',
      key: 'defaultValueType',
      width: 150,
      render: (valueType: ConfigValueTypeEnum) =>
        CONFIG_VALUE_TYPE_LABELS[valueType],
    },
    {
      title: 'Default Value',
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      ellipsis: true,
      render: (value?: string | null) => value || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button
          size='large'
          type='text'
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];
};
