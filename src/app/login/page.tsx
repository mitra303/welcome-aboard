'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const SSO_ERRORS: Record<string, string> = {
    missing_token: 'SSO token missing. Please login via MITRA portal.',
    sso_unauthorized: 'SSO authentication failed. Please try again.',
    sso_unreachable: 'Could not connect to MITRA portal. Please try again.',
    sso_no_email: 'No email received from SSO. Contact admin.',
    account_inactive: 'Your account is inactive. Contact admin.',
  };
  const ssoError = params.get('error');
  const [error, setError] = useState(ssoError ? (SSO_ERRORS[ssoError] || 'SSO login failed.') : '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push(params.get('next') || '/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-mitra-blue via-[#164a7a] to-[#0d2f4d] text-white">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_70%,white,transparent_30%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-10">
              <img src="https://miplapp.in/images/logo1.ico" alt="MITRA" className="h-9 w-9 rounded bg-white/90 p-1" />
              <span className="text-xl font-extrabold tracking-wide">MITRA</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              Welcome Aboard,<br />reimagined.
            </h2>
            <p className="text-sm text-blue-100/90 leading-relaxed max-w-xs">
              Create, preview and send beautifully on-brand Welcome Aboard
              announcements to your team — all from one dashboard.
            </p>
          </div>
          <p className="relative text-xs text-blue-100/70">
            © {new Date().getFullYear()} MITRA Industries
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <img src="https://miplapp.in/images/logo1.ico" alt="MITRA" className="h-7 w-7" />
              <span className="text-lg font-extrabold text-mitra-blue">MITRA</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to manage Welcome Aboard announcements</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="you@mitraindustries.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mitra-blue focus:border-mitra-blue transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="11" width="16" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 118 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mitra-blue focus:border-mitra-blue transition"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mitra-blue hover:bg-[#163f68] transition-colors text-white rounded-lg py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 text-sm text-center">
            <Link href="/forgot-password" className="text-mitra-blue font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
