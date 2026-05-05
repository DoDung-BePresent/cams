import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  LockOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { createStyles } from 'antd-style';
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

const formatPackageName = (code: string) =>
  code
    .replace(/^TOKEN_/i, '')
    .replace(/K$/i, 'K tokens')
    .replace(/_/g, ' ');

const useStyle = createStyles(({ css }) => {
  return {
    pricingCard: css`
      background: #18181b;
      border: 1px solid #2d2528;
      border-radius: 14px;
      transition: all 0.3s ease;
      height: 100%;
      display: flex;
      flex-direction: column;

      &:hover {
        border-color: rgba(248, 113, 113, 0.42);
        box-shadow: 0 18px 38px rgba(0, 0, 0, 0.32);
        transform: translateY(-4px);
      }

      .ant-card-head {
        border-bottom: 1px solid #2d2528;
        padding: 20px 24px;
        color: #f8f7f7;
      }

      .ant-card-body {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    `,
    popularCard: css`
      border-color: #ef4444;
      position: relative;

      &::before {
        content: 'POPULAR';
        position: absolute;
        top: -12px;
        right: 24px;
        background: #ef4444;
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }

      &:hover {
        border-color: #f87171;
        box-shadow: 0 18px 42px rgba(127, 29, 29, 0.28);
      }
    `,
    priceSection: css`
      text-align: center;
      padding: 24px 0;
      border-bottom: 1px solid #2d2528;
      margin-bottom: 24px;
    `,
    price: css`
      font-size: 48px;
      font-weight: 700;
      color: #f8f7f7;
      line-height: 1;
      margin-bottom: 8px;
    `,
    tokens: css`
      font-size: 24px;
      font-weight: 600;
      color: #fca5a5;
      margin-bottom: 4px;
    `,
    featureList: css`
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
      flex: 1;

      li {
        padding: 8px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #b7adb0;

        .anticon {
          color: #86efac;
          font-size: 16px;
        }
      }
    `,
  };
});

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
  const { styles, cx } = useStyle();
  const wallet = walletQuery.data;

  // Sort packages by tokens to determine popular
  const sortedPackages = [...(packagesQuery.data ?? [])].sort(
    (a, b) => a.tokens - b.tokens,
  );
  const middleIndex = Math.floor(sortedPackages.length / 2);

  return (
    <>
      <Card
        title={
          <Space>
            <ShoppingOutlined />
            Token packages
          </Space>
        }
        extra={
          walletQuery.isLoading ? (
            <Skeleton.Button
              active
              size='small'
            />
          ) : walletQuery.isError ? null : (
            <Space size='large'>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color:
                    (wallet?.balanceTokens ?? 0) < 0 ? '#fca5a5' : '#86efac',
                }}
              >
                {wallet?.balanceTokens?.toLocaleString() ?? 0} tokens
              </span>
              {wallet?.isLocked && (
                <Tag
                  color='error'
                  icon={<LockOutlined />}
                >
                  Locked
                </Tag>
              )}
            </Space>
          )
        }
      >
        {wallet?.isLocked && (
          <Alert
            type='warning'
            showIcon
            icon={<LockOutlined />}
            message='Wallet locked'
            description='Top up to clear debt and unlock playback / generation.'
            style={{ marginBottom: 16 }}
          />
        )}

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
            {sortedPackages.map((pkg: BillingPackageItem, index: number) => {
              const isPopular = index === middleIndex;
              return (
                <Col
                  xs={24}
                  sm={12}
                  md={8}
                  key={pkg.code}
                >
                  <Card
                    className={cx(
                      styles.pricingCard,
                      isPopular && styles.popularCard,
                    )}
                    title={
                      <Space>
                        <ShoppingOutlined />
                        {formatPackageName(pkg.code)}
                      </Space>
                    }
                  >
                    <div className={styles.priceSection}>
                      <div className={styles.price}>
                        {formatMoney(pkg.amount, pkg.currency)}
                      </div>
                      <div className={styles.tokens}>
                        {pkg.tokens.toLocaleString()} tokens
                      </div>
                      <Typography.Text type='secondary'>
                        One-time payment
                      </Typography.Text>
                    </div>

                    <ul className={styles.featureList}>
                      <li>
                        <CheckOutlined />
                        <span>Instant token credit</span>
                      </li>
                      <li>
                        <CheckOutlined />
                        <span>MoMo payment gateway</span>
                      </li>
                      <li>
                        <CheckOutlined />
                        <span>No expiration date</span>
                      </li>
                      <li>
                        <CheckOutlined />
                        <span>Secure transaction</span>
                      </li>
                    </ul>

                    <Button
                      type={isPopular ? 'primary' : 'default'}
                      size='large'
                      block
                      loading={topUpMutation.isPending}
                      onClick={() => topUpMutation.mutate(pkg.code)}
                    >
                      Buy with MoMo
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {(packagesQuery.data?.length ?? 0) === 0 &&
          !packagesQuery.isLoading && (
            <Typography.Text type='secondary'>
              No packages configured yet.
            </Typography.Text>
          )}
      </Card>

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
