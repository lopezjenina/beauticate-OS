"use client";

import React, { useState } from "react";

export function LoginPage({ onLogin }: { onLogin: (user: { name: string; email: string; role: string }) => void }) {
  const [email, setEmail] = useState("admin@agency.com");
  const [pass, setPass] = useState("password");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (email && pass) {
      onLogin({ name: "Jenina Lopez", email, role: "Admin" });
    } else {
      setError("Please enter your credentials.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-sub)", fontFamily: "inherit",
    }}>
      <div style={{ width: 360, padding: 48, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Sign in</h1>
          <p style={{ fontSize: 14, color: "var(--text-sec)", margin: 0, lineHeight: 1.5 }}>Enter your credentials to access the workspace.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 6,
                border: "1px solid var(--border)", fontSize: 14, color: "var(--text)",
                outline: "none", boxSizing: "border-box", background: "var(--bg)",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 6,
                border: "1px solid var(--border)", fontSize: 14, color: "var(--text)",
                outline: "none", boxSizing: "border-box", background: "var(--bg)",
              }}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: "var(--red)" }}>{error}</div>}
          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "10px", borderRadius: 6, border: "none",
              background: "var(--text)", color: "#FFF", fontSize: 14, fontWeight: 500,
              cursor: "pointer", marginTop: 8,
            }}
          >
            Continue
          </button>
        </div>
        <div style={{ marginTop: 24, fontSize: 12, color: "var(--text-ter)", textAlign: "center" }}>
          Demo credentials are pre-filled.
        </div>
      </div>
    </div>
  );
}
