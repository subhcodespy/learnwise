import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ProficiencyLevel } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    displayName: string;
    email: string;
    password: string;
    preferredLevel?: ProficiencyLevel;
    learningPreference?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  quickDemoLogin: () => Promise<void>;
  loginWithGoogle: (credential?: string, fallback?: { email: string; displayName: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
  };

  const register = async (data: {
    displayName: string;
    email: string;
    password: string;
    preferredLevel?: ProficiencyLevel;
    learningPreference?: string;
  }) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const quickDemoLogin = async () => {
    try {
      const res = await api.login({ email: 'student@learnwise.ai', password: 'learnwise123' });
      setUser(res.user);
    } catch {
      // If demo student doesn't exist yet, register them
      const res = await api.register({
        displayName: 'Subhranshu (Student)',
        email: 'student@learnwise.ai',
        password: 'learnwise123',
        preferredLevel: 'Intermediate',
        learningPreference: 'Practical coding',
      });
      setUser(res.user);
    }
  };

  const loginWithGoogle = async (credential?: string, fallback?: { email: string; displayName: string }) => {
    const res = await api.loginWithGoogle(credential, fallback);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        quickDemoLogin,
        loginWithGoogle,
      }}
    >
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
