'use client';

export * from './index';

import { ReactNode } from 'react';

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: 200, padding: '8px 12px', borderRadius: 7, border: '1px solid var(--brd)', background: 'var(--bg-2)', color: 'var(--fg)', fontSize: 13, outline: 'none' }}
    />
  );
}

export function ViewToggle({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--brd)', borderRadius: 7, overflow: 'hidden' }}>
      {options.map(o => (
        <button
          key={o.key} onClick={() => onChange(o.key)}
          style={{ padding: '7px 14px', background: value === o.key ? 'rgba(127,119,221,0.12)' : 'transparent', color: value === o.key ? '#7F77DD' : 'var(--mut)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AlertBanner({ type, children }: { type: 'success' | 'info' | 'warning' | 'error'; children: ReactNode }) {
  const colors = {
    success: { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.2)', text: '#4ade80' },
    info:    { bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)', text: '#60a5fa' },
    warning: { bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)', text: '#fbbf24' },
    error:   { bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.2)', text: '#f87171' },
  };
  const s = colors[type];
  return (
    <div style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${s.border}`, background: s.bg, color: s.text, fontSize: 13, fontWeight: 500 }}>
      {children}
    </div>
  );
}
