import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, message } from 'antd';

/**
 * Icons
 */
import { PlusOutlined } from '@ant-design/icons';

/**
 * Hooks
 */
import { useStores } from '@/features/manager/hooks/useStores';
import { useToggleStoreStatus } from '@/features/manager/hooks/useToggleStoreStatus';

/**
 * Components
 */
import { PageHeader } from '@/shared/components/common/PageHeader';
import { AppModal } from '@/shared/components/ui/AppModal';
import { DataTable } from '@/shared/components/common/DataTable';
import { getStoreColumns } from './components/StoreTableColumns';
import { CreateStoreDrawer } from './components/CreateStoreDrawer';
import { EditStoreDrawer } from './components/EditStoreDrawer';

/**
 * Types
 */
import type { StoreFilter } from '@/features/manager/types/storeTypes';

export const StoreList = () => {
  const navigate = useNavigate();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<StoreFilter>({});

  const { data, isLoading } = useStores({
    page: currentPage,
    pageSize,
    ...filters,
  });

  const toggleStatus = useToggleStoreStatus();

  const handleView = (storeId: string) => {
    console.log('View store:', storeId);
    // TODO: Navigate to store detail page
    // navigate(`/manager/stores/${storeId}`);
    message.info('Store detail page will be implemented soon');
  };

  const handleEdit = (storeId: string) => {
    setSelectedStoreId(storeId);
    setEditDrawerOpen(true);
  };

  const handleToggleStatus = (storeId: string) => {
    AppModal.confirm({
      title: 'Toggle Store Status',
      content: 'Are you sure you want to change this store status?',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        toggleStatus.mutate(storeId);
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
      title: 'Store Management',
    },
  ];

  const columns = getStoreColumns({
    onView: handleView,
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <div>
      <PageHeader
        title='Store Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            Add Store
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
          showTotal: (total) => `Total ${total} stores`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
      />

      <CreateStoreDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          setCreateDrawerOpen(false);
          message.success('Store created successfully!');
        }}
      />

      <EditStoreDrawer
        open={editDrawerOpen}
        storeId={selectedStoreId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedStoreId(null);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setSelectedStoreId(null);
          message.success('Store updated successfully!');
        }}
      />
    </div>
  );
};

export default StoreList;
