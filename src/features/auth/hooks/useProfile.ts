import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { authService } from '../services/authService';

/**
 * Shared
 */
import { mapRoleFromEnum } from '@/shared/utils/jwt';

/**
 * Types
 */
import type { User } from '../types/authTypes';

export const useProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<User | null> => {
      const response = await authService.getProfile();
      const { data } = response.data;

      if (!data) return null;

      return {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        avatarUrl: data.avatarUrl,
        role: mapRoleFromEnum(data.roles),
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
