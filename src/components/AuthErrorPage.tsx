"use client";

import React from "react";

interface AuthErrorPageProps {
  error: string;
  errorDescription: string;
  errorCode?: string;
  onBackToLogin: () => void;
}

export function AuthErrorPage({ error, errorDescription, errorCode, onBackToLogin }: AuthErrorPageProps) {
  // Map Supabase error codes to more user-friendly messages if needed
  const isExpired = errorCode === "otp_expired" || errorDescription.toLowerCase().includes("expired");
  const isRateLimited = errorCode === "over_email_send_rate_limit" || errorDescription.toLowerCase().includes("rate limit");
  const friendlyError = isRateLimited ? "Too Many Requests" : (isExpired ? "Link Expired" : (error === "access_denied" ? "Access Denied" : error));
  
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          radial-gradient(at 0% 0%, rgba(255, 59, 48, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(255, 149, 0, 0.1) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(255, 59, 48, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(175, 82, 222, 0.1) 0px, transparent 50%),
          #F2F2F7
        `,
        fontFamily: "'Outfit', sans-serif",
        padding: "20px",
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
          textAlign: "center",
          animation: "fadeIn 0.6s ease-out",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: "linear-gradient(135deg, #FF3B30, #FF9500)",
            color: "#FFF", fontSize: 40, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", boxShadow: "0 12px 24px rgba(255, 59, 48, 0.3)"
          }}>
            !
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            {friendlyError}
          </h1>
          <p style={{ 
            fontSize: 16, 
            lineHeight: 1.6,
            color: "var(--text-sec)", 
            margin: 0, 
            fontWeight: 500 
          }}>
            {decodeURIComponent(errorDescription.replace(/\+/g, " "))}
          </p>
        </div>

        <div className="glass-dark" style={{
          fontSize: 14, 
          color: "var(--text-ter)",
          background: "rgba(0, 0, 0, 0.03)",
          padding: "20px", 
          borderRadius: 20,
          border: "1px solid rgba(0, 0, 0, 0.05)",
          fontWeight: 500,
          textAlign: "left"
        }}>
          <p style={{ margin: "0 0 8px 0", color: "var(--text-sec)", fontWeight: 600 }}>What happened?</p>
          <p style={{ margin: 0 }}>This usually happens if the link you clicked has already been used, has expired, or was opened in a different browser than where it was requested.</p>
        </div>

        <button
          onClick={onBackToLogin}
          style={{
            width: "100%", padding: "16px", borderRadius: 16,
            border: "none",
            background: "var(--accent)",
            color: "#FFFFFF", fontSize: 16, fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 8px 20px rgba(0, 122, 255, 0.25)",
          }}
        >
          Back to Login
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-ter)", fontWeight: 500 }}>
          If you continue to have trouble, please contact support.
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
