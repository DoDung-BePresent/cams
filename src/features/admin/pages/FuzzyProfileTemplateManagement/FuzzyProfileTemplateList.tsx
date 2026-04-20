import { useState } from 'react';
import { Button, message } from 'antd';
import { useNavigate } from 'react-router';
import { PlusOutlined } from '@ant-design/icons';

import { DataTable, PageHeader, AppModal } from '@/shared/components';
import { PAGINATION_SIZES } from '@/shared/constants';
import type { FuzzyProfileTemplateListItem } from '@/features/admin/types';
import {
  useCreateFuzzyProfileTemplate,
  useDeleteFuzzyProfileTemplate,
  useFuzzyProfileTemplateDetail,
  useFuzzyProfileTemplatesManage,
  useUpdateFuzzyProfileTemplate,
} from '@/features/admin/hooks';
import {
  FuzzyTemplateFilter,
  getFuzzyTemplateColumns,
  UpsertFuzzyTemplateDrawer,
} from './components';

export const FuzzyProfileTemplateList = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | undefined>();

  const { data, isLoading, refetch } = useFuzzyProfileTemplatesManage(
    page,
    pageSize,
  );

  const { data: detail, isLoading: detailLoading } =
    useFuzzyProfileTemplateDetail(
      editingId,
      drawerOpen && mode === 'edit' && !!editingId,
    );

  const createMut = useCreateFuzzyProfileTemplate();
  const updateMut = useUpdateFuzzyProfileTemplate();
  const deleteMut = useDeleteFuzzyProfileTemplate();

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearchValue('');
    setPage(1);
  };

  const handleCreate = () => {
    setMode('create');
    setEditingId(undefined);
    setDrawerOpen(true);
  };

  const handleEdit = (record: FuzzyProfileTemplateListItem) => {
    setMode('edit');
    setEditingId(record.id);
    setDrawerOpen(true);
  };

  const handleDelete = (record: FuzzyProfileTemplateListItem) => {
    AppModal.confirm({
      title: 'Delete Template',
      content: (
        <div>
          Are you sure you want to delete template{' '}
          <strong>{record.displayName}</strong>?
          <br />
          <br />
          This will soft-delete the template (hidden from pickers). Existing
          brand keys may still resolve.
        </div>
      ),
      okText: 'Delete',
      okButtonProps: {
        danger: true,
      },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await deleteMut.mutateAsync(record.id);
          if (res.data.isSuccess) {
            message.success(res.data.message || 'Template deleted');
            refetch();
          } else {
            message.error(res.data.message || 'Delete failed');
          }
        } catch (e: unknown) {
          const err = e as { response?: { data?: { message?: string } } };
          const apiMsg = err?.response?.data?.message;
          if (apiMsg) message.error(apiMsg);
        }
      },
    });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingId(undefined);
  };

  const buildPayload = (values: Record<string, unknown>) => ({
    templateKey: String(values.templateKey ?? '').trim(),
    displayName: String(values.displayName ?? '').trim(),
    profileDescription: String(values.profileDescription ?? '').trim() || null,
    chillMoodDescription:
      String(values.chillMoodDescription ?? '').trim() || null,
    focusMoodDescription:
      String(values.focusMoodDescription ?? '').trim() || null,
    energeticMoodDescription:
      String(values.energeticMoodDescription ?? '').trim() || null,
    sortOrder: Number(values.sortOrder),
    chillBpmMin: Number(values.chillBpmMin),
    chillBpmMax: Number(values.chillBpmMax),
    focusBpmMin: Number(values.focusBpmMin),
    focusBpmMax: Number(values.focusBpmMax),
    energeticBpmMin: Number(values.energeticBpmMin),
    energeticBpmMax: Number(values.energeticBpmMax),
    pressureLowMax: Number(values.pressureLowMax),
    pressureCriticalMin: Number(values.pressureCriticalMin),
    noiseQuietMaxDb: Number(values.noiseQuietMaxDb),
    noiseLoudMinDb: Number(values.noiseLoudMinDb),
    spaceCapacity: Number(values.spaceCapacity),
    defaultDecibelWhenNull: Number(values.defaultDecibelWhenNull),
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const body = buildPayload(values);

      if (mode === 'create') {
        const res = await createMut.mutateAsync(body);
        if (res.data.isSuccess) {
          message.success(res.data.message || 'Template created');
          handleCloseDrawer();
          refetch();
        } else {
          message.error(res.data.message || 'Create failed');
        }
      } else if (editingId) {
        const res = await updateMut.mutateAsync({
          id: editingId,
          body: { ...body, isActive: !!values.isActive },
        });
        if (res.data.isSuccess) {
          message.success(res.data.message || 'Template updated');
          handleCloseDrawer();
          refetch();
        } else {
          message.error(res.data.message || 'Update failed');
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const apiMsg = err?.response?.data?.message;
      if (apiMsg) message.error(apiMsg);
    }
  };

  const columns = getFuzzyTemplateColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    currentPage: page,
    pageSize,
  });

  // Filter data based on search
  const filteredData = (data?.items ?? []).filter((item) => {
    if (!searchValue) return true;
    const search = searchValue.toLowerCase();
    return (
      item.templateKey.toLowerCase().includes(search) ||
      item.displayName.toLowerCase().includes(search)
    );
  });

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    { title: 'AI Fuzzy Management' },
  ];

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      <PageHeader
        title='AI Fuzzy Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description:
            'Manage fuzzy profile templates for AI-driven music selection',
          keywords: 'fuzzy, ai, music, templates, bpm, mood',
        }}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            New Template
          </Button>
        }
      />

      <DataTable<FuzzyProfileTemplateListItem>
        filter={
          <FuzzyTemplateFilter
            searchValue={searchValue}
            onSearch={handleSearch}
            onRefresh={refetch}
            onReset={handleReset}
          />
        }
        columns={columns}
        dataSource={filteredData}
        rowKey='id'
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: filteredData.length,
          showSizeChanger: true,
          pageSizeOptions: PAGINATION_SIZES,
          showTotal: (total) => `Total ${total} templates`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1200 }}
      />

      <UpsertFuzzyTemplateDrawer
        open={drawerOpen}
        mode={mode}
        selectedTemplate={detail ?? null}
        loading={detailLoading || saving}
        onClose={handleCloseDrawer}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
