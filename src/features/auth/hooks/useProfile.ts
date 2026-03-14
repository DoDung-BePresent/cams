import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { authService } from '@/features/auth/services';

/**
 * Types
 */
import type { User } from '@/features/auth/types';
import { STALE_TIME } from '@/config';

export const useProfile = (enabled = true) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authService.getProfile();

      // Type-safe data extraction
      if (!response.data.isSuccess || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }

      const profileData = response.data.data;

      // Transform to User domain type
      const user: User = {
        id: profileData.userId,
        email: profileData.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        avatarUrl: profileData.avatarUrl,
        roles: profileData.roles,
      };

      return user;
    },
    enabled,
    staleTime: STALE_TIME.medium,
    retry: false,
  });
};
