import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { authApi, orgApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  tenant: Organization | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tenant, setTenant] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('pos_tenant');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pos_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      if (!localStorage.getItem('pos_token')) {
        setIsLoading(false);
        return;
      }
      const u = await authApi.getMe();
      setUser(u);
      localStorage.setItem('pos_user', JSON.stringify(u));

      if (u.organization_id) {
        const org = await orgApi.getCurrent();
        setTenant(org);
        localStorage.setItem('pos_tenant', JSON.stringify(org));
      } else {
        setTenant(null);
        localStorage.removeItem('pos_tenant');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('pos_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('pos_user', JSON.stringify(data.user));

    if (data.user.organization_id) {
      const org = await orgApi.getCurrent();
      setTenant(org);
      localStorage.setItem('pos_tenant', JSON.stringify(org));
    }
  };

  const register = async (payload: any) => {
    const data = await authApi.register(payload);
    localStorage.setItem('pos_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('pos_user', JSON.stringify(data.user));

    if (data.user.organization_id) {
      const org = await orgApi.getCurrent();
      setTenant(org);
      localStorage.setItem('pos_tenant', JSON.stringify(org));
    }
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_tenant');
    setToken(null);
    setUser(null);
    setTenant(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, tenant, token, isLoading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
