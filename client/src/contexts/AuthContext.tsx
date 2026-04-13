import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserDto } from '../types/api';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: UserDto) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('user');
    return {
      accessToken: token,
      user: userJson ? JSON.parse(userJson) : null,
    };
  });

  const login = (token: string, user: UserDto) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ accessToken: token, user });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setState({ accessToken: null, user: null });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, isAuthenticated: !!state.accessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
