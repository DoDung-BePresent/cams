import { useState } from 'react';
import { Button, Card, Flex, Table, Tag, Typography, Breadcrumb } from 'antd';
import { PlusOutlined, HomeOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import type { Branch } from '@/features/admin/types/branchTypes';
import { AddBranchDrawer } from '@/features/admin/components/BranchManagement/AddBranchDrawer';

const { Title } = Typography;

export const BranchList = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([
    {
      id: '1',
      store_id: storeId!,
      branch_name: 'Highlands Coffee - District 1',
      branch_code: 'HLC_Q1',
      address: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ]);

  const columns: ColumnsType<Branch> = [
    {
      title: 'Branch Name',
      dataIndex: 'branch_name',
      key: 'branch_name',
      sorter: (a, b) => a.branch_name.localeCompare(b.branch_name),
    },
    {
      title: 'Branch Code',
      dataIndex: 'branch_code',
      key: 'branch_code',
      render: (code: string) => <Tag color='geekblue'>{code}</Tag>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
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

  const handleAddBranch = (newBranch: any) => {
    const branch: Branch = {
      id: String(branches.length + 1),
      ...newBranch,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBranches([...branches, branch]);
  };

  return (
    <div>
      <Breadcrumb
        className='mb-4'
        items={[
          {
            title: (
              <>
                <HomeOutlined />
                <span>Dashboard</span>
              </>
            ),
            onClick: () => navigate('/admin/dashboard'),
            className: 'cursor-pointer',
          },
          {
            title: (
              <>
                <ShopOutlined />
                <span>Store Management</span>
              </>
            ),
            onClick: () => navigate('/admin/stores'),
            className: 'cursor-pointer',
          },
          {
            title: 'Branch Management',
          },
        ]}
      />

      <Flex
        justify='space-between'
        align='center'
        className='mb-6'
      >
        <Title level={2}>Branch Management</Title>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
        >
          Add Branch
        </Button>
      </Flex>

      <Card>
        <Table
          columns={columns}
          dataSource={branches}
          rowKey='id'
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} branches`,
          }}
        />
      </Card>

      <AddBranchDrawer
        open={drawerOpen}
        storeId={storeId!}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddBranch}
      />
    </div>
  );
};
