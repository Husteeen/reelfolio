import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

export interface AuthUser {
  id:           string;
  email:        string;
  role:         string;
  name?:        string;
  username?:    string;
  displayName?: string;
  avatarUrl?:   string;
}

interface AuthContextValue {
  user:     AuthUser | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<string | null>;
  register: (name: string, username: string, email: string, password: string) => Promise<string | null>;
  logout:   () => Promise<void>;
  refresh:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string): Promise<string | null> => {
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) { setUser(data.user); return null; }
    return data.message ?? 'Login failed.';
  };

  const register = async (name: string, username: string, email: string, password: string): Promise<string | null> => {
    const res = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body:   JSON.stringify({ name, username, email, password }),
    });
    const data = await res.json();
    if (res.ok) { setUser(data.user); return null; }
    return data.message ?? 'Registration failed.';
  };

  const logout = async () => {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
