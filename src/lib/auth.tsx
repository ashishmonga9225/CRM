'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from './supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'executive';
  isActive: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  loginAsDemo: () => {},
  logout: async () => {},
  updateProfile: async () => ({ success: false }),
  changePassword: async () => ({ success: false }),
});

const DEMO_USER: UserProfile = {
  id: 'usr-demo-1',
  name: 'Admin User',
  email: 'admin@leadflowcrm.com',
  role: 'admin',
  isActive: true,
};

const LOCAL_STORAGE_AUTH_KEY = 'crm_auth_session_v2';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUserId: string, authEmail: string, metaName?: string) => {
    if (!supabase) return null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (profile) {
        return {
          id: authUserId,
          email: authEmail,
          name: profile.full_name || metaName || authEmail.split('@')[0],
          role: profile.role || 'executive',
          isActive: Boolean(profile.is_active),
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      id: authUserId,
      email: authEmail,
      name: metaName || authEmail.split('@')[0],
      role: 'admin' as const,
      isActive: true,
    };
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await fetchProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name
          );
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name
          );
          setUser(profile);
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_AUTH_KEY) : null;
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          setUser(DEMO_USER);
        }
      } else {
        setUser(DEMO_USER);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(DEMO_USER));
        }
      }
      setLoading(false);
    }
  }, []);

  // ROUTE PROTECTION
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = pathname === '/login';
      if (!user && !isPublicRoute) {
        router.replace('/login');
      } else if (user && isPublicRoute) {
        router.replace('/today');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const profile = await fetchProfile(
          data.user.id,
          data.user.email || '',
          data.user.user_metadata?.full_name
        );
        setUser(profile);
        return { success: true };
      }
    }

    const localUser: UserProfile = {
      id: 'usr-' + Date.now(),
      name: email.split('@')[0] || 'Sales Executive',
      email,
      role: 'admin',
      isActive: true,
    };
    setUser(localUser);
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(localUser));
    return { success: true };
  };

  const signup = async (email: string, pass: string, fullName: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        // If session created automatically
        if (data.session) {
          const profile = await fetchProfile(data.user.id, data.user.email || '', fullName);
          setUser(profile);
          return { success: true };
        } else {
          return {
            success: true,
            message: 'Account created! Please check your email to confirm, or sign in.',
          };
        }
      }
    }

    return login(email, pass);
  };

  const loginAsDemo = () => {
    setUser(DEMO_USER);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(DEMO_USER));
    }
    router.replace('/today');
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    }
    router.replace('/login');
  };

  const updateProfile = async (name: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (error) return { success: false, error: error.message };

      await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    }

    const updated = { ...user, name };
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(updated));
    }
    return { success: true };
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginAsDemo,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
