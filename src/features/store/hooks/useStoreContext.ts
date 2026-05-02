import { useSearchParams } from 'react-router';
import { useAuth } from '@/providers';

/**
 * Hook to get the current store context.
 *
 * Supports two modes:
 * 1. Store Manager: Uses user.storeId from auth context
 * 2. Brand Manager "acting as Store Manager": Uses storeId from URL query params
 *
 * This allows Brand Manager to view Store Dashboard for any store they manage
 * without having elevated permissions - they see exactly what Store Manager sees.
 *
 * @returns storeId - The current store ID, or undefined if not available
 */
export const useStoreContext = (): string | undefined => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Priority: URL query param (Brand Manager acting as Store) > user.storeId (actual Store Manager)
  const storeId = searchParams.get('storeId') || user?.storeId || undefined;

  return storeId;
};
