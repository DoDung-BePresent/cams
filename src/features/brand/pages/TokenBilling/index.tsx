import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Tabs, message } from 'antd';
import { createStyles } from 'antd-style';
import {
  HistoryOutlined,
  TransactionOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import { STALE_TIME, QUERY_KEYS } from '@/config';
import { PageHeader } from '@/shared/components';
import { useProfile } from '@/shared/modules/auth/hooks';
import { billingService } from '@/shared/modules/billing';
import { storeService } from '@/features/brand/services/storeService';
import { RoleEnum } from '@/shared/types';
import {
  WalletPackagesTab,
  TokenUsageTab,
  TopupHistoryTab,
} from './components';

const useStyle = createStyles(({ css, prefixCls }) => {
  return {
    customTabs: css`
      .${prefixCls}-tabs-nav {
        margin-bottom: 0;
        .${prefixCls}-tabs-nav-wrap {
          .${prefixCls}-tabs-nav-list {
            width: 100%;
            .${prefixCls}-tabs-tab {
              justify-content: center;
              &:hover {
                background-color: var(--ant-blue-1);
                color: var(--ant-tabs-item-selected-color);
              }
            }
          }
        }
      }
    `,
  };
});

export const BrandTokenBilling = () => {
  const { styles } = useStyle();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [activeTab, setActiveTab] = useState<string>('wallet');
  const [pendingMockOrderId, setPendingMockOrderId] = useState<string | null>(
    null,
  );

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
    queryKey: ['billing', 'usage', 'brand', isStoreManagerOnly],
    queryFn: async () => {
      const res = await billingService.getUsage({
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
    queryKey: ['billing', 'topup-history', 'brand'],
    queryFn: async () => {
      const res = await billingService.getTopupHistory({
        limit: 100,
      });
      if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.message || 'Failed to load top-up history');
      }
      return res.data.data;
    },
    staleTime: STALE_TIME.short,
  });

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
          'Mock MoMo: use "Complete test payment" below to credit tokens (no real wallet).',
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

  const tabItems = [
    {
      key: 'wallet',
      label: (
        <span>
          <WalletOutlined className='mr-2' />
          Wallet & Packages
        </span>
      ),
    },
    {
      key: 'usage',
      label: (
        <span>
          <HistoryOutlined className='mr-2' />
          Token Usage
        </span>
      ),
    },
    {
      key: 'topup',
      label: (
        <span>
          <TransactionOutlined className='mr-2' />
          Top-up History
        </span>
      ),
    },
  ];

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

      <Card>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={setActiveTab}
          style={{ marginBottom: 24 }}
          styles={{
            item: {
              width: 'fit-content',
              paddingInline: 20,
            },
          }}
          className={styles.customTabs}
        />

        {activeTab === 'wallet' && (
          <WalletPackagesTab
            walletQuery={walletQuery}
            packagesQuery={packagesQuery}
            topUpMutation={topUpMutation}
            mockCompleteMutation={mockCompleteMutation}
            pendingMockOrderId={pendingMockOrderId}
          />
        )}

        {activeTab === 'usage' && (
          <TokenUsageTab
            usageQuery={usageQuery}
            storeOptions={storeOptions}
            storeNameById={storeNameById}
            isStoreManagerOnly={isStoreManagerOnly}
            storesLoading={storesQuery.isLoading}
          />
        )}

        {activeTab === 'topup' && <TopupHistoryTab topupQuery={topupQuery} />}
      </Card>
    </div>
  );
};
