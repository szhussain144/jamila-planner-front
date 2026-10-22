import { MapPin, ShieldCheck } from 'lucide-react';
import { Mark } from './ui.jsx';

/** Navy-headed, phone-first frame for the client-facing pages. */
export default function PublicShell({ practice, embed = false, children }) {
  return (
    <div className={`${embed ? '' : 'min-h-screen'} bg-[var(--color-bg)]`}>
      {!embed && (
        <header className="bg-[var(--color-navy)] text-[var(--color-navy-ink)]">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--color-navy-accent)]"><Mark size={24} /></span>
              <div className="min-w-0">
                <p className="truncate font-display text-[18px] font-medium">{practice?.name || ' '}</p>
                <p className="truncate text-[12px] text-[var(--color-navy-ink-2)]">
                  {practice?.therapistName}
                  {practice?.address && <span className="inline-flex items-center gap-1"> · <MapPin size={11} /> {practice.address}</span>}
                </p>
              </div>
            </div>
          </div>
        </header>
      )}
      <main className="wash">
        <div className="relative mx-auto max-w-2xl px-4 pt-6 pb-4">{children}</div>
      </main>
      {!embed && (
        <footer className="mx-auto max-w-2xl px-4 pb-8 text-center text-[11.5px] text-[var(--color-faint)]">
          <p className="flex items-center justify-center gap-1.5"><ShieldCheck size={12} /> Your details are private and only shared with your therapist.</p>
          <p className="mt-1.5">If you are in crisis or in danger, contact your local emergency number now. This booking page is not monitored for emergencies.</p>
        </footer>
      )}
    </div>
  );
}
