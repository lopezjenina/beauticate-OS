"use client";

import React, { useState } from "react";
import { signInWithMagicLink } from "@/lib/auth";

export function LoginPage({
  onLogin,
}: {
  onLogin: (user: { name: string; email: string; role: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Suppress eslint; onLogin is kept for backwards compat (auth state listener will call it)
  void onLogin;

  // Timer for cooldown
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSendLink = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError } = await signInWithMagicLink(email);

    if (authError) {
      if (authError.toLowerCase().includes("rate limit") || authError.toLowerCase().includes("too many")) {
        setError("Too many attempts. Please wait 60 seconds.");
        setCooldown(60);
      } else {
        setError(authError || "Failed to send magic link. Please try again.");
      }
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    padding: "14px 16px",
    borderRadius: 12,
    border: `1px solid ${focusedField === field ? "var(--accent)" : "var(--border-light)"}`,
    fontSize: 15,
    color: "var(--text)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: focusedField === field ? "0 0 0 4px rgba(0, 122, 255, 0.1)" : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          radial-gradient(at 0% 0%, rgba(0, 122, 255, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(255, 149, 0, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(52, 199, 89, 0.15) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(175, 82, 222, 0.15) 0px, transparent 50%),
          #F2F2F7
        `,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        className="glass"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "48px 40px",
          borderRadius: 32,
          display: "flex",
          flexDirection: "column",
          gap: 32,
          boxShadow: "0 24px 64px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo + Title */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{
            fontSize: 36,
            fontWeight: 400,
            letterSpacing: "0.15em",
            color: "var(--text)",
            fontFamily: "'Outfit', sans-serif",
            margin: "0 0 16px 0",
            textTransform: "uppercase"
          }}>
            BEAUTICATE.
          </div>
          <p style={{ fontSize: 15, color: "var(--text-sec)", margin: 0, fontWeight: 500 }}>
            Agency Operating System
          </p>
        </div>

        {sent ? (
          // ── Sent state ──────────────────────────────────────
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(52, 199, 89, 0.1)",
                border: "1px solid rgba(52, 199, 89, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>
                Check your inbox
              </p>
              <p style={{ fontSize: 14, color: "var(--text-sec)", margin: 0, lineHeight: 1.6 }}>
                We sent a secure sign-in link to{" "}
                <strong style={{ color: "var(--text)" }}>{email}</strong>.
                <br />
                The link expires in 10 minutes.
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{
                background: "transparent", border: "none",
                color: "var(--accent)", fontSize: 14, fontWeight: 600,
                cursor: "pointer", padding: "4px 8px",
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          // ── Input state ──────────────────────────────────────
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sec)", marginLeft: 4 }}>
                Email Address
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleSendLink()}
                placeholder="you@beauticate.com"
                style={inputStyle("email")}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {error && (
              <div
                className="glass-dark"
                style={{
                  fontSize: 13, color: "var(--red)",
                  background: "rgba(255, 59, 48, 0.05)",
                  padding: "12px 16px", borderRadius: 12,
                  border: "1px solid rgba(255, 59, 48, 0.1)",
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <button
              id="login-submit"
              onClick={handleSendLink}
              disabled={loading || cooldown > 0}
              style={{
                width: "100%", padding: "16px", borderRadius: 16,
                border: "none",
                background: (loading || cooldown > 0) ? "var(--text-ter)" : "var(--accent)",
                color: "#FFFFFF", fontSize: 16, fontWeight: 600,
                cursor: (loading || cooldown > 0) ? "not-allowed" : "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 8px 20px rgba(0, 122, 255, 0.25)",
                marginTop: 8,
              }}
            >
              {loading ? "Sending..." : cooldown > 0 ? `Wait ${cooldown}s` : "Send Magic Link →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-ter)", margin: 0, lineHeight: 1.5 }}>
              No password needed. We'll send a secure link to your inbox.
            </p>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-ter)", fontWeight: 500 }}>
          Powered by BEAUTICATE.
        </div>
      </div>
    </div>
  );
}
