import { useQuery } from '@tanstack/react-query';
import { authService, userService } from '@/shared/services';
import { STALE_TIME, QUERY_KEYS } from '@/config';
import type { User } from '@/features/auth/types';

/**
 * Hook to get current user's full profile
 * Combines auth profile (basic info) with user detail (full info)
 */
export const useMyProfile = () => {
  // Step 1: Get basic auth profile (userId, roles, etc.)
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.auth.profile,
    queryFn: async () => {
      const response = await authService.getProfile();

      if (!response.data.isSuccess || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }

      const profileData = response.data.data;

      const user: User = {
        userId: profileData.userId,
        email: profileData.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        avatarUrl: profileData.avatarUrl,
        roles: profileData.roles,
        brandId: profileData.brandId,
        storeId: profileData.storeId,
      };

      return user;
    },
    staleTime: STALE_TIME.medium,
    retry: false,
  });

  // Step 2: Get full user detail by userId
  const detailQuery = useQuery({
    queryKey: QUERY_KEYS.users.detail(profileQuery.data?.userId),
    queryFn: async () => {
      const response = await userService.getById(profileQuery.data!.userId);

      if (!response.data.isSuccess || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch user detail');
      }

      return response.data.data;
    },
    enabled: !!profileQuery.data?.userId,
    staleTime: STALE_TIME.medium,
    retry: false,
  });

  return {
    data: detailQuery.data,
    isLoading: profileQuery.isLoading || detailQuery.isLoading,
    error: profileQuery.error ?? detailQuery.error,
  };
};
