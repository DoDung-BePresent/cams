import { useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Row,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
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
import { AssignStoreDrawer } from './components/AssignStoreDrawer';
import { AssignBranchDrawer } from './components/AssignBranchDrawer';

const { Title, Text } = Typography;

export const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [assignStoreDrawerOpen, setAssignStoreDrawerOpen] = useState(false);
  const [assignBranchDrawerOpen, setAssignBranchDrawerOpen] = useState(false);

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

      <Row gutter={16}>
        {/* Left Column - User Profile Card */}
        <Col
          xs={24}
          lg={8}
        >
          <Card>
            <Flex
              vertical
              align='center'
              gap={16}
            >
              <Avatar
                size={120}
                icon={<UserOutlined />}
                className='bg-primary!'
              />
              <Flex
                vertical
                align='center'
                gap={8}
              >
                <Title
                  level={4}
                  className='mb-0!'
                >
                  {user.name || 'Not set'}
                </Title>
                <Text type='secondary'>{user.email}</Text>
                <Tag color='blue'>{roleMap[user.role]}</Tag>
                <Tag color={USER_STATUS_COLORS[user.status]}>
                  {USER_STATUS_LABELS[user.status]}
                </Tag>
              </Flex>

              <Descriptions
                column={1}
                className='w-full'
                bordered
                size='small'
              >
                <Descriptions.Item label='Stores Assigned'>
                  <Text strong>{storeAssignments.length}</Text>
                </Descriptions.Item>
                <Descriptions.Item label='Branches Assigned'>
                  <Text strong>{branchAssignments.length}</Text>
                </Descriptions.Item>
                <Descriptions.Item label='Joined Date'>
                  {new Date(user.created_at).toLocaleDateString()}
                </Descriptions.Item>
              </Descriptions>
            </Flex>
          </Card>
        </Col>

        {/* Right Column - Assignments */}
        <Col
          xs={24}
          lg={16}
        >
          <Flex
            vertical
            gap={16}
          >
            {/* Store Assignments */}
            <Card
              title={<Title level={5}>Store Assignments</Title>}
              extra={
                <Button
                  type='primary'
                  icon={<PlusOutlined />}
                  onClick={() => setAssignStoreDrawerOpen(true)}
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
                    render: (date: string) =>
                      new Date(date).toLocaleDateString(),
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    width: 120,
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
                  onClick={() => setAssignBranchDrawerOpen(true)}
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
                    render: (date: string) =>
                      new Date(date).toLocaleDateString(),
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    width: 120,
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
        </Col>
      </Row>

      <AssignStoreDrawer
        open={assignStoreDrawerOpen}
        userId={userId!}
        onClose={() => setAssignStoreDrawerOpen(false)}
        onSuccess={() => {
          // TODO: Refresh store assignments
          setAssignStoreDrawerOpen(false);
        }}
      />

      <AssignBranchDrawer
        open={assignBranchDrawerOpen}
        userId={userId!}
        onClose={() => setAssignBranchDrawerOpen(false)}
        onSuccess={() => {
          // TODO: Refresh branch assignments
          setAssignBranchDrawerOpen(false);
        }}
      />
    </div>
  );
};
