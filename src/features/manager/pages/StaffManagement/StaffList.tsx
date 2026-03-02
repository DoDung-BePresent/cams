import { useState } from 'react';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import { PlusOutlined } from '@ant-design/icons';

/**
 * Hooks
 */
import { useStaff } from '@/features/manager/hooks/useStaff';
import { useToggleStaffStatus } from '@/features/manager/hooks/useToggleStaffStatus';

/**
 * Components
 */
import { DataTable } from '@/shared/components/common/DataTable';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { AppModal } from '@/shared/components/ui/AppModal';
import { getStaffColumns } from './components/StaffTableColumns';
import { CreateStaffDrawer } from './components/CreateStaffDrawer';
import { EditStaffDrawer } from './components/EditStaffDrawer';
import { AssignStaffStoreDrawer } from './components/AssignStaffStoreDrawer';
import { ResetPasswordDrawer } from './components/ResetPasswordDrawer';

/**
 * Types
 */
import type { StaffFilter } from '@/features/manager/types/staffTypes';

export const StaffList = () => {
  const navigate = useNavigate();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [assignStoreDrawerOpen, setAssignStoreDrawerOpen] = useState(false);
  const [resetPasswordDrawerOpen, setResetPasswordDrawerOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<StaffFilter>({});

  const { data, isLoading } = useStaff({
    page: currentPage,
    pageSize,
    ...filters,
  });

  const toggleStatus = useToggleStaffStatus();

  const handleView = (staffId: string) => {
    console.log('View staff:', staffId);
    // TODO: Navigate to staff detail page
    message.info('Staff detail page will be implemented soon');
  };

  const handleEdit = (staffId: string) => {
    setSelectedStaffId(staffId);
    setEditDrawerOpen(true);
  };

  const handleAssignStore = (staffId: string) => {
    setSelectedStaffId(staffId);
    setAssignStoreDrawerOpen(true);
  };

  const handleResetPassword = (staffId: string) => {
    setSelectedStaffId(staffId);
    setResetPasswordDrawerOpen(true);
  };

  const handleToggleStatus = (staffId: string) => {
    AppModal.confirm({
      title: 'Toggle Staff Status',
      content: 'Are you sure you want to change this staff member status?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: () => {
        toggleStatus.mutate(staffId);
      },
    });
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/manager/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Staff Management',
    },
  ];

  const columns = getStaffColumns({
    onView: handleView,
    onEdit: handleEdit,
    onAssignStore: handleAssignStore,
    onResetPassword: handleResetPassword,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <div>
      <PageHeader
        title='Staff Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            Add Staff
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
          pageSize: pageSize,
          total: data?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} staff members`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
      />

      <CreateStaffDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          setCreateDrawerOpen(false);
          message.success('Staff created successfully!');
        }}
      />

      <EditStaffDrawer
        open={editDrawerOpen}
        staffId={selectedStaffId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedStaffId(null);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setSelectedStaffId(null);
          message.success('Staff updated successfully!');
        }}
      />

      <AssignStaffStoreDrawer
        open={assignStoreDrawerOpen}
        staffId={selectedStaffId}
        onClose={() => {
          setAssignStoreDrawerOpen(false);
          setSelectedStaffId(null);
        }}
        onSuccess={() => {
          setAssignStoreDrawerOpen(false);
          setSelectedStaffId(null);
          message.success('Store assignment updated successfully!');
        }}
      />

      <ResetPasswordDrawer
        open={resetPasswordDrawerOpen}
        staffId={selectedStaffId}
        onClose={() => {
          setResetPasswordDrawerOpen(false);
          setSelectedStaffId(null);
        }}
        onSuccess={() => {
          setResetPasswordDrawerOpen(false);
          setSelectedStaffId(null);
          message.success('Password reset successfully!');
        }}
      />
    </div>
  );
};

export default StaffList;
