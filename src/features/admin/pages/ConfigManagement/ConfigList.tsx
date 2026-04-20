import { useState } from 'react';
import { Button, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

import {
  ConfigDetailDrawer,
  ConfigFilter as ConfigFilterComponent,
  getConfigColumns,
  getConfigPolicyColumns,
  UpsertConfigPolicyDrawer,
  UpsertSystemValueDrawer,
} from './components';
import { usePolicyConfigs, useSystemConfigs } from '@/features/admin/hooks';
import type {
  ConfigFlatRowItem,
  ConfigPolicyFilter,
  ConfigPolicyRowItem,
  ConfigSystemFilter,
} from '@/features/admin/types';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { PAGINATION_SIZES } from '@/shared/constants';
import { DataTable, PageHeader } from '@/shared/components';
import { createStyles } from 'antd-style';

type ConfigTabKey = 'system' | 'policy';

const DEFAULT_FILTER: ConfigSystemFilter = {
  page: 1,
  pageSize: 10,
  sortBy: 'key',
  isAscending: true,
};

const useStyle = createStyles(({ css, prefixCls }) => {
  return {
    customTabs: css`
      .${prefixCls}-tabs-nav {
        margin-bottom: 0;
        .${prefixCls}-tabs-nav-wrap {
          .${prefixCls}-tabs-nav-list {
            width: 100%;
            .${prefixCls}-tabs-tab {
              padding-inline: 15px;
              justify-content: center;
              &:hover {
                background-color: var(--ant-blue-1);
                color: var(--ant-tabs-item-selected-color);
              }
            }
          }
        }
      }
    `,
  };
});

export const ConfigList = () => {
  const { styles } = useStyle();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ConfigTabKey>('system');
  const [systemFilter, setSystemFilter] =
    useState<ConfigSystemFilter>(DEFAULT_FILTER);
  const [policyFilter, setPolicyFilter] =
    useState<ConfigPolicyFilter>(DEFAULT_FILTER);

  const [showSystemFilters, setShowSystemFilters] = useState(false);
  const [showPolicyFilters, setShowPolicyFilters] = useState(false);

  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
  const [systemValueDrawerOpen, setSystemValueDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const [selectedSystemConfig, setSelectedSystemConfig] =
    useState<ConfigFlatRowItem | null>(null);
  const [selectedPolicy, setSelectedPolicy] =
    useState<ConfigPolicyRowItem | null>(null);

  const {
    data: systemData,
    isLoading: isSystemLoading,
    refetch: refetchSystem,
  } = useSystemConfigs(systemFilter);

  const {
    data: policyData,
    isLoading: isPolicyLoading,
    refetch: refetchPolicy,
  } = usePolicyConfigs(policyFilter);

  const handleSystemSearch = (value: string) => {
    setSystemFilter((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handlePolicySearch = (value: string) => {
    setPolicyFilter((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handleSystemFilterChange = (
    key: keyof ConfigSystemFilter,
    value: unknown,
  ) => {
    setSystemFilter((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePolicyFilterChange = (
    key: keyof ConfigPolicyFilter,
    value: unknown,
  ) => {
    setPolicyFilter((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleSystemTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ConfigFlatRowItem> | SorterResult<ConfigFlatRowItem>[],
  ) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    setSystemFilter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sortBy: currentSorter.field ? String(currentSorter.field) : 'key',
      isAscending: currentSorter.order === 'ascend',
    }));
  };

  const handlePolicyTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter:
      | SorterResult<ConfigPolicyRowItem>
      | SorterResult<ConfigPolicyRowItem>[],
  ) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    setPolicyFilter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sortBy: currentSorter.field ? String(currentSorter.field) : 'key',
      isAscending: currentSorter.order === 'ascend',
    }));
  };

  const handleSystemReset = () => {
    setSystemFilter({ ...DEFAULT_FILTER });
  };

  const handlePolicyReset = () => {
    setPolicyFilter({ ...DEFAULT_FILTER });
  };

  const handleCreateSystemValue = () => {
    setSelectedSystemConfig(null);
    setSystemValueDrawerOpen(true);
  };

  const handleEditSystemValue = (record: ConfigFlatRowItem) => {
    setSelectedSystemConfig(record);
    setSystemValueDrawerOpen(true);
  };

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setPolicyDrawerOpen(true);
  };

  const handleEditPolicy = (record: ConfigPolicyRowItem) => {
    setSelectedPolicy(record);
    setPolicyDrawerOpen(true);
  };

  const handleViewSystemDetails = (record: ConfigFlatRowItem) => {
    setSelectedSystemConfig(record);
    setDetailDrawerOpen(true);
  };

  const handleClosePolicyDrawer = () => {
    setPolicyDrawerOpen(false);
    setSelectedPolicy(null);
  };

  const handleCloseSystemValueDrawer = () => {
    setSystemValueDrawerOpen(false);
    setSelectedSystemConfig(null);
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedSystemConfig(null);
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Config Management',
    },
  ];

  const systemColumns = getConfigColumns({
    onView: handleViewSystemDetails,
    onEditSystemValue: handleEditSystemValue,
  });

  const policyColumns = getConfigPolicyColumns({
    onEdit: handleEditPolicy,
  });

  const headerAction =
    activeTab === 'policy' ? (
      <Button
        size='large'
        type='primary'
        icon={<PlusOutlined />}
        onClick={handleCreatePolicy}
      >
        Upsert Policy
      </Button>
    ) : (
      <Button
        size='large'
        type='primary'
        icon={<PlusOutlined />}
        onClick={handleCreateSystemValue}
      >
        Upsert System Value
      </Button>
    );

  const tabItems = [
    {
      key: 'system',
      label: 'System Values',
      children: (
        <DataTable<ConfigFlatRowItem>
          filter={
            <ConfigFilterComponent
              mode='system'
              filter={systemFilter}
              showAdvanced={showSystemFilters}
              onSearch={handleSystemSearch}
              onFilterChange={handleSystemFilterChange}
              onToggleAdvanced={() => setShowSystemFilters(!showSystemFilters)}
              onRefresh={refetchSystem}
              onReset={handleSystemReset}
            />
          }
          columns={systemColumns}
          dataSource={systemData?.items || []}
          rowKey={(record) =>
            `${record.key}:${record.scopeType}:${record.scopeId}`
          }
          loading={isSystemLoading}
          pagination={{
            current: systemFilter.page,
            pageSize: systemFilter.pageSize,
            total: systemData?.totalItems || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} system config records`,
            pageSizeOptions: PAGINATION_SIZES,
            onChange: (page, size) => {
              setSystemFilter((prev) => ({
                ...prev,
                page,
                pageSize: size,
              }));
            },
          }}
          onChange={handleSystemTableChange}
          scroll={{ x: 1600 }}
        />
      ),
    },
    {
      key: 'policy',
      label: 'Policy Templates',
      children: (
        <DataTable<ConfigPolicyRowItem>
          filter={
            <ConfigFilterComponent
              mode='policy'
              filter={policyFilter}
              showAdvanced={showPolicyFilters}
              onSearch={handlePolicySearch}
              onFilterChange={handlePolicyFilterChange}
              onToggleAdvanced={() => setShowPolicyFilters(!showPolicyFilters)}
              onRefresh={refetchPolicy}
              onReset={handlePolicyReset}
            />
          }
          columns={policyColumns}
          dataSource={policyData?.items || []}
          rowKey={(record) => record.key}
          loading={isPolicyLoading}
          pagination={{
            current: policyFilter.page,
            pageSize: policyFilter.pageSize,
            total: policyData?.totalItems || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} policy records`,
            pageSizeOptions: PAGINATION_SIZES,
            onChange: (page, size) => {
              setPolicyFilter((prev) => ({
                ...prev,
                page,
                pageSize: size,
              }));
            },
          }}
          onChange={handlePolicyTableChange}
          scroll={{ x: 1200 }}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title='Config Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description:
            'Manage config policy templates and system config values in separate tabs.',
          keywords: 'config, governance, system, policy, admin',
        }}
        extra={headerAction}
      />

      <Tabs
        activeKey={activeTab}
        className={styles.customTabs}
        onChange={(key) => setActiveTab(key as ConfigTabKey)}
        items={tabItems}
      />

      <UpsertConfigPolicyDrawer
        open={policyDrawerOpen}
        selectedPolicy={selectedPolicy}
        onClose={handleClosePolicyDrawer}
        onSuccess={() => {
          handleClosePolicyDrawer();
          refetchPolicy();
        }}
      />

      <UpsertSystemValueDrawer
        open={systemValueDrawerOpen}
        selectedConfig={selectedSystemConfig}
        onClose={handleCloseSystemValueDrawer}
        onSuccess={() => {
          handleCloseSystemValueDrawer();
          refetchSystem();
        }}
      />

      <ConfigDetailDrawer
        open={detailDrawerOpen}
        data={selectedSystemConfig}
        onClose={handleCloseDetailDrawer}
      />
    </div>
  );
};
