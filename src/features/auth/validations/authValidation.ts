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

export const registerValidation = {
  firstName: [
    { required: true, message: 'Please input your first name!' },
    { min: 2, message: 'First name must be at least 2 characters!' },
  ] as Rule[],
  lastName: [
    { required: true, message: 'Please input your last name!' },
    { min: 2, message: 'Last name must be at least 2 characters!' },
  ] as Rule[],
  store: [{ required: false }] as Rule[],
  email: [
    { required: true, message: 'Please input your email!' },
    { type: 'email', message: 'Please enter a valid email!' },
  ] as Rule[],
  password: [
    { required: true, message: 'Please input your password!' },
    { min: 8, message: 'Password must be at least 8 characters!' },
  ] as Rule[],
  confirmPassword: [
    { required: true, message: 'Please confirm your password!' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || getFieldValue('password') === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('Passwords do not match!'));
      },
    }),
  ] as Rule[],
  terms: [
    {
      validator: (_, value) =>
        value
          ? Promise.resolve()
          : Promise.reject(new Error('You must agree to the terms!')),
    },
  ] as Rule[],
};
