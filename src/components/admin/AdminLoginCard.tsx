import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminPermissions, AdminUserSession } from './adminTypes';
import { setAdminSessionToken } from '../../utils/adminSession';

interface AdminLoginCardProps {
  onSuccess: (payload: { user: AdminUserSession; permissions: AdminPermissions }) => void;
}

export const AdminLoginCard: React.FC<AdminLoginCardProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        sessionToken?: string;
        user?: AdminUserSession;
        permissions?: AdminPermissions;
        error?: string;
      };
      if (!res.ok || !json.user || !json.permissions) {
        throw new Error(json.error || 'Authentication failed. Verify your email and password.');
      }
      if (json.sessionToken) {
        setAdminSessionToken(json.sessionToken);
      }
      onSuccess({ user: json.user, permissions: json.permissions });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1120] text-[#FFFDF7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#D4A537]/45 bg-[#17233A]/95 p-7 sm:p-9 shadow-2xl space-y-6">
        <div className="space-y-2 border-b border-[#D4A537]/25 pb-5">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#F7D774]">
            <ShieldCheck className="w-4 h-4 text-[#D4A537]" aria-hidden="true" />
            <span>Project Eternal · Command Centre</span>
          </div>
          <h1 className="font-editorial text-3xl text-[#FFFDF7]">
            Secretariat Sign In
          </h1>
          <p className="text-xs text-[#E9DCC5]/75 leading-relaxed">
            Authorized Secretariat access across Mahotsav operations, media, scripture CMS, and audit governance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-xs font-medium text-[#E9DCC5]">
            <span>Secretariat Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              data-testid="admin-login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="secretariat@eternal2027.org"
              className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#D4A537]/35 bg-[#0D1120] text-sm text-[#FFFDF7] focus:outline-none focus:border-[#F7D774]"
            />
          </label>

          <label className="block space-y-1.5 text-xs font-medium text-[#E9DCC5]">
            <span>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              data-testid="admin-login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              className="w-full min-h-[44px] px-3.5 rounded-lg border border-[#D4A537]/35 bg-[#0D1120] text-sm text-[#FFFDF7] focus:outline-none focus:border-[#F7D774]"
            />
          </label>

          {error && (
            <div
              role="alert"
              data-testid="admin-login-error"
              className="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-950/50 px-3 py-2 text-xs text-red-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            data-testid="admin-login-submit"
            disabled={loading}
            className="w-full min-h-[46px] rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{loading ? 'Authenticating…' : 'Enter Command Centre'}</span>
          </button>
        </form>

        <div className="rounded-xl border border-[#D4A537]/25 bg-[#0D1120]/60 p-3.5 text-[11px] text-[#E9DCC5]/75 leading-relaxed">
          Role-based credentials are managed by the Mahotsav Secretariat and provisioned via server environment configuration.
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-[#F7D774] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Return to Public Mahotsav Site</span>
        </Link>
      </div>
    </div>
  );
};
