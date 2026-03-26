'use client';

import { useEffect, ReactNode } from 'react';

export function Skeleton({ w, h, r }: { w?: string | number; h?: number; r?: number }) {
  return <div className="skeleton" style={{ width: w || '100%', height: h || 14, borderRadius: r || 6 }} />;
}

export function PageLoader() {
  return (
    <div>
      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Skeleton w={180} h={22} r={6} />
          <div style={{ marginTop: 8 }}><Skeleton w={280} h={13} r={4} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton w={140} h={34} r={7} />
          <Skeleton w={100} h={34} r={7} />
        </div>
      </div>
      {/* Metric cards skeleton */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, minWidth: 120, background: 'var(--bg-2)', borderRadius: 10, padding: '16px 20px', border: '1px solid var(--brd)' }}>
            <Skeleton w={60} h={10} r={3} />
            <div style={{ marginTop: 8 }}><Skeleton w={80} h={22} r={4} /></div>
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--brd)', padding: 20 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--brd)' }}>
            <Skeleton w={32} h={32} r={999} />
            <div style={{ flex: 1 }}>
              <Skeleton w="60%" h={13} r={4} />
              <div style={{ marginTop: 6 }}><Skeleton w="40%" h={11} r={4} /></div>
            </div>
            <Skeleton w={70} h={24} r={4} />
            <Skeleton w={80} h={24} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Badge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, background: color + '18', color,
      whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

export function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: 'var(--bg-2)', borderRadius: 10, padding: '16px 20px',
      border: '1px solid var(--brd)', flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: 10, color: 'var(--mut)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: accent || 'var(--fg)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, max, color, h = 5 }: { value: number; max: number; color?: string; h?: number }) {
  const p = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height: h, background: 'rgba(255,255,255,0.06)', borderRadius: h, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: color || '#7F77DD', borderRadius: h, transition: 'width 0.25s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--mut)', minWidth: 28, textAlign: 'right' }}>{p}%</span>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="modal-backdrop"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(3px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-box"
        style={{ background: 'var(--bg-1)', borderRadius: 14, border: '1px solid var(--brd)', width: width || 520, maxWidth: '96vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--brd)', position: 'sticky', top: 0, background: 'var(--bg-1)', borderRadius: '14px 14px 0 0', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--fg)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '4px 6px', borderRadius: 6 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

export function FormRow({ label, children, required, span }: { label: string; children: ReactNode; required?: boolean; span?: boolean }) {
  return (
    <div style={{ marginBottom: 14, gridColumn: span ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--mut)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && <span style={{ color: '#E24B4A', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{children}</div>;
}

export function Divider() {
  return <div style={{ borderTop: '1px solid var(--brd)', margin: '16px 0' }} />;
}

export function Toast({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  const colors: Record<string, string> = { success: '#4ade80', error: '#f87171', info: '#60a5fa', warning: '#fbbf24' };
  const color = colors[type] || colors.info;
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--bg-1)', border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: '11px 18px', fontSize: 13, fontWeight: 500, color: 'var(--fg)', zIndex: 2000, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 360, animation: 'slideIn 0.2s ease' }}>
      {message}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h2>
        {subtitle && <p style={{ margin: '3px 0 0', color: 'var(--mut)', fontSize: 13 }}>{subtitle}</p>}
      </div>
      {children && (
        <div className="page-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function PrimaryButton({ onClick, children, disabled }: { onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ background: '#7F77DD', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', color: 'var(--mut)', border: '1px solid var(--brd)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      {children}
    </button>
  );
}

export function DangerButton({ onClick, children, disabled }: { onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7, padding: '8px 14px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, opacity: disabled ? 0.4 : 1 }}
    >
      {children}
    </button>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }: {
  open: boolean; title: string; message: ReactNode;
  confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20, backdropFilter: 'blur(3px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-1)', borderRadius: 12, border: '1px solid var(--brd)', width: 400, maxWidth: '96vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', padding: '24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>{title}</h3>
        <div style={{ fontSize: 13, color: 'var(--mut)', marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'transparent', color: 'var(--mut)', border: '1px solid var(--brd)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: danger ? 'rgba(248,113,113,0.12)' : '#7F77DD', color: danger ? '#f87171' : '#fff', border: danger ? '1px solid rgba(248,113,113,0.25)' : 'none', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function IconButton({ onClick, children, title }: { onClick?: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{ background: 'transparent', border: '1px solid var(--brd)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--mut)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mut)', marginBottom: 10 }}>
      {children}
    </div>
  );
}

export function WeekHeader({
  weekNum, label, dateRange, count, vTarget, vComplete, collapsed, onToggle,
}: {
  weekNum: number; label: string; dateRange: string; count: number;
  vTarget: number; vComplete: number; collapsed: boolean; onToggle: () => void;
}) {
  const pct = vTarget > 0 ? Math.round((vComplete / vTarget) * 100) : 0;
  const color = pct >= 100 ? '#4ade80' : pct >= 50 ? '#7F77DD' : '#f87171';
  return (
    <div
      onClick={onToggle}
      className="week-header-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', background: 'var(--bg-2)',
        borderRadius: 8, border: '1px solid var(--brd)',
        cursor: 'pointer', marginBottom: collapsed ? 10 : 6,
        userSelect: 'none', transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.75, transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s', display: 'inline-block', color: '#7F77DD' }}>▶</span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--mut)' }}>{dateRange}</span>
      <span style={{ fontSize: 11, color: 'var(--mut)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 20 }}>{count} client{count !== 1 ? 's' : ''}</span>
      <div style={{ flex: 1 }} />
      {vTarget > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.25s' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{vComplete}/{vTarget}</span>
        </div>
      )}
    </div>
  );
}
