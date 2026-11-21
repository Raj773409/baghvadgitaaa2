import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Check,
  Download,
  Flag,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  GatewayStatus,
  MembershipEntry,
  ParticipantEntry,
  PaymentEntry,
  RefundEntry,
  VolunteerEntry,
} from './adminTypes';
import { adminFetch, downloadAdminExport } from '../../utils/adminSession';
import { paginateRecords } from '../../utils/cmsSync';
import {
  AdminConfirmModal,
  AdminPaginationBar,
  AdminStatusBadge,
  type AdminToastMessage,
} from './AdminUiPrimitives';

export const AdminParticipantsPanel: React.FC<{
  participants: ParticipantEntry[];
  canWrite: boolean;
  onRefresh: () => void;
  onToast?: (toast: Omit<AdminToastMessage, 'id'>) => void;
}> = ({ participants, canWrite, onRefresh, onToast }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'flagged'>('all');
  const [assistanceFilter, setAssistanceFilter] = useState<
    'all' | 'visa' | 'accommodation' | 'localTransport'
  >('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'fullName' | 'donationAmountInr' | 'referenceCode'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pageIdx, setPageIdx] = useState(1);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParticipantEntry | null>(null);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = participants.filter((p) => {
      if (statusFilter !== 'all' && p.verificationStatus !== statusFilter) return false;
      if (assistanceFilter !== 'all' && !p.assistance[assistanceFilter]) return false;
      if (!q) return true;
      return `${p.fullName} ${p.email} ${p.country} ${p.city} ${p.referenceCode}`
        .toLowerCase()
        .includes(q);
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'donationAmountInr') {
        cmp = a.donationAmountInr - b.donationAmountInr;
      } else if (sortBy === 'fullName') {
        cmp = a.fullName.localeCompare(b.fullName);
      } else if (sortBy === 'referenceCode') {
        cmp = a.referenceCode.localeCompare(b.referenceCode);
      } else {
        cmp = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [participants, search, statusFilter, assistanceFilter, sortBy, sortDir]);

  const paged = paginateRecords(filteredAndSorted, pageIdx, 10);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'fullName' || col === 'referenceCode' ? 'asc' : 'desc');
    }
    setPageIdx(1);
  };

  const updateVerification = async (
    id: string,
    verificationStatus: ParticipantEntry['verificationStatus'],
  ) => {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/participants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Could not update participant status.');
      }
      onToast?.({
        kind: 'success',
        title: `Participant Marked ${verificationStatus}`,
      });
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDeleteParticipant = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    setBusyId(deleteTarget.id);
    try {
      const res = await adminFetch(`/api/admin/participants/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Could not delete participant.');
      }
      onToast?.({
        kind: 'info',
        title: 'Participant Record Removed',
        detail: `${deleteTarget.fullName} (${deleteTarget.referenceCode}) removed.`,
      });
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleExport = async (format: 'csv' | 'xls') => {
    setActionError(null);
    try {
      await downloadAdminExport(
        `/api/admin/participants/export?format=${format}`,
        `eternal-2027-participants.${format}`,
      );
      onToast?.({
        kind: 'success',
        title: `Exported Participants (${format.toUpperCase()})`,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  return (
    <div className="space-y-5">
      {actionError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 rounded-lg px-3.5 py-2.5">
          {actionError}
        </p>
      )}

      {/* Toolbar */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIdx(1);
                }}
                placeholder="Search name, email, ref code, country…"
                className="w-full min-h-[38px] pl-9 pr-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs text-[var(--color-ink)]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'pending' | 'verified' | 'flagged');
                setPageIdx(1);
              }}
              aria-label="Filter by verification status"
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs text-[var(--color-ink)]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => void handleExport('csv')}
              data-testid="export-csv-link"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-lg border border-[#D5AF62]/55 text-xs font-medium text-[var(--color-ink)] hover:bg-[#D5AF62]/15 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
              <span>CSV Export</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExport('xls')}
              data-testid="export-xls-link"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-lg border border-[#D5AF62]/55 text-xs font-medium text-[var(--color-ink)] hover:bg-[#D5AF62]/15 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-bronze)]" />
              <span>Excel (.xls)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-bronze)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Assistance Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border)] text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] mr-1">
            Delegate Assistance:
          </span>
          {(
            [
              { id: 'all', label: 'All Delegates' },
              { id: 'visa', label: 'Visa Support' },
              { id: 'accommodation', label: 'Accommodation' },
              { id: 'localTransport', label: 'Local Transport' },
            ] as const
          ).map((flag) => (
            <button
              key={flag.id}
              type="button"
              onClick={() => {
                setAssistanceFilter(flag.id);
                setPageIdx(1);
              }}
              className={`px-3 py-1 rounded border text-xs cursor-pointer ${
                assistanceFilter === flag.id
                  ? 'bg-[#17233A] text-[#F5E2B5] border-[#17233A] dark:bg-[#D5AF62] dark:text-[#171717] dark:border-[#D5AF62] font-semibold'
                  : 'border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {flag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        {paged.items.length === 0 ? (
          <p className="p-8 text-sm text-[var(--color-muted)] text-center">
            No matching participant records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.1em]">
                  <th className="p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('referenceCode')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:text-[var(--color-ink)]"
                    >
                      <span>Ref Code</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('fullName')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:text-[var(--color-ink)]"
                    >
                      <span>Delegate</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="p-3.5">Track / Persons</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('donationAmountInr')}
                      className="inline-flex items-center gap-1 cursor-pointer hover:text-[var(--color-ink)]"
                    >
                      <span>Contribution</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="p-3.5">Verification</th>
                  {canWrite && <th className="p-3.5 print:hidden">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paged.items.map((p) => (
                  <tr key={p.id} className="hover:bg-[#D5AF62]/5">
                    <td className="p-3.5 font-mono font-semibold text-[var(--color-ink)] whitespace-nowrap">
                      {p.referenceCode}
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-[var(--color-ink)]">{p.fullName}</p>
                      <p className="text-[var(--color-muted)]">
                        {p.email} · {p.phone}
                      </p>
                      {p.preferredLanguage && (
                        <p className="text-[10px] font-mono uppercase text-[var(--color-bronze)]">
                          Lang: {p.preferredLanguage}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="uppercase font-medium text-[var(--color-ink)]">
                        {p.registrationType}
                      </span>{' '}
                      <span className="tabular-nums">({p.noOfPersons})</span>
                      {(p.organisationName ||
                        p.parayanaCity ||
                        p.familyOrGroupMembers ||
                        p.volunteerSkills) && (
                        <div className="mt-1 space-y-0.5 text-[10.5px] text-[var(--color-muted)]">
                          {p.organisationName && (
                            <p>
                              Org: {p.organisationName}
                              {p.organisationRole ? ` (${p.organisationRole})` : ''}
                            </p>
                          )}
                          {p.familyOrGroupMembers && <p>Group: {p.familyOrGroupMembers}</p>}
                          {p.parayanaCity && <p>Parayana: {p.parayanaCity}</p>}
                          {p.volunteerSkills && <p>Seva: {p.volunteerSkills}</p>}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--color-muted)]">
                      <p>
                        {p.city}, {p.country}
                      </p>
                      {p.assistanceNotes && (
                        <p
                          className="text-[10.5px] italic mt-0.5 max-w-[200px] truncate"
                          title={p.assistanceNotes}
                        >
                          Note: {p.assistanceNotes}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 tabular-nums font-medium text-[var(--color-ink)]">
                      ₹ {p.donationAmountInr.toLocaleString('en-IN')}
                      <span className="block text-[10px] font-mono uppercase text-[var(--color-muted)]">
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <AdminStatusBadge status={p.verificationStatus} />
                    </td>
                    {canWrite && (
                      <td className="p-3.5 print:hidden">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => void updateVerification(p.id, 'verified')}
                            title="Verify participant"
                            className="p-1.5 rounded border border-emerald-700/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => void updateVerification(p.id, 'flagged')}
                            title="Flag for review"
                            className="p-1.5 rounded border border-amber-600/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => setDeleteTarget(p)}
                            title="Remove entry"
                            className="p-1.5 rounded border border-red-500/35 text-red-600 dark:text-red-300 hover:bg-red-500/15 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
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
          pageSize={10}
          onPageChange={setPageIdx}
        />
      </div>

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove Participant Record"
        description="Are you sure you want to permanently remove this delegate registration from the Secretariat ledger? This action is recorded in the security audit trail."
        targetSummary={
          deleteTarget
            ? `${deleteTarget.fullName} · ${deleteTarget.referenceCode} (${deleteTarget.email})`
            : ''
        }
        confirmLabel="Remove Record"
        tone="danger"
        busy={Boolean(deleteTarget && busyId === deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDeleteParticipant()}
      />
    </div>
  );
};

export const AdminPaymentsPanel: React.FC<{
  payments: PaymentEntry[];
  refunds: RefundEntry[];
  gatewayStatus: GatewayStatus;
  canWrite: boolean;
  onRefresh: () => void;
  onToast?: (toast: Omit<AdminToastMessage, 'id'>) => void;
}> = ({ payments, refunds, gatewayStatus, canWrite, onRefresh, onToast }) => {
  const [refundReason, setRefundReason] = useState('Secretariat approved adjustment');
  const [actionError, setActionError] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaymentEntry | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [pageIdx, setPageIdx] = useState(1);

  const paged = paginateRecords(payments, pageIdx, 10);

  const confirmRefund = async () => {
    if (!refundTarget) return;
    setActionError(null);
    setProcessingRefund(true);
    try {
      const res = await adminFetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: refundTarget.id, reason: refundReason }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Could not process refund.');
      }
      onToast?.({
        kind: 'info',
        title:
          refundTarget.gateway === 'razorpay' ? 'Gateway Refund Issued' : 'Refund Ledger Entry Recorded',
        detail: `₹ ${refundTarget.amountInr.toLocaleString('en-IN')} (${refundTarget.gatewayReference})`,
      });
      setRefundTarget(null);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Refund failed.');
    } finally {
      setProcessingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 rounded-lg px-3.5 py-2.5">
          {actionError}
        </p>
      )}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            Payment Gateway Status
          </p>
          <p className="text-sm text-[var(--color-ink)]">
            {gatewayStatus.providers.razorpay
              ? `Razorpay checkout live${gatewayStatus.providers.razorpayWebhook ? ' · webhook HMAC verification active' : ' · webhook secret not yet configured'}`
              : 'Razorpay keys not configured — participants are sent to the official external payment portal.'}
          </p>
        </div>
        {canWrite && (
          <input
            type="text"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            aria-label="Default refund memo"
            className="min-h-[36px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs text-[var(--color-ink)] w-64"
          />
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        {paged.items.length === 0 ? (
          <p className="p-8 text-sm text-[var(--color-muted)] text-center">
            No payment handoff records recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.1em]">
                  <th className="p-3.5">Gateway Ref</th>
                  <th className="p-3.5">Delegate</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Status</th>
                  {canWrite && <th className="p-3.5">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paged.items.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[#D5AF62]/5">
                    <td className="p-3.5 font-mono font-semibold text-[var(--color-ink)]">
                      {pay.gatewayReference}
                    </td>
                    <td className="p-3.5 text-[var(--color-ink)]">{pay.participantName}</td>
                    <td className="p-3.5 tabular-nums font-medium">
                      ₹ {pay.amountInr.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-[var(--color-muted)]">{pay.gateway}</td>
                    <td className="p-3.5">
                      <AdminStatusBadge status={pay.status} />
                    </td>
                    {canWrite && (
                      <td className="p-3.5">
                        {pay.status === 'captured' && (
                          <button
                            type="button"
                            onClick={() => setRefundTarget(pay)}
                            className="px-3 py-1 rounded border border-[#D5AF62]/55 text-xs hover:bg-[#D5AF62]/15 cursor-pointer"
                          >
                            {pay.gateway === 'razorpay' ? 'Issue Gateway Refund' : 'Record Refund'}
                          </button>
                        )}
                      </td>
                    )}
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
          pageSize={10}
          onPageChange={setPageIdx}
        />
      </div>

      {refunds.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 space-y-2">
          <h3 className="font-editorial text-lg text-[var(--color-ink)]">Refunds Issued</h3>
          <ul className="space-y-1.5 text-xs text-[var(--color-muted)]">
            {refunds.map((r) => (
              <li key={r.id} className="tabular-nums">
                {r.id}: ₹ {r.amountInr.toLocaleString('en-IN')} — {r.reason} (Approved by{' '}
                {r.approvedBy})
              </li>
            ))}
          </ul>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(refundTarget)}
        title="Record Payment Refund"
        description={`This records an administrative refund entry with memo: "${refundReason}".`}
        targetSummary={
          refundTarget
            ? `${refundTarget.participantName} · ₹ ${refundTarget.amountInr.toLocaleString('en-IN')} (${refundTarget.gatewayReference})`
            : ''
        }
        confirmLabel="Confirm Refund Entry"
        tone="danger"
        busy={processingRefund}
        onCancel={() => setRefundTarget(null)}
        onConfirm={() => void confirmRefund()}
      />
    </div>
  );
};

export const AdminVolunteersPanel: React.FC<{
  volunteers: VolunteerEntry[];
  canWrite: boolean;
  onRefresh: () => void;
  onToast?: (toast: Omit<AdminToastMessage, 'id'>) => void;
}> = ({ volunteers, canWrite, onRefresh, onToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState<VolunteerEntry['department']>('hospitality');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(1);

  const paged = paginateRecords(volunteers, pageIdx, 10);

  const createVol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setActionError(null);
    const res = await adminFetch('/api/admin/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: name.trim(), email: email.trim(), department: dept }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setActionError(j.error || 'Could not add volunteer.');
      return;
    }
    onToast?.({ kind: 'success', title: 'Volunteer Seva Added', detail: name.trim() });
    setName('');
    setEmail('');
    onRefresh();
  };

  const patchVol = async (id: string, body: Record<string, unknown>) => {
    setActionError(null);
    const res = await adminFetch(`/api/admin/volunteers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setActionError(j.error || 'Could not update volunteer.');
      return;
    }
    onToast?.({ kind: 'success', title: 'Volunteer Record Updated' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 rounded-lg px-3.5 py-2.5">
          {actionError}
        </p>
      )}
      {canWrite && (
        <form
          onSubmit={createVol}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 flex flex-wrap items-end gap-3"
        >
          <label className="space-y-1 text-xs flex-1 min-w-[160px]">
            <span className="text-[var(--color-muted)]">Volunteer Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
          </label>
          <label className="space-y-1 text-xs flex-1 min-w-[180px]">
            <span className="text-[var(--color-muted)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-[var(--color-muted)]">Department</span>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as VolunteerEntry['department'])}
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            >
              <option value="hospitality">Hospitality</option>
              <option value="translation">Translation</option>
              <option value="media">Media</option>
              <option value="logistics">Logistics</option>
              <option value="stage">Stage</option>
            </select>
          </label>
          <button
            type="submit"
            className="min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Seva Member</span>
          </button>
        </form>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        {paged.items.length === 0 ? (
          <p className="p-8 text-sm text-[var(--color-muted)] text-center">
            No volunteer applications yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.1em]">
                  <th className="p-3.5">Seva ID</th>
                  <th className="p-3.5">Name / Email</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Shifts Attended</th>
                  {canWrite && <th className="p-3.5">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paged.items.map((v) => (
                  <tr key={v.id} className="hover:bg-[#D5AF62]/5">
                    <td className="p-3.5 font-mono font-semibold">{v.volunteerBadgeId}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-[var(--color-ink)]">{v.fullName}</p>
                      <p className="text-[var(--color-muted)]">
                        {v.email} · {v.city}, {v.country}
                      </p>
                    </td>
                    <td className="p-3.5 uppercase">{v.department}</td>
                    <td className="p-3.5">
                      <AdminStatusBadge status={v.approvalStatus} />
                    </td>
                    <td className="p-3.5 tabular-nums">{v.attendanceCount}</td>
                    {canWrite && (
                      <td className="p-3.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => void patchVol(v.id, { approvalStatus: 'approved' })}
                          className="px-2.5 py-1 rounded border border-emerald-700/40 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void patchVol(v.id, { incrementAttendance: true })}
                          className="px-2.5 py-1 rounded border border-[#D5AF62]/55 text-[var(--color-ink)] cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          +1 Shift
                        </button>
                      </td>
                    )}
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
          pageSize={10}
          onPageChange={setPageIdx}
        />
      </div>
    </div>
  );
};

export const AdminMembershipsPanel: React.FC<{
  memberships: MembershipEntry[];
  canWrite: boolean;
  onRefresh: () => void;
  onToast?: (toast: Omit<AdminToastMessage, 'id'>) => void;
}> = ({ memberships, canWrite, onRefresh, onToast }) => {
  const [memberName, setMemberName] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<MembershipEntry['tier']>('patron');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(1);

  const paged = paginateRecords(memberships, pageIdx, 10);

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !email.trim()) return;
    setActionError(null);
    const res = await adminFetch('/api/admin/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberName: memberName.trim(), email: email.trim(), tier }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setActionError(j.error || 'Could not enroll member.');
      return;
    }
    onToast?.({ kind: 'success', title: 'Charter Member Enrolled', detail: memberName.trim() });
    setMemberName('');
    setEmail('');
    onRefresh();
  };

  const patchMember = async (id: string, body: Record<string, unknown>) => {
    setActionError(null);
    const res = await adminFetch(`/api/admin/memberships/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setActionError(j.error || 'Could not update membership.');
      return;
    }
    onToast?.({ kind: 'success', title: 'Membership Updated' });
    onRefresh();
  };

  const deleteMember = async (id: string, label: string) => {
    if (!window.confirm(`Remove membership for ${label}? This cannot be undone.`)) return;
    setActionError(null);
    const res = await adminFetch(`/api/admin/memberships/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setActionError(j.error || 'Could not remove membership.');
      return;
    }
    onToast?.({ kind: 'success', title: 'Membership Removed', detail: label });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300 bg-red-500/10 rounded-lg px-3.5 py-2.5">
          {actionError}
        </p>
      )}
      {canWrite && (
        <form
          onSubmit={createMember}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] p-5 flex flex-wrap items-end gap-3"
        >
          <label className="space-y-1 text-xs flex-1 min-w-[160px]">
            <span className="text-[var(--color-muted)]">Member / Institution</span>
            <input
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
          </label>
          <label className="space-y-1 text-xs flex-1 min-w-[180px]">
            <span className="text-[var(--color-muted)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-[var(--color-muted)]">Charter Tier</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as MembershipEntry['tier'])}
              className="min-h-[38px] px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs"
            >
              <option value="patron">Patron</option>
              <option value="lifetime">Lifetime Trustee</option>
              <option value="institutional">Institutional Chapter</option>
              <option value="youth-fellow">Youth Gita Fellow</option>
            </select>
          </label>
          <button
            type="submit"
            className="min-h-[38px] px-4 rounded-lg royal-gold-surface text-xs font-semibold cursor-pointer"
          >
            Enroll Member
          </button>
        </form>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden">
        {paged.items.length === 0 ? (
          <p className="p-8 text-sm text-[var(--color-muted)] text-center">
            No memberships registered yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-bronze)] uppercase tracking-[0.1em]">
                  <th className="p-3.5">Member</th>
                  <th className="p-3.5">Tier</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Enrolled</th>
                  {canWrite && <th className="p-3.5">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paged.items.map((m) => (
                  <tr key={m.id} className="hover:bg-[#D5AF62]/5">
                    <td className="p-3.5">
                      <p className="font-semibold text-[var(--color-ink)]">{m.memberName}</p>
                      <p className="text-[var(--color-muted)]">{m.email}</p>
                    </td>
                    <td className="p-3.5 uppercase">{m.tier}</td>
                    <td className="p-3.5">
                      <AdminStatusBadge status={m.status} />
                    </td>
                    <td className="p-3.5 text-[var(--color-muted)] tabular-nums">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    {canWrite && (
                      <td className="p-3.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void patchMember(m.id, {
                              status: m.status === 'active' ? 'pending' : 'active',
                            })
                          }
                          className="px-2.5 py-1 rounded border border-emerald-700/40 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                        >
                          {m.status === 'active' ? 'Mark Pending' : 'Mark Active'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteMember(m.id, m.memberName)}
                          className="px-2.5 py-1 rounded border border-red-700/40 text-red-700 dark:text-red-300 cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    )}
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
          pageSize={10}
          onPageChange={setPageIdx}
        />
      </div>
    </div>
  );
};
