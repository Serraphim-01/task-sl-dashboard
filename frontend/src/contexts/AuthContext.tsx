import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import api from '../services/api.ts';

interface User {
  role: 'admin' | 'customer' | 'guest';
  token: string | null;
  userId: number | null;
  mustChangePassword?: boolean;
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
  const [user, setUser] = useState<User>({ role: 'guest', token: null, userId: null });
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from token on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try to fetch user info - if cookie exists and is valid, this will succeed
        const response = await api.get('/auth/me');
        setUser({ 
          role: response.data.is_admin ? 'admin' : 'customer', 
          token: 'authenticated', // We don't need the actual token, just know we're authenticated
          userId: response.data.user_id || null,
          mustChangePassword: response.data.must_change_password
        });
      } catch (error) {
        // If request fails, user is not authenticated
        setUser({ role: 'guest', token: null, userId: null });
      } finally {
        setIsLoading(false);
      }
    };
    
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // Token is set as HTTP-only cookie by backend
      // Fetch user info to confirm authentication and get role
      const userResponse = await api.get('/auth/me');
      setUser({ 
        role: userResponse.data.is_admin ? 'admin' : 'customer', 
        token: 'authenticated',
        userId: userResponse.data.user_id || null,
        mustChangePassword: userResponse.data.must_change_password
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore if no logout endpoint
    }
    setUser({ role: 'guest', token: null, userId: null });
  };

  const isAdmin = user.role === 'admin';
  const isAuthenticated = user.role !== 'guest';

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-starlink-darker">
      <div className="text-starlink-text text-lg">Loading...</div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

