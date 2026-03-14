'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ROLES } from '@/lib/constants';
import type { RoleConfig } from '@/types';

const defaultRole: RoleConfig = {
  label: 'Viewer',
  color: '#888780',
  boards: ['dashboard', 'production', 'publishing'],
  canEdit: false,
  canDelete: false,
  canManageUsers: false,
};

type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  role: RoleConfig;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: defaultRole,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<RoleConfig>(defaultRole);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const syncUser = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!mounted) return;

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        const roleConfig = profile ? ROLES[profile.role] ?? defaultRole : defaultRole;
        const name = profile?.name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null;
        const avatar = profile?.avatar ?? null;

        setUser({ id: user.id, email: user.email, name, avatar });
        setRole(roleConfig);
      } else {
        setUser(null);
        setRole(defaultRole);
      }

      setLoading(false);
    };

    syncUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      syncUser();
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  const signOut = useMemo(() => async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(defaultRole);
  }, [supabase]);

  const signInWithGoogle = useMemo(() => async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const value = useMemo(
    () => ({ user, role, loading, signOut, signInWithGoogle }),
    [user, role, loading, signOut, signInWithGoogle]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
