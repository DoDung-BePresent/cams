import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { User } from '@/features/admin/types/userTypes';
import { AddUserDrawer } from './components/AddUserDrawer';
import { getUserColumns } from './components/UserTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';

export const UserList = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'admin@cams.com',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      email: 'john.doe@highlands.com',
      name: 'John Doe',
      role: 'STORE_MANAGER',
      status: 'ACTIVE',
      created_at: '2024-01-05T10:00:00Z',
      updated_at: '2024-01-05T10:00:00Z',
    },
    {
      id: '3',
      email: 'jane.smith@moonlight.com',
      name: 'Jane Smith',
      role: 'BRANCH_MANAGER',
      status: 'INVITED',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
    },
  ]);

  const handleResendInvite = (userId: string) => {
    console.log('Resend invite:', userId);
    // TODO: Implement resend invite logic
  };

  const handleSuspend = (userId: string) => {
    console.log('Suspend user:', userId);
    // TODO: Implement suspend logic
  };

  const handleReactivate = (userId: string) => {
    console.log('Reactivate user:', userId);
    // TODO: Implement reactivate logic
  };

  const handleAddUser = (newUser: any) => {
    const user: User = {
      id: String(users.length + 1),
      email: newUser.email,
      name: '',
      role: newUser.role,
      status: 'INVITED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUsers([...users, user]);
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'User Management',
    },
  ];

  const columns = getUserColumns({
    onViewDetail: (userId) => navigate(`/admin/users/${userId}`),
    onResendInvite: handleResendInvite,
    onSuspend: handleSuspend,
    onReactivate: handleReactivate,
  });

  return (
    <div>
      <PageHeader
        title='User Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Add User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={users}
        rowKey='id'
      />

      <AddUserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddUser}
      />
    </div>
  );
};
