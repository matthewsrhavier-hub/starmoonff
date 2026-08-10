'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readCachedAuth(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    const user = raw ? (JSON.parse(raw) as User) : null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUserProfile = async (session: any): Promise<User> => {
    // Timeout de 5 segundos para buscar perfil, se demorar mais usamos os dados da sessão
    const profilePromise = supabase
      .from('users')
      .select('*')
      .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
      .maybeSingle();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as any;

      const userMetadata = session.user.user_metadata;
      return {
        id: (profile?.id || session.user.id) as any,
        email: profile?.email || session.user.email || '',
        name: profile?.name || userMetadata.name || session.user.email?.split('@')[0] || '',
        avatar_url: profile?.avatar_url || userMetadata.avatar_url || '',
        isAdmin: profile?.is_admin || userMetadata.isAdmin || false,
        subscription_status: profile?.subscription_status || profile?.plan || 'gratis',
        plan: profile?.plan,
        expires_at: profile?.expires_at,
      };
    } catch (e) {
      console.error("Profile Fetch Error or Timeout:", e);
      const userMetadata = session.user.user_metadata;
      return {
        id: session.user.id as any,
        email: session.user.email || '',
        name: userMetadata.name || session.user.email?.split('@')[0] || '',
        avatar_url: userMetadata.avatar_url || '',
        isAdmin: userMetadata.isAdmin || false,
        subscription_status: 'gratis',
      };
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const initAuth = async () => {
      // Hidrata do cache na hora (sem bloquear a UI em navegações)
      const cached = readCachedAuth();
      const hasCache = !!(cached.token && cached.user);
      if (hasCache) {
        setToken(cached.token);
        setUser(cached.user);
        setIsLoading(false);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const authUser = await getUserProfile(session);
          setToken(session.access_token);
          setUser(authUser);
          localStorage.setItem(STORAGE_KEYS.token, session.access_token);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(authUser));
          
          const expires = new Date();
          expires.setDate(expires.getDate() + 30);
          document.cookie = `auth_token=${session.access_token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        } else if (hasCache) {
          setToken(null);
          setUser(null);
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.user);
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          const authUser = await getUserProfile(session);
          setToken(session.access_token);
          setUser(authUser);
          localStorage.setItem(STORAGE_KEYS.token, session.access_token);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(authUser));
        }
      } else if (event === 'SIGNED_OUT') {
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveAuth = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.token, newToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
    
    // Sincronizar cookie fisico para o Middleware ver (expira em 30 dias)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `auth_token=${newToken}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    
    // Limpar cookie fisico
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const loginTimeout = setTimeout(() => {
       setIsLoading(false);
    }, 12000); // Segurança de 12s

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        const authUser = await getUserProfile(data.session);
        saveAuth(data.session.access_token, authUser);
      }
    } finally {
      clearTimeout(loginTimeout);
      setIsLoading(false);
    }
  }, [saveAuth]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name || email.split('@')[0], isAdmin: false } }
      });
      if (error) throw error;
      if (data.session) {
        const authUser = await getUserProfile(data.session);
        saveAuth(data.session.access_token, authUser);
      } else if (data.user) {
        throw new Error('Conta criada! Verifique seu e-mail para confirmar o acesso.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch(e) {}
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  const updateProfile = useCallback(async (name: string, avatarUrl?: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Não autenticado');

    const updateData: any = { name };
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    const { error } = await supabase.auth.updateUser({
      data: updateData
    });

    if (error) throw error;

    try {
        await supabase.from('users').update({ name, avatar_url: avatarUrl }).eq('id', currentUser.id);
    } catch(e) {}

    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser: User = {
        ...prev,
        name,
        avatar_url: avatarUrl || prev.avatar_url,
      };
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setToken(null);
      setUser(null);
      return;
    }
    const updatedUser = await getUserProfile(session);
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}