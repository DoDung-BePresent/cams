import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import type { StoreUser } from '@/features/admin/types/userTypes';
import { InviteManagerDrawer } from './components/InviteManagerDrawer';
import { getStoreManagersColumns } from './components/StoreManagersTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';

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

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Store Management',
      onClick: () => navigate('/admin/stores'),
      className: 'cursor-pointer',
    },
    {
      title: 'Managers',
    },
  ];

  const columns = getStoreManagersColumns({
    onResendInvite: handleResendInvite,
    onChangeRole: handleChangeRole,
    onSuspend: handleSuspend,
    onReactivate: handleReactivate,
  });

  const existingEmails = managers.map((m) => m.email.toLowerCase());

  return (
    <div>
      <PageHeader
        title='Store Managers'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Invite Manager
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={managers}
        rowKey='id'
      />

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
