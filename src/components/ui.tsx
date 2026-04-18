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
  default: { bg: "rgba(0, 0, 0, 0.05)", color: "var(--text-sec)", border: "transparent" },
  active: { bg: "rgba(0, 122, 255, 0.1)", color: "var(--accent)", border: "transparent" },
  success: { bg: "rgba(52, 199, 89, 0.1)", color: "var(--green)", border: "transparent" },
  warning: { bg: "rgba(255, 149, 0, 0.1)", color: "var(--orange)", border: "transparent" },
  danger: { bg: "rgba(255, 59, 48, 0.1)", color: "var(--red)", border: "transparent" },
};

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) {
  const s = badgeStyles[variant] || badgeStyles.default;
  return (
    <span
      className="glass-dark"
      style={{
        padding: "3px 10px", borderRadius: 8,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
        textTransform: "uppercase", letterSpacing: "0.02em"
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
    padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: disabled ? "default" : "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "none", opacity: disabled ? 0.4 : 1, ...sx,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  };
  if (variant === "primary") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "var(--accent)", color: "#FFF", boxShadow: "0 4px 12px rgba(0, 122, 255, 0.2)" }}>{children}</button>;
  if (variant === "ghost") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "transparent", color: "var(--text-sec)" }}>{children}</button>;
  return <button className="glass" onClick={onClick} disabled={disabled} style={{ ...base, color: "var(--text)", border: "1px solid var(--border-light)" }}>{children}</button>;
}

/* ─── Card ─── */
export function Card({ children, style: sx, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div 
      className={`glass ${className || ""}`}
      style={{
        borderRadius: 24, padding: 32, ...sx
      }}
    >
      {children}
    </div>
  );
}

/* ─── Stat Card ─── */
export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card style={{ padding: "24px 28px" }}>
      <div style={{ fontSize: 11, color: "var(--text-ter)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-ter)", marginTop: 8, fontWeight: 500 }}>{sub}</div>}
    </Card>
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

/* ─── Confirm Modal ─── */
export function ConfirmModal({
  title, message, confirmLabel = "Delete", onConfirm, onCancel, variant = "danger",
}: {
  title: string; message: React.ReactNode; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; variant?: "danger" | "primary";
}) {
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1100,
      }}
      onClick={onCancel}
    >
      <div
        className="glass"
        style={{
          borderRadius: 24, border: "1px solid var(--border-light)",
          padding: "32px", maxWidth: 400, width: "90%", textAlign: "center",
          boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 12, letterSpacing: "-0.02em" }}>{title}</div>
        <div style={{ fontSize: 15, color: "var(--text-sec)", marginBottom: 32, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
          <Btn
            variant="primary"
            onClick={onConfirm}
            style={variant === "danger" ? { background: "var(--red)", color: "#FFF", boxShadow: "0 4px 12px rgba(255, 59, 48, 0.2)" } : undefined}
          >
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast Notification ─── */
type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };
let toastListeners: ((t: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];
let toastId = 0;

export function showToast(message: string, type: ToastType = "success") {
  const item: ToastItem = { id: ++toastId, message, type };
  toasts = [...toasts, item];
  toastListeners.forEach(fn => fn(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== item.id);
    toastListeners.forEach(fn => fn(toasts));
  }, 3000);
}

export function ToastContainer() {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  React.useEffect(() => {
    toastListeners.push(setItems);
    return () => { toastListeners = toastListeners.filter(fn => fn !== setItems); };
  }, []);
  if (items.length === 0) return null;
  const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: "#F0FAF6", border: "#4DAB9A", text: "#1A6B5A" },
    error: { bg: "#FDF2F2", border: "#EB5757", text: "#C53030" },
    info: { bg: "#EEF4FF", border: "#2383E2", text: "#1A56A8" },
  };
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(t => {
        const c = colors[t.type];
        return (
          <div key={t.id} style={{
            padding: "10px 20px", borderRadius: 8, background: c.bg, borderLeft: `4px solid ${c.border}`,
            color: c.text, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            animation: "slideIn 0.25s ease-out", minWidth: 240, maxWidth: 380,
          }}>
            {t.message}
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

/* ─── Celebration Modal (Confetti) ─── */
export function CelebrationModal({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 480; canvas.height = 320;
    const colors = ["#4DAB9A", "#5B5FC7", "#EB5757", "#CB7F2C", "#2383E2", "#E91E8B", "#F5A623"];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * 480, y: Math.random() * -320,
      w: 4 + Math.random() * 6, h: 8 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3, vy: 1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.15,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, 480, 320);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > 340) { p.y = -10; p.x = Math.random() * 480; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }} onClick={onClose}>
      <div style={{ background: "#FFF", borderRadius: 16, overflow: "hidden", width: 480, maxWidth: "90vw", textAlign: "center", boxShadow: "0 16px 48px rgba(0,0,0,0.2)", position: "relative" }} onClick={e => e.stopPropagation()}>
        <canvas ref={canvasRef} style={{ width: "100%", height: 160, display: "block" }} />
        <div style={{ padding: "24px 32px 32px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.5, marginBottom: 24 }}>{message}</div>
          <button onClick={onClose} style={{
            padding: "10px 32px", borderRadius: 8, border: "none", background: "#1A1A1A", color: "#FFF",
            fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
          }}>Let's go!</button>
        </div>
      </div>
    </div>
  );
}

/* ─── File Upload Area ─── */
export function FileUploadArea({
  onFilesSelected, accept, label = "Drop files here or click to upload",
}: {
  onFilesSelected: (files: { name: string; url: string; type: "image" | "video" | "document" }[]) => void;
  accept?: string;
  label?: string;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList) => {
    const results: { name: string; url: string; type: "image" | "video" | "document" }[] = [];
    Array.from(fileList).forEach((file) => {
      const url = URL.createObjectURL(file);
      let type: "image" | "video" | "document" = "document";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      results.push({ name: file.name, url, type });
    });
    onFilesSelected(results);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
      style={{
        border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 8, padding: "24px 16px", textAlign: "center", cursor: "pointer",
        background: dragOver ? "var(--accent-light)" : "var(--bg-sub)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-ter)" }}>Images, videos, or documents</div>
      <input ref={inputRef} type="file" multiple accept={accept} style={{ display: "none" }} onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

/* ─── Attachment List ─── */
export function AttachmentList({
  attachments, onRemove, compact = false,
}: {
  attachments: { id: string; name: string; url: string; type: string; thumbnailUrl?: string }[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  if (attachments.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: compact ? 6 : 8, marginTop: compact ? 6 : 8 }}>
      {attachments.map((att) => (
        <div
          key={att.id}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: compact ? "2px 8px" : "4px 10px",
            background: "var(--bg-sub)", border: "1px solid var(--border-light)",
            borderRadius: 6, fontSize: compact ? 11 : 12, color: "var(--text-sec)",
            maxWidth: 200,
          }}
        >
          {att.type === "image" && (
            <img src={att.thumbnailUrl || att.url} alt="" style={{ width: compact ? 16 : 20, height: compact ? 16 : 20, borderRadius: 3, objectFit: "cover" }} />
          )}
          {att.type === "link" && <span style={{ fontSize: compact ? 10 : 12 }}>&#128279;</span>}
          {att.type === "video" && <span style={{ fontSize: compact ? 10 : 12 }}>&#127916;</span>}
          {att.type === "document" && <span style={{ fontSize: compact ? 10 : 12 }}>&#128196;</span>}
          <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: "var(--accent)", textDecoration: "none", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {att.name}
          </a>
          {onRemove && (
            <span
              onClick={(e) => { e.stopPropagation(); onRemove(att.id); }}
              style={{ cursor: "pointer", color: "var(--text-ter)", fontSize: 14, lineHeight: 1, marginLeft: 2 }}
            >
              ×
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Link Input ─── */
export function LinkInput({
  onAdd,
}: {
  onAdd: (link: { name: string; url: string }) => void;
}) {
  const [url, setUrl] = React.useState("");
  const [label, setLabel] = React.useState("");

  const handleAdd = () => {
    if (!url.trim()) return;
    onAdd({ name: label.trim() || url.trim(), url: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}` });
    setUrl("");
    setLabel("");
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--text-ter)", marginBottom: 4 }}>URL</div>
        <input
          type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          style={{
            width: "100%", padding: "6px 10px", borderRadius: 6,
            border: "1px solid var(--border)", fontSize: 13, fontFamily: "inherit",
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--text-ter)", marginBottom: 4 }}>Label (optional)</div>
        <input
          type="text" value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="Link name"
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          style={{
            width: "100%", padding: "6px 10px", borderRadius: 6,
            border: "1px solid var(--border)", fontSize: 13, fontFamily: "inherit",
          }}
        />
      </div>
      <Btn onClick={handleAdd} style={{ flexShrink: 0, padding: "6px 12px" }}>Add</Btn>
    </div>
  );
}
