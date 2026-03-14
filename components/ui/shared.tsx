'use client';

export * from './index';

import { ReactNode, useState } from 'react';

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.04)',
        color: 'var(--fg)',
      }}
    />
  );
}

export function AlertBanner({
  type,
  children,
}: {
  type: 'success' | 'info' | 'warning' | 'error';
  children: ReactNode;
}) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(99,153,34,0.12)', border: 'rgba(99,153,34,0.25)', text: '#639922' },
    info: { bg: 'rgba(56,138,221,0.12)', border: 'rgba(56,138,221,0.25)', text: '#378ADD' },
    warning: { bg: 'rgba(239,159,39,0.12)', border: 'rgba(239,159,39,0.25)', text: '#EF9F27' },
    error: { bg: 'rgba(226,75,74,0.12)', border: 'rgba(226,75,74,0.25)', text: '#E24B4A' },
  };

  const style = colors[type] || colors.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 12,
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.text,
        marginBottom: 14,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}
