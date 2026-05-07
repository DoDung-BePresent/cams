import { api } from '@/config';
import type { Result } from '@/shared/types';

export type BrandRegistrationInquiryResponse = {
  submittedAtUtc: string;
};

const AUTH_ENDPOINTS = {
  registerInquiry: '/api/auth/register-inquiry',
};

export const registerService = {
  // POST /api/auth/register-inquiry (multipart/form-data) — public, no auth required
  submitInquiry: (formData: FormData) =>
    api.post<Result<BrandRegistrationInquiryResponse>>(
      AUTH_ENDPOINTS.registerInquiry,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),
};
