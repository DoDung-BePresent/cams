# Test Cases — Subscription & Token Billing

**Module:** Billing & Token Wallet  
**Roles:** SystemAdmin (package management, admin credit), BrandManager (wallet, top-up, usage), StoreManager (view usage on dashboard)  
**APIs:** `GET /api/cms/billing/packages`, `PUT /api/cms/billing/admin/packages`, `GET /api/cms/billing/wallet`, `GET /api/cms/billing/usage`, `GET /api/cms/billing/settlements`, `POST /api/cms/billing/admin/brands/{brandId}/credit-tokens`, `POST /api/cms/billing/topup/momo/orders`, `POST /api/cms/billing/topup/momo/mock-complete`

---

## Wallet & Balance

| Test Case ID | Test Case Description                       | Test Case Procedure                                            | Expected Results                                                                      | Pre-conditions                        |
| ------------ | ------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| BILL-01      | BrandManager views wallet balance           | Navigate to Billing/Wallet screen                              | `BillingWalletView` displayed: `balanceTokens`, `isLocked`, `businessDate`            | BrandManager logged in; wallet exists |
| BILL-02      | Wallet locked state displayed correctly     | View wallet when `isLocked: true`                              | Locked status badge shown; `lockedFromBusinessDate` displayed; top-up CTA highlighted | Brand wallet is locked                |
| BILL-03      | Wallet balance updates after top-up         | Complete a successful top-up; return to wallet view            | `balanceTokens` reflects credited amount; `isLocked` becomes `false` if was locked    | Wallet in locked state                |
| BILL-04      | SystemAdmin views wallet for specific brand | Admin navigates to brand billing; passes `brandId` query param | Wallet data for the specified brand shown                                             | SystemAdmin logged in; brand exists   |

---

## Package Management (SystemAdmin)

| Test Case ID | Test Case Description                        | Test Case Procedure                            | Expected Results                                                                                           | Pre-conditions                      |
| ------------ | -------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| BILL-05      | SystemAdmin views billing packages           | Navigate to `/admin/billing-packages`          | Package list loaded: `code`, `tokens`, `amount`, `currency` for each package                               | SystemAdmin logged in               |
| BILL-06      | SystemAdmin updates package pricing          | Edit token amount or price for a package; save | `PUT /api/cms/billing/admin/packages` called; updated values reflected in list                             | SystemAdmin logged in               |
| BILL-07      | SystemAdmin credits tokens to brand manually | Enter brand ID and token amount; confirm       | `POST /api/cms/billing/admin/brands/{brandId}/credit-tokens` called; success message; brand wallet updated | SystemAdmin logged in; brand exists |
| BILL-08      | Admin credit with invalid brand ID           | Enter non-existent brand ID; submit            | Error response shown; no tokens credited                                                                   | SystemAdmin logged in               |

---

## MoMo Top-Up Flow

| Test Case ID | Test Case Description                   | Test Case Procedure                                                   | Expected Results                                                                                                   | Pre-conditions                             |
| ------------ | --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| BILL-09      | BrandManager initiates MoMo top-up      | Select a package; click Top Up; choose MoMo                           | `POST /api/cms/billing/topup/momo/orders` called; `paymentUrl` returned; user redirected to MoMo payment page      | BrandManager logged in; packages available |
| BILL-10      | Mock MoMo payment completion (dev mode) | After creating order with `isMock: true`; call mock-complete          | `POST /api/cms/billing/topup/momo/mock-complete` called; `creditedTokens` and `balanceAfter` shown; wallet updated | `Billing:MoMo:UseMock = true` in config    |
| BILL-11      | MoMo payment return page renders        | Complete MoMo flow; browser redirects to `/brand/billing/momo-return` | Return page shows success/failure based on MoMo callback params; wallet refreshed                                  | MoMo payment flow completed                |
| BILL-12      | Duplicate top-up order prevented        | Submit same orderId twice via callback                                | `isDuplicate: true` in response; tokens not double-credited                                                        | Previous order already processed           |
| BILL-13      | Top-up with invalid package code        | Manually submit order with non-existent `packageCode`                 | API returns error; no order created                                                                                | BrandManager logged in                     |

---

## Usage & Settlement History

| Test Case ID | Test Case Description                | Test Case Procedure                                 | Expected Results                                                                                                        | Pre-conditions                            |
| ------------ | ------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| BILL-14      | View token usage history             | Navigate to Usage tab; observe list                 | `BillingUsageView` list shown: `usageType`, `tokensCharged`, `chargedAtUtc`, `source` per entry                         | Brand has usage records                   |
| BILL-15      | Filter usage by date range           | Set `fromBusinessDate` and `toBusinessDate` filters | Only usage within range returned; entries outside range excluded                                                        | Usage records exist across multiple dates |
| BILL-16      | Filter usage by store                | Select a specific store filter                      | Usage filtered to entries with matching `storeId`                                                                       | Brand has multiple stores                 |
| BILL-17      | View daily settlement summary        | Navigate to Settlements tab                         | `BillingSettlementView` list: `openingBalanceTokens`, `totalUsageTokens`, `closingBalanceTokens`, `lockApplied` per day | Settlement records exist                  |
| BILL-18      | StoreManager sees usage on dashboard | Login as StoreManager; view dashboard               | `BillingUsageView` for own store visible; no access to wallet top-up                                                    | StoreManager logged in; usage exists      |

---

## Authorization & Edge Cases

| Test Case ID | Test Case Description                               | Test Case Procedure                                               | Expected Results                                                              | Pre-conditions                            |
| ------------ | --------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| BILL-19      | BrandManager cannot access admin package management | Login as BrandManager; call `PUT /api/cms/billing/admin/packages` | 403 Forbidden returned; admin UI not visible                                  | BrandManager account                      |
| BILL-20      | BrandManager cannot view other brand's wallet       | BrandManager calls wallet API with another brand's ID             | API ignores param; returns own brand's wallet only                            | BrandManager logged in                    |
| BILL-21      | Locked wallet blocks CAMS usage                     | Brand wallet locked; attempt to stream music in a space           | CAMS playback restricted or degraded; error surfaced in space control panel   | Brand wallet `isLocked: true`             |
| BILL-22      | Zero token balance warning displayed                | Brand wallet at 0 tokens but not locked                           | Warning indicator shown on wallet screen; top-up CTA displayed                | Brand wallet `balanceTokens = 0`          |
| BILL-23      | Usage records link to generation or space           | View a usage entry with `generationRequestId` or `spaceId` set    | Related entity info shown (space name or generation reference)                | Usage records with related entities exist |
| BILL-24      | Settlements pagination                              | More than 30 settlement records exist; change `limit`             | Records limited to requested count; UI handles pagination or scroll correctly | Sufficient settlement history             |
| BILL-25      | Currency displayed correctly for packages           | View package list                                                 | `currency` field shown (e.g., "VND"); amount formatted appropriately          | Packages configured                       |
