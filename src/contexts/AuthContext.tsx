import { createContext, useContext, useState, ReactNode } from 'react';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, email: string, name: string, surname?: string, profilePicture?: string, role?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'sw_token';
const REFRESH_TOKEN_KEY = 'sw_refresh_token';
const USER_KEY = 'sw_user';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function loadStoredSession(): { token: string | null; user: AuthUser | null } {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  // If no refresh token, session is invalid regardless of access token state
  if (!storedToken || !storedRefresh) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { token: null, user: null };
  }
  // If access token is expired but refresh token exists, keep session alive —
  // the API interceptor will refresh it on the first 401.
  const storedUser = localStorage.getItem(USER_KEY);
  return {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadStoredSession();
  const [token, setToken] = useState<string | null>(initial.token);
  const [user, setUser] = useState<AuthUser | null>(initial.user);

  const login = (token: string, refreshToken: string, email: string, name: string, surname?: string, profilePicture?: string, role?: string) => {
    const user: AuthUser = { email, name, surname, profilePicture, role };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefresh) {
      // Fire-and-forget: invalidate refresh token on server
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
