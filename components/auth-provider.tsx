'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const syncUser = async (showLoading = false) => {
      if (showLoading) setLoading(true);

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
      initialized = true;
    };

    syncUser(true);

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      // Don't show loading spinner on token refresh / tab focus — only on actual sign-in/out
      syncUser(false);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useMemo(() => async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(defaultRole);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
