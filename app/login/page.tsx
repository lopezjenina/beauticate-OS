'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type LoginMode = 'password' | 'magic';

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  const clearMessages = () => { setError(''); setMessage(''); };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    clearMessages();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    clearMessages();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a login link!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0F' }}>
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#7F77DD' }}>
            VIRAL VISION
          </h1>
          <p className="text-xs font-semibold mt-1 tracking-widest" style={{ color: '#7A7A82' }}>
            OPERATING SYSTEM
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: '#E8E6E1' }}>Sign in</h2>
          <p className="text-sm mb-6" style={{ color: '#7A7A82' }}>
            Access the Viral Vision operating system
          </p>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg py-3 px-4 text-sm font-semibold transition-all mb-6"
            style={{ background: '#fff', color: '#1a1a1a', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Mode toggle */}
          <div className="flex mb-5 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0B0B0F' }}>
            {(['password', 'magic'] as LoginMode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); clearMessages(); }}
                className="flex-1 py-2 text-xs font-semibold transition-all"
                style={{ background: mode === m ? '#7F77DD' : 'transparent', color: mode === m ? '#fff' : '#7A7A82', cursor: 'pointer', border: 'none' }}>
                {m === 'password' ? 'Password' : 'Magic link'}
              </button>
            ))}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#7A7A82' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearMessages(); }}
              onKeyDown={e => e.key === 'Enter' && (mode === 'password' ? handlePasswordLogin() : handleMagicLink())}
              placeholder="you@viralvision.com"
              style={{ background: '#0B0B0F', fontSize: 14, padding: '12px 14px' }}
            />
          </div>

          {/* Password field — only shown in password mode */}
          {mode === 'password' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: '#7A7A82' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); clearMessages(); }}
                onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder="••••••••"
                style={{ background: '#0B0B0F', fontSize: 14, padding: '12px 14px' }}
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg p-3 mb-4 text-xs font-medium"
              style={{ background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.25)', color: '#E24B4A' }}>
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg p-3 mb-4 text-xs font-medium"
              style={{ background: 'rgba(99,153,34,0.08)', border: '1px solid rgba(99,153,34,0.25)', color: '#639922' }}>
              {message}
            </div>
          )}

          <button
            onClick={mode === 'password' ? handlePasswordLogin : handleMagicLink}
            disabled={loading || !email || (mode === 'password' && !password)}
            className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity"
            style={{ background: '#7F77DD', color: '#fff', opacity: loading || !email || (mode === 'password' && !password) ? 0.5 : 1, cursor: loading || !email ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : mode === 'password' ? 'Sign in' : 'Send magic link'}
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#7A7A82' }}>
          Only authorized Viral Vision team members can sign in.
          <br />Contact an admin if you need access.
        </p>
      </div>
    </div>
  );
}
