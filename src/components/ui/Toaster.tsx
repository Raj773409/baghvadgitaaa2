import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastInput {
  tone?: ToastTone;
  title: string;
  body?: string;
  /** ms before auto-dismiss; 0 keeps it until closed. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, 'body'>> {
  id: number;
  body?: string;
}

interface ToastContextValue {
  notify: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue>({ notify: () => undefined });

export const useToast = (): ToastContextValue => useContext(ToastContext);

const TONE_STYLES: Record<ToastTone, { icon: React.ElementType; ring: string; glow: string; iconColor: string }> = {
  success: {
    icon: CheckCircle2,
    ring: 'border-[#D4A537]/70',
    glow: 'shadow-[0_18px_48px_-12px_rgba(0,0,0,0.55),0_0_32px_-6px_rgba(247,215,116,0.55)]',
    iconColor: 'text-[#F7D774]',
  },
  info: {
    icon: Info,
    ring: 'border-[#9DB5D8]/50',
    glow: 'shadow-[0_18px_48px_-12px_rgba(0,0,0,0.55),0_0_28px_-8px_rgba(157,181,216,0.45)]',
    iconColor: 'text-[#9DB5D8]',
  },
  warning: {
    icon: AlertTriangle,
    ring: 'border-amber-400/60',
    glow: 'shadow-[0_18px_48px_-12px_rgba(0,0,0,0.55),0_0_28px_-8px_rgba(251,191,36,0.5)]',
    iconColor: 'text-amber-300',
  },
  error: {
    icon: XCircle,
    ring: 'border-red-400/60',
    glow: 'shadow-[0_18px_48px_-12px_rgba(0,0,0,0.55),0_0_28px_-8px_rgba(248,113,113,0.5)]',
    iconColor: 'text-red-300',
  },
};

const ToastCard: React.FC<{ toast: ToastItem; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startedRef = useRef(Date.now());
  const style = TONE_STYLES[toast.tone];
  const Icon = style.icon;

  const close = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => onClose(toast.id), 260);
  }, [onClose, toast.id]);

  useEffect(() => {
    if (!toast.duration || paused) return;
    startedRef.current = Date.now();
    const id = window.setTimeout(close, remainingRef.current);
    return () => {
      window.clearTimeout(id);
      remainingRef.current -= Date.now() - startedRef.current;
    };
  }, [toast.duration, paused, close]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`toast-card pointer-events-auto relative w-full overflow-hidden rounded-2xl border ${style.ring} ${style.glow} bg-[#0F1829]/95 backdrop-blur-md text-[#FFFDF7] ${
        leaving ? 'toast-leave' : 'toast-enter'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px gold-leaf-line" aria-hidden="true" />
      <div className="flex items-start gap-3 p-4 pr-10">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} aria-hidden="true" />
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold leading-snug">{toast.title}</p>
          {toast.body && <p className="text-xs text-[#E9DCC5]/85 leading-relaxed">{toast.body}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss notification"
        className="absolute top-3 right-3 p-1 rounded-full text-[#E9DCC5]/70 hover:text-[#F7D774] hover:bg-white/5 cursor-pointer"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
      {toast.duration > 0 && (
        <div
          className="toast-timer absolute bottom-0 left-0 h-[2px]"
          style={{
            animationDuration: `${toast.duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
            backgroundImage: 'var(--gold-gradient-metallic)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const notify = useCallback((input: ToastInput) => {
    const item: ToastItem = {
      id: nextId.current++,
      tone: input.tone ?? 'info',
      title: input.title,
      body: input.body,
      duration: input.duration ?? 5500,
    };
    setToasts((prev) => [...prev.slice(-3), item]); // keep at most 4 on screen
  }, []);

  const remove = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed z-[100] top-20 right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-2.5"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
