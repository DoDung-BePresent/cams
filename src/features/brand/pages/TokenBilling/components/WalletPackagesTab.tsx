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
} from 'antd';
import {
  LockOutlined,
  ShoppingOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type {
  BillingPackageItem,
  BillingWalletView,
  BillingCreateTopUpOrderResult,
  BillingApplyTopUpResult,
} from '@/shared/modules/billing';

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

type WalletPackagesTabProps = {
  walletQuery: UseQueryResult<BillingWalletView, Error>;
  packagesQuery: UseQueryResult<BillingPackageItem[], Error>;
  topUpMutation: UseMutationResult<
    BillingCreateTopUpOrderResult,
    Error,
    string,
    unknown
  >;
  mockCompleteMutation: UseMutationResult<
    BillingApplyTopUpResult,
    Error,
    string,
    unknown
  >;
  pendingMockOrderId: string | null;
};

export const WalletPackagesTab = ({
  walletQuery,
  packagesQuery,
  topUpMutation,
  mockCompleteMutation,
  pendingMockOrderId,
}: WalletPackagesTabProps) => {
  const wallet = walletQuery.data;

  return (
    <>
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
    </>
  );
};
