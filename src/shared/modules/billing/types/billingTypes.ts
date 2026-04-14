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
  storeId?: string;
  fromBusinessDate?: string;
  toBusinessDate?: string;
  limit?: number;
};
