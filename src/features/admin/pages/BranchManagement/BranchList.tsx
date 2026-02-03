import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import type { Branch } from '@/features/admin/types/branchTypes';
import { AddBranchDrawer } from './components/AddBranchDrawer';
import { getBranchColumns } from './components/BranchTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';

export const BranchList = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([
    {
      id: '1',
      store_id: storeId!,
      branch_name: 'Highlands Coffee - District 1',
      branch_code: 'HLC_Q1',
      address: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ]);

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
      title: 'Branch Management',
    },
  ];

  const columns = getBranchColumns({
    onViewDetails: (branchId) => navigate(`/admin/branches/${branchId}`),
  });

  return (
    <div>
      <PageHeader
        title='Branch Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Add Branch
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={branches}
        rowKey='id'
      />

      <AddBranchDrawer
        open={drawerOpen}
        storeId={storeId!}
        onClose={() => setDrawerOpen(false)}
        onSuccess={(branch) => setBranches([...branches, branch as any])}
      />
    </div>
  );
};
