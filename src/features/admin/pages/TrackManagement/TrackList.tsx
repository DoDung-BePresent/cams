import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Tabs, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { createStyles } from 'antd-style';

/**
 * Components
 */
import { PageHeader, DataTable } from '@/shared/components';
import { getTrackColumns } from '@/shared/modules/tracks/components';
import {
  TrackDetailsDrawer,
  TrackFilter as TrackFilterComponent,
  CreateSharedTrackDrawer,
  EditSharedTrackDrawer,
} from './components';

/**
 * Hooks
 */
import {
  useTracks,
  useDeleteTrack,
  useToggleTrackStatus,
} from '@/shared/modules/tracks/hooks';
import { useBlockedTracksForAdmin } from '@/shared/modules/tracks/hooks';
import { useBrands } from '@/features/admin/hooks';

import { AppModal } from '@/shared/components';

/**
 * Constants
 */
import { PAGINATION_SIZES } from '@/shared/constants';

/**
 * Types
 */
import type { TrackFilter, TrackListItem } from '@/shared/modules/tracks/types';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

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

export const TrackList = () => {
  const { styles } = useStyle();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState<'all' | 'blocked'>('all');

  const [allFilter, setAllFilter] = useState<TrackFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    isAscending: false,
  });

  const [blockedFilter, setBlockedFilter] = useState<TrackFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'brandId',
    isAscending: true,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editTrackId, setEditTrackId] = useState<string>();

  const deleteTrack = useDeleteTrack();
  const toggleTrackStatus = useToggleTrackStatus();

  const {
    data: allData,
    isLoading: isAllLoading,
    refetch: refetchAll,
  } = useTracks(allFilter);
  const {
    data: blockedData,
    isLoading: isBlockedLoading,
    refetch: refetchBlocked,
  } = useBlockedTracksForAdmin(blockedFilter);
  const { data: brandsData } = useBrands({
    page: 1,
    pageSize: 500,
    sortBy: 'name',
    isAscending: true,
  });

  const currentFilter = activeTabKey === 'all' ? allFilter : blockedFilter;
  const setCurrentFilter =
    activeTabKey === 'all' ? setAllFilter : setBlockedFilter;
  const currentData = activeTabKey === 'all' ? allData : blockedData;
  const isCurrentLoading =
    activeTabKey === 'all' ? isAllLoading : isBlockedLoading;

  const brandOptions = useMemo(
    () =>
      (brandsData?.items || []).map((brand) => ({
        label: brand.name,
        value: brand.id,
      })),
    [brandsData?.items],
  );

  const brandNameById = useMemo(() => {
    const map = new Map<string, string>();
    (brandsData?.items || []).forEach((brand) => {
      map.set(brand.id, brand.name);
    });
    return map;
  }, [brandsData?.items]);

  const handleSearch = (value: string) => {
    setCurrentFilter((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (
    key: keyof TrackFilter,
    value: TrackFilter[keyof TrackFilter] | undefined,
  ) => {
    setCurrentFilter((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<TrackListItem> | SorterResult<TrackListItem>[],
  ) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const defaultSortBy = activeTabKey === 'blocked' ? 'brandId' : 'createdAt';
    const defaultIsAscending = activeTabKey === 'blocked';

    setCurrentFilter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sortBy: currentSorter.field ? String(currentSorter.field) : defaultSortBy,
      isAscending: currentSorter.order
        ? currentSorter.order === 'ascend'
        : defaultIsAscending,
    }));
  };

  const handleView = (id: string) => {
    setSelectedTrackId(id);
    setDetailsDrawerOpen(true);
  };

  const handlePreview = (id: string) => {
    setSelectedTrackId(id);
    setDetailsDrawerOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditTrackId(id);
    setEditDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    AppModal.confirm({
      title: 'Delete Track',
      content:
        'Are you sure you want to delete this track? This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteTrack.mutate(id),
    });
  };

  const handleToggleStatus = (id: string) => {
    AppModal.warning({
      title: 'Toggle Track Status',
      content: 'Are you sure you want to change the status of this track?',
      okText: 'Confirm',
      onOk: () => toggleTrackStatus.mutate(id),
    });
  };

  const handleReset = () => {
    const defaultSortBy = activeTabKey === 'blocked' ? 'brandId' : 'createdAt';
    const defaultIsAscending = activeTabKey === 'blocked';

    setCurrentFilter({
      page: 1,
      pageSize: 10,
      sortBy: defaultSortBy,
      isAscending: defaultIsAscending,
    });
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Track Library',
    },
  ];

  const columns = useMemo(() => {
    const baseColumns = getTrackColumns({
      onView: handleView,
      onPreview: handlePreview,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onToggleStatus: handleToggleStatus,
      isActionAllowed: (record) => !record.brandId,
    });

    if (activeTabKey !== 'blocked') {
      return baseColumns;
    }

    const brandColumn: ColumnsType<TrackListItem>[number] = {
      title: 'Brand',
      dataIndex: 'brandId',
      key: 'brandId',
      width: 180,
      sorter: true,
      render: (brandId?: string) =>
        brandId ? brandNameById.get(brandId) || brandId : '-',
    };

    const insertAt = Math.min(3, baseColumns.length);
    return [
      ...baseColumns.slice(0, insertAt),
      brandColumn,
      ...baseColumns.slice(insertAt),
    ];
  }, [
    activeTabKey,
    brandNameById,
    handleView,
    handlePreview,
    handleEdit,
    handleDelete,
    handleToggleStatus,
  ]);

  return (
    <div>
      <PageHeader
        title='Track Library'
        breadcrumbs={breadcrumbs}
        extra={
          activeTabKey === 'all' && (
            <Button
              type='primary'
              size='large'
              icon={<PlusOutlined />}
              onClick={() => setCreateDrawerOpen(true)}
            >
              Create Shared Track
            </Button>
          )
        }
      />

      {/* Filter Component */}
      <Tabs
        activeKey={activeTabKey}
        className={styles.customTabs}
        onChange={(key) => setActiveTabKey(key as 'all' | 'blocked')}
        items={[
          {
            key: 'all',
            label: 'All Tracks',
          },
          {
            key: 'blocked',
            label: 'Blocked Tracks',
          },
        ]}
      />

      <DataTable<TrackListItem>
        filter={
          <TrackFilterComponent
            filter={currentFilter}
            showAdvanced={showFilters}
            brandOptions={brandOptions}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            onRefresh={() => {
              if (activeTabKey === 'all') {
                void refetchAll();
                return;
              }

              void refetchBlocked();
            }}
            onReset={handleReset}
          />
        }
        columns={columns}
        dataSource={currentData?.items || []}
        loading={isCurrentLoading}
        rowKey='id'
        pagination={{
          current: currentFilter.page,
          pageSize: currentFilter.pageSize,
          total: currentData?.totalItems || 0,
          showSizeChanger: true,
          showTotal: (total) =>
            activeTabKey === 'all'
              ? `Total ${total} tracks`
              : `Total ${total} blocked tracks`,
          pageSizeOptions: PAGINATION_SIZES,
          onChange: (page, size) => {
            setCurrentFilter((prev) => ({ ...prev, page, pageSize: size }));
          },
        }}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
      />

      {/* Details Drawer (View Only) */}
      <TrackDetailsDrawer
        open={detailsDrawerOpen}
        trackId={selectedTrackId}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedTrackId(undefined);
        }}
      />

      {/* Create Shared Track Drawer */}
      <CreateSharedTrackDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => setCreateDrawerOpen(false)}
      />

      {/* Edit Shared Track Drawer */}
      <EditSharedTrackDrawer
        open={editDrawerOpen}
        trackId={editTrackId}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditTrackId(undefined);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setEditTrackId(undefined);
        }}
      />
    </div>
  );
};
