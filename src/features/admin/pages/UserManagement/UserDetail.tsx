import { useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Flex,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import type {
  BranchUser,
  StoreUser,
  User,
} from '@/features/admin/types/userTypes';
import {
  USER_STATUS_COLORS,
  USER_STATUS_LABELS,
} from '@/features/admin/constants/userConstants';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { AssignStoreModal } from './components/AssignStoreModal';
import { AssignBranchModal } from './components/AssignBranchModal';

const { Title } = Typography;

export const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [assignStoreModalOpen, setAssignStoreModalOpen] = useState(false);
  const [assignBranchModalOpen, setAssignBranchModalOpen] = useState(false);

  // TODO: Fetch user data from API
  const user: User = {
    id: userId!,
    email: 'john.doe@highlands.com',
    name: 'John Doe',
    role: 'STORE_MANAGER',
    status: 'ACTIVE',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  };

  const [storeAssignments, setStoreAssignments] = useState<StoreUser[]>([
    {
      id: '1',
      store_id: '1',
      store_name: 'Moonlight Coffee',
      assigned_at: '2024-01-05T10:00:00Z',
    },
    {
      id: '2',
      store_id: '2',
      store_name: 'Highlands Coffee',
      assigned_at: '2024-01-10T10:00:00Z',
    },
  ]);

  const [branchAssignments, setBranchAssignments] = useState<BranchUser[]>([
    {
      id: '1',
      branch_id: '1',
      branch_name: 'District 1 Branch',
      store_id: '1',
      store_name: 'Moonlight Coffee',
      assigned_at: '2024-01-05T10:00:00Z',
    },
    {
      id: '2',
      branch_id: '2',
      branch_name: 'District 3 Branch',
      store_id: '1',
      store_name: 'Moonlight Coffee',
      assigned_at: '2024-01-06T10:00:00Z',
    },
    {
      id: '3',
      branch_id: '3',
      branch_name: 'Tan Binh Branch',
      store_id: '2',
      store_name: 'Highlands Coffee',
      assigned_at: '2024-01-10T10:00:00Z',
    },
  ]);

  const handleRemoveStore = (storeAssignmentId: string) => {
    setStoreAssignments(
      storeAssignments.filter((s) => s.id !== storeAssignmentId),
    );
    // TODO: Call API to remove store assignment
  };

  const handleRemoveBranch = (branchAssignmentId: string) => {
    setBranchAssignments(
      branchAssignments.filter((b) => b.id !== branchAssignmentId),
    );
    // TODO: Call API to remove branch assignment
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'User Management',
      onClick: () => navigate('/admin/users'),
      className: 'cursor-pointer',
    },
    {
      title: 'User Details',
    },
  ];

  const roleMap = {
    ADMIN: 'Admin',
    STORE_MANAGER: 'Store Manager',
    BRANCH_MANAGER: 'Branch Manager',
  };

  return (
    <div>
      <PageHeader
        title='User Details'
        breadcrumbs={breadcrumbs}
      />

      <Flex
        vertical
        gap={16}
      >
        {/* User Information */}
        <Card title='User Information'>
          <Descriptions column={2}>
            <Descriptions.Item label='Email'>{user.email}</Descriptions.Item>
            <Descriptions.Item label='Name'>
              {user.name || 'Not set'}
            </Descriptions.Item>
            <Descriptions.Item label='Role'>
              <Tag color='blue'>{roleMap[user.role]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Status'>
              <Tag color={USER_STATUS_COLORS[user.status]}>
                {USER_STATUS_LABELS[user.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Created At'>
              {new Date(user.created_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Store Assignments */}
        <Card
          title={<Title level={5}>Store Assignments</Title>}
          extra={
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => setAssignStoreModalOpen(true)}
            >
              Add Store
            </Button>
          }
        >
          <Table
            dataSource={storeAssignments}
            rowKey='id'
            pagination={false}
            columns={[
              {
                title: 'Store Name',
                dataIndex: 'store_name',
                key: 'store_name',
              },
              {
                title: 'Assigned At',
                dataIndex: 'assigned_at',
                key: 'assigned_at',
                render: (date: string) => new Date(date).toLocaleDateString(),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Button
                    danger
                    type='link'
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveStore(record.id)}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
          />
        </Card>

        {/* Branch Assignments */}
        <Card
          title={<Title level={5}>Branch Assignments</Title>}
          extra={
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => setAssignBranchModalOpen(true)}
            >
              Add Branch
            </Button>
          }
        >
          <Table
            dataSource={branchAssignments}
            rowKey='id'
            pagination={false}
            columns={[
              {
                title: 'Store',
                dataIndex: 'store_name',
                key: 'store_name',
              },
              {
                title: 'Branch',
                dataIndex: 'branch_name',
                key: 'branch_name',
              },
              {
                title: 'Assigned At',
                dataIndex: 'assigned_at',
                key: 'assigned_at',
                render: (date: string) => new Date(date).toLocaleDateString(),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Button
                    danger
                    type='link'
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveBranch(record.id)}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </Flex>

      <AssignStoreModal
        open={assignStoreModalOpen}
        userId={userId!}
        onClose={() => setAssignStoreModalOpen(false)}
        onSuccess={() => {
          // TODO: Refresh store assignments
          setAssignStoreModalOpen(false);
        }}
      />

      <AssignBranchModal
        open={assignBranchModalOpen}
        userId={userId!}
        onClose={() => setAssignBranchModalOpen(false)}
        onSuccess={() => {
          // TODO: Refresh branch assignments
          setAssignBranchModalOpen(false);
        }}
      />
    </div>
  );
};
