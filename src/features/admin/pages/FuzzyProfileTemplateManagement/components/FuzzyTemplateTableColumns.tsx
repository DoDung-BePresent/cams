import { Button, Dropdown, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';

import type { FuzzyProfileTemplateListItem } from '@/features/admin/types';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

type GetColumnsProps = {
  onEdit: (record: FuzzyProfileTemplateListItem) => void;
  onDelete: (record: FuzzyProfileTemplateListItem) => void;
  currentPage: number;
  pageSize: number;
};

export const getFuzzyTemplateColumns = ({
  onEdit,
  onDelete,
  currentPage,
  pageSize,
}: GetColumnsProps): ColumnsType<FuzzyProfileTemplateListItem> => {
  const getActionMenuItems = (
    record: FuzzyProfileTemplateListItem,
  ): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit Template',
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete Template',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(record),
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
      title: 'Display Name',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 200,
      render: (value: string) => (
        <span style={{ fontWeight: 500 }}>{value}</span>
      ),
    },
    {
      title: 'Template Key',
      dataIndex: 'templateKey',
      key: 'templateKey',
      width: 180,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'profileDescription',
      key: 'profileDescription',
      ellipsis: true,
      render: (value: string | null | undefined) =>
        value?.trim() ? (
          value
        ) : (
          <Typography.Text type='secondary'>—</Typography.Text>
        ),
    },
    {
      title: 'Sort Order',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 110,
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (active: boolean) =>
        active ? (
          <Tag color='success'>Active</Tag>
        ) : (
          <Tag color='default'>Inactive</Tag>
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
