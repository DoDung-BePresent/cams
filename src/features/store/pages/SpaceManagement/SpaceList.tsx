import { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

/**
 * Hooks
 */
import {
  useSpaces,
  useDeleteSpace,
  useToggleSpaceStatus,
} from '@/features/store/hooks';

/**
 * Components
 */
import { DataTable, PageHeader, AppModal } from '@/shared/components';
import {
  getSpaceColumns,
  CreateSpaceDrawer,
  EditSpaceDrawer,
} from './components';

/**
 * Types
 */
import type { SpaceFilter } from '@/features/store/types';

export const SpaceList = () => {
  const navigate = useNavigate();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SpaceFilter>({});

  const { data, isLoading } = useSpaces({
    page: currentPage,
    pageSize,
    ...filters,
  });

  const deleteSpace = useDeleteSpace();
  const toggleStatus = useToggleSpaceStatus();

  const handleView = (spaceId: string) => {
    console.log('View space:', spaceId);
    message.info('Space detail page will be implemented soon');
  };

  const handleEdit = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setEditDrawerOpen(true);
  };

  const handleDelete = (spaceId: string) => {
    AppModal.confirm({
      title: 'Delete Space',
      content:
        'Are you sure you want to delete this space? This action cannot be undone.',
      okText: 'Yes, Delete',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        deleteSpace.mutate(spaceId);
      },
    });
  };

  const handleToggleStatus = (spaceId: string) => {
    AppModal.confirm({
      title: 'Toggle Space Status',
      content: 'Are you sure you want to change this space status?',
      okText: 'Yes',
      cancelText: 'No',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        toggleStatus.mutate(spaceId);
      },
    });
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/store/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Space Management',
    },
  ];

  const columns = getSpaceColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <div>
      <PageHeader
        title='Space Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            Create Space
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
          showTotal: (total) => `Total ${total} spaces`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
      />

      <CreateSpaceDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          setCreateDrawerOpen(false);
        }}
      />

      <EditSpaceDrawer
        open={editDrawerOpen}
        spaceId={selectedSpaceId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedSpaceId(null);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setSelectedSpaceId(null);
        }}
      />
    </div>
  );
};

export default SpaceList;
