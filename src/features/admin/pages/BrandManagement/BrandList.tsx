import { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { BrandListItem } from '@/features/admin/types/brandTypes';
import { AddBrandDrawer } from './components/AddBrandDrawer';
import { getBrandColumns } from './components/BrandTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';
import { EntityStatusEnum } from '@/shared/types/commonTypes';

export const BrandList = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mock data - TODO: Replace with API call
  const [brands, setBrands] = useState<BrandListItem[]>([
    {
      id: '1',
      name: 'Moonlight Coffee',
      logoUrl: null,
      industry: 'F&B',
      primaryContactName: 'John Doe',
      contactEmail: 'contact@moonlight.com',
      contactPhone: '+84901234567',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      createdBy: null,
      updatedBy: null,
      status: EntityStatusEnum.Active,
    },
  ]);

  const handleEdit = (brand: BrandListItem) => {
    console.log('Edit brand:', brand);
    // TODO: Open edit drawer or navigate to detail page
  };

  const handleDelete = (brandId: string) => {
    message.success('Brand deleted successfully!');
    setBrands(brands.filter((b) => b.id !== brandId));
    // TODO: Call API to delete brand
  };

  const handleAddBrand = async (formData: FormData) => {
    // TODO: Call API to create brand
    console.log('Create brand:', Object.fromEntries(formData));
    message.success('Brand created successfully!');
    setDrawerOpen(false);
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Brand Management',
    },
  ];

  const columns = getBrandColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div>
      <PageHeader
        title='Brand Management'
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Add Brand
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={brands}
        rowKey='id'
      />

      <AddBrandDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddBrand}
      />
    </div>
  );
};
