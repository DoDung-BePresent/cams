import { useMemo, useState } from 'react';
import {
  Button,
  Col,
  Flex,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import { MODAL_WIDTHS } from '@/config';
import { STORE_STATUS_OPTIONS } from '@/features/brand/constants';
import { useStores } from '@/features/brand/hooks';
import type { StoreFilter, StoreListItem } from '@/features/brand/types';
import { AppModal, DataTable } from '@/shared/components';
import { PAGINATION_SIZES } from '@/shared/constants';
import { EntityStatusEnum } from '@/shared/types';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

type SelectAffectedStoresModalProps = {
  open: boolean;
  selectedStoreIds: string[];
  onClose: () => void;
  onApply: (storeIds: string[]) => void;
};

const DEFAULT_FILTER: StoreFilter = {
  page: 1,
  pageSize: 10,
  sortBy: 'name',
  isAscending: true,
  status: EntityStatusEnum.Active,
};

const getStatusLabel = (status?: number) => {
  if (status === EntityStatusEnum.Active) {
    return 'Active';
  }

  if (status === EntityStatusEnum.Inactive) {
    return 'Inactive';
  }

  if (status === EntityStatusEnum.Pending) {
    return 'Pending';
  }

  if (status === EntityStatusEnum.Rejected) {
    return 'Rejected';
  }

  return '-';
};

export const SelectAffectedStoresModal = ({
  open,
  selectedStoreIds,
  onClose,
  onApply,
}: SelectAffectedStoresModalProps) => {
  const [filter, setFilter] = useState<StoreFilter>(DEFAULT_FILTER);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [draftSelectedStoreIds, setDraftSelectedStoreIds] =
    useState<string[]>(selectedStoreIds);

  const { data, isLoading, refetch } = useStores(filter);

  const hasActiveFilters =
    !!filter.search ||
    filter.status !== undefined ||
    !!filter.city ||
    !!filter.district;

  const cityOptions = useMemo(() => {
    const cities = new Set(
      (data?.items || [])
        .filter((store) => store.city)
        .map((store) => store.city!),
    );

    return Array.from(cities)
      .sort()
      .map((city) => ({ label: city, value: city }));
  }, [data?.items]);

  const columns: ColumnsType<StoreListItem> = [
    {
      title: 'Store',
      dataIndex: 'name',
      sorter: true,
      render: (_, record) => (
        <Space
          direction='vertical'
          size={0}
        >
          <Text strong>{record.name}</Text>
          <Text type='secondary'>{record.address || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'City',
      dataIndex: 'city',
      width: 140,
      render: (value: string | null) => value || '-',
    },
    {
      title: 'District',
      dataIndex: 'district',
      width: 140,
      render: (value: string | null) => value || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: number) => getStatusLabel(value),
    },
  ];

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<StoreListItem> | SorterResult<StoreListItem>[],
  ) => {
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    setFilter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sortBy: currentSorter.field ? String(currentSorter.field) : 'name',
      isAscending: currentSorter.order === 'ascend',
    }));
  };

  return (
    <AppModal
      title='Select Affected Stores'
      open={open}
      width={MODAL_WIDTHS.medium}
      onCancel={onClose}
      onOk={() => onApply(draftSelectedStoreIds)}
      okText='Apply Selected Stores'
      size='large'
      scrollable={false}
      afterOpenChange={(isOpen) => {
        if (!isOpen) {
          return;
        }

        setDraftSelectedStoreIds(selectedStoreIds);
      }}
    >
      <DataTable<StoreListItem>
        filter={
          <Space
            direction='vertical'
            size='middle'
            style={{ width: '100%' }}
          >
            <Flex
              justify='space-between'
              wrap='wrap'
            >
              <Input
                size='large'
                placeholder='Search by name, city, district or address...'
                prefix={<SearchOutlined />}
                value={filter.search}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    search: e.target.value || undefined,
                    page: 1,
                  }))
                }
                style={{ width: 300 }}
                allowClear
              />

              <Space>
                <Button
                  size='large'
                  icon={<FilterOutlined />}
                  onClick={() => setShowAdvanced((prev) => !prev)}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  size='large'
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                >
                  Refresh
                </Button>
                {hasActiveFilters && (
                  <Button
                    size='large'
                    onClick={() => setFilter(DEFAULT_FILTER)}
                  >
                    Reset Filters
                  </Button>
                )}
              </Space>
            </Flex>

            {showAdvanced && (
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Select
                    size='large'
                    placeholder='Filter by Status'
                    options={STORE_STATUS_OPTIONS}
                    value={filter.status}
                    onChange={(value) =>
                      setFilter((prev) => ({ ...prev, status: value, page: 1 }))
                    }
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Col>
                <Col span={8}>
                  <Select
                    size='large'
                    placeholder='Filter by City'
                    options={cityOptions}
                    value={filter.city}
                    onChange={(value) =>
                      setFilter((prev) => ({ ...prev, city: value, page: 1 }))
                    }
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    optionFilterProp='label'
                  />
                </Col>
                <Col span={8}>
                  <Input
                    size='large'
                    placeholder='Filter by District'
                    value={filter.district}
                    onChange={(e) =>
                      setFilter((prev) => ({
                        ...prev,
                        district: e.target.value || undefined,
                        page: 1,
                      }))
                    }
                    allowClear
                  />
                </Col>
              </Row>
            )}

            {hasActiveFilters && (
              <Space wrap>
                {filter.status !== undefined && (
                  <Tag
                    closable
                    onClose={() =>
                      setFilter((prev) => ({
                        ...prev,
                        status: undefined,
                        page: 1,
                      }))
                    }
                  >
                    Status:{' '}
                    {
                      STORE_STATUS_OPTIONS?.find(
                        (item) => item?.value === filter.status,
                      )?.label
                    }
                  </Tag>
                )}
                {filter.city && (
                  <Tag
                    closable
                    onClose={() =>
                      setFilter((prev) => ({
                        ...prev,
                        city: undefined,
                        page: 1,
                      }))
                    }
                  >
                    City: {filter.city}
                  </Tag>
                )}
                {filter.district && (
                  <Tag
                    closable
                    onClose={() =>
                      setFilter((prev) => ({
                        ...prev,
                        district: undefined,
                        page: 1,
                      }))
                    }
                  >
                    District: {filter.district}
                  </Tag>
                )}
              </Space>
            )}
          </Space>
        }
        rowKey='id'
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        rowSelection={{
          selectedRowKeys: draftSelectedStoreIds,
          onChange: (selectedRowKeys) =>
            setDraftSelectedStoreIds(selectedRowKeys as string[]),
        }}
        onRow={(record) => ({
          onClick: () => {
            setDraftSelectedStoreIds((prev) =>
              prev.includes(record.id)
                ? prev.filter((id) => id !== record.id)
                : [...prev, record.id],
            );
          },
        })}
        pagination={{
          current: filter.page,
          pageSize: filter.pageSize,
          total: data?.totalItems || 0,
          showSizeChanger: true,
          pageSizeOptions: PAGINATION_SIZES,
          showTotal: (total) => `Total ${total} stores`,
          onChange: (page, pageSize) => {
            setFilter((prev) => ({
              ...prev,
              page,
              pageSize,
            }));
          },
        }}
        onChange={handleTableChange}
      />
    </AppModal>
  );
};
