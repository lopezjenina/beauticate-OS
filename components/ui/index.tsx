'use client';

import { useEffect, ReactNode } from 'react';

export function Badge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600, background: color + '1A', color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

export function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--brd)', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 10, color: 'var(--mut)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || 'var(--fg)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, color, h = 6 }: { value: number; max: number; color?: string; h?: number }) {
  const p = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height: h, background: 'var(--brd)', borderRadius: h / 2, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: color || '#7F77DD', borderRadius: h / 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--mut)', minWidth: 28, textAlign: 'right' }}>{p}%</span>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-1)', borderRadius: 16, border: '1px solid var(--brd)', width: width || 540, maxWidth: '95%', maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--brd)', position: 'sticky', top: 0, background: 'var(--bg-1)', borderRadius: '16px 16px 0 0', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mut)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

export function FormRow({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--mut)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#E24B4A' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>{children}</div>;
}

export function Toast({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  const colors: Record<string, string> = { success: '#639922', error: '#E24B4A', info: '#378ADD', warning: '#EF9F27' };
  const color = colors[type] || colors.info;
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--bg-1)', border: `1px solid ${color}40`, borderLeft: `4px solid ${color}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 500, color: 'var(--fg)', zIndex: 2000, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxWidth: 380, animation: 'slideIn 0.25s ease' }}>
      {message}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--mut)', fontSize: 13 }}>{subtitle}</p>
      </div>
      {children && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>}
    </div>
  );
}

export function PrimaryButton({ onClick, children, disabled }: { onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

export function GhostButton({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ background: 'transparent', color: 'var(--mut)', border: '1px solid var(--brd)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
      {children}
    </button>
  );
}

export function DangerButton({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ background: 'rgba(226,75,74,0.1)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.2)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
      {children}
    </button>
  );
}

export function WeekHeader({ weekNum, label, dateRange, count, vTarget, vComplete, collapsed, onToggle }: {
  weekNum: number; label: string; dateRange: string; count: number; vTarget: number; vComplete: number; collapsed: boolean; onToggle: () => void;
}) {
  const ideal = Math.round(86 / 4);
  const over = vTarget > ideal + 4;
  const light = vTarget < ideal - 4 && count > 0;
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--brd)', cursor: 'pointer', marginBottom: collapsed ? 12 : 8, userSelect: 'none' }}>
      <span style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s', opacity: 0.5, fontSize: 12 }}>▶</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--mut)', marginLeft: 10 }}>{dateRange}</span>
        <span style={{ fontSize: 12, color: 'var(--mut)', marginLeft: 10 }}>{count} client{count !== 1 ? 's' : ''}</span>
      </div>
      {over && <Badge color="#E24B4A">Overloaded</Badge>}
      {light && <Badge color="#EF9F27">Light</Badge>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
        <ProgressBar value={vComplete} max={vTarget} color={vComplete >= vTarget ? '#639922' : vComplete < vTarget * 0.5 ? '#E24B4A' : '#1D9E75'} h={8} />
        <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{vComplete}/{vTarget}</span>
      </div>
    </div>
  );
}
