import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { NavigateOptions } from 'react-router';

/**
 * Hook that wraps `useNavigate` to automatically preserve the `storeId`
 * query parameter when navigating within store routes.
 *
 * This is critical for Brand Manager "acting as Store Manager" mode,
 * where the storeId is passed via URL query params (?storeId=xxx).
 * Without this, navigating to sub-pages (e.g. music, schedule) would
 * lose the store context and break SignalR connections / data fetching.
 *
 * For actual Store Managers, the query param is absent so this is a no-op.
 */
export const useStoreNavigate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const storeNavigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      const queryStoreId = searchParams.get('storeId');
      if (queryStoreId) {
        // Preserve existing query params and append storeId
        const separator = to.includes('?') ? '&' : '?';
        navigate(`${to}${separator}storeId=${queryStoreId}`, options);
      } else {
        navigate(to, options);
      }
    },
    [navigate, searchParams],
  );

  return storeNavigate;
};
