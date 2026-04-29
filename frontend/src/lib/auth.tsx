'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  name?: string;
  locale: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('af_token');
    const storedUser = localStorage.getItem('af_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('af_token');
        localStorage.removeItem('af_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('af_token', t);
    localStorage.setItem('af_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await authApi.register({ email, password, name });
    const { token: t, user: u } = res.data;
    localStorage.setItem('af_token', t);
    localStorage.setItem('af_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('af_token');
    localStorage.removeItem('af_user');
    setToken(null);
    setUser(null);
    window.location.href = '/auth/login';
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('af_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
