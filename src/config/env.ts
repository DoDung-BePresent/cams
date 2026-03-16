export const env = {
  baseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api/v1'),
};
