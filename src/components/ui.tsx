"use client";

import React from "react";

/* ─── Avatar ─── */
export function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--bg-sub)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 600, color: "var(--text-sec)", flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Badge ─── */
const badgeStyles: Record<string, { bg: string; color: string; border: string }> = {
  default: { bg: "var(--bg-sub)", color: "var(--text-sec)", border: "var(--border-light)" },
  active: { bg: "var(--accent-light)", color: "var(--accent)", border: "transparent" },
  success: { bg: "var(--green-light)", color: "var(--green)", border: "transparent" },
  warning: { bg: "var(--orange-light)", color: "var(--orange)", border: "transparent" },
  danger: { bg: "var(--red-light)", color: "var(--red)", border: "transparent" },
};

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) {
  const s = badgeStyles[variant] || badgeStyles.default;
  return (
    <span
      style={{
        padding: "2px 8px", borderRadius: 4,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ─── Button ─── */
export function Btn({
  children, variant = "default", onClick, disabled, style: sx,
}: {
  children: React.ReactNode; variant?: "default" | "primary" | "ghost";
  onClick?: (e?: React.MouseEvent) => void; disabled?: boolean; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500,
    cursor: disabled ? "default" : "pointer", transition: "background 0.1s",
    border: "none", opacity: disabled ? 0.4 : 1, ...sx,
  };
  if (variant === "primary") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "var(--text)", color: "#FFF" }}>{children}</button>;
  if (variant === "ghost") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "transparent", color: "var(--text-sec)" }}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>{children}</button>;
}

/* ─── Stat Card ─── */
export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ fontSize: 12, color: "var(--text-ter)", fontWeight: 500, letterSpacing: "0.02em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-ter)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ─── Checkbox ─── */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <div onClick={onChange} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4,
        border: `2px solid ${checked ? "var(--green)" : "var(--border)"}`,
        background: checked ? "var(--green)" : "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {checked && <span style={{ color: "#FFF", fontSize: 11, fontWeight: 700 }}>&#10003;</span>}
      </div>
      {label && <span style={{ fontSize: 14, color: checked ? "var(--text-ter)" : "var(--text)" }}>{label}</span>}
    </div>
  );
}

/* ─── Progress Bar ─── */
export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = color || (pct > 100 ? "var(--red)" : pct > 85 ? "var(--orange)" : "var(--text)");
  return (
    <div style={{ height: 4, background: "var(--bg-sub)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2, transition: "width 0.3s" }} />
    </div>
  );
}

/* ─── Section Header ─── */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 6px", letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: "var(--text-sec)", margin: 0 }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

/* ─── Filter Pills ─── */
export function FilterPills<T extends string | null>({
  options, value, onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "5px 12px", borderRadius: 20,
            border: `1px solid ${value === opt.value ? "var(--text)" : "var(--border)"}`,
            background: value === opt.value ? "var(--text)" : "var(--bg)",
            color: value === opt.value ? "#FFF" : "var(--text-sec)",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ padding: "64px 0", textAlign: "center" }}>
      <div style={{ fontSize: 15, color: "var(--text-ter)", marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: "var(--text-ter)" }}>{subtitle}</div>}
    </div>
  );
}
