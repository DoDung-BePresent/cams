export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type LoginResponse = {
  isSuccess: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string; // ✅ Chuẩn bị sẵn cho tương lai
    expiresAt: string;
    roles: number[]; // API trả về number[]
  };
};

// ✅ RefreshToken response (chuẩn bị sẵn)
export type RefreshTokenResponse = {
  isSuccess: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: string; // Mapped từ roles[0]
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};
