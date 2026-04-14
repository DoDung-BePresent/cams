import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  LockOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import { STALE_TIME } from '@/config';
import { PageHeader } from '@/shared/components';
import { billingService } from '@/shared/modules/billing';
import type { BillingPackageItem } from '@/shared/modules/billing';

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

export const BrandTokenBilling = () => {
  const queryClient = useQueryClient();
  const [pendingMockOrderId, setPendingMockOrderId] = useState<string | null>(
    null,
  );

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
                onClick={() => walletQuery.refetch()}
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
