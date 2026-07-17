import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthResponse } from '../types/auth';

interface AuthUser {
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  function login(data: AuthResponse) {
    localStorage.setItem('token', data.token);
    const authUser = { email: data.email, fullName: data.fullName, role: data.role };
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
