import type { Rule } from 'antd/es/form';

export const configValidation = {
  key: [
    { required: true, message: 'Please input config key!' },
    { max: 200, message: 'Config key must not exceed 200 characters!' },
  ] as Rule[],

  domain: [
    { required: true, message: 'Please select config domain!' },
  ] as Rule[],

  tier: [{ required: true, message: 'Please select policy tier!' }] as Rule[],

  defaultValue: [
    { max: 2000, message: 'Default value must not exceed 2000 characters!' },
  ] as Rule[],
};
