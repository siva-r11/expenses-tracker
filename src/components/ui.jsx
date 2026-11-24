import { forwardRef, useEffect, useRef } from 'react';

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const buttonStyles = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
};

export function buttonClass(variant = 'primary', className = '') {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    buttonStyles[variant],
    className,
  );
}

export const Button = forwardRef(function Button({ type = 'button', variant = 'primary', className = '', children, ...props }, ref) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, className)} {...props}>
      {children}
    </button>
  );
});

export const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-teal-600 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100';

export function Field({ id, label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Card({ className = '', children }) {
  return (
    <section className={cx(
      'rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-card backdrop-blur-sm transition duration-300 dark:border-slate-800 dark:bg-slate-900/95',
      className,
    )}
    >
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }) {
  useEffect(() => {
    document.title = `${title} · Expense Tracker`;
  }, [title]);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function Sparkline({ values = [], tone = 'default' }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 72;
  const height = 28;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const stroke = tone === 'bad' ? '#e11d48' : tone === 'good' ? '#0f766e' : '#64748b';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-7 w-[72px]" aria-hidden="true">
      <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export function StatCard({ label, value, detail, tone = 'default', icon, delta, spark }) {
  const tones = {
    default: {
      value: 'text-slate-900 dark:text-white',
      bar: 'bg-slate-400',
      icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    good: {
      value: 'text-teal-800 dark:text-teal-200',
      bar: 'bg-teal-600',
      icon: 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200',
    },
    bad: {
      value: 'text-rose-800 dark:text-rose-200',
      bar: 'bg-rose-500',
      icon: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
    },
  };
  const style = tones[tone] || tones.default;
  const deltaTone = delta == null
    ? ''
    : delta > 0
      ? (tone === 'bad' ? 'text-rose-700 dark:text-rose-300' : 'text-teal-700 dark:text-teal-300')
      : delta < 0
        ? (tone === 'bad' ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300')
        : 'text-slate-500 dark:text-slate-400';

  return (
    <Card className="relative overflow-hidden">
      <div className={cx('absolute inset-y-0 left-0 w-1', style.bar)} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className={cx('mt-2 text-2xl font-semibold tabular-nums', style.value)}>{value}</p>
          {detail && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>}
          {delta != null && Number.isFinite(delta) && (
            <p className={cx('mt-1 text-xs font-medium tabular-nums', deltaTone)}>
              {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'}
              {' '}
              {Math.abs(delta).toFixed(1)}% vs last month
            </p>
          )}
          {spark?.length > 1 && <Sparkline values={spark} tone={tone} />}
        </div>
        {icon && (
          <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', style.icon)} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    good: 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100',
    bad: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-100',
    warn: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    info: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
  };
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function CategoryDot({ color, className = '' }) {
  return (
    <span
      className={cx('inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900', className)}
      style={{ backgroundColor: color || '#64748b' }}
      aria-hidden="true"
    />
  );
}

export function ProgressBar({ value, max, label, tone, remainingLabel }) {
  const ratio = max > 0 ? value / max : 0;
  const width = Math.max(0, Math.min(ratio, 1)) * 100;
  const autoTone = ratio > 1 ? 'bg-rose-500' : ratio >= 0.8 ? 'bg-amber-500' : 'bg-teal-600';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums">
          {max > 0 ? `${Math.round(ratio * 100)}%` : 'No budget'}
          {remainingLabel ? ` · ${remainingLabel}` : ''}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
        aria-label={label}
      >
        <div
          className={cx('h-full rounded-full transition-[width] duration-500 ease-out', tone || autoTone)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

const emptyIcons = {
  default: (
    <>
      <path d="M4 7.5h16M6 7.5V18a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7.5" strokeLinecap="round" />
      <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" strokeLinecap="round" />
    </>
  ),
  transactions: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  bills: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  goals: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  budget: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M7 16l4-5 3 3 5-7" />
    </>
  ),
};

export function EmptyState({ title, message, action, compact = false, icon = 'default' }) {
  return (
    <div className={cx('flex flex-col items-center text-center', compact ? 'px-2 py-6' : 'px-4 py-10')}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {emptyIcons[icon] || emptyIcons.default}
        </svg>
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div
      className={cx(
        'rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer dark:from-slate-800 dark:via-slate-700 dark:to-slate-800',
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-up" aria-busy="true" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((key) => <Skeleton key={key} className="h-32" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 lg:col-span-3" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose, wide = false }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = panelRef.current?.querySelector('input, select, textarea')
      || panelRef.current?.querySelector('button');
    focusable?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/50 transition-opacity duration-200" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cx(
          'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-fade-up dark:border-slate-700 dark:bg-slate-900',
          wide ? 'max-w-2xl' : 'max-w-lg',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="dialog-title" className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, hideCancel = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onCancelRef.current();
    };
    window.addEventListener('keydown', onKey);
    (hideCancel ? confirmRef : cancelRef).current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [hideCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/50 transition-opacity duration-200" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-fade-up dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          {!hideCancel && (
            <Button ref={cancelRef} variant="secondary" onClick={onCancel}>Cancel</Button>
          )}
          <Button ref={confirmRef} variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            'pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card animate-toast-in',
            toast.tone === 'bad'
              ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100'
              : toast.tone === 'warn'
                ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100'
                : 'border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100',
          )}
        >
          <p className="flex-1">{toast.message}</p>
          <button
            type="button"
            className="rounded-md px-1.5 py-0.5 text-current/70 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function Chip({ active, children, onClick, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition',
        active
          ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-500 dark:bg-teal-600'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function InsightBanner({ tone = 'good', title, message, action }) {
  const tones = {
    good: 'border-teal-200 bg-teal-50/90 text-teal-950 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-50',
    bad: 'border-rose-200 bg-rose-50/90 text-rose-950 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-50',
    warn: 'border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-50',
    info: 'border-sky-200 bg-sky-50/90 text-sky-950 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-50',
  };
  return (
    <div className={cx('mb-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between', tones[tone])}>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="mt-0.5 text-sm opacity-90">{message}</p>}
      </div>
      {action}
    </div>
  );
}
