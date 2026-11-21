import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { AdminUserSession } from '../../components/admin/adminTypes';
import { adminFetch, clearAdminSessionToken } from '../../utils/adminSession';

const AdminAccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AdminUserSession | null>(null);
  const reason =
    typeof (location.state as { reason?: unknown } | null)?.reason === 'string'
      ? (location.state as { reason: string }).reason
      : 'Your Secretariat account does not hold the required administrative role or module authorization.';

  useEffect(() => {
    let active = true;
    adminFetch('/api/admin/session')
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((json: { authenticated: boolean; user?: AdminUserSession }) => {
        if (active && json.authenticated && json.user) {
          setUser(json.user);
        }
      })
      .catch(() => {
        // Non-fatal
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSwitchAccount = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      clearAdminSessionToken();
    }
    navigate('/admin/login', { replace: true });
  };

  return (
    <div
      data-testid="admin-access-denied"
      className="min-h-screen bg-[#0D1120] text-[#FFFDF7] flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#C9A04E]/45 bg-[#17233A]/95 p-8 shadow-2xl space-y-6">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#F0D38B]">
          <ShieldAlert className="w-4 h-4 text-[#C9A04E]" aria-hidden="true" />
          <span>403 · Administrative Access Restricted</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-editorial text-3xl text-[#FFFDF7]">Access Denied</h1>
          <p className="text-sm text-[#E9DCC5]/85 leading-relaxed">{reason}</p>
        </div>

        {user && (
          <div className="rounded-xl border border-[#C9A04E]/30 bg-[#0D1120]/70 p-4 text-xs space-y-1">
            <p className="text-[#E9DCC5]/70">Signed in as:</p>
            <p className="font-medium text-[#FFFDF7]">{user.name}</p>
            <p className="text-[#F0D38B] font-mono">
              {user.email} · Role: {user.role}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void handleSwitchAccount()}
            className="inline-flex items-center gap-2 min-h-[42px] px-5 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.08em] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{user ? 'Sign Out & Switch Account' : 'Go to Admin Login'}</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 min-h-[42px] px-5 rounded-full border border-[#C9A04E]/45 text-xs font-medium text-[#F0D38B] hover:bg-[#C9A04E]/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to Public Site</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminAccessDeniedPage;
