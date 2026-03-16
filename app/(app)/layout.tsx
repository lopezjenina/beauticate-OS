'use client';

import { AuthProvider, useAuth } from '@/components/auth-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { ToastProvider } from '@/components/ui/toast-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function Shell({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    // Redirect to first allowed board if current board is not accessible
    const currentBoard = pathname.replace(/^\//, '');
    if (currentBoard && role?.boards && !role.boards.includes(currentBoard)) {
      router.replace('/' + role.boards[0]);
    }
  }, [loading, user, role, pathname, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0F' }}><div className="text-xl font-bold" style={{ color: '#7F77DD' }}>Loading...</div></div>;
  if (!user) return null;
  return (
    <div className="min-h-screen flex" style={{ background: '#0B0B0F' }}>
      <Sidebar />
      <main role="main" className="app-main flex-1 overflow-auto" style={{ padding: '24px 28px', maxHeight: '100vh' }}>{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><ToastProvider><Shell>{children}</Shell></ToastProvider></AuthProvider>;
}
