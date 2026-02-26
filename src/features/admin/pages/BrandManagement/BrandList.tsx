import { useState } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import { PlusOutlined } from '@ant-design/icons';

/**
 * Types
 */
import type { BrandListItem } from '@/features/admin/types/brandTypes';

/**
 * Components
 */
import { AddBrandDrawer } from './components/AddBrandDrawer';
import { getBrandColumns } from './components/BrandTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';

/**
 * Hooks
 */
import { useBrands } from '@/features/admin/hooks/useBrands';
import { useDeleteBrand } from '@/features/admin/hooks/useDeleteBrand';

export const BrandList = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError } = useBrands({
    page: currentPage,
    pageSize,
  });

  const deleteBrand = useDeleteBrand();

  const handleEdit = (brand: BrandListItem) => {
    console.log('Edit brand:', brand);
    // TODO: Open edit drawer or navigate to detail page
  };

  const handleDelete = (brandId: string) => {
    deleteBrand.mutate(brandId);
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
        dataSource={data?.items || []}
        rowKey='id'
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize,
          total: data?.totalItems || 0,
          showTotal: (total) => `Total ${total} brands`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          },
        }}
      />

      <AddBrandDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => setDrawerOpen(false)}
      />
    </div>
  );
};
