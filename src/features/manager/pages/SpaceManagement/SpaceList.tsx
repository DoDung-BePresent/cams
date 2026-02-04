import { useState, useEffect } from 'react';
import { Button, Modal, message } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { Space } from '@/features/manager/types/spaceTypes';
import { AddSpaceDrawer } from './components/AddSpaceDrawer';
import { getSpaceColumns } from './components/SpaceTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';
import { useBranchStore } from '@/features/manager/stores/useBranchStore';

export const SpaceList = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentBranch = useBranchStore((state) => state.currentBranch);

  const [spaces, setSpaces] = useState<Space[]>([
    {
      id: '1',
      branch_id: currentBranch?.id || '1',
      space_name: 'Main Floor',
      space_code: 'FLOOR_1',
      description: 'Main dining area',
      device_id: 'ESP32_001',
      device_status: 'connected',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      branch_id: currentBranch?.id || '1',
      space_name: 'VIP Area',
      space_code: 'VIP_AREA',
      description: 'VIP lounge',
      device_id: 'ANDROID_001',
      device_status: 'disconnected',
      status: 'active',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
    },
  ]);

  const handleEdit = (space: Space) => {
    console.log('Edit space:', space);
    // TODO: Open edit drawer
  };

  const handleDelete = (spaceId: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this space?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setSpaces(spaces.filter((s) => s.id !== spaceId));
        message.success('Space deleted successfully!');
        // TODO: Call API to delete space
      },
    });
  };

  const handleAddSpace = (newSpace: any) => {
    const space: Space = {
      id: String(spaces.length + 1),
      ...newSpace,
      device_status: newSpace.device_id ? 'disconnected' : undefined,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSpaces([...spaces, space]);
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/manager/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Space Management',
    },
  ];

  const columns = getSpaceColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  // Redirect if no branch selected
  useEffect(() => {
    if (!currentBranch) {
      message.warning('No branch selected. Redirecting to dashboard...');
      navigate('/manager/dashboard');
    }
  }, [currentBranch, navigate]);

  if (!currentBranch) return null;

  return (
    <div>
      <PageHeader
        title={`Space Management - ${currentBranch.branch_name}`}
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Add Space
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={spaces}
        rowKey='id'
      />

      <AddSpaceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddSpace}
      />
    </div>
  );
};
