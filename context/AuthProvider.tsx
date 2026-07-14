'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/api/client';

interface User {
  id?: string;
  _id?: string;
  role?: 'student' | 'staff' | 'admin';
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  matric_number?: string;
  faculty?: string;
  department?: string;
  is_approved?: boolean;
  post_held?: string;
  signature_url?: string;
  [key: string]: any;
}

type Role = 'student' | 'staff' | 'admin';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  login: (tokenData: { access_token: string; token_type: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchMe(token: string): Promise<User | null> {
  try {
    const response = await apiClient.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch {
    return null;
  }
}

function detectRole(userData: User): Role {
  // The /users/me response should contain role info
  if (userData.role) return userData.role as Role;
  // Fallback: detect by fields present
  if (userData.matric_number) return 'student';
  if (userData.is_approved !== undefined) return 'staff';
  return 'admin';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('access_token');
      const savedRole = localStorage.getItem('role') as Role | null;
      const savedUser = localStorage.getItem('user');

      if (savedToken) {
        setToken(savedToken);
        if (savedRole) setRole(savedRole);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {}
        }
      }
      setLoading(false);
    }
  }, []);

  // Fetch /users/me and update state + storage
  const refreshUser = async () => {
    const savedToken = localStorage.getItem('access_token');
    if (!savedToken) return;
    const userData = await fetchMe(savedToken);
    if (userData) {
      const detectedRole = detectRole(userData);
      setUser(userData);
      setRole(detectedRole);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', detectedRole);
    }
  };

  // Login: store token then fetch user info from /users/me
  const login = async (tokenData: { access_token: string; token_type: string }) => {
    const { access_token } = tokenData;
    localStorage.setItem('access_token', access_token);
    setToken(access_token);

    // Fetch user profile to get role
    const userData = await fetchMe(access_token);
    if (userData) {
      const detectedRole = detectRole(userData);
      setUser(userData);
      setRole(detectedRole);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', detectedRole);
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, token, loading, login, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
