import { api } from '@/config';
import type { Result } from '@/shared/types';
import type {
  BillingApplyTopUpResult,
  BillingCreateTopUpOrderResult,
  BillingPackageItem,
  BillingPackageUpdateRequest,
  BillingSettlementView,
  BillingTopUpHistoryFilter,
  BillingTopUpHistoryView,
  BillingUsageCostConfigView,
  BillingUsageFilter,
  BillingUsageView,
  BillingWalletAdminRow,
  BillingWalletView,
  MoMoTopUpCallbackRequest,
} from '../types/billingTypes';

const BILLING_BASE = '/api/cms/billing';

export const billingService = {
  getPackages: () =>
    api.get<Result<BillingPackageItem[]>>(`${BILLING_BASE}/packages`),

  adminUpsertPackages: (packages: BillingPackageUpdateRequest[]) =>
    api.put<Result<BillingPackageItem[]>>(
      `${BILLING_BASE}/admin/packages`,
      packages,
    ),

  adminGetUsageCosts: () =>
    api.get<Result<BillingUsageCostConfigView>>(
      `${BILLING_BASE}/admin/usage-costs`,
    ),

  adminUpsertUsageCosts: (body: BillingUsageCostConfigView) =>
    api.put<Result<BillingUsageCostConfigView>>(
      `${BILLING_BASE}/admin/usage-costs`,
      body,
    ),

  adminGetWallets: (params: {
    lockedOnly?: boolean;
    negativeBalanceOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.lockedOnly !== undefined)
      qs.append('lockedOnly', String(params.lockedOnly));
    if (params.negativeBalanceOnly !== undefined)
      qs.append('negativeBalanceOnly', String(params.negativeBalanceOnly));
    if (params.page) qs.append('page', String(params.page));
    if (params.pageSize) qs.append('pageSize', String(params.pageSize));
    return api.get<Result<BillingWalletAdminRow[]>>(
      `${BILLING_BASE}/admin/wallets?${qs.toString()}`,
    );
  },

  adminCreditTokens: (
    brandId: string,
    body: { tokens: number; note?: string },
  ) =>
    api.post<Result<BillingWalletView>>(
      `${BILLING_BASE}/admin/brands/${brandId}/credit-tokens`,
      body,
    ),

  adminDebitTokens: (
    brandId: string,
    body: { tokens: number; note?: string },
  ) =>
    api.post<Result<BillingWalletView>>(
      `${BILLING_BASE}/admin/brands/${brandId}/debit-tokens`,
      body,
    ),

  adminForceLockWallet: (brandId: string, body: { reason?: string }) =>
    api.post<Result<BillingWalletView>>(
      `${BILLING_BASE}/admin/brands/${brandId}/force-lock`,
      body,
    ),

  adminForceUnlockWallet: (brandId: string, body: { reason?: string }) =>
    api.post<Result<BillingWalletView>>(
      `${BILLING_BASE}/admin/brands/${brandId}/force-unlock`,
      body,
    ),

  adminGetTopupHistory: (
    brandId: string,
    limit = 50,
    params?: { fromUtc?: string; toUtc?: string },
  ) => {
    const qs = new URLSearchParams();
    qs.append('limit', String(limit));
    if (params?.fromUtc) qs.append('fromUtc', params.fromUtc);
    if (params?.toUtc) qs.append('toUtc', params.toUtc);
    return api.get<Result<BillingTopUpHistoryView[]>>(
      `${BILLING_BASE}/admin/brands/${brandId}/topup-history?${qs.toString()}`,
    );
  },

  /** Brand / store manager: MoMo and credit top-ups for the scoped brand (not split by store). */
  getTopupHistory: (filter: BillingTopUpHistoryFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.brandId) params.append('brandId', filter.brandId);
    if (filter.fromUtc) params.append('fromUtc', filter.fromUtc);
    if (filter.toUtc) params.append('toUtc', filter.toUtc);
    if (filter.limit) params.append('limit', String(filter.limit));
    const qs = params.toString();
    return api.get<Result<BillingTopUpHistoryView[]>>(
      qs
        ? `${BILLING_BASE}/topup-history?${qs}`
        : `${BILLING_BASE}/topup-history`,
    );
  },

  getWallet: (brandId?: string) => {
    const params = new URLSearchParams();
    if (brandId) params.append('brandId', brandId);
    const qs = params.toString();
    return api.get<Result<BillingWalletView>>(
      qs ? `${BILLING_BASE}/wallet?${qs}` : `${BILLING_BASE}/wallet`,
    );
  },

  getUsage: (filter: BillingUsageFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.brandId) params.append('brandId', filter.brandId);
    if (filter.storeIds?.length) {
      filter.storeIds.forEach((id) => params.append('storeIds', id));
    } else if (filter.storeId) {
      params.append('storeId', filter.storeId);
    }
    if (filter.fromBusinessDate)
      params.append('fromBusinessDate', filter.fromBusinessDate);
    if (filter.toBusinessDate)
      params.append('toBusinessDate', filter.toBusinessDate);
    if (filter.limit) params.append('limit', filter.limit.toString());
    return api.get<Result<BillingUsageView[]>>(
      `${BILLING_BASE}/usage?${params.toString()}`,
    );
  },

  getSettlements: (brandId?: string, limit = 30) => {
    const params = new URLSearchParams();
    if (brandId) params.append('brandId', brandId);
    params.append('limit', limit.toString());
    return api.get<Result<BillingSettlementView[]>>(
      `${BILLING_BASE}/settlements?${params.toString()}`,
    );
  },

  createMoMoTopUpOrder: (body: {
    brandId?: string | null;
    packageCode: string;
  }) =>
    api.post<Result<BillingCreateTopUpOrderResult>>(
      `${BILLING_BASE}/topup/momo/orders`,
      body,
    ),

  /** Dev: completes mock MoMo top-up when API has Billing:MoMo:UseMock enabled. */
  mockCompleteMoMoTopUp: (body: { brandId?: string | null; orderId: string }) =>
    api.post<Result<BillingApplyTopUpResult>>(
      `${BILLING_BASE}/topup/momo/mock-complete`,
      body,
    ),

  applyMoMoTopUpCallback: (body: MoMoTopUpCallbackRequest) =>
    api.post<Result<string>>(`${BILLING_BASE}/topup/momo/callback`, body),
};
