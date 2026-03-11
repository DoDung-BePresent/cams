import type { Rule } from 'antd/es/form';

export const loginValidation = {
  email: [
    { required: true, message: 'Please input your email!' },
    { type: 'email', message: 'Please enter a valid email!' },
  ] as Rule[],
  password: [
    { required: true, message: 'Please input your password!' },
    { min: 6, message: 'Password must be at least 6 characters!' },
  ] as Rule[],
};