import type { Rule } from 'antd/es/form';

export const branchValidation = {
  branch_name: [
    { required: true, message: 'Please input branch name!' },
    { min: 2, message: 'Branch name must be at least 2 characters!' },
    { max: 100, message: 'Branch name must not exceed 100 characters!' },
  ] as Rule[],
  branch_code: [
    { required: true, message: 'Please input branch code!' },
    {
      pattern: /^[A-Z0-9_]+$/,
      message:
        'Branch code must be uppercase letters, numbers, and underscores only!',
    },
    { max: 20, message: 'Branch code must not exceed 20 characters!' },
  ] as Rule[],
  address: [
    { required: true, message: 'Please input branch address!' },
    { min: 10, message: 'Address must be at least 10 characters!' },
    { max: 255, message: 'Address must not exceed 255 characters!' },
  ] as Rule[],
  status: [
    { required: true, message: 'Please select branch status!' },
  ] as Rule[],
};
