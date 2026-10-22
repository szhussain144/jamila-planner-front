import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, CalendarPlus, Check, Clock, MapPin, Phone, Video } from 'lucide-react';
import { api } from '../api.js';
import PublicShell from '../components/PublicShell.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import { Alert, Button, Card, Input, Spinner, Textarea, Toggle } from '../components/ui.jsx';

const STEPS = ['Session', 'Time', 'Your details'];
const LOC_ICON = { in_person: MapPin, video: Video, phone: Phone };
const LOC_LABEL = { in_person: 'In person', video: 'Video call', phone: 'Phone call' };
const when = (iso) => DateTime.fromISO(iso).toFormat("cccc d LLLL 'at' h:mm a");

/** Add-to-calendar file for the client's phone. */
function icsUrl(done, practice) {
  const stamp = (iso) => DateTime.fromISO(iso).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const text = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Practice Scheduler//EN', 'BEGIN:VEVENT',
    `UID:${done.token}@practice`, `DTSTART:${stamp(done.start)}`, `DTEND:${stamp(done.end)}`,
    `SUMMARY:Appointment with ${practice.therapistName}`,
    `LOCATION:${done.meetLink || practice.address || ''}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
}

export default function Book() {
  const [params] = useSearchParams();
  const embed = params.get('embed') === '1';
  const [practice, setPractice] = useState(null);
  const [step, setStep] = useState(0);
  const [type, setType] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', consent: false, isMinor: false, guardianName: '', guardianEmail: '', guardianPhone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/api/public/practice').then(setPractice);
  }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      setDone(await api.post('/api/public/book', { ...form, sessionTypeId: type.id, start: slot.start }));
    } catch (err) {
      setError(err.message);
      if (/available/i.test(err.message)) {
        setSlot(null);
        setStep(1);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!practice) return <PublicShell embed={embed}><Spinner /></PublicShell>;

  if (done) {
    const LocIcon = LOC_ICON[type.locationType] || MapPin;
    return (
      <PublicShell practice={practice} embed={embed}>
        <Card className="p-7 text-center sm:p-10">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-green)]/10 text-[var(--color-green)]"><CalendarCheck size={30} /></span>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">{done.status === 'pending' ? 'Request received' : 'Booked'}</p>
          <h1 className="font-display text-[28px] font-medium leading-tight">{done.status === 'pending' ? "We'll confirm shortly" : "You're all set!"}</h1>
          <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-[var(--color-panel-alt)] p-4 text-left text-[13px]">
            <p className="font-semibold">{done.typeName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[var(--color-muted)]"><Clock size={13} /> {when(done.start)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[var(--color-muted)]"><LocIcon size={13} /> {type.locationType === 'video' ? 'A video link will be sent to you' : practice.address || LOC_LABEL[type.locationType]}</p>
          </div>
          <p className="mx-auto mt-4 max-w-sm text-[13px] text-[var(--color-muted)]">We've sent a confirmation, and you'll get reminders before your session.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <a href={icsUrl(done, practice)} download="appointment.ics"><Button variant="ghost"><CalendarPlus size={15} /> Add to my calendar</Button></a>
            <Link to={`/a/${done.token}`}><Button>Manage booking</Button></Link>
          </div>
        </Card>
      </PublicShell>
    );
  }

  const canNext = (step === 0 && type) || (step === 1 && slot);

  return (
    <PublicShell practice={practice} embed={embed}>
      {/* stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                i < step ? 'bg-[var(--color-green)] text-white' : i === step ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-panel-alt)] text-[var(--color-faint)]'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </button>
            <span className={`hidden text-[12.5px] font-medium sm:inline ${i === step ? 'text-[var(--color-ink)]' : 'text-[var(--color-faint)]'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < step ? 'bg-[var(--color-green)]' : 'bg-[var(--color-border)]'}`} />}
          </li>
        ))}
      </ol>

      <Card className="p-5 sm:p-6">
        {step === 0 && (
          <>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Book online</p>
            <h1 className="font-display text-[24px] font-medium leading-tight">What kind of session?</h1>
            <p className="mt-1 mb-5 text-[13.5px] text-[var(--color-muted)]">Choose the session that fits you best. You can add a note for {practice.therapistName} later.</p>
            <div className="space-y-2.5">
              {practice.sessionTypes.map((t) => {
                const Icon = LOC_ICON[t.locationType] || MapPin;
                const on = type?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setType(t); setSlot(null); }}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${on ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/60 shadow-[0_0_0_3px_rgba(116,41,195,0.12)]' : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)]/50'}`}
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${t.color} 14%, white)`, color: t.color }}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold">{t.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-[var(--color-muted)]">
                        <span className="inline-flex items-center gap-1"><Clock size={12} /> {t.durationMin} min</span>
                        <span>{LOC_LABEL[t.locationType]}</span>
                        {t.priceCents > 0 && <span className="font-semibold text-[var(--color-ink)]">{(t.priceCents / 100).toLocaleString()}</span>}
                      </span>
                      {t.description && <span className="mt-1.5 block text-[12.5px] text-[var(--color-ink-2)]">{t.description}</span>}
                    </span>
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)]'}`}>
                      {on && <Check size={12} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && type && (
          <>
            <h1 className="font-display text-[24px] font-medium leading-tight">Pick a time</h1>
            <p className="mt-1 mb-5 text-[13.5px] text-[var(--color-muted)]">{type.name} · {type.durationMin} min</p>
            <SlotPicker sessionTypeId={type.id} maxDaysAhead={practice.maxDaysAhead} practice={practice} selected={slot} onSelect={setSlot} />
          </>
        )}

        {step === 2 && slot && (
          <form id="details" onSubmit={submit} className="space-y-4">
            <div>
              <h1 className="font-display text-[24px] font-medium leading-tight">Your details</h1>
              <p className="mt-1 text-[13.5px] text-[var(--color-muted)]">So we can confirm and remind you.</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-panel-alt)] p-4 text-[13px]">
              <p className="font-semibold">{when(slot.start)}</p>
              <p className="text-[var(--color-muted)]">{type.name} · {type.durationMin} min · {LOC_LABEL[type.locationType]}</p>
            </div>
            <Input label="Full name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              <Input label="Mobile" hint="SMS / WhatsApp reminders" type="tel" autoComplete="tel" placeholder="+92 300 1234567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <Textarea label="Anything you'd like us to know?" hint="optional" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            <div className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
              <Toggle checked={form.isMinor} onChange={(v) => set('isMinor', v)} label="I'm under 18 or booking for a student" description="A parent or guardian will also receive reminders." />
              {form.isMinor && (
                <div className="space-y-3">
                  <Input label="Parent / guardian name" value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} required />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Guardian email" type="email" value={form.guardianEmail} onChange={(e) => set('guardianEmail', e.target.value)} />
                    <Input label="Guardian phone" type="tel" value={form.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] text-[var(--color-ink-2)]">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} required />
              <span>I agree to receive appointment reminders and to the practice's privacy policy. I can change or cancel up to {practice.cancelWindowHours} hours before.</span>
            </label>
          </form>
        )}

        {error && <Alert className="mt-4">{error}</Alert>}
      </Card>

      {/* summary + next step, always in reach on a phone */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} aria-label="Back" className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-ink-2)] hover:border-[var(--color-accent)]">
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="min-w-0 flex-1 text-[12.5px]">
            {type ? (
              <>
                <p className="truncate font-semibold">{type.name}</p>
                <p className="truncate text-[var(--color-muted)]">{slot ? when(slot.start) : `${type.durationMin} min · choose a time`}</p>
              </>
            ) : (
              <p className="text-[var(--color-muted)]">Choose a session to begin</p>
            )}
          </div>
          {step < 2 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button type="submit" form="details" disabled={busy}>{busy ? 'Booking…' : 'Confirm booking'}</Button>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
