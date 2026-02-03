import { useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Table,
  Tag,
  Typography,
  Space,
  Dropdown,
  Breadcrumb,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  HomeOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import type { StoreUser } from '@/features/admin/types/userTypes';
import {
  USER_STATUS_COLORS,
  USER_STATUS_LABELS,
} from '@/features/admin/constants/userConstants';
import { InviteManagerDrawer } from '@/features/admin/components/StoreManagement/InviteManagerDrawer';

const { Title } = Typography;

export const StoreManagers = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [managers, setManagers] = useState<StoreUser[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@highlands.com',
      role: 'STORE_MANAGER',
      status: 'ACTIVE',
      store_id: storeId!,
      activated_at: '2024-01-10T10:00:00Z',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@highlands.com',
      role: 'BRANCH_MANAGER',
      status: 'INVITED',
      store_id: storeId!,
      invited_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ]);

  const getActionMenuItems = (record: StoreUser) => {
    const baseItems = [
      {
        key: 'change-role',
        label: 'Change Role',
        onClick: () => handleChangeRole(record.id),
      },
    ];

    if (record.status === 'INVITED') {
      baseItems.unshift({
        key: 'resend-invite',
        label: 'Resend Invite',
        onClick: () => handleResendInvite(record.id),
      });
    }

    if (record.status === 'ACTIVE') {
      baseItems.push({
        key: 'suspend',
        label: 'Suspend',
        onClick: () => handleSuspend(record.id),
        danger: true,
      } as any);
    }

    if (record.status === 'SUSPENDED') {
      baseItems.push({
        key: 'reactivate',
        label: 'Reactivate',
        onClick: () => handleReactivate(record.id),
      });
    }

    return baseItems;
  };

  const handleResendInvite = (userId: string) => {
    console.log('Resend invite:', userId);
    // TODO: Implement resend invite logic
  };

  const handleChangeRole = (userId: string) => {
    console.log('Change role:', userId);
    // TODO: Implement change role logic
  };

  const handleSuspend = (userId: string) => {
    console.log('Suspend user:', userId);
    // TODO: Implement suspend logic
  };

  const handleReactivate = (userId: string) => {
    console.log('Reactivate user:', userId);
    // TODO: Implement reactivate logic
  };

  const columns: ColumnsType<StoreUser> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => name || record.email.split('@')[0],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color='blue'>
          {role === 'STORE_MANAGER' ? 'Store Manager' : 'Branch Manager'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof USER_STATUS_COLORS) => (
        <Tag color={USER_STATUS_COLORS[status]}>
          {USER_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          placement='bottomRight'
        >
          <Button
            type='text'
            icon={<MoreOutlined />}
          />
        </Dropdown>
      ),
    },
  ];

  const handleInviteManager = (newUser: any) => {
    const user: StoreUser = {
      id: String(managers.length + 1),
      name: '',
      email: newUser.email,
      role: newUser.role,
      status: 'INVITED',
      store_id: storeId!,
      invited_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setManagers([...managers, user]);
  };

  const existingEmails = managers.map((m) => m.email.toLowerCase());

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
            title: 'Managers',
          },
        ]}
      />

      <Flex
        justify='space-between'
        align='center'
        className='mb-6'
      >
        <Title level={2}>Store Managers</Title>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
        >
          Invite Manager
        </Button>
      </Flex>

      <Card>
        <Table
          columns={columns}
          dataSource={managers}
          rowKey='id'
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} managers`,
          }}
        />
      </Card>

      <InviteManagerDrawer
        open={drawerOpen}
        storeId={storeId!}
        existingEmails={existingEmails}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleInviteManager}
      />
    </div>
  );
};
