import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, message, Space } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useCallback, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

import { STALE_TIME } from '@/config';
import { AppModal, DataTable, PageHeader } from '@/shared/components';
import {
  billingService,
  type BillingPackageItem,
} from '@/shared/modules/billing';
import { EditableCell, EditableRow } from './components';

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
      message.success('Package catalog saved');
      setDraftRows(null);
      queryClient.invalidateQueries({
        queryKey: ['billing', 'admin', 'packages'],
      });
      queryClient.invalidateQueries({ queryKey: ['billing', 'packages'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const handleSave = useCallback(
    (row: Row) => {
      setDraftRows((prev) => {
        const current = prev ?? serverRows;
        return current.map((r) => (r.key === row.key ? row : r));
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
      AppModal.confirm({
        type: 'warning',
        title: 'Delete Package',
        content: 'Are you sure you want to delete this package?',
        okButtonProps: {
          danger: true,
        },
        onOk: () => {
          setDraftRows((prev) => {
            const current = prev ?? serverRows;
            return current.filter((r) => r.key !== key);
          });
        },
      });
    },
    [serverRows],
  );

  const handleSaveAll = () => {
    const invalid = rows.some(
      (r) =>
        !r.code?.trim() ||
        r.tokens <= 0 ||
        r.amount <= 0 ||
        !r.currency?.trim(),
    );
    if (invalid) {
      message.warning('Each row needs code, tokens & amount > 0, and currency');
      return;
    }
    const codes = rows.map((r) => r.code.trim().toUpperCase());
    if (new Set(codes).size !== codes.length) {
      message.warning('Package codes must be unique');
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

  const defaultColumns: (ColumnsType<Row>[number] & {
    editable?: boolean;
    dataIndex?: string;
    inputType?: 'text' | 'number';
  })[] = [
    {
      title: 'No.',
      key: 'index',
      dataIndex: 'key',
      width: 70,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: 'Package Code',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      editable: true,
      inputType: 'text',
    },
    {
      title: 'Tokens',
      dataIndex: 'tokens',
      key: 'tokens',
      width: 150,
      editable: true,
      inputType: 'number',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      editable: true,
      inputType: 'number',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: 120,
      editable: true,
      inputType: 'text',
    },
    {
      title: 'Actions',
      key: 'actions',
      dataIndex: 'key',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type='text'
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeRow(record.key)}
        >
          Delete
        </Button>
      ),
    },
  ];

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: Row) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        inputType: col.inputType,
        handleSave,
        step: col.inputType === 'number' ? 1000 : undefined,
      }),
    };
  });

  const breadcrumbs = [{ title: 'Dashboard' }, { title: 'Token Packages' }];

  return (
    <div>
      <PageHeader
        title='Token Packages'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Configure token bundles for MoMo top-up',
          keywords: 'billing, packages, admin, tokens',
        }}
        extra={
          <Space>
            <Button
              size='large'
              icon={<PlusOutlined />}
              onClick={addRow}
            >
              Add Package
            </Button>
            <Button
              size='large'
              type='primary'
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              onClick={handleSaveAll}
              disabled={!draftRows || packagesQuery.isLoading}
            >
              Save Catalog
            </Button>
          </Space>
        }
      />

      <DataTable<Row>
        components={components}
        rowClassName={() => 'editable-row'}
        columns={columns as ColumnsType<Row>}
        dataSource={rows}
        rowKey='key'
        loading={packagesQuery.isLoading}
        pagination={false}
        scroll={{ x: 800 }}
      />
    </div>
  );
};
