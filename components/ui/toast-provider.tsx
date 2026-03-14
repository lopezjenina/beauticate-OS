'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastItem = { id: number; message: string; type: ToastType };

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const COLORS: Record<ToastType, { border: string; bar: string; icon: string }> = {
  success: { border: 'rgba(74,222,128,0.25)',  bar: '#4ade80', icon: '✓' },
  error:   { border: 'rgba(248,113,113,0.25)', bar: '#f87171', icon: '✕' },
  info:    { border: 'rgba(96,165,250,0.25)',  bar: '#60a5fa', icon: 'ℹ' },
  warning: { border: 'rgba(251,191,36,0.25)',  bar: '#fbbf24', icon: '!' },
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => {
          const c = COLORS[t.type];
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--bg-1)',
                border: `1px solid ${c.border}`,
                borderLeft: `3px solid ${c.bar}`,
                borderRadius: 9,
                padding: '11px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--fg)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                maxWidth: 380,
                minWidth: 240,
                cursor: 'pointer',
                pointerEvents: 'auto',
                animation: 'slideIn 0.2s ease',
              }}
            >
              <span style={{ color: c.bar, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{c.icon}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
