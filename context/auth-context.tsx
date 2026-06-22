import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'user' | 'hairstylist' | 'admin' | null;

interface AuthContextType {
  isSignedIn: boolean;
  userRole: UserRole;
  userName: string;
  login: (email: string, password: string, role: UserRole) => void;
  signUp: (email: string, password: string, name: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');

  const login = (email: string, password: string, role: UserRole) => {
    // Mock authentication
    setIsSignedIn(true);
    setUserRole(role);
    setUserName(email.split('@')[0]);
  };

  const signUp = (email: string, password: string, name: string, role: UserRole) => {
    // Mock registration
    setIsSignedIn(true);
    setUserRole(role);
    setUserName(name);
  };

  const logout = () => {
    setIsSignedIn(false);
    setUserRole(null);
    setUserName('');
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, userRole, userName, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
