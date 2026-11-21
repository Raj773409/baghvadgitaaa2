import React, { useState } from 'react';
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError, announcePortalSessionChange, portalApi } from '../../utils/portalApi';
import { useToast } from '../ui/Toaster';

interface SignInPanelProps {
  onSignedIn: () => void;
}

export const SignInPanel: React.FC<SignInPanelProps> = ({ onSignedIn }) => {
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const referenceValid = /^BVGM-[A-Z0-9]{4,}$/.test(reference.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailValid || !referenceValid) {
      setError('Enter the email you registered with and your reference code (e.g. BVGM-1A2B3C).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await portalApi.login(email.trim(), reference.trim());
      notify({ tone: 'success', title: 'Welcome back', body: 'You are signed in to your Mahotsav dashboard.' });
      announcePortalSessionChange();
      onSignedIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-24 sm:py-28 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(720px,140vw)] aspect-square rounded-full bg-[radial-gradient(circle,rgba(247,215,116,0.18)_0%,rgba(212,165,55,0.06)_40%,transparent_70%)] blur-2xl"
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="cinematic-rise relative w-full max-w-md rounded-3xl border border-[#D4A537]/45 bg-[#0F1829]/90 backdrop-blur-md p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_60px_-18px_rgba(212,165,55,0.55)]"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] gold-leaf-line rounded-t-3xl" aria-hidden="true" />
        <div className="flex flex-col items-center text-center gap-3">
          <span className="relative grid place-items-center w-14 h-14 rounded-full royal-gold-surface">
            <span className="absolute inset-0 rounded-full border border-[#F7D774]/60 gold-pulse-ring" aria-hidden="true" />
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </span>
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#D4A537]">Participant Dashboard</p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#FFFDF7] leading-tight">
            Sign in to your <span className="royal-gold-gradient-text">Mahotsav</span> account
          </h1>
          <p className="text-sm text-[#E9DCC5]/80 leading-relaxed">
            View your entry passes, payment receipts, notifications and profile.
          </p>
        </div>

        <div className="mt-7 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#E9DCC5]/90">Registered email</span>
            <span className="flex items-center gap-2 rounded-xl border border-[#D4A537]/35 bg-black/25 px-3 focus-within:border-[#F7D774] focus-within:shadow-[0_0_0_3px_rgba(247,215,116,0.15)] transition">
              <Mail className="w-4 h-4 text-[#D4A537] shrink-0" aria-hidden="true" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.org"
                className="w-full min-h-[46px] bg-transparent text-sm text-[#FFFDF7] placeholder:text-[#E9DCC5]/35 outline-none"
              />
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#E9DCC5]/90">Registration reference code</span>
            <span className="flex items-center gap-2 rounded-xl border border-[#D4A537]/35 bg-black/25 px-3 focus-within:border-[#F7D774] focus-within:shadow-[0_0_0_3px_rgba(247,215,116,0.15)] transition">
              <KeyRound className="w-4 h-4 text-[#D4A537] shrink-0" aria-hidden="true" />
              <input
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="BVGM-1A2B3C"
                className="w-full min-h-[46px] bg-transparent text-sm font-mono tracking-[0.08em] text-[#FFFDF7] placeholder:text-[#E9DCC5]/35 outline-none"
              />
            </span>
            <span className="block text-[11px] text-[#E9DCC5]/60 leading-relaxed">
              Your reference code was shown after registration and is in your notifications.
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full royal-gold-surface text-sm font-semibold tracking-[0.04em] cursor-pointer disabled:opacity-70"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
            <span>{submitting ? 'Signing in…' : 'Open my dashboard'}</span>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[#E9DCC5]/70">
          Not registered yet?{' '}
          <Link to="/participate/register" className="inline-flex items-center gap-1 font-semibold text-[#F7D774] hover:underline">
            Register for the Mahotsav <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </p>
      </form>
    </div>
  );
};
