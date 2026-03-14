'use client';

import { AuthProvider, useAuth } from '@/components/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.push('/login'); }, [loading, user, router]);
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0F' }}><div className="text-xl font-bold" style={{ color: '#7F77DD' }}>Loading...</div></div>;
  if (!user) return null;
  return (
    <div className="min-h-screen flex" style={{ background: '#0B0B0F' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ padding: '24px 28px', maxHeight: '100vh' }}>{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><Shell>{children}</Shell></AuthProvider>;
}
