import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Practice mark: a soft open loop (calm, continuous care). */
export function Mark({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" className={className} aria-hidden="true">
      <path d="M14 30c0-8 6-14 14-14 5 0 8 3 8 7 0 6-6 9-11 9-4 0-6-2-6-5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`card-in rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-faint)]">{eyebrow}</p>}
        <h2 className="font-display text-[17px] font-medium tracking-tight text-[var(--color-ink)]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const btn = {
  primary:
    'btn-primary bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-semibold shadow-[0_1px_2px_rgba(32,34,53,0.12)] hover:bg-[var(--color-accent-dark)] hover:-translate-y-px hover:shadow-[0_10px_24px_-8px_rgba(116,41,195,0.55)]',
  ghost:
    'bg-[var(--color-panel)] text-[var(--color-ink-2)] font-medium border border-[var(--color-border)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)]/50',
  subtle: 'bg-[var(--color-panel-alt)] text-[var(--color-ink)] font-medium hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent-dark)]',
  danger: 'bg-[var(--color-panel)] text-[var(--color-red)] font-medium border border-[var(--color-red)]/25 hover:bg-[var(--color-red)]/8',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, type = 'button', ...props }) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : size === 'lg' ? 'px-5 py-3 text-[14px]' : 'px-4 py-2 text-[13px]';
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${sz} ${btn[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`rounded-lg p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel-alt)] hover:text-[var(--color-ink)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const tone = {
  green: 'text-[var(--color-green)] bg-[var(--color-green)]/10',
  blue: 'text-[var(--color-blue)] bg-[var(--color-blue)]/10',
  orange: 'text-[var(--color-orange)] bg-[var(--color-orange)]/10',
  accent: 'text-[var(--color-accent)] bg-[var(--color-accent)]/10',
  red: 'text-[var(--color-red)] bg-[var(--color-red)]/10',
  neutral: 'text-[var(--color-muted)] bg-[var(--color-panel-alt)]',
};

const STATUS_TONE = {
  confirmed: 'green', completed: 'blue', pending: 'accent', cancelled: 'red', no_show: 'orange',
  sent: 'green', received: 'blue', simulated: 'neutral', failed: 'red', scheduled: 'accent',
};

export function Badge({ children, tone: t, status, className = '' }) {
  const cls = tone[t || STATUS_TONE[status] || 'neutral'];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls} ${className}`}>{children}</span>;
}

const avatarHues = ['#7429C3', '#2F7D6B', '#47769D', '#B0407A'];
export const initialsOf = (name) =>
  String(name || '?').split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export function Avatar({ name, size = 36 }) {
  const initials = initialsOf(name);
  const hue = avatarHues[[...initials].reduce((n, c) => n + c.charCodeAt(0), 0) % avatarHues.length];
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36, background: hue }}>
      {initials}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, accent = false }) {
  return (
    <Card className={`relative overflow-hidden p-4 transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 sm:p-5 ${accent ? 'banner border-none' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[12.5px] font-medium ${accent ? 'text-white/80' : 'text-[var(--color-muted)]'}`}>{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-white/15 text-white' : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className={`mt-2 text-[26px] font-semibold leading-tight tracking-tight ${accent ? 'text-white' : 'text-[var(--color-ink)]'}`}>{value}</p>
      {sub && <p className={`mt-1 text-[12px] ${accent ? 'text-white/80' : 'text-[var(--color-faint)]'}`}>{sub}</p>}
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel-alt)]/40 px-6 py-8 text-center">
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Icon size={18} />
        </span>
      )}
      <p className="text-[14px] font-semibold text-[var(--color-ink)]">{title}</p>
      {children && <p className="mt-1 max-w-xs text-[12.5px] text-[var(--color-muted)]">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Pill tabs with a sliding highlight. options: [{ key, label, icon }] */
export function Segmented({ options, value, onChange, className = '' }) {
  const wrap = useRef(null);
  const [pill, setPill] = useState(null);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector('[aria-selected="true"]');
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && wrap.current) ro.observe(wrap.current);
    const raf = requestAnimationFrame(() => setReady(true));
    return () => {
      ro?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, options.length]);

  return (
    <div className={`max-w-full overflow-x-auto scrollbar-none ${className}`}>
      <div ref={wrap} role="tablist" className="relative inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] p-1 shadow-[var(--shadow-card)]">
        {pill && (
          <span
            aria-hidden="true"
            className={`absolute top-1 bottom-1 rounded-full bg-[var(--color-accent)] shadow-[0_6px_16px_-8px_rgba(116,41,195,0.7)] ${ready ? 'transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
            style={{ left: pill.left, width: pill.width }}
          />
        )}
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={value === o.key}
            onClick={() => onChange(o.key)}
            className={`relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
              value === o.key ? `text-white ${pill ? '' : 'bg-[var(--color-accent)]'}` : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {o.icon && <o.icon size={14} />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const field =
  'w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-panel)] px-3.5 py-2.5 text-[13px] text-[var(--color-ink)] outline-none transition-shadow placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(116,41,195,0.14)]';

function Label({ label, hint }) {
  if (!label) return null;
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px] font-medium text-[var(--color-ink-2)]">
      {label}
      {hint && <span className="font-normal text-[var(--color-faint)]">{hint}</span>}
    </span>
  );
}

export function Input({ label, hint, className = '', wrapClass = '', ...props }) {
  return (
    <label className={`block ${wrapClass}`}>
      <Label label={label} hint={hint} />
      <input className={`${field} ${className}`} {...props} />
    </label>
  );
}

export function Textarea({ label, hint, className = '', wrapClass = '', ...props }) {
  return (
    <label className={`block ${wrapClass}`}>
      <Label label={label} hint={hint} />
      <textarea className={`${field} ${className}`} {...props} />
    </label>
  );
}

export function Select({ label, hint, className = '', wrapClass = '', children, ...props }) {
  return (
    <label className={`block ${wrapClass}`}>
      <Label label={label} hint={hint} />
      <select className={`${field} cursor-pointer ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}

/** Switch-style checkbox */
export function Toggle({ checked, onChange, label, description, className = '' }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 ${className}`}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-5 w-9 rounded-full bg-[var(--color-border)] transition-colors peer-checked:bg-[var(--color-accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-accent)]/40" />
        <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-[var(--color-ink)]">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] text-[var(--color-muted)]">{description}</span>}
      </span>
    </label>
  );
}

/** Pill-style multi-choice chips */
export function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.key);
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.key) : [...value, o.key])}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              on ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-dark)]' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            {o.icon && <o.icon size={13} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function useEscape(onClose) {
  const ref = useRef(onClose);
  useEffect(() => {
    ref.current = onClose;
  });
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && ref.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);
}

/** Centered dialog; bottom sheet on phones. */
export function Modal({ title, subtitle, onClose, children, footer, width = 'max-w-xl' }) {
  useEscape(onClose);
  return createPortal(
    <div className="drawer-fade fixed inset-0 z-[70] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`pop-in flex max-h-[94vh] w-full ${width} flex-col overflow-hidden rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl sm:rounded-3xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-soft)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-[18px] font-medium tracking-tight">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">{subtitle}</div>}
          </div>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-[var(--color-border-soft)] px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Right-side panel that slides in. */
export function Drawer({ title, subtitle, onClose, children, footer }) {
  useEscape(onClose);
  return createPortal(
    <div className="drawer-fade fixed inset-0 z-[70] flex justify-end bg-black/35 backdrop-blur-[2px]" onMouseDown={onClose}>
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="drawer-slide flex h-full w-full max-w-md flex-col border-l border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-soft)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-[18px] font-medium tracking-tight">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">{subtitle}</div>}
          </div>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-[var(--color-border-soft)] px-5 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body
  );
}

export function Alert({ tone: t = 'red', children, className = '' }) {
  return <div role="alert" className={`rounded-xl px-3.5 py-2.5 text-[13px] ${tone[t]} ${className}`}>{children}</div>;
}

export function Spinner({ label = 'Loadingâ€¦' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[var(--color-muted)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)]/25 border-t-[var(--color-accent)]" />
      {label}
    </div>
  );
}
