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

export type ConfigSystemFilter = BasePaginationFilter & {
  domain?: ConfigDomainEnum;
  key?: string;
  keyPrefix?: string;
  scopeType?: ConfigScopeTypeEnum;
  scopeId?: string;
};

export type ConfigPolicyFilter = BasePaginationFilter & {
  domain?: ConfigDomainEnum;
  key?: string;
  keyPrefix?: string;
};

export type ConfigPolicyRowItem = {
  key: string;
  domain: ConfigDomainEnum;
  tier: ConfigTierEnum;
  defaultValueType: ConfigValueTypeEnum;
  defaultValue?: string | null;
};

export type UpsertPolicyRequest = {
  key: string;
  domain: ConfigDomainEnum;
  tier: ConfigTierEnum;
  defaultValueType?: ConfigValueTypeEnum;
  defaultValue?: string;
};

export type UpsertSystemValueRequest = {
  key: string;
  domain: ConfigDomainEnum;
  valueType: ConfigValueTypeEnum;
  value: string;
};

export type ConfigSystemPaginationResult = PaginationResult<ConfigFlatRowItem>;
export type ConfigPolicyPaginationResult =
  PaginationResult<ConfigPolicyRowItem>;
