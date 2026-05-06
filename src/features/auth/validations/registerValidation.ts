import type { Rule } from 'antd/es/form';

export const registerValidation = {
  /* ── Brand Manager ── */
  firstName: [
    { required: true, message: 'Please enter your first name!' },
    { max: 100, message: 'First name must not exceed 100 characters!' },
  ] as Rule[],

  lastName: [
    { required: true, message: 'Please enter your last name!' },
    { max: 100, message: 'Last name must not exceed 100 characters!' },
  ] as Rule[],

  managerEmail: [
    { required: true, message: 'Please enter your email!' },
    { type: 'email', message: 'Please enter a valid email!' },
  ] as Rule[],

  phoneNumber: [
    {
      pattern: /^[\d\s+()-]{7,15}$/,
      message: 'Phone number must be 7–15 digits (supports +, (), -, spaces)',
    },
  ] as Rule[],

  /* ── Brand ── */
  brandName: [
    { required: true, message: 'Please enter your brand name!' },
    { max: 200, message: 'Brand name must not exceed 200 characters!' },
  ] as Rule[],

  brandLogo: [
    { required: true, message: 'Please upload your brand logo!' },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validator: (_: any, value: File) => {
        if (!value)
          return Promise.reject(new Error('Please upload your brand logo!'));

        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/svg+xml',
        ];
        if (!allowedTypes.includes(value.type)) {
          return Promise.reject(
            new Error(
              'File must be an image (jpg, jpeg, png, gif, webp, bmp, svg)',
            ),
          );
        }

        const maxSize = 5 * 1024 * 1024;
        if (value.size > maxSize) {
          return Promise.reject(new Error('File size must not exceed 5MB'));
        }

        return Promise.resolve();
      },
    },
  ] as Rule[],

  industry: [
    { max: 100, message: 'Industry must not exceed 100 characters!' },
  ] as Rule[],

  contactEmail: [
    { type: 'email', message: 'Please enter a valid contact email!' },
  ] as Rule[],

  contactPhone: [
    {
      pattern: /^[\d\s+()-]{7,15}$/,
      message: 'Contact phone must be 7–15 digits (supports +, (), -, spaces)',
    },
  ] as Rule[],

  primaryContactName: [
    { max: 200, message: 'Contact name must not exceed 200 characters!' },
  ] as Rule[],

  website: [
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve();
        try {
          const url = new URL(value);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            return Promise.resolve();
          }
          return Promise.reject(
            new Error('Website must start with http:// or https://'),
          );
        } catch {
          return Promise.reject(
            new Error('Please enter a valid URL (e.g. https://example.com)'),
          );
        }
      },
    },
  ] as Rule[],

  description: [
    { max: 2000, message: 'Description must not exceed 2000 characters!' },
  ] as Rule[],

  legalName: [
    { max: 250, message: 'Legal name must not exceed 250 characters!' },
  ] as Rule[],

  taxCode: [
    { max: 50, message: 'Tax code must not exceed 50 characters!' },
  ] as Rule[],

  billingAddress: [
    { max: 500, message: 'Billing address must not exceed 500 characters!' },
  ] as Rule[],
};
