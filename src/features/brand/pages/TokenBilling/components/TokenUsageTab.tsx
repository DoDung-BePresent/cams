import { useMemo, useState } from 'react';
import { DatePicker, Select, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import type { UseQueryResult } from '@tanstack/react-query';

import type { BillingUsageView } from '@/shared/modules/billing';
import { DataTable } from '@/shared/components';

type TokenUsageTabProps = {
  usageQuery: UseQueryResult<BillingUsageView[], Error>;
  storeOptions: { label: string; value: string }[];
  storeNameById: Map<string, string>;
  isStoreManagerOnly: boolean;
  storesLoading: boolean;
};

export const TokenUsageTab = ({
  usageQuery,
  storeOptions,
  storeNameById,
  isStoreManagerOnly,
  storesLoading,
}: TokenUsageTabProps) => {
  const [usageStoreIds, setUsageStoreIds] = useState<string[]>([]);
  const [usageBusinessDateRange, setUsageBusinessDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: ColumnsType<BillingUsageView> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 60,
        align: 'center',
        render: (_: unknown, __: BillingUsageView, index: number) =>
          (currentPage - 1) * pageSize + index + 1,
      },
      {
        title: 'Business date',
        dataIndex: 'businessDate',
        key: 'businessDate',
        width: 120,
        render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
      },
      {
        title: 'Type',
        dataIndex: 'usageType',
        key: 'usageType',
        width: 120,
      },
      {
        title: 'Tokens',
        dataIndex: 'tokensCharged',
        key: 'tokensCharged',
        width: 100,
        render: (n: number) => (
          <span style={{ color: '#cf1322', fontWeight: 600 }}>-{n}</span>
        ),
      },
      {
        title: 'Store',
        dataIndex: 'storeId',
        key: 'storeId',
        ellipsis: true,
        render: (id: string | null) =>
          id ? (storeNameById.get(id) ?? id) : '—',
      },
      {
        title: 'Charged (UTC)',
        dataIndex: 'chargedAtUtc',
        key: 'chargedAtUtc',
        width: 180,
        render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
      },
      { title: 'Source', dataIndex: 'source', key: 'source', ellipsis: true },
    ],
    [currentPage, pageSize, storeNameById],
  );

  return (
    <div>
      {!isStoreManagerOnly && (
        <Space
          wrap
          style={{ marginBottom: 16 }}
        >
          <Select
            size='large'
            mode='multiple'
            allowClear
            placeholder='All stores'
            style={{ minWidth: 280 }}
            options={storeOptions}
            value={usageStoreIds}
            onChange={setUsageStoreIds}
            loading={storesLoading}
          />
          <DatePicker.RangePicker
            size='large'
            value={usageBusinessDateRange}
            onChange={(v) => setUsageBusinessDateRange(v)}
          />
        </Space>
      )}
      {isStoreManagerOnly && (
        <Typography.Paragraph
          type='secondary'
          style={{ marginBottom: 16 }}
        >
          Showing usage for your assigned store only.
        </Typography.Paragraph>
      )}
      <DataTable<BillingUsageView>
        rowKey={(row) =>
          `${row.chargedAtUtc}-${row.usageType}-${row.storeId ?? ''}-${row.source}`
        }
        columns={columns}
        dataSource={usageQuery.data ?? []}
        loading={usageQuery.isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
        }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};
