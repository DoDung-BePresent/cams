import { useState } from 'react';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import { PlusOutlined } from '@ant-design/icons';

/**
 * Types
 */
import { type AccountListItem } from '@/features/admin/types';

/**
 * Components
 */
import {
  CreateAccountDrawer,
  EditAccountDrawer,
  ResetPasswordModal,
  AssignBrandModal,
  getAccountColumns,
} from './components';
import { PageHeader, DataTable, AppModal } from '@/shared/components';

/**
 * Hooks
 */
import { useAccounts, useToggleAccountStatus } from '@/features/admin/hooks';

export const AccountList = () => {
  const navigate = useNavigate();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [assignBrandModalOpen, setAssignBrandModalOpen] = useState(false);
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
    message.info('Account detail page will be implemented soon');
  };

  const handleEdit = (account: AccountListItem) => {
    setSelectedAccountId(account.id);
    setEditDrawerOpen(true);
  };

  const handleToggleStatus = (accountId: string) => {
    AppModal.confirm({
      title: 'Toggle Account Status',
      content: 'Are you sure you want to change this account status?',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {
        danger: true,
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
    setAssignBrandModalOpen(true);
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

      <AssignBrandModal
        open={assignBrandModalOpen}
        accountId={selectedAccountId}
        onClose={() => {
          setAssignBrandModalOpen(false);
          setSelectedAccountId(null);
        }}
        onSuccess={() => {
          setAssignBrandModalOpen(false);
          setSelectedAccountId(null);
        }}
      />
    </div>
  );
};
