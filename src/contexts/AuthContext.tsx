import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, profilesAPI } from '@/lib/api';
import type { Me, Profile } from '@/lib/api';

interface AuthContextType {
  user: Me | null;
  profile: Profile | null;
  role: 'farmer' | 'dealer' | 'admin' | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: { full_name: string; phone?: string; village_city?: string; role: string }
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'farmgenius_token';
const USER_KEY = 'farmgenius_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Me | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<'farmer' | 'dealer' | 'admin' | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      const u = JSON.parse(saved) as Me;
      return (u.role as 'farmer' | 'dealer' | 'admin') || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const me = await authAPI.me();
      setUser(me);
      setRole(me.role as 'farmer' | 'dealer' | 'admin');
      localStorage.setItem(USER_KEY, JSON.stringify(me));

      // Also fetch the full profile
      const profileData = await profilesAPI.get(me.id);
      setProfile(profileData);
    } catch {
      // Token invalid/expired — clear state
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: { full_name: string; phone?: string; village_city?: string; role: string }
  ) => {
    try {
      const data = await authAPI.register({
        email,
        password,
        full_name: metadata.full_name,
        phone: metadata.phone,
        village_city: metadata.village_city,
        role: metadata.role,
      });
      localStorage.setItem(TOKEN_KEY, data.access_token);
      await fetchMe();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      await fetchMe();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const profileData = await profilesAPI.get(user.id);
        setProfile(profileData);
        // Also refresh me to get latest role etc.
        const me = await authAPI.me();
        setUser(me);
        setRole(me.role as 'farmer' | 'dealer' | 'admin');
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch (err) {
        console.error('Failed to refresh profile:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
