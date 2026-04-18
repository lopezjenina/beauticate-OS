"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorCode = searchParams.get("error_code");
  const isExpired = errorCode === "otp_expired" || errorCode === "401";
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // Recover implicit flow token from hash if available
    if (window.location.hash.includes("access_token=")) {
      setIsRecovering(true);
      supabase.auth.getSession().then(() => {
        router.replace("/");
      });
    }
  }, [router]);

  if (isRecovering) {
    return (
      <div style={{ textAlign: "center", color: "#6B6B6B" }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🔄</div>
        <h1 style={{ fontSize: 20, color: "#1A1A1A", marginBottom: 8 }}>Authenticating...</h1>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        padding: "48px 40px",
        borderRadius: 32,
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(255, 59, 48, 0.1)",
          border: "1px solid rgba(255, 59, 48, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
        }}
      >
        {isExpired ? "⏰" : "⚠️"}
      </div>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          {isExpired ? "Link Expired" : "Authentication Failed"}
        </h1>
        <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0, lineHeight: 1.6 }}>
          {isExpired
            ? "Your magic link has expired. Links are only valid for 10 minutes. Request a new one to sign in."
            : "Something went wrong during authentication. Please try again."}
        </p>
      </div>

      <Link
        href="/"
        style={{
          display: "inline-block",
          width: "100%",
          padding: "14px 24px",
          borderRadius: 14,
          background: "linear-gradient(135deg, #007AFF, #5AC8FA)",
          color: "#FFFFFF",
          fontSize: 15, fontWeight: 600,
          textDecoration: "none",
          boxShadow: "0 8px 20px rgba(0, 122, 255, 0.25)",
        }}
      >
        Request New Magic Link →
      </Link>

      <p style={{ fontSize: 12, color: "#A0A0A0", margin: 0 }}>
        BEAUTICATE. · Secure Access
      </p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          radial-gradient(at 0% 0%, rgba(255, 59, 48, 0.1) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(0, 122, 255, 0.1) 0px, transparent 50%),
          #F2F2F7
        `,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <Suspense fallback={
        <div style={{ fontSize: 14, color: "#6B6B6B" }}>Loading...</div>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
