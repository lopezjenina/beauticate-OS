"use client";

import React, { useState } from "react";
import { signInWithEmail } from "@/lib/auth";

export function LoginPage({
  onLogin,
}: {
  onLogin: (user: { name: string; email: string; role: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Timer for cooldown
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleLogin = async () => {
    if (!email || !pass) {
      setError("Please enter your credentials.");
      return;
    }

    setLoading(true);
    setError("");

    const { user, error: authError } = await signInWithEmail(email, pass);

    if (authError || !user) {
      if (authError?.toLowerCase().includes("rate limit") || authError?.toLowerCase().includes("too many")) {
        setError("Too many attempts. Please wait 60 seconds.");
        setCooldown(60);
      } else {
        setError(authError || "Sign in failed. Please try again.");
      }
      setLoading(false);
      return;
    }

    onLogin({ name: user.username, email: user.email, role: user.role });
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
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg, var(--accent), #5AC8FA)",
            color: "#FFF", fontSize: 24, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 12px 24px rgba(0, 122, 255, 0.3)"
          }}>
            B
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.03em" }}>Beauticate OS</h1>
          <p style={{ fontSize: 15, color: "var(--text-sec)", margin: 0, fontWeight: 500 }}>Agency Operating System</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sec)", marginLeft: 4 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              placeholder="you@beauticate.com"
              style={inputStyle("email")}
              disabled={loading}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-sec)", marginLeft: 4 }}>Password</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              style={inputStyle("password")}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="glass-dark" style={{
              fontSize: 13, color: "var(--red)",
              background: "rgba(255, 59, 48, 0.05)",
              padding: "12px 16px", borderRadius: 12,
              border: "1px solid rgba(255, 59, 48, 0.1)",
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || cooldown > 0}
            style={{
              width: "100%", padding: "16px", borderRadius: 16,
              border: "none",
              background: (loading || cooldown > 0) ? "var(--text-ter)" : "var(--accent)",
              color: "#FFFFFF", fontSize: 16, fontWeight: 600,
              cursor: (loading || cooldown > 0) ? "not-allowed" : "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 8px 20px rgba(0, 122, 255, 0.25)",
              marginTop: 8
            }}
          >
            {loading ? "Signing in..." : cooldown > 0 ? `Wait ${cooldown}s` : "Sign In"}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-ter)", fontWeight: 500 }}>
          Powered by Beauticate
        </div>
      </div>
    </div>
  );
}
