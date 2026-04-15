import type { BasePaginationFilter, PaginationResult } from '@/shared/types';

export enum ConfigDomainEnum {
  Ops = 1,
  Playback = 2,
  Fuzzy = 3,
  Content = 4,
  Governance = 5,
  Scheduling = 6,
  Cams = 7,
  Sys = 8,
}

export enum ConfigScopeTypeEnum {
  System = 0,
  Brand = 1,
  Store = 2,
  Space = 3,
}

export enum ConfigTierEnum {
  System = 0,
  Tenant = 1,
}

export enum ConfigValueTypeEnum {
  String = 1,
  Number = 2,
  Boolean = 3,
  DateTime = 4,
}

export enum BrandOverrideIntentEnum {
  None = 0,
  AllowStoreOverride = 1,
  ForceInheritToAllChildren = 2,
}

export type ConfigFlatRowItem = {
  key: string;
  domain: ConfigDomainEnum;
  scopeType: ConfigScopeTypeEnum;
  scopeId: string;
  valueType?: ConfigValueTypeEnum | null;
  value?: string | null;
  policyTier?: ConfigTierEnum | null;
  policyDefaultValueType?: ConfigValueTypeEnum | null;
  policyDefaultValue?: string | null;
  allowStoreOverride?: boolean | null;
  allowSpaceOverride?: boolean | null;
  brandLockReason?: string | null;
};

export type ConfigBrandFilter = BasePaginationFilter & {
  domain?: ConfigDomainEnum;
  key?: string;
  keyPrefix?: string;
};

export type UpsertBrandValueRequest = {
  key: string;
  domain: ConfigDomainEnum;
  valueType: ConfigValueTypeEnum;
  value: string;
  overrideIntent?: BrandOverrideIntentEnum;
  overrideReason?: string;
  targetStoreIds?: string[];
};

export type ConfigBrandPaginationResult = PaginationResult<ConfigFlatRowItem>;

// ── Governance Mode ──────────────────────────────────────────────────────────

export enum GovernanceModeEnum {
  StrictSync = 1,
  AIMode = 2,
  Freedom = 3,
}

export const GOVERNANCE_MODE_LABELS: Record<GovernanceModeEnum, string> = {
  [GovernanceModeEnum.StrictSync]: 'Strict Sync',
  [GovernanceModeEnum.AIMode]: 'AI Mode',
  [GovernanceModeEnum.Freedom]: 'Freedom',
};

export const GOVERNANCE_MODE_DESCRIPTIONS: Record<GovernanceModeEnum, string> =
  {
    [GovernanceModeEnum.StrictSync]:
      'Server-scheduled playback. Store follows the brand schedule and local queue control is locked down.',
    [GovernanceModeEnum.AIMode]:
      'AI-driven playback within brand policy bounds. Managers can intervene temporarily and AI resumes afterward.',
    [GovernanceModeEnum.Freedom]:
      'Store has full playback autonomy within the brand allowlist, with AI only filling gaps when needed.',
  };

export type SetStoreGovernanceModeRequest = {
  storeIds: string[];
  mode: GovernanceModeEnum;
};
