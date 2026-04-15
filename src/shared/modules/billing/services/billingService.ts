import { api } from '@/config';
import type { Result } from '@/shared/types';
import type {
  BillingApplyTopUpResult,
  BillingCreateTopUpOrderResult,
  BillingPackageItem,
  BillingPackageUpdateRequest,
  BillingSettlementView,
  BillingUsageFilter,
  BillingUsageView,
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
    if (filter.storeId) params.append('storeId', filter.storeId);
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
