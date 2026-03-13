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
import type { BrandListItem } from '@/features/admin/types';

/**
 * Components
 */
import { AddBrandDrawer, EditBrandDrawer, getBrandColumns } from './components';
import { PageHeader, DataTable, AppModal } from '@/shared/components';

/**
 * Hooks
 */
import { useBrands, useDeleteBrand } from '@/features/admin/hooks';

export const BrandList = () => {
  const navigate = useNavigate();
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useBrands({
    page: currentPage,
    pageSize,
  });

  const deleteBrand = useDeleteBrand();

  const handleView = (brandId: string) => {
    console.log('View brand:', brandId);
    message.info('Brand detail page will be implemented soon');
  };

  const handleEdit = (brand: BrandListItem) => {
    setSelectedBrandId(brand.id);
    setEditDrawerOpen(true);
  };

  const handleDelete = (brandId: string) => {
    const brand = data?.items.find((b) => b.id === brandId);

    AppModal.confirm({
      title: 'Are you sure you want to delete this brand?',
      content: (
        <div>
          <p>
            By deleting "<strong>{brand?.name}</strong>", all associated data
            will be permanently removed.
          </p>
        </div>
      ),
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        deleteBrand.mutate(brandId);
      },
    });
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
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div>
      <PageHeader
        title='Brand Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Manage all brands in the system',
          keywords: 'brand, management, admin, cms',
        }}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setAddDrawerOpen(true)}
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
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={() => setAddDrawerOpen(false)}
      />

      <EditBrandDrawer
        open={editDrawerOpen}
        brandId={selectedBrandId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedBrandId(null);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setSelectedBrandId(null);
        }}
      />
    </div>
  );
};
