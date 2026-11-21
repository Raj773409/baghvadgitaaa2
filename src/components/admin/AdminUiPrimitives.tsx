import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Monitor,
  Smartphone,
  X,
} from 'lucide-react';
import type {
  AdminLocaleCode,
  PageInventoryRecord,
  PageSnapshotPayload,
} from '../../utils/cmsSync';
import { resolveLocalizedText } from '../../utils/cmsSync';

export interface AdminToastMessage {
  id: string;
  kind: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

export const AdminToastStack: React.FC<{
  toasts: AdminToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          data-testid={`admin-toast-${toast.kind}`}
          className={`pointer-events-auto rounded-xl border p-3.5 shadow-[0_14px_32px_rgba(23,35,58,0.18)] flex items-start justify-between gap-3 text-xs ${
            toast.kind === 'error'
              ? 'bg-[#FFF5F5] dark:bg-[#2B1416] border-red-400/60 text-red-900 dark:text-red-100'
              : toast.kind === 'success'
                ? 'bg-[var(--surface-elevated)] border-[#9C6B1E]/60 text-[var(--color-ink)]'
                : 'bg-[var(--surface-elevated)] border-[var(--color-border)] text-[var(--color-ink)]'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {toast.kind === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[var(--color-bronze)] shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 space-y-0.5">
              <p className="font-semibold">{toast.title}</p>
              {toast.detail && (
                <p className="text-[11px] text-[var(--color-muted)] leading-snug">
                  {toast.detail}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
            className="p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const AdminConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description: string;
  targetSummary?: string;
  confirmLabel: string;
  tone?: 'danger' | 'publish' | 'primary';
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({
  open,
  title,
  description,
  targetSummary,
  confirmLabel,
  tone = 'primary',
  busy = false,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0D1422]/70 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        data-testid="admin-confirm-modal"
        className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] text-[var(--color-ink)] p-6 space-y-4 shadow-[0_24px_60px_rgba(11,17,28,0.45)]"
      >
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)]">
            Secretariat Confirmation
          </p>
          <h2 id="admin-confirm-title" className="font-editorial text-2xl font-normal">
            {title}
          </h2>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>

        {targetSummary && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-xs font-medium break-words">
            {targetSummary}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={busy}
            data-testid="admin-confirm-cancel"
            onClick={onCancel}
            className="min-h-[38px] px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-bronze)] cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            data-testid="admin-confirm-submit"
            onClick={onConfirm}
            className={`min-h-[38px] px-5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 ${
              tone === 'danger'
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'royal-gold-surface'
            }`}
          >
            {busy ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminStatusBadge: React.FC<{
  status: string;
}> = ({ status }) => {
  const norm = status.toLowerCase();
  let toneClasses =
    'border-[var(--color-border)] text-[var(--color-muted)] bg-[var(--color-canvas)]';
  if (
    norm === 'published' ||
    norm === 'verified' ||
    norm === 'approved' ||
    norm === 'captured' ||
    norm === 'paid' ||
    norm === 'active' ||
    norm === 'cms-synced'
  ) {
    toneClasses =
      'border-emerald-700/35 text-emerald-800 dark:text-emerald-300 bg-emerald-500/10';
  } else if (norm === 'flagged' || norm === 'failed' || norm === 'declined' || norm === 'suspended') {
    toneClasses = 'border-red-700/35 text-red-800 dark:text-red-300 bg-red-500/10';
  } else if (
    norm === 'draft' ||
    norm === 'pending' ||
    norm === 'pending-review' ||
    norm === 'unpublished-draft'
  ) {
    toneClasses =
      'border-[#9C6B1E]/50 text-[#865D21] dark:text-[#F7D774] bg-[#D4A537]/15';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-[0.06em] whitespace-nowrap ${toneClasses}`}
    >
      {status}
    </span>
  );
};

export const AdminPaginationBar: React.FC<{
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
}> = ({ page, totalPages, totalItems, pageSize, onPageChange }) => {
  if (totalItems === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)]">
      <span className="tabular-nums">
        Showing <strong className="text-[var(--color-ink)]">{start}</strong>–
        <strong className="text-[var(--color-ink)]">{end}</strong> of{' '}
        <strong className="text-[var(--color-ink)]">{totalItems}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-bronze)] disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>
        <span className="px-2 tabular-nums font-mono text-[11px]">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-bronze)] disabled:opacity-40 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const AdminPreviewModal: React.FC<{
  open: boolean;
  page: PageInventoryRecord | null;
  snapshot: PageSnapshotPayload | null;
  modeLabel: 'Draft Staging Preview' | 'Live Published Snapshot';
  locale: AdminLocaleCode;
  onClose: () => void;
}> = ({ open, page, snapshot, modeLabel, locale, onClose }) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !page || !snapshot) return null;

  const visibleBlocks = [...snapshot.blocks]
    .filter((b) => b.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0D1422]/75 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${page.name}`}
        data-testid="admin-preview-modal"
        className="w-full max-w-5xl max-h-[90vh] rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] text-[var(--color-ink)] flex flex-col overflow-hidden shadow-[0_24px_60px_rgba(11,17,28,0.5)]"
      >
        <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-mono text-[var(--color-bronze)]">
              {modeLabel} · {page.route}
            </p>
            <h3 className="font-editorial text-xl truncate">{page.name}</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-canvas)]">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs cursor-pointer ${
                  viewport === 'desktop'
                    ? 'bg-[#17233A] text-[#F7D774] dark:bg-[#D4A537] dark:text-[#171717] font-semibold'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs cursor-pointer ${
                  viewport === 'mobile'
                    ? 'bg-[#17233A] text-[#F7D774] dark:bg-[#D4A537] dark:text-[#171717] font-semibold'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (390px)</span>
              </button>
            </div>

            <a
              href={page.route}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 min-h-[34px] px-3 rounded-lg border border-[var(--color-border)] text-xs hover:border-[var(--color-bronze)]"
            >
              <span>Open Route</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-bronze)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--color-canvas)] p-4 sm:p-6">
          <div
            className={`mx-auto rounded-xl border border-[var(--color-border)] bg-[var(--surface-elevated)] overflow-hidden transition-all ${
              viewport === 'mobile' ? 'max-w-[390px]' : 'max-w-4xl'
            }`}
          >
            <div className="bg-[#17233A] text-[#FFFDF8] p-6 sm:p-8 border-b border-[#D4A537]/30 space-y-2">
              <p className="text-[11px] font-mono text-[#F7D774] uppercase tracking-[0.14em]">
                {snapshot.seo.metaTitle || page.route}
              </p>
              <h4 className="font-editorial text-2xl sm:text-3xl font-normal">
                {resolveLocalizedText(snapshot.title, locale, page.name)}
              </h4>
              <p className="text-xs sm:text-sm text-[#EAE3D6]">
                {resolveLocalizedText(snapshot.subtitle, locale, '')}
              </p>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {visibleBlocks.map((block) => (
                <div key={block.id} className="p-5 sm:p-6 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--color-muted)]">
                    <span>
                      {block.order}. {block.label}
                    </span>
                    <span>{block.type}</span>
                  </div>
                  {block.heading && resolveLocalizedText(block.heading, locale, '') && (
                    <h5 className="font-editorial text-xl text-[var(--color-ink)]">
                      {resolveLocalizedText(block.heading, locale, '')}
                    </h5>
                  )}
                  {block.subheading && resolveLocalizedText(block.subheading, locale, '') && (
                    <p className="text-xs font-medium text-[var(--color-bronze)]">
                      {resolveLocalizedText(block.subheading, locale, '')}
                    </p>
                  )}
                  {block.body && resolveLocalizedText(block.body, locale, '') && (
                    <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
                      {resolveLocalizedText(block.body, locale, '')}
                    </p>
                  )}
                  {block.mediaUrl && (
                    <img
                      src={block.mediaUrl}
                      alt={block.mediaAlt || block.label}
                      className="mt-2 max-h-48 w-full object-cover rounded-lg border border-[var(--color-border)]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
