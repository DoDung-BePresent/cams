import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  HistoryOutlined,
  LockOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  TransactionOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import { STALE_TIME, QUERY_KEYS } from '@/config';
import { PageHeader } from '@/shared/components';
import { useProfile } from '@/shared/modules/auth/hooks';
import { billingService } from '@/shared/modules/billing';
import type {
  BillingPackageItem,
  BillingTopUpHistoryView,
  BillingUsageView,
} from '@/shared/modules/billing';
import { storeService } from '@/features/brand/services/storeService';
import { RoleEnum } from '@/shared/types';

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

export const BrandTokenBilling = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [pendingMockOrderId, setPendingMockOrderId] = useState<string | null>(
    null,
  );
  const [usageStoreIds, setUsageStoreIds] = useState<string[]>([]);
  const [usageBusinessDateRange, setUsageBusinessDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [topupUtcRange, setTopupUtcRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const isStoreManagerOnly =
    !!profile?.roles?.includes(RoleEnum.StoreManager) &&
    !profile?.roles?.includes(RoleEnum.BrandManager) &&
    !profile?.roles?.includes(RoleEnum.SystemAdmin);

  const storesQuery = useQuery({
    queryKey: QUERY_KEYS.stores.list({ page: 1, pageSize: 200 }),
    queryFn: async () => {
      const res = await storeService.getList({ page: 1, pageSize: 200 });
      return res.data;
    },
    staleTime: STALE_TIME.medium,
  });

  const storeOptions = useMemo(
    () =>
      (storesQuery.data?.items ?? []).map((s) => ({
        label: s.name,
        value: s.id,
      })),
    [storesQuery.data?.items],
  );

  const storeNameById = useMemo(() => {
    const m = new Map<string, string>();
    (storesQuery.data?.items ?? []).forEach((s) => m.set(s.id, s.name));
    return m;
  }, [storesQuery.data?.items]);

  const usageQuery = useQuery({
    queryKey: [
      'billing',
      'usage',
      'brand',
      usageStoreIds,
      usageBusinessDateRange?.[0]?.format('YYYY-MM-DD'),
      usageBusinessDateRange?.[1]?.format('YYYY-MM-DD'),
      isStoreManagerOnly,
    ],
    queryFn: async () => {
      const res = await billingService.getUsage({
        storeIds:
          !isStoreManagerOnly && usageStoreIds.length > 0
            ? usageStoreIds
            : undefined,
        fromBusinessDate:
          usageBusinessDateRange?.[0]?.format('YYYY-MM-DD') ?? undefined,
        toBusinessDate:
          usageBusinessDateRange?.[1]?.format('YYYY-MM-DD') ?? undefined,
        limit: 200,
      });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load token usage');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.short,
  });

  const topupQuery = useQuery({
    queryKey: [
      'billing',
      'topup-history',
      'brand',
      topupUtcRange?.[0]?.toISOString(),
      topupUtcRange?.[1]?.toISOString(),
    ],
    queryFn: async () => {
      const res = await billingService.getTopupHistory({
        fromUtc: topupUtcRange?.[0]?.toISOString(),
        toUtc: topupUtcRange?.[1]?.toISOString(),
        limit: 100,
      });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load top-up history');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.short,
  });

  const usageColumns: ColumnsType<BillingUsageView> = [
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
      render: (id: string | null) => (id ? (storeNameById.get(id) ?? id) : '—'),
    },
    {
      title: 'Charged (UTC)',
      dataIndex: 'chargedAtUtc',
      key: 'chargedAtUtc',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: 'Source', dataIndex: 'source', key: 'source', ellipsis: true },
  ];

  const topupColumns: ColumnsType<BillingTopUpHistoryView> = [
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
  ];

  const packagesQuery = useQuery({
    queryKey: ['billing', 'packages'],
    queryFn: async () => {
      const res = await billingService.getPackages();
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load packages');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.medium,
  });

  const walletQuery = useQuery({
    queryKey: ['billing', 'wallet', 'brand'],
    queryFn: async () => {
      const res = await billingService.getWallet();
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load wallet');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.short,
  });

  const topUpMutation = useMutation({
    mutationFn: async (packageCode: string) => {
      const res = await billingService.createMoMoTopUpOrder({ packageCode });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Could not create MoMo order');
      }
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data.isMock) {
        setPendingMockOrderId(data.orderId);
        message.info(
          'Mock MoMo: use “Complete test payment” below to credit tokens (no real wallet).',
        );
        return;
      }
      message.success('Opening MoMo payment…');
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
      }
      queryClient.invalidateQueries({ queryKey: ['billing', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'topup-history'] });
    },
    onError: (e: Error) => {
      message.error(e.message);
    },
  });

  const mockCompleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await billingService.mockCompleteMoMoTopUp({ orderId });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Could not complete mock payment');
      }
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data.isDuplicate) {
        message.info(data.message);
      } else {
        message.success(
          `${data.message} New balance: ${data.balanceAfter.toLocaleString()} tokens.`,
        );
      }
      setPendingMockOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['billing', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'usage'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'topup-history'] });
    },
    onError: (e: Error) => {
      message.error(e.message);
    },
  });

  const wallet = walletQuery.data;

  return (
    <div>
      <PageHeader
        title='Tokens & top-up'
        breadcrumbs={[{ title: 'Brand' }, { title: 'Tokens & top-up' }]}
        seo={{
          description:
            'Buy token packages (MoMo) and view brand wallet balance.',
          keywords: 'tokens, billing, MoMo, wallet',
        }}
      />

      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          lg={8}
        >
          <Card
            title={
              <Space>
                <WalletOutlined />
                Wallet
              </Space>
            }
            extra={
              <Button
                size='small'
                icon={<ReloadOutlined />}
                onClick={() => {
                  void walletQuery.refetch();
                  void usageQuery.refetch();
                  void topupQuery.refetch();
                }}
              >
                Refresh
              </Button>
            }
          >
            {walletQuery.isLoading ? (
              <Skeleton active />
            ) : walletQuery.isError ? (
              <Alert
                type='error'
                message={(walletQuery.error as Error).message}
              />
            ) : (
              <Space
                direction='vertical'
                size='middle'
                style={{ width: '100%' }}
              >
                <Statistic
                  title='Balance'
                  value={wallet?.balanceTokens ?? 0}
                  suffix='tokens'
                  valueStyle={{
                    color:
                      (wallet?.balanceTokens ?? 0) < 0 ? '#cf1322' : '#3f8600',
                    fontWeight: 700,
                  }}
                />
                <div>
                  <Typography.Text type='secondary'>Status: </Typography.Text>
                  <Tag color={wallet?.isLocked ? 'error' : 'success'}>
                    {wallet?.lockStatus ?? '—'}
                  </Tag>
                </div>
                {wallet?.isLocked && (
                  <Alert
                    type='warning'
                    showIcon
                    icon={<LockOutlined />}
                    message='Wallet locked'
                    description='Top up to clear debt and unlock playback / generation.'
                  />
                )}
              </Space>
            )}
          </Card>
        </Col>

        <Col
          xs={24}
          lg={16}
        >
          <Card
            title={
              <Space>
                <ShoppingOutlined />
                Token packages
              </Space>
            }
          >
            <Typography.Paragraph type='secondary'>
              Pay with MoMo. After payment completes, your balance updates
              automatically.
            </Typography.Paragraph>
            {packagesQuery.isLoading ? (
              <Skeleton active />
            ) : packagesQuery.isError ? (
              <Alert
                type='error'
                message={(packagesQuery.error as Error).message}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {(packagesQuery.data ?? []).map((pkg: BillingPackageItem) => (
                  <Col
                    xs={24}
                    sm={12}
                    md={8}
                    key={pkg.code}
                  >
                    <Card
                      size='small'
                      type='inner'
                      title={pkg.code}
                      styles={{ header: { fontSize: 13 } }}
                    >
                      <Statistic
                        title='Tokens'
                        value={pkg.tokens}
                        valueStyle={{ fontSize: 22 }}
                      />
                      <Typography.Title
                        level={4}
                        style={{ marginTop: 8, marginBottom: 16 }}
                      >
                        {formatMoney(pkg.amount, pkg.currency)}
                      </Typography.Title>
                      <Button
                        type='primary'
                        block
                        loading={topUpMutation.isPending}
                        onClick={() => topUpMutation.mutate(pkg.code)}
                      >
                        Buy with MoMo
                      </Button>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
            {(packagesQuery.data?.length ?? 0) === 0 &&
              !packagesQuery.isLoading && (
                <Typography.Text type='secondary'>
                  No packages configured yet.
                </Typography.Text>
              )}
          </Card>
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        style={{ marginTop: 8 }}
      >
        <Col span={24}>
          <Card
            title={
              <Space>
                <HistoryOutlined />
                Token usage (deductions)
              </Space>
            }
            extra={
              <Button
                size='small'
                icon={<ReloadOutlined />}
                onClick={() => void usageQuery.refetch()}
              >
                Refresh
              </Button>
            }
          >
            {!isStoreManagerOnly && (
              <Space
                wrap
                style={{ marginBottom: 16 }}
              >
                <Select
                  mode='multiple'
                  allowClear
                  placeholder='All stores'
                  style={{ minWidth: 280 }}
                  options={storeOptions}
                  value={usageStoreIds}
                  onChange={setUsageStoreIds}
                  loading={storesQuery.isLoading}
                />
                <DatePicker.RangePicker
                  value={usageBusinessDateRange}
                  onChange={(v) => setUsageBusinessDateRange(v)}
                />
              </Space>
            )}
            {isStoreManagerOnly && (
              <Typography.Paragraph type='secondary'>
                Showing usage for your assigned store only.
              </Typography.Paragraph>
            )}
            {usageQuery.isLoading ? (
              <Skeleton active />
            ) : usageQuery.isError ? (
              <Alert
                type='error'
                message={(usageQuery.error as Error).message}
              />
            ) : (
              <Table<BillingUsageView>
                size='small'
                rowKey={(row) =>
                  `${row.chargedAtUtc}-${row.usageType}-${row.storeId ?? ''}-${row.source}`
                }
                columns={usageColumns}
                dataSource={usageQuery.data ?? []}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 900 }}
              />
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title={
              <Space>
                <TransactionOutlined />
                Top-up transactions
              </Space>
            }
            extra={
              <Button
                size='small'
                icon={<ReloadOutlined />}
                onClick={() => void topupQuery.refetch()}
              >
                Refresh
              </Button>
            }
          >
            <Alert
              type='info'
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
                showTime
                value={topupUtcRange}
                onChange={(v) => setTopupUtcRange(v)}
              />
            </Space>
            {topupQuery.isLoading ? (
              <Skeleton active />
            ) : topupQuery.isError ? (
              <Alert
                type='error'
                message={(topupQuery.error as Error).message}
              />
            ) : (
              <Table<BillingTopUpHistoryView>
                size='small'
                rowKey={(row) => row.id}
                columns={topupColumns}
                dataSource={topupQuery.data ?? []}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {pendingMockOrderId && (
        <Alert
          style={{ marginTop: 16 }}
          type='info'
          showIcon
          message='Mock MoMo (development)'
          description={
            <Space
              direction='vertical'
              style={{ width: '100%' }}
              size='middle'
            >
              <Typography.Text type='secondary'>
                Order ID (server logs / debugging):
              </Typography.Text>
              <Typography.Text
                code
                copyable
              >
                {pendingMockOrderId}
              </Typography.Text>
              <Button
                type='primary'
                loading={mockCompleteMutation.isPending}
                onClick={() => mockCompleteMutation.mutate(pendingMockOrderId)}
              >
                Complete test payment
              </Button>
            </Space>
          }
        />
      )}
    </div>
  );
};
