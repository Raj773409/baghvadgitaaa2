import React, { useMemo, useState } from 'react';
import { Archive, Download, Printer, RotateCcw, Shield, UserPlus } from 'lucide-react';
import type {
  AdminRole,
  AdminUserEntry,
  AuditLogEntry,
  BackupEntry,
  DashboardPayload,
  SystemSettingsEntry,
} from './adminTypes';
import { adminFetch, downloadAdminExport } from '../../utils/adminSession';
import { paginateRecords } from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminPaginationBar,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';

const ALL_ROLES: ReadonlyArray<AdminRole> = [
  'SUPER_ADMIN',
  'EVENT_ADMIN',
  'REGISTRATION_MANAGER',
  'FINANCE_MANAGER',
  'VOLUNTEER_MANAGER',
  'CONTENT_EDITOR',
  'MEDIA_MANAGER',
  'AUDITOR',
];

export const AdminUsersPanel: React.FC<{
  users: AdminUserEntry[];
  canWrite: boolean;
  onRefresh: () => void;
  onToast?: (toast: Omit<AdminToastMessage, 'id'>) => void;
}> = ({ users, canWrite, onRefresh, onToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('CONTENT_EDITOR');
  const [error, setError] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(1);

  const [statusTarget, setStatusTarget] = useState<AdminUserEntry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const paged = paginateRecords(users, pageIdx, 10);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await adminFetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'Could not provision user.');
      return;
    }
    onToast?.({ kind: 'success', title: 'Staff Account Provisioned', detail: `${email} (${role})` });
    setName('');
    setEmail('');
    setPassword('');
    onRefresh();
  };

  const confirmToggleActive = async () => {
    if (!statusTarget) return;
    setError(null);
    setUpdatingStatus(true);
    try {
      const nextActive = !statusTarget.active;
      const res = await adminFetch(`/api/admin/users/${statusTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || 'Could not update user status.');
      }
      onToast?.({
        kind: 'info',
        title: nextActive ? 'Account Reactivated' : 'Account Suspended',
        detail: statusTarget.email,
      });
      setStatusTarget(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update user status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const changeRole = async (user: AdminUserEntry, nextRole: AdminRole) => {
    setError(null);
    const res = await adminFetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || 'Could not update role.');
      return;
    }
    onToast?.({ kind: 'success', title: 'RBAC Role Updated', detail: `${user.email} -> ${nextRole}` });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {canWrite && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            <UserPlus className="w-4 h-4" />
            <span>Provision Administrator / RBAC Role Account</span>
          </div>

          {error && (
            <p className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="min-h-[38px] px-5 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
          >
            Create Staff Account
          </button>
        </form>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.1em]">
                <th className="p-3.5">Administrator</th>
                <th className="p-3.5">RBAC Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Login</th>
                {canWrite && <th className="p-3.5">Access</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {paged.items.map((u) => (
                <tr key={u.id} className="hover:bg-[#D5AF62]/5">
                  <td className="p-3.5">
                    <p className="font-semibold text-[var(--color-ink)]">{u.name}</p>
                    <p className="text-[var(--color-muted)]">{u.email}</p>
                  </td>
                  <td className="p-3.5">
                    {canWrite ? (
                      <select
                        value={u.role}
                        onChange={(e) => void changeRole(u, e.target.value as AdminRole)}
                        className="min-h-[32px] px-2 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-mono">{u.role}</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <AdminStatusBadge status={u.active ? 'active' : 'suspended'} />
                  </td>
                  <td className="p-3.5 text-[var(--color-muted)] tabular-nums">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  {canWrite && (
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => setStatusTarget(u)}
                        className="px-3 py-1 rounded border border-[#D5AF62]/55 cursor-pointer hover:bg-[#D5AF62]/15"
                      >
                        {u.active ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminPaginationBar
          page={paged.page}
          totalPages={paged.totalPages}
          totalItems={paged.totalItems}
          pageSize={10}
          onPageChange={setPageIdx}
        />
      </div>

      <AdminConfirmModal
        open={Boolean(statusTarget)}
        title={statusTarget?.active ? 'Suspend Staff Access' : 'Reactivate Staff Account'}
        description={
          statusTarget?.active
            ? 'Suspending this account immediately blocks login and administrative actions for this staff member until reactivated.'
            : 'Reactivating restores Command Centre access according to the assigned RBAC role.'
        }
        targetSummary={
          statusTarget ? `${statusTarget.name} (${statusTarget.email}) · ${statusTarget.role}` : ''
        }
        confirmLabel={statusTarget?.active ? 'Suspend Account' : 'Reactivate Account'}
        tone={statusTarget?.active ? 'danger' : 'primary'}
        busy={updatingStatus}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => void confirmToggleActive()}
      />
    </div>
  );
};

export const AdminAnalyticsPanel: React.FC<{ data: DashboardPayload }> = ({ data }) => {
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'xls') => {
    setExportError(null);
    try {
      await downloadAdminExport(
        `/api/admin/participants/export?format=${format}`,
        `eternal-2027-participants.${format}`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  return (
    <div className="space-y-6">
      {exportError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 rounded-lg px-3.5 py-2.5">
          {exportError}
        </p>
      )}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-editorial text-2xl text-[var(--color-ink)]">
            Executive Secretariat Report
          </h3>
          <p className="text-xs text-[var(--color-muted)]">
            Verified exportable metrics calculated directly from persisted transactions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={() => void handleExport('csv')}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-lg border border-[#D5AF62]/55 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => void handleExport('xls')}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-lg border border-[#D5AF62]/55 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            Country Distribution
          </h4>
          {data.countryBreakdown.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">No registrations yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {data.countryBreakdown.map((c) => (
                <li key={c.country} className="flex justify-between py-1 border-b border-[var(--color-border)]">
                  <span>{c.country}</span>
                  <strong className="tabular-nums">{c.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            Track Mix
          </h4>
          {data.typeBreakdown.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">No registrations yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {data.typeBreakdown.map((t) => (
                <li key={t.type} className="flex justify-between py-1 border-b border-[var(--color-border)]">
                  <span className="uppercase">{t.type}</span>
                  <strong className="tabular-nums">{t.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminAuditPanel: React.FC<{ auditLogs: AuditLogEntry[] }> = ({ auditLogs }) => {
  const [filter, setFilter] = useState('');
  const [pageIdx, setPageIdx] = useState(1);

  const filtered = useMemo(
    () =>
      filter.trim()
        ? auditLogs.filter((l) =>
            `${l.actorEmail} ${l.action} ${l.module} ${l.summary}`
              .toLowerCase()
              .includes(filter.trim().toLowerCase()),
          )
        : auditLogs,
    [auditLogs, filter],
  );

  const paged = paginateRecords(filtered, pageIdx, 12);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
          <Shield className="w-4 h-4" />
          <span>Immutable Security &amp; Operations Audit Trail</span>
        </div>
        <input
          type="search"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPageIdx(1);
          }}
          placeholder="Filter audit actions…"
          className="min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs w-64"
        />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        {paged.items.length === 0 ? (
          <p className="p-8 text-sm text-[var(--color-muted)] text-center">No matching audit entries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.1em]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action / Module</th>
                  <th className="p-3.5">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paged.items.map((log) => (
                  <tr key={log.id} className="hover:bg-[#D5AF62]/5">
                    <td className="p-3.5 whitespace-nowrap tabular-nums text-[var(--color-muted)]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-[var(--color-ink)]">{log.actorEmail}</span>
                      <span className="block text-[10px] text-[var(--color-muted)]">{log.actorRole}</span>
                    </td>
                    <td className="p-3.5 font-mono">
                      {log.action} <span className="text-[var(--color-muted)]">({log.module})</span>
                    </td>
                    <td className="p-3.5 text-[var(--color-ink)]">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPaginationBar
          page={paged.page}
          totalPages={paged.totalPages}
          totalItems={paged.totalItems}
          pageSize={12}
          onPageChange={setPageIdx}
        />
      </div>
    </div>
  );
};

export const AdminSettingsPanel: React.FC<{
  settings: SystemSettingsEntry;
  backups: BackupEntry[];
  canWrite: boolean;
  onRefresh: () => void;
  onToast?: (toast: Omit<AdminToastMessage, 'id'>) => void;
}> = ({ settings, backups, canWrite, onRefresh, onToast }) => {
  const [banner, setBanner] = useState(settings.maintenanceBanner);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(settings.defaultVoiceGender);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const saveSettings = async (patch: Partial<SystemSettingsEntry>) => {
    setFeedback(null);
    const res = await adminFetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setFeedback({ kind: 'error', message: json.error || 'Could not update settings.' });
      return;
    }
    setFeedback({ kind: 'success', message: 'Platform settings saved.' });
    onToast?.({ kind: 'success', title: 'Platform Settings Updated' });
    onRefresh();
  };

  const createBackup = async () => {
    setFeedback(null);
    const res = await adminFetch('/api/admin/backups', { method: 'POST' });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setFeedback({ kind: 'error', message: json.error || 'Backup creation failed.' });
      return;
    }
    setFeedback({ kind: 'success', message: 'Database snapshot created (plain JSON, not encrypted).' });
    onToast?.({ kind: 'success', title: 'Snapshot Created' });
    onRefresh();
  };

  const confirmRestoreBackup = async () => {
    if (!restoreTarget) return;
    setFeedback(null);
    setRestoring(true);
    try {
      const res = await adminFetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: restoreTarget }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || 'Backup restore failed.');
      }
      setFeedback({ kind: 'success', message: `Restored platform snapshot ${restoreTarget}.` });
      onToast?.({
        kind: 'info',
        title: 'Backup Restored',
        detail: restoreTarget,
      });
      setRestoreTarget(null);
      onRefresh();
    } catch (err) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Backup restore failed.',
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          role="status"
          className={`text-xs rounded-lg px-3.5 py-2.5 ${
            feedback.kind === 'error'
              ? 'text-red-700 dark:text-red-300 bg-red-500/10'
              : 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/10'
          }`}
        >
          {feedback.message}
        </p>
      )}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-4">
        <h3 className="font-editorial text-xl text-[var(--color-ink)]">
          Platform Controls &amp; Default Preferences
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="font-medium">Public Delegate Registrations Open</span>
            <input
              type="checkbox"
              disabled={!canWrite}
              checked={settings.registrationOpen}
              onChange={(e) => void saveSettings({ registrationOpen: e.target.checked })}
              className="w-4 h-4 accent-[#D5AF62]"
            />
          </label>
          <label className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="font-medium">Require Secretariat Volunteer Approval</span>
            <input
              type="checkbox"
              disabled={!canWrite}
              checked={settings.requireVolunteerApproval}
              onChange={(e) =>
                void saveSettings({ requireVolunteerApproval: e.target.checked })
              }
              className="w-4 h-4 accent-[#D5AF62]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-2">
          <label className="space-y-1 text-xs flex-1 min-w-[220px]">
            <span className="text-[var(--color-muted)]">Secretariat Public Notice Banner</span>
            <input
              type="text"
              disabled={!canWrite}
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="Optional announcement banner"
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-[var(--color-muted)]">Default Indian Voice</span>
            <select
              disabled={!canWrite}
              value={voiceGender}
              onChange={(e) => setVoiceGender(e.target.value as 'female' | 'male')}
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            >
              <option value="female">Female (Aoede)</option>
              <option value="male">Male (Charon)</option>
            </select>
          </label>
          {canWrite && (
            <button
              type="button"
              onClick={() =>
                void saveSettings({
                  maintenanceBanner: banner,
                  defaultVoiceGender: voiceGender,
                })
              }
              className="min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
            >
              Save Settings
            </button>
          )}
        </div>
      </div>

      {/* Backups & Recovery */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-[#D5AF62]" />
            <h3 className="font-editorial text-xl text-[var(--color-ink)]">
              Database Snapshots &amp; Recovery
            </h3>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={() => void createBackup()}
              className="min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
            >
              Create Snapshot Now
            </button>
          )}
        </div>

        {backups.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">No backups created yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] text-xs">
            {backups.map((b) => (
              <li key={b.fileName} className="py-2.5 flex items-center justify-between gap-4">
                <div className="tabular-nums">
                  <span className="font-mono font-semibold text-[var(--color-ink)]">
                    {b.fileName}
                  </span>
                  <span className="ml-3 text-[var(--color-muted)]">
                    {(b.sizeBytes / 1024).toFixed(1)} KB · {new Date(b.modifiedAt).toLocaleString()}
                  </span>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setRestoreTarget(b.fileName)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded border border-[#D5AF62]/55 hover:bg-[#D5AF62]/15 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminConfirmModal
        open={Boolean(restoreTarget)}
        title="Restore Database Snapshot"
        description="Restoring a snapshot overwrites current CMS pages, carousels, participants, and system settings with the state captured in that backup file."
        targetSummary={restoreTarget ?? ''}
        confirmLabel="Restore Snapshot"
        tone="danger"
        busy={restoring}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={() => void confirmRestoreBackup()}
      />
    </div>
  );
};
