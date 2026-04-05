import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import api from '../services/api.ts';

interface User {
  role: 'admin' | 'customer' | 'guest';
  token: string | null;
}

interface AuthContextType {
  user: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>({ role: 'guest', token: null });

  // Restore user from token on mount
  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) {
      // Fetch user info from backend
      api.get('/auth/me').then(response => {
        setUser({ 
          role: response.data.is_admin ? 'admin' : 'customer', 
          token 
        });
      }).catch(() => {
        Cookies.remove('access_token');
        setUser({ role: 'guest', token: null });
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // Token is set as HTTP-only cookie by backend, get it from cookie
      const token = Cookies.get('access_token');
      // Fetch user info
      const userResponse = await api.get('/auth/me');
      setUser({ 
        role: userResponse.data.is_admin ? 'admin' : 'customer', 
        token: token || null 
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('access_token');
    setUser({ role: 'guest', token: null });
  };

  const isAdmin = user.role === 'admin';
  const isAuthenticated = user.role !== 'guest';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

