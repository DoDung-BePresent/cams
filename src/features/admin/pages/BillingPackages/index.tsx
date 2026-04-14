import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Flex,
  Input,
  InputNumber,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useCallback, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

import { STALE_TIME } from '@/config';
import { PageHeader } from '@/shared/components';
import {
  billingService,
  type BillingPackageItem,
} from '@/shared/modules/billing';

type Row = BillingPackageItem & { key: string };

const newKey = () =>
  `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const AdminBillingPackages = () => {
  const queryClient = useQueryClient();
  const [draftRows, setDraftRows] = useState<Row[] | null>(null);

  const packagesQuery = useQuery({
    queryKey: ['billing', 'admin', 'packages'],
    queryFn: async () => {
      const res = await billingService.getPackages();
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load packages');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.medium,
  });

  const serverRows = useMemo<Row[]>(
    () =>
      (packagesQuery.data ?? []).map((p) => ({
        ...p,
        key: p.code,
      })),
    [packagesQuery.data],
  );
  const rows = draftRows ?? serverRows;

  const saveMutation = useMutation({
    mutationFn: async (payload: BillingPackageItem[]) => {
      const res = await billingService.adminUpsertPackages(payload);
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Save failed');
      }
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Package catalog saved.');
      setDraftRows(null);
      queryClient.invalidateQueries({
        queryKey: ['billing', 'admin', 'packages'],
      });
      queryClient.invalidateQueries({ queryKey: ['billing', 'packages'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const updateRow = useCallback(
    (key: string, patch: Partial<BillingPackageItem>) => {
      setDraftRows((prev) => {
        const current = prev ?? serverRows;
        return current.map((r) => (r.key === key ? { ...r, ...patch } : r));
      });
    },
    [serverRows],
  );

  const addRow = useCallback(() => {
    setDraftRows((prev) => {
      const current = prev ?? serverRows;
      return [
        ...current,
        {
          key: newKey(),
          code: '',
          tokens: 0,
          amount: 0,
          currency: 'VND',
        },
      ];
    });
  }, [serverRows]);

  const removeRow = useCallback(
    (key: string) => {
      setDraftRows((prev) => {
        const current = prev ?? serverRows;
        return current.filter((r) => r.key !== key);
      });
    },
    [serverRows],
  );

  const handleSave = () => {
    const invalid = rows.some(
      (r) =>
        !r.code?.trim() ||
        r.tokens <= 0 ||
        r.amount <= 0 ||
        !r.currency?.trim(),
    );
    if (invalid) {
      message.warning(
        'Each row needs code, tokens & amount > 0, and currency.',
      );
      return;
    }
    const codes = rows.map((r) => r.code.trim().toUpperCase());
    if (new Set(codes).size !== codes.length) {
      message.warning('Package codes must be unique.');
      return;
    }
    saveMutation.mutate(
      rows.map((r) => ({
        code: r.code.trim(),
        tokens: r.tokens,
        amount: r.amount,
        currency: r.currency.trim().toUpperCase(),
      })),
    );
  };

  const columns: ColumnsType<Row> = [
    {
      title: 'Code',
      dataIndex: 'code',
      width: 160,
      render: (_, r) => (
        <Input
          value={r.code}
          placeholder='TOKEN_20K'
          onChange={(e) => updateRow(r.key, { code: e.target.value })}
        />
      ),
    },
    {
      title: 'Tokens',
      dataIndex: 'tokens',
      width: 130,
      render: (_, r) => (
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          value={r.tokens}
          onChange={(v) => updateRow(r.key, { tokens: Number(v) || 0 })}
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 140,
      render: (_, r) => (
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          value={r.amount}
          onChange={(v) => updateRow(r.key, { amount: Number(v) || 0 })}
        />
      ),
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      width: 100,
      render: (_, r) => (
        <Input
          maxLength={8}
          value={r.currency}
          onChange={(e) => updateRow(r.key, { currency: e.target.value })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, r) => (
        <Button
          type='text'
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeRow(r.key)}
          aria-label='Remove row'
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title='Token packages'
        breadcrumbs={[{ title: 'Admin' }, { title: 'Token packages' }]}
        seo={{
          description: 'Configure token bundles for MoMo top-up.',
          keywords: 'billing, packages, admin',
        }}
      />

      <Card>
        <Typography.Paragraph type='secondary'>
          These packages are shown to brand managers for MoMo purchase. Saving
          replaces the catalog server-side (admin only).
        </Typography.Paragraph>

        {packagesQuery.isError && (
          <Alert
            type='error'
            className='mb-4!'
            message={(packagesQuery.error as Error).message}
          />
        )}

        <Flex
          justify='space-between'
          align='center'
          wrap='wrap'
          gap={12}
          className='mb-4!'
        >
          <Space>
            <Button
              icon={<PlusOutlined />}
              onClick={addRow}
            >
              Add row
            </Button>
            <Button
              type='primary'
              icon={<SaveOutlined />}
              loading={saveMutation.isPending || packagesQuery.isLoading}
              onClick={handleSave}
            >
              Save catalog
            </Button>
          </Space>
          <Button
            onClick={() => {
              setDraftRows(null);
              packagesQuery.refetch();
            }}
            disabled={packagesQuery.isFetching}
          >
            Reload from server
          </Button>
        </Flex>

        <Table<Row>
          loading={packagesQuery.isLoading && rows.length === 0}
          rowKey='key'
          pagination={false}
          columns={columns}
          dataSource={rows}
          locale={{ emptyText: 'No packages — add a row or reload.' }}
        />
      </Card>
    </div>
  );
};
