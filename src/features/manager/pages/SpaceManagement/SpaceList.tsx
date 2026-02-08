import { useState, useEffect } from 'react';
import { Button, Tabs, message } from 'antd';
import {
  PlusOutlined,
  TableOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { Space } from '@/features/manager/types/spaceTypes';
import { AddSpaceDrawer } from './components/AddSpaceDrawer';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { useBranchStore } from '@/features/manager/stores/useBranchStore';
import { AppModal } from '@/shared/components/ui/AppModal';
import { SpaceTableView } from './components/SpaceTableView';
import { SpaceVoronoiView } from './components/SpaceVoronoiView';

export const SpaceList = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'voronoi'>('table');
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
    const space = spaces.find((s) => s.id === spaceId);

    AppModal.confirm({
      title: 'Are you sure you want to delete this space?',
      content: `By deleting "${space?.space_name}", all devices assigned to this space will be unlinked.`,
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
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

  // Redirect if no branch selected
  useEffect(() => {
    if (!currentBranch) {
      message.warning('No branch selected. Redirecting to dashboard...');
      navigate('/manager/dashboard');
    }
  }, [currentBranch, navigate]);

  if (!currentBranch) return null;

  const tabItems = [
    {
      key: 'table',
      label: (
        <span>
          <TableOutlined /> Table View
        </span>
      ),
      children: (
        <SpaceTableView
          spaces={spaces}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ),
    },
    {
      key: 'voronoi',
      label: (
        <span>
          <PieChartOutlined /> Coverage Map
        </span>
      ),
      children: <SpaceVoronoiView spaces={spaces} />,
    },
  ];

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
            onClick={() => setDrawerOpen(true)}
          >
            Add Space
          </Button>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'table' | 'voronoi')}
        items={tabItems}
        size='large'
      />

      <AddSpaceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddSpace}
      />
    </div>
  );
};
