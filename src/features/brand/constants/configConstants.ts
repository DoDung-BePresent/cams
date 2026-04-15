import type { SelectProps } from 'antd';

import {
  BrandOverrideIntentEnum,
  ConfigDomainEnum,
  ConfigScopeTypeEnum,
  ConfigTierEnum,
  ConfigValueTypeEnum,
} from '@/features/brand/types';

export const CONFIG_DOMAIN_OPTIONS: SelectProps['options'] = [
  { label: 'Ops', value: ConfigDomainEnum.Ops },
  { label: 'Playback', value: ConfigDomainEnum.Playback },
  { label: 'Fuzzy', value: ConfigDomainEnum.Fuzzy },
  { label: 'Content', value: ConfigDomainEnum.Content },
  { label: 'Governance', value: ConfigDomainEnum.Governance },
  { label: 'Scheduling', value: ConfigDomainEnum.Scheduling },
  { label: 'CAMS', value: ConfigDomainEnum.Cams },
  { label: 'System', value: ConfigDomainEnum.Sys },
];

export const CONFIG_VALUE_TYPE_OPTIONS: SelectProps['options'] = [
  { label: 'String', value: ConfigValueTypeEnum.String },
  { label: 'Number', value: ConfigValueTypeEnum.Number },
  { label: 'Boolean', value: ConfigValueTypeEnum.Boolean },
  { label: 'DateTime', value: ConfigValueTypeEnum.DateTime },
];

export const CONFIG_BOOL_VALUE_OPTIONS: SelectProps['options'] = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
];

export const BRAND_OVERRIDE_INTENT_OPTIONS: SelectProps['options'] = [
  { label: 'No override intent', value: BrandOverrideIntentEnum.None },
  {
    label: 'Allow store override',
    value: BrandOverrideIntentEnum.AllowStoreOverride,
  },
  {
    label: 'Force inherit to child stores',
    value: BrandOverrideIntentEnum.ForceInheritToAllChildren,
  },
];

export const CONFIG_DOMAIN_LABELS: Record<ConfigDomainEnum, string> = {
  [ConfigDomainEnum.Ops]: 'Ops',
  [ConfigDomainEnum.Playback]: 'Playback',
  [ConfigDomainEnum.Fuzzy]: 'Fuzzy',
  [ConfigDomainEnum.Content]: 'Content',
  [ConfigDomainEnum.Governance]: 'Governance',
  [ConfigDomainEnum.Scheduling]: 'Scheduling',
  [ConfigDomainEnum.Cams]: 'CAMS',
  [ConfigDomainEnum.Sys]: 'System',
};

export const CONFIG_SCOPE_LABELS: Record<ConfigScopeTypeEnum, string> = {
  [ConfigScopeTypeEnum.System]: 'System',
  [ConfigScopeTypeEnum.Brand]: 'Brand',
  [ConfigScopeTypeEnum.Store]: 'Store',
  [ConfigScopeTypeEnum.Space]: 'Space',
};

export const CONFIG_TIER_LABELS: Record<ConfigTierEnum, string> = {
  [ConfigTierEnum.System]: 'System',
  [ConfigTierEnum.Tenant]: 'Tenant',
};

export const CONFIG_VALUE_TYPE_LABELS: Record<ConfigValueTypeEnum, string> = {
  [ConfigValueTypeEnum.String]: 'String',
  [ConfigValueTypeEnum.Number]: 'Number',
  [ConfigValueTypeEnum.Boolean]: 'Boolean',
  [ConfigValueTypeEnum.DateTime]: 'DateTime',
};
