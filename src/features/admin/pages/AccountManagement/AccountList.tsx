import { useState } from 'react';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router';
import { PlusOutlined } from '@ant-design/icons';
import type { AccountListItem } from '@/features/admin/types/accountTypes';
import { CreateAccountDrawer } from './components/CreateAccountDrawer';
import { EditAccountDrawer } from './components/EditAccountDrawer';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { AssignBrandDrawer } from './components/AssignBrandDrawer';
import { getAccountColumns } from './components/AccountTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';
import { AppModal } from '@/shared/components/ui/AppModal';
import { useAccounts } from '@/features/admin/hooks/useAccounts';
import { useToggleAccountStatus } from '@/features/admin/hooks/useToggleAccountStatus';

export const AccountList = () => {
  const navigate = useNavigate();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [assignBrandDrawerOpen, setAssignBrandDrawerOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useAccounts({
    page: currentPage,
    pageSize,
  });

  const toggleStatus = useToggleAccountStatus();

  const handleView = (accountId: string) => {
    console.log('View account:', accountId);
    // TODO: Navigate to account detail page
    // navigate(`/admin/accounts/${accountId}`);
    message.info('Account detail page will be implemented soon');
  };

  const handleEdit = (account: AccountListItem) => {
    setSelectedAccountId(account.id);
    setEditDrawerOpen(true);
  };

  const handleToggleStatus = (accountId: string) => {
    const account = data?.items.find((a) => a.id === accountId);

    AppModal.confirm({
      title: `Are you sure you want to ${account?.status === 1 ? 'deactivate' : 'activate'} this account?`,
      content: (
        <div>
          <p>
            Account: <strong>{account?.fullName}</strong> ({account?.email})
          </p>
          <p>
            {account?.status === 1
              ? 'This user will no longer be able to access the system.'
              : 'This user will regain access to the system.'}
          </p>
        </div>
      ),
      okText: account?.status === 1 ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: account?.status === 1,
      },
      onOk: () => {
        toggleStatus.mutate(accountId);
      },
    });
  };

  const handleResetPassword = (accountId: string) => {
    setSelectedAccountId(accountId);
    setResetPasswordModalOpen(true);
  };

  const handleAssignBrand = (accountId: string) => {
    setSelectedAccountId(accountId);
    setAssignBrandDrawerOpen(true);
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Account Management',
    },
  ];

  const columns = getAccountColumns({
    onView: handleView,
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
    onResetPassword: handleResetPassword,
    onAssignBrand: handleAssignBrand,
  });

  return (
    <div>
      <PageHeader
        title='Account Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            Create Account
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data?.items || []}
        rowKey='id'
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize,
          total: data?.totalItems || 0,
          showTotal: (total) => `Total ${total} accounts`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          },
        }}
      />

      <CreateAccountDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => setCreateDrawerOpen(false)}
      />

      <EditAccountDrawer
        open={editDrawerOpen}
        accountId={selectedAccountId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setSelectedAccountId(null);
        }}
      />

      <ResetPasswordModal
        open={resetPasswordModalOpen}
        accountId={selectedAccountId}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          setResetPasswordModalOpen(false);
          setSelectedAccountId(null);
        }}
      />

      <AssignBrandDrawer
        open={assignBrandDrawerOpen}
        accountId={selectedAccountId}
        onClose={() => {
          setAssignBrandDrawerOpen(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          setAssignBrandDrawerOpen(false);
          setSelectedAccountId(null);
        }}
      />
    </div>
  );
};
