import { useMemo, useState } from 'react';
import { Alert, DatePicker, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import type { UseQueryResult } from '@tanstack/react-query';

import type { BillingTopUpHistoryView } from '@/shared/modules/billing';
import { DataTable } from '@/shared/components';

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

type TopupHistoryTabProps = {
  topupQuery: UseQueryResult<BillingTopUpHistoryView[], Error>;
};

export const TopupHistoryTab = ({ topupQuery }: TopupHistoryTabProps) => {
  const [topupUtcRange, setTopupUtcRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: ColumnsType<BillingTopUpHistoryView> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: 60,
        align: 'center',
        render: (_: unknown, __: BillingTopUpHistoryView, index: number) =>
          (currentPage - 1) * pageSize + index + 1,
      },
      {
        title: 'Time (UTC)',
        dataIndex: 'topUpDateUtc',
        key: 'topUpDateUtc',
        width: 180,
        render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: 'Package',
        dataIndex: 'packageCode',
        key: 'packageCode',
        width: 140,
      },
      {
        title: 'Tokens',
        dataIndex: 'tokensCredited',
        key: 'tokensCredited',
        width: 110,
        render: (n: number) => (
          <span style={{ color: '#3f8600', fontWeight: 600 }}>+{n}</span>
        ),
      },
      {
        title: 'Amount',
        key: 'amount',
        width: 120,
        render: (_, row) => formatMoney(row.amount, row.currency),
      },
      {
        title: 'Provider',
        dataIndex: 'paymentProvider',
        key: 'paymentProvider',
        width: 120,
        render: (v: string | null) => v ?? '—',
      },
    ],
    [currentPage, pageSize],
  );

  return (
    <div>
      <Alert
        type='info'
        closable
        showIcon
        style={{ marginBottom: 16 }}
        message='Brand wallet'
        description='MoMo and manual credits apply to the brand wallet; they are not attributed to individual stores.'
      />
      <Space
        wrap
        style={{ marginBottom: 16 }}
      >
        <DatePicker.RangePicker
          size='large'
          showTime
          value={topupUtcRange}
          onChange={(v) => setTopupUtcRange(v)}
        />
      </Space>
      <DataTable<BillingTopUpHistoryView>
        rowKey={(row) => row.id}
        columns={columns}
        dataSource={topupQuery.data ?? []}
        loading={topupQuery.isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
        }}
        scroll={{ x: 800 }}
      />
    </div>
  );
};
