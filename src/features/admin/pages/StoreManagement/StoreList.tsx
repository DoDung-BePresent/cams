import { useState } from 'react';
import { Button, Card, Flex, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Store } from '@/features/admin/types/storeTypes';
import { AddStoreDrawer } from '@/features/admin/components/StoreManagement/AddStoreDrawer';

const { Title } = Typography;

export const StoreList = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      store_name: 'Moonlight Coffee',
      business_type: 'cafe',
      description: 'A cozy coffee brand focusing on chill experience',
      manager_emails: [
        'manager1@moonlightcoffee.com',
        'manager2@moonlightcoffee.com',
      ],
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ]);

  const columns: ColumnsType<Store> = [
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
      title: 'Managers',
      dataIndex: 'manager_emails',
      key: 'manager_emails',
      render: (emails: string[]) => <span>{emails.length} manager(s)</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const handleAddStore = (newStore: any) => {
    const store: Store = {
      id: String(stores.length + 1),
      ...newStore,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStores([...stores, store]);
  };

  return (
    <div>
      <Flex
        justify='space-between'
        align='center'
        className='mb-6'
      >
        <Title level={2}>Store Management</Title>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
        >
          Add Store
        </Button>
      </Flex>

      <Card>
        <Table
          columns={columns}
          dataSource={stores}
          rowKey='id'
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} stores`,
          }}
        />
      </Card>

      <AddStoreDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddStore}
      />
    </div>
  );
};
