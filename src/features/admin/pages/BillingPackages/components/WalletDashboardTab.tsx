import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';

import { STALE_TIME } from '@/config';
import { DataTable } from '@/shared/components';
import {
  billingService,
  type BillingTopUpHistoryView,
  type BillingUsageCostConfigView,
  type BillingWalletAdminRow,
} from '@/shared/modules/billing';
import { brandService } from '@/features/admin/services';
import type { BrandListItem } from '@/features/admin/types';

export const WalletDashboardTab = () => {
  const queryClient = useQueryClient();
  const [selectedBrandId, setSelectedBrandId] = useState<string>();
  const [walletFilterLockedOnly, setWalletFilterLockedOnly] = useState(false);
  const [walletFilterNegativeOnly, setWalletFilterNegativeOnly] =
    useState(false);
  const [adjustForm] = Form.useForm<{
    tokens: number;
    note?: string;
    reason?: string;
  }>();
  const [usageCostForm] = Form.useForm<BillingUsageCostConfigView>();

  const usageCostQuery = useQuery({
    queryKey: ['billing', 'admin', 'usage-costs'],
    queryFn: async () => {
      const res = await billingService.adminGetUsageCosts();
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load usage token costs');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.short,
  });

  const saveUsageCostMutation = useMutation({
    mutationFn: async (payload: BillingUsageCostConfigView) => {
      const res = await billingService.adminUpsertUsageCosts(payload);
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to save usage token costs');
      }
      return res.data.data;
    },
    onSuccess: (data) => {
      usageCostForm.setFieldsValue(data);
      message.success('Usage token costs updated.');
      queryClient.invalidateQueries({
        queryKey: ['billing', 'admin', 'usage-costs'],
      });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const brandsQuery = useQuery({
    queryKey: ['admin', 'brands', 'for-billing'],
    queryFn: async () => {
      const res = await brandService.getList({
        page: 1,
        pageSize: 500,
        sortBy: 'name',
        isAscending: true,
      });
      return res.data.items;
    },
    staleTime: STALE_TIME.medium,
  });

  const walletsQuery = useQuery({
    queryKey: [
      'billing',
      'admin',
      'wallets',
      walletFilterLockedOnly,
      walletFilterNegativeOnly,
    ],
    queryFn: async () => {
      const res = await billingService.adminGetWallets({
        page: 1,
        pageSize: 200,
        lockedOnly: walletFilterLockedOnly || undefined,
        negativeBalanceOnly: walletFilterNegativeOnly || undefined,
      });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load wallet dashboard');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.short,
  });

  const topupHistoryQuery = useQuery({
    queryKey: ['billing', 'admin', 'topup-history', selectedBrandId],
    enabled: !!selectedBrandId,
    queryFn: async () => {
      const res = await billingService.adminGetTopupHistory(
        selectedBrandId!,
        100,
      );
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load top-up history');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.short,
  });

  useEffect(() => {
    if (usageCostQuery.data) {
      usageCostForm.setFieldsValue(usageCostQuery.data);
    }
  }, [usageCostForm, usageCostQuery.data]);

  const refreshBillingDashboard = () => {
    queryClient.invalidateQueries({
      queryKey: ['billing', 'admin', 'wallets'],
    });
    queryClient.invalidateQueries({
      queryKey: ['billing', 'admin', 'topup-history', selectedBrandId],
    });
  };

  const creditMutation = useMutation({
    mutationFn: async (payload: {
      brandId: string;
      tokens: number;
      note?: string;
    }) => {
      const res = await billingService.adminCreditTokens(payload.brandId, {
        tokens: payload.tokens,
        note: payload.note,
      });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to credit tokens');
      }
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Credited tokens successfully.');
      refreshBillingDashboard();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const debitMutation = useMutation({
    mutationFn: async (payload: {
      brandId: string;
      tokens: number;
      note?: string;
    }) => {
      const res = await billingService.adminDebitTokens(payload.brandId, {
        tokens: payload.tokens,
        note: payload.note,
      });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to debit tokens');
      }
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Debited tokens successfully.');
      refreshBillingDashboard();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const lockMutation = useMutation({
    mutationFn: async (payload: {
      brandId: string;
      reason?: string;
      unlock?: boolean;
    }) => {
      const req = payload.unlock
        ? billingService.adminForceUnlockWallet(payload.brandId, {
            reason: payload.reason,
          })
        : billingService.adminForceLockWallet(payload.brandId, {
            reason: payload.reason,
          });
      const res = await req;
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to update lock status');
      }
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      message.success(vars.unlock ? 'Unlocked wallet.' : 'Locked wallet.');
      refreshBillingDashboard();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const walletColumns: ColumnsType<BillingWalletAdminRow> = [
    {
      title: 'No.',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_: unknown, __: BillingWalletAdminRow, index: number) =>
        index + 1,
    },
    { title: 'Brand', dataIndex: 'brandName', width: 260 },
    {
      title: 'Balance',
      dataIndex: 'balanceTokens',
      width: 140,
      render: (v: number) => (
        <Typography.Text style={{ color: v < 0 ? '#cf1322' : '#389e0d' }}>
          {v.toLocaleString()}
        </Typography.Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'lockStatus',
      width: 150,
      render: (_: string, row) => (
        <Tag color={row.isLockedToday ? 'error' : 'success'}>
          {row.isLockedToday ? 'LOCKED' : 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Debt date',
      dataIndex: 'lastDebtBusinessDate',
      width: 160,
      render: (v: string | null) =>
        v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, row) => (
        <Space>
          <Button
            size='small'
            onClick={() => setSelectedBrandId(row.brandId)}
          >
            Manage
          </Button>
          {row.isLockedToday ? (
            <Button
              size='small'
              type='primary'
              ghost
              loading={lockMutation.isPending}
              onClick={() =>
                lockMutation.mutate({
                  brandId: row.brandId,
                  unlock: true,
                  reason: 'Admin unlock from dashboard',
                })
              }
            >
              Unlock
            </Button>
          ) : (
            <Button
              size='small'
              danger
              loading={lockMutation.isPending}
              onClick={() =>
                lockMutation.mutate({
                  brandId: row.brandId,
                  reason: 'Admin lock from dashboard',
                })
              }
            >
              Lock
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const topupColumns: ColumnsType<BillingTopUpHistoryView> = [
    {
      title: 'No.',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_: unknown, __: BillingTopUpHistoryView, index: number) =>
        index + 1,
    },
    {
      title: 'Time',
      dataIndex: 'topUpDateUtc',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString('vi-VN'),
    },
    {
      title: 'Tokens',
      dataIndex: 'tokensCredited',
      width: 120,
      render: (v: number) => v.toLocaleString(),
    },
    { title: 'Package', dataIndex: 'packageCode', width: 180 },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 120,
      render: (v: number, row) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: row.currency || 'VND',
          maximumFractionDigits: 0,
        }).format(v),
    },
    {
      title: 'Provider',
      dataIndex: 'paymentProvider',
      width: 130,
      render: (v: string | null) => v ?? '—',
    },
  ];

  const selectedBrandOptions = (brandsQuery.data ?? []).map(
    (b: BrandListItem) => ({
      value: b.id,
      label: b.name,
    }),
  );

  const submitCredit = async () => {
    if (!selectedBrandId) {
      message.warning('Please select a brand first.');
      return;
    }
    const values = await adjustForm.validateFields();
    creditMutation.mutate({
      brandId: selectedBrandId,
      tokens: values.tokens,
      note: values.note,
    });
  };

  const submitDebit = async () => {
    if (!selectedBrandId) {
      message.warning('Please select a brand first.');
      return;
    }
    const values = await adjustForm.validateFields();
    debitMutation.mutate({
      brandId: selectedBrandId,
      tokens: values.tokens,
      note: values.note,
    });
  };

  const submitLock = async (unlock = false) => {
    if (!selectedBrandId) {
      message.warning('Please select a brand first.');
      return;
    }
    const values = adjustForm.getFieldsValue();
    lockMutation.mutate({
      brandId: selectedBrandId,
      reason: values.reason || values.note,
      unlock,
    });
  };

  const submitUsageCosts = async () => {
    const values = await usageCostForm.validateFields();
    saveUsageCostMutation.mutate({
      streamingSpaceDailyTokens: Number(values.streamingSpaceDailyTokens) || 0,
      aiGenerationSunoTokens: Number(values.aiGenerationSunoTokens) || 0,
      aiGenerationBrandModelTokens:
        Number(values.aiGenerationBrandModelTokens) || 0,
      manualUploadCopyrightScanTokens:
        Number(values.manualUploadCopyrightScanTokens) || 0,
    });
  };

  const exportTopupCsv = () => {
    const rows = topupHistoryQuery.data ?? [];
    if (rows.length === 0) {
      message.info('No top-up history to export.');
      return;
    }

    const header = [
      'TopUpDateUtc',
      'BrandId',
      'PackageCode',
      'TokensCredited',
      'Amount',
      'Currency',
      'PaymentProvider',
      'ExternalTransactionId',
      'CreatedByUserId',
    ];
    const csvRows = rows.map((r) => [
      r.topUpDateUtc,
      r.brandId,
      r.packageCode,
      String(r.tokensCredited),
      String(r.amount),
      r.currency,
      r.paymentProvider ?? '',
      r.externalTransactionId ?? '',
      r.createdByUserId ?? '',
    ]);

    const escapeCell = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const csv = [header, ...csvRows]
      .map((line) => line.map((c) => escapeCell(c)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-topup-history-${selectedBrandId ?? 'brand'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Typography.Title level={4}>Admin token dashboard</Typography.Title>
      <Typography.Paragraph type='secondary'>
        Monitor wallet balances, lock status, usage token costs, and admin
        actions.
      </Typography.Paragraph>

      <Card
        type='inner'
        className='mb-4!'
        title='Usage token cost config'
      >
        <Form
          form={usageCostForm}
          layout='vertical'
        >
          <Flex
            wrap='wrap'
            gap={12}
          >
            <Form.Item
              label='AI generation tokens (Suno)'
              name='aiGenerationSunoTokens'
              style={{ minWidth: 280 }}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label='AI generation tokens (Brand model)'
              name='aiGenerationBrandModelTokens'
              style={{ minWidth: 280 }}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label='Streaming daily tokens (per space/day)'
              name='streamingSpaceDailyTokens'
              style={{ minWidth: 280 }}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label='Manual upload scan tokens'
              name='manualUploadCopyrightScanTokens'
              style={{ minWidth: 280 }}
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Flex>
          <Space>
            <Button
              type='primary'
              loading={
                saveUsageCostMutation.isPending || usageCostQuery.isLoading
              }
              onClick={submitUsageCosts}
            >
              Save usage costs
            </Button>
          </Space>
        </Form>
      </Card>

      <Flex
        gap={16}
        wrap='wrap'
        align='center'
        className='mb-4!'
      >
        <Space>
          <Typography.Text>Locked only</Typography.Text>
          <Switch
            checked={walletFilterLockedOnly}
            onChange={setWalletFilterLockedOnly}
          />
        </Space>
        <Space>
          <Typography.Text>Negative balance only</Typography.Text>
          <Switch
            checked={walletFilterNegativeOnly}
            onChange={setWalletFilterNegativeOnly}
          />
        </Space>
      </Flex>

      {walletsQuery.isError && (
        <Alert
          type='error'
          className='mb-4!'
          message={(walletsQuery.error as Error).message}
        />
      )}

      <DataTable<BillingWalletAdminRow>
        rowKey='brandId'
        loading={walletsQuery.isLoading}
        pagination={{ pageSize: 10 }}
        columns={walletColumns}
        dataSource={walletsQuery.data ?? []}
        rowClassName={(row) =>
          row.balanceTokens < 0
            ? 'bg-[#2A171B]! border-l-4! border-red-500!'
            : ''
        }
      />

      <Card
        type='inner'
        className='mt-4!'
        title='Manage selected brand'
      >
        <Form
          form={adjustForm}
          layout='vertical'
        >
          <Form.Item label='Brand'>
            <Select
              showSearch
              allowClear
              optionFilterProp='label'
              placeholder='Select brand'
              loading={brandsQuery.isLoading}
              options={selectedBrandOptions}
              value={selectedBrandId}
              onChange={setSelectedBrandId}
            />
          </Form.Item>
          <Flex
            wrap='wrap'
            gap={12}
          >
            <Form.Item
              label='Tokens'
              name='tokens'
              style={{ minWidth: 180 }}
              rules={[{ required: true, message: 'Enter token amount' }]}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label='Note'
              name='note'
              style={{ flex: 1, minWidth: 260 }}
            >
              <Input placeholder='Reason / note for audit log' />
            </Form.Item>
            <Form.Item
              label='Lock reason'
              name='reason'
              style={{ flex: 1, minWidth: 260 }}
            >
              <Input placeholder='Optional reason for lock/unlock' />
            </Form.Item>
          </Flex>
          <Space wrap>
            <Button
              type='primary'
              loading={creditMutation.isPending}
              onClick={submitCredit}
            >
              Credit tokens
            </Button>
            <Button
              danger
              loading={debitMutation.isPending}
              onClick={submitDebit}
            >
              Debit tokens
            </Button>
            <Button
              loading={lockMutation.isPending}
              onClick={() => submitLock(false)}
            >
              Force lock
            </Button>
            <Button
              type='primary'
              ghost
              loading={lockMutation.isPending}
              onClick={() => submitLock(true)}
            >
              Force unlock
            </Button>
          </Space>
        </Form>
      </Card>

      <Card
        type='inner'
        className='mt-4!'
        title='Top-up history (selected brand)'
        extra={
          <Button
            icon={<DownloadOutlined />}
            disabled={
              !selectedBrandId || (topupHistoryQuery.data?.length ?? 0) === 0
            }
            onClick={exportTopupCsv}
          >
            Export CSV
          </Button>
        }
      >
        {!selectedBrandId ? (
          <Typography.Text type='secondary'>
            Select a brand above to view top-up history.
          </Typography.Text>
        ) : (
          <DataTable<BillingTopUpHistoryView>
            rowKey='id'
            loading={topupHistoryQuery.isLoading}
            columns={topupColumns}
            dataSource={topupHistoryQuery.data ?? []}
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>
    </>
  );
};
