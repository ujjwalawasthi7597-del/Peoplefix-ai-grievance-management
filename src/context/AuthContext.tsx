import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoAccount: (role: 'citizen' | 'officer_roads' | 'officer_sanitation' | 'admin') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('peoplefix_token') || localStorage.getItem('civicfix_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch {
      // If token expired or invalid, clear
      localStorage.removeItem('peoplefix_token');
      localStorage.removeItem('civicfix_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      // If no token, auto-login with default Citizen demo account for instant out-of-the-box exploration
      switchDemoAccount('citizen').catch(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('peoplefix_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    localStorage.setItem('peoplefix_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    localStorage.removeItem('peoplefix_token');
    localStorage.removeItem('civicfix_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoAccount = async (role: 'citizen' | 'officer_roads' | 'officer_sanitation' | 'admin') => {
    setLoading(true);
    try {
      let email = 'citizen@civicfix.org';
      let password = 'Citizen@123';

      if (role === 'officer_roads') {
        email = 'officer.roads@civicfix.org';
        password = 'Officer@123';
      } else if (role === 'officer_sanitation') {
        email = 'officer.sanitation@civicfix.org';
        password = 'Officer@123';
      } else if (role === 'admin') {
        email = 'admin@civicfix.org';
        password = 'Admin@123';
      }

      const res = await api.auth.login({ email, password });
      localStorage.setItem('peoplefix_token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    } catch (err) {
      console.error('Error switching demo account:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoAccount,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
