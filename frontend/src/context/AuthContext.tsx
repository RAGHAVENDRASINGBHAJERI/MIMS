import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setupTokenRefresh } from '@/utils/tokenManager';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'chief-administrative-officer' | 'department-officer' | 'user';
  department?: {
    _id: string;
    name: string;
  };
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDepartmentOfficer: boolean;
  isChiefAdministrativeOfficer: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app load
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setupTokenRefresh();
      } catch (error) {
        // Clear invalid stored data
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', authToken);
    setupTokenRefresh();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';
  const isDepartmentOfficer = user?.role === 'department-officer';
  const isChiefAdministrativeOfficer = user?.role === 'chief-administrative-officer';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isDepartmentOfficer,
      isChiefAdministrativeOfficer,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
