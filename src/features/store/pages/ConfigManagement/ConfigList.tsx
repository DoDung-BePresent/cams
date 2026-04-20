import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

import {
  ConfigDetailDrawer,
  ConfigFilter as ConfigFilterComponent,
  getConfigColumns,
  UpsertStoreValueDrawer,
} from './components';
import { useStoreConfigs } from '@/features/store/hooks';
import type {
  ConfigFlatRowItem,
  ConfigStoreFilter,
} from '@/features/store/types';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { PAGINATION_SIZES } from '@/shared/constants';
import { DataTable, PageHeader } from '@/shared/components';

const DEFAULT_FILTER: ConfigStoreFilter = {
  page: 1,
  pageSize: 10,
  sortBy: 'key',
  isAscending: true,
};

export const ConfigList = () => {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<ConfigStoreFilter>(DEFAULT_FILTER);
  const [showFilters, setShowFilters] = useState(false);

  const [storeValueDrawerOpen, setStoreValueDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] =
    useState<ConfigFlatRowItem | null>(null);

  const { data, isLoading, refetch } = useStoreConfigs(filter);

  const handleSearch = (value: string) => {
    setFilter((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof ConfigStoreFilter, value: unknown) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ConfigFlatRowItem> | SorterResult<ConfigFlatRowItem>[],
  ) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    setFilter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sortBy: currentSorter.field ? String(currentSorter.field) : 'key',
      isAscending: currentSorter.order === 'ascend',
    }));
  };

  const handleReset = () => {
    setFilter({ ...DEFAULT_FILTER });
  };

  const handleCreateStoreValue = () => {
    setSelectedConfig(null);
    setStoreValueDrawerOpen(true);
  };

  const handleEditStoreValue = (record: ConfigFlatRowItem) => {
    setSelectedConfig(record);
    setStoreValueDrawerOpen(true);
  };

  const handleViewDetails = (record: ConfigFlatRowItem) => {
    setSelectedConfig(record);
    setDetailDrawerOpen(true);
  };

  const handleCloseStoreValueDrawer = () => {
    setStoreValueDrawerOpen(false);
    setSelectedConfig(null);
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedConfig(null);
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/store/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Config Management',
    },
  ];

  const columns = getConfigColumns({
    onView: handleViewDetails,
    onEditStoreValue: handleEditStoreValue,
    currentPage: filter.page ?? 1,
    pageSize: filter.pageSize ?? 10,
  });

  return (
    <div>
      <PageHeader
        title='Config Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description:
            'Manage store-level config values inherited from parent scopes.',
          keywords: 'store, config, management, cams',
        }}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleCreateStoreValue}
          >
            Upsert Store Value
          </Button>
        }
      />

      <DataTable<ConfigFlatRowItem>
        filter={
          <ConfigFilterComponent
            filter={filter}
            showAdvanced={showFilters}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            onRefresh={refetch}
            onReset={handleReset}
          />
        }
        columns={columns}
        dataSource={data?.items || []}
        rowKey={(record) =>
          `${record.key}:${record.scopeType}:${record.scopeId}`
        }
        loading={isLoading}
        pagination={{
          current: filter.page,
          pageSize: filter.pageSize,
          total: data?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} store config records`,
          pageSizeOptions: PAGINATION_SIZES,
          onChange: (page, size) => {
            setFilter((prev) => ({
              ...prev,
              page,
              pageSize: size,
            }));
          },
        }}
        onChange={handleTableChange}
        scroll={{ x: 1700 }}
      />

      <UpsertStoreValueDrawer
        open={storeValueDrawerOpen}
        selectedConfig={selectedConfig}
        onClose={handleCloseStoreValueDrawer}
        onSuccess={() => {
          handleCloseStoreValueDrawer();
          refetch();
        }}
      />

      <ConfigDetailDrawer
        open={detailDrawerOpen}
        data={selectedConfig}
        onClose={handleCloseDetailDrawer}
      />
    </div>
  );
};
