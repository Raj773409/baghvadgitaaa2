import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AdminLoginCard } from '../../components/admin/AdminLoginCard';
import type { AdminPermissions, AdminUserSession } from '../../components/admin/adminTypes';
import { adminFetch, clearAdminSessionToken } from '../../utils/adminSession';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'unauthenticated' | 'authenticated' | 'denied'>(
    'checking',
  );

  const requestedFrom =
    typeof (location.state as { from?: unknown } | null)?.from === 'string' &&
    String((location.state as { from: string }).from).startsWith('/admin') &&
    String((location.state as { from: string }).from) !== '/admin/login' &&
    String((location.state as { from: string }).from) !== '/admin/access-denied'
      ? String((location.state as { from: string }).from)
      : '/admin';

  useEffect(() => {
    let active = true;
    adminFetch('/api/admin/session')
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then(
        (json: {
          authenticated: boolean;
          user?: AdminUserSession;
          permissions?: AdminPermissions;
        }) => {
          if (!active) return;
          if (json.authenticated && json.user && json.permissions) {
            if (json.permissions.read.length === 0) {
              setStatus('denied');
            } else {
              setStatus('authenticated');
            }
          } else {
            clearAdminSessionToken();
            setStatus('unauthenticated');
          }
        },
      )
      .catch(() => {
        if (active) setStatus('unauthenticated');
      });
    return () => {
      active = false;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#0D1120] text-[#FFFDF7] flex items-center justify-center">
        <p className="font-editorial text-lg text-[#F7D774]">Verifying Secretariat Session…</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to={requestedFrom} replace />;
  }

  if (status === 'denied') {
    return <Navigate to="/admin/access-denied" replace />;
  }

  return (
    <AdminLoginCard
      onSuccess={({ permissions }) => {
        if (permissions.read.length === 0) {
          navigate('/admin/access-denied', { replace: true });
          return;
        }
        navigate(requestedFrom, { replace: true });
      }}
    />
  );
};

export default AdminLoginPage;
