import { useState } from 'react';
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
import { AppModal, DataTable } from '@/shared/components';
import { PAGINATION_SIZES } from '@/shared/constants';
import { EntityStatusEnum } from '@/shared/types';
import { useSpaces } from '@/shared/modules/spaces/hooks';
import {
  SPACE_STATUS_OPTIONS,
  SPACE_TYPE_LABELS,
  SPACE_TYPE_OPTIONS,
} from '@/shared/modules/spaces/constants';
import type {
  SpaceFilter,
  SpaceListItem,
  SpaceTypeEnum,
} from '@/shared/modules/spaces/types';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

type SelectAffectedSpacesModalProps = {
  open: boolean;
  selectedSpaceIds: string[];
  onClose: () => void;
  onApply: (spaceIds: string[]) => void;
};

const DEFAULT_FILTER: SpaceFilter = {
  page: 1,
  pageSize: 10,
  sortBy: 'name',
  isAscending: true,
  status: EntityStatusEnum.Active,
};

const getStatusLabel = (status?: number) => {
  const matched = SPACE_STATUS_OPTIONS?.find(
    (option) => option?.value === status,
  );
  return matched?.label || '-';
};

export const SelectAffectedSpacesModal = ({
  open,
  selectedSpaceIds,
  onClose,
  onApply,
}: SelectAffectedSpacesModalProps) => {
  const [filter, setFilter] = useState<SpaceFilter>(DEFAULT_FILTER);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [draftSelectedSpaceIds, setDraftSelectedSpaceIds] =
    useState<string[]>(selectedSpaceIds);

  const { data, isLoading, refetch } = useSpaces(filter, open);

  const hasActiveFilters =
    !!filter.search || filter.status !== undefined || filter.type !== undefined;

  const columns: ColumnsType<SpaceListItem> = [
    {
      title: 'Space',
      dataIndex: 'name',
      sorter: true,
      render: (_, record) => (
        <Space
          direction='vertical'
          size={0}
        >
          <Text strong>{record.name}</Text>
          <Text type='secondary'>{record.description || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 180,
      render: (value: SpaceTypeEnum) => SPACE_TYPE_LABELS[value] || '-',
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
    sorter: SorterResult<SpaceListItem> | SorterResult<SpaceListItem>[],
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
      title='Select Affected Spaces'
      open={open}
      width={MODAL_WIDTHS.medium}
      onCancel={onClose}
      onOk={() => onApply(draftSelectedSpaceIds)}
      okText='Apply Selected Spaces'
      size='large'
      scrollable={false}
      afterOpenChange={(isOpen) => {
        if (!isOpen) {
          return;
        }

        setDraftSelectedSpaceIds(selectedSpaceIds);
      }}
    >
      <DataTable<SpaceListItem>
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
                placeholder='Search by space name or description...'
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
                <Col span={12}>
                  <Select
                    size='large'
                    placeholder='Filter by Status'
                    options={SPACE_STATUS_OPTIONS}
                    value={filter.status}
                    onChange={(value) =>
                      setFilter((prev) => ({ ...prev, status: value, page: 1 }))
                    }
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    optionFilterProp='label'
                  />
                </Col>
                <Col span={12}>
                  <Select
                    size='large'
                    placeholder='Filter by Space Type'
                    options={SPACE_TYPE_OPTIONS}
                    value={filter.type}
                    onChange={(value) =>
                      setFilter((prev) => ({ ...prev, type: value, page: 1 }))
                    }
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    optionFilterProp='label'
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
                    Status: {getStatusLabel(filter.status)}
                  </Tag>
                )}
                {filter.type !== undefined && (
                  <Tag
                    closable
                    onClose={() =>
                      setFilter((prev) => ({
                        ...prev,
                        type: undefined,
                        page: 1,
                      }))
                    }
                  >
                    Type: {SPACE_TYPE_LABELS[filter.type as SpaceTypeEnum]}
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
          selectedRowKeys: draftSelectedSpaceIds,
          preserveSelectedRowKeys: true,
          onChange: (selectedRowKeys) =>
            setDraftSelectedSpaceIds(selectedRowKeys as string[]),
        }}
        onRow={(record) => ({
          onClick: () => {
            setDraftSelectedSpaceIds((prev) =>
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
          showTotal: (total) => `Total ${total} spaces`,
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
