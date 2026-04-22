const rawBaseUrl = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

export const env = {
  baseUrl: rawBaseUrl.replace(/\/+$/, ''),
};
