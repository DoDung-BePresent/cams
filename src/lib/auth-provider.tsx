/**
 * Node modules
 */
import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Types
 */
import type { User, LoginCredentials } from '@/features/auth/types';

/**
 * Services
 */
import {
  getUserProfile,
  loginWithEmail,
  logout as apiLogout,
} from '@/features/auth/api/auth-api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check user khi lade trang lần đầu (F5) nếu có token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userProfile = await getUserProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Session expired', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (creds: LoginCredentials) => {
    const { user, token } = await loginWithEmail(creds);
    localStorage.setItem('token', token);
    setUser(user);
    // Có thể navigate ở đây hoặc để component gọi login tự xử lý
  };

  const logout = () => {
    apiLogout();
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login'; // Hard reload để clear state trash
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
