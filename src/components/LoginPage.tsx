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
  const [hoverButton, setHoverButton] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) {
      setError("Please enter your credentials.");
      return;
    }

    setLoading(true);
    setError("");

    const { user, error: authError } = await signInWithEmail(email, pass);

    if (authError || !user) {
      setError(authError || "Sign in failed. Please try again.");
      setLoading(false);
      return;
    }

    onLogin({ name: user.username, email: user.email, role: user.role });
    setLoading(false);
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    padding: "12px 14px",
    borderRadius: 8,
    border: `1px solid ${focusedField === field ? "#5B5FC7" : "#E3E3E0"}`,
    fontSize: 14,
    color: "#1A1A1A",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "#FAFAFA",
    transition: "border-color 0.15s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "inherit",
      }}
    >
      {/* Left Hero Panel */}
      <div
        className="login-hero"
        style={{
          width: "60%",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-10%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(91,95,199,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "10%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,143,214,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "60%",
            right: "20%",
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(91,95,199,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#FFFFFF",
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Beauticate OS
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 8px",
              lineHeight: 1.5,
            }}
          >
            Your agency&apos;s command center
          </p>
          <a
            href="https://www.beauticate.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              color: "#8B8FD6",
              textDecoration: "none",
            }}
          >
            www.beauticate.com
          </a>

          {/* Feature highlights */}
          <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
            {["Content Pipeline", "Team Analytics", "Client Portal"].map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#5B5FC7",
                  }}
                />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div
        className="login-form-panel"
        style={{
          width: "40%",
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#1A1A1A",
                margin: "0 0 8px",
              }}
            >
              Welcome back
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#6B6B6B",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Sign in to your workspace
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1A1A1A",
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                style={inputStyle("email")}
                disabled={loading}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1A1A1A",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                style={inputStyle("password")}
                disabled={loading}
              />
            </div>

            {error && (
              <div
                style={{
                  fontSize: 13,
                  color: "#DC3545",
                  background: "#FDF2F2",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #FECACA",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              onMouseEnter={() => setHoverButton(true)}
              onMouseLeave={() => setHoverButton(false)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#9B9DD4" : hoverButton ? "#4A4EB3" : "#5B5FC7",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
                transition: "background 0.15s",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div
            style={{
              marginTop: 32,
              fontSize: 12,
              color: "#A0A0A0",
              textAlign: "center",
            }}
          >
            Beauticate OS
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .login-hero {
            display: none !important;
          }
          .login-form-panel {
            width: 100% !important;
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}
