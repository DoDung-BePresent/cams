import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { Store } from '@/features/admin/types/storeTypes';
import { AddStoreDrawer } from './components/AddStoreDrawer';
import { getStoreColumns } from './components/StoreTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';

export const StoreList = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      store_name: 'Moonlight Coffee',
      business_type: 'cafe',
      description: 'A cozy coffee brand focusing on chill experience',
      manager_emails: [],
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ]);

  const handleAddStore = (newStore: any) => {
    const store: Store = {
      id: String(stores.length + 1),
      ...newStore,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStores([...stores, store]);
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Store Management',
    },
  ];

  const columns = getStoreColumns({
    onViewBranches: (storeId) => navigate(`/admin/stores/${storeId}/branches`),
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
            onClick={() => setDrawerOpen(true)}
          >
            Add Store
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={stores}
        rowKey='id'
      />

      <AddStoreDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddStore}
      />
    </div>
  );
};
