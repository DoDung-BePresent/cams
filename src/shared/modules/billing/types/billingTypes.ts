export type BillingWalletView = {
  brandId: string;
  balanceTokens: number;
  lockStatus: string;
  lockedFromBusinessDate: string | null;
  businessDate: string;
  isLocked: boolean;
};

export type BillingPackageItem = {
  code: string;
  tokens: number;
  amount: number;
  currency: string;
};

export type BillingPackageUpdateRequest = BillingPackageItem;

export type BillingCreateTopUpOrderResult = {
  paymentUrl: string;
  orderId: string;
  requestId: string;
  packageCode: string;
  tokens: number;
  amount: number;
  currency: string;
  createdAtUtc: string;
  /** When true, complete payment via mock-complete API (Billing:MoMo:UseMock). */
  isMock?: boolean;
};

export type BillingApplyTopUpResult = {
  isSuccess: boolean;
  isDuplicate: boolean;
  brandId: string;
  creditedTokens: number;
  balanceAfter: number;
  message: string;
};

export type MoMoTopUpCallbackRequest = {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  resultCode: number;
  transId?: number;
  message?: string;
  orderInfo?: string;
  orderType?: string;
  payType?: string;
  extraData?: string;
  responseTime?: number;
  signature: string;
};

export type BillingUsageView = {
  businessDate: string;
  usageType: string;
  tokensCharged: number;
  storeId: string | null;
  spaceId: string | null;
  generationRequestId: string | null;
  chargedAtUtc: string;
  source: string;
};

export type BillingSettlementView = {
  businessDate: string;
  openingBalanceTokens: number;
  totalUsageTokens: number;
  closingBalanceTokens: number;
  lockApplied: boolean;
  settledAtUtc: string;
};

export type BillingUsageFilter = {
  brandId?: string;
  /** Single store (backward compatible). Ignored when `storeIds` is set. */
  storeId?: string;
  /** Filter to these stores (OR). Omit for all stores under the brand. */
  storeIds?: string[];
  fromBusinessDate?: string;
  toBusinessDate?: string;
  limit?: number;
};

export type BillingTopUpHistoryFilter = {
  brandId?: string;
  fromUtc?: string;
  toUtc?: string;
  limit?: number;
};

export type BillingWalletAdminRow = {
  brandId: string;
  brandName: string;
  balanceTokens: number;
  lockStatus: string;
  isLockedToday: boolean;
  lockedFromBusinessDate: string | null;
  lastDebtBusinessDate: string | null;
  walletUpdatedAtUtc: string;
};

export type BillingTopUpHistoryView = {
  id: string;
  brandId: string;
  packageCode: string;
  tokensCredited: number;
  amount: number;
  currency: string;
  paymentProvider: string | null;
  externalTransactionId: string | null;
  topUpDateUtc: string;
  createdByUserId: string | null;
};

export type BillingUsageCostConfigView = {
  streamingSpaceDailyTokens: number;
  aiGenerationSunoTokens: number;
  aiGenerationBrandModelTokens: number;
  manualUploadCopyrightScanTokens: number;
};
