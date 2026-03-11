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
    refreshToken?: string;
    expiresAt: string;
    roles: number[];
  };
};

export type ProfileResponse = {
  isSuccess: boolean;
  message: string;
  data: {
    email: string;
    userId: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatarUrl?: string;
    roles: number[];
  };
};

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
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: string;
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};
