import { Button, Dropdown, Tag } from 'antd';
import { BranchesOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import type { Store } from '@/features/admin/types/storeTypes';

type GetColumnsProps = {
  onViewBranches: (storeId: string) => void;
};

export const getStoreColumns = ({
  onViewBranches,
}: GetColumnsProps): ColumnsType<Store> => {
  const getActionMenuItems = (record: Store): MenuProps['items'] => [
    {
      key: 'branches',
      label: 'Branches',
      icon: <BranchesOutlined />,
      onClick: () => onViewBranches(record.id),
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
      title: 'Store Name',
      dataIndex: 'store_name',
      key: 'store_name',
      sorter: (a, b) => a.store_name.localeCompare(b.store_name),
    },
    {
      title: 'Business Type',
      dataIndex: 'business_type',
      key: 'business_type',
      render: (type: string) => <Tag color='blue'>{type.toUpperCase()}</Tag>,
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
