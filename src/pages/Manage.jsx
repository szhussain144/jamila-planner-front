import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ban, CalendarClock, CalendarX, CheckCheck, Clock, MapPin, Video } from 'lucide-react';
import { api } from '../api.js';
import PublicShell from '../components/PublicShell.jsx';
import SlotPicker from '../components/SlotPicker.jsx';
import { Alert, Badge, Button, Card, EmptyState, Spinner } from '../components/ui.jsx';
import { STATUS_LABEL } from '../format.js';

export default function Manage() {
  const { token } = useParams();
  const [b, setB] = useState(null);
  const [practice, setPractice] = useState(null);
  const [mode, setMode] = useState(null); // reschedule | cancel
  const [slot, setSlot] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/api/public/manage/${token}`).then(setB).catch(() => setNotFound(true));
    api.get('/api/public/practice').then(setPractice);
  }, [token]);

  const act = async (action, body) => {
    setError('');
    try {
      setB(await api.post(`/api/public/manage/${token}/${action}`, body));
      setMode(null);
      setSlot(null);
      setMsg({ confirm: "Thanks for confirming. See you then!", cancel: 'Your appointment has been cancelled.', reschedule: 'Done. Your appointment has been moved.' }[action]);
    } catch (e) {
      setError(e.message);
    }
  };

  if (notFound)
    return (
      <PublicShell practice={practice}>
        <Card className="p-6"><EmptyState icon={CalendarX} title="Booking not found">This link may be out of date. Please contact the practice.</EmptyState></Card>
      </PublicShell>
    );
  if (!b || !practice) return <PublicShell practice={practice}><Spinner /></PublicShell>;

  const start = DateTime.fromISO(b.start);
  const active = ['pending', 'confirmed'].includes(b.status);

  return (
    <PublicShell practice={practice}>
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="banner relative p-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="relative flex items-center gap-4">
              <div className="flex h-[64px] w-[64px] shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 leading-none backdrop-blur">
                <span className="text-[11px] font-semibold uppercase text-white/80">{start.toFormat('LLL')}</span>
                <span className="mt-1 text-[24px] font-semibold">{start.toFormat('d')}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-white/80">Your appointment</p>
                <p className="font-display text-[20px] font-medium leading-tight">{b.typeName}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/85"><Clock size={13} /> {start.toFormat("cccc 'at' h:mm a")}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={b.status}>{STATUS_LABEL[b.status]}</Badge>
              {b.clientConfirmed && active && <Badge tone="blue"><CheckCheck size={11} /> You confirmed</Badge>}
              <span className="text-[12.5px] text-[var(--color-muted)]">with {practice.therapistName}</span>
            </div>
            {b.meetLink && active && (
              <a href={b.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-[var(--color-accent-soft)] px-4 py-3 text-[13px] font-semibold text-[var(--color-accent-dark)]">
                <Video size={16} /> Join your video session
              </a>
            )}
            {(b.location || practice.address) && active && !b.meetLink && (
              <p className="flex items-center gap-2 text-[13px] text-[var(--color-muted)]"><MapPin size={14} /> {b.location || practice.address}</p>
            )}
            {msg && <Alert tone="green">{msg}</Alert>}
            {error && <Alert>{error}</Alert>}

            {active && !mode && (
              <div className="flex flex-wrap gap-2 pt-1">
                {!b.clientConfirmed && <Button onClick={() => act('confirm')}><CheckCheck size={15} /> I'll be there</Button>}
                <Button variant="ghost" disabled={!b.canChange} onClick={() => setMode('reschedule')}><CalendarClock size={15} /> Reschedule</Button>
                <Button variant="danger" disabled={!b.canChange} onClick={() => setMode('cancel')}><Ban size={15} /> Cancel</Button>
              </div>
            )}
            {active && !b.canChange && (
              <p className="text-[12px] text-[var(--color-faint)]">Online changes close {practice.cancelWindowHours} hours before the session. Please contact the practice directly.</p>
            )}
            {b.status === 'cancelled' && <Link to="/book"><Button>Book a new appointment</Button></Link>}
          </div>
        </Card>

        {mode === 'reschedule' && (
          <Card className="pop-in p-5 sm:p-6">
            <h2 className="mb-4 font-display text-[20px] font-medium">Choose a new time</h2>
            <SlotPicker sessionTypeId={b.sessionTypeId} excludeToken={token} maxDaysAhead={practice.maxDaysAhead} practice={practice} selected={slot} onSelect={setSlot} />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode(null)}>Back</Button>
              <Button disabled={!slot} onClick={() => act('reschedule', { start: slot.start })}>
                {slot ? `Move to ${DateTime.fromISO(slot.start).toFormat('ccc d LLL, h:mm a')}` : 'Pick a time'}
              </Button>
            </div>
          </Card>
        )}
        {mode === 'cancel' && (
          <Card className="pop-in p-5 sm:p-6">
            <h2 className="font-display text-[20px] font-medium">Cancel this appointment?</h2>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">The time will be released for someone else. You can book again any time.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode(null)}>Keep it</Button>
              <Button variant="danger" onClick={() => act('cancel', { reason: 'Cancelled by client online' })}>Yes, cancel</Button>
            </div>
          </Card>
        )}
      </div>
    </PublicShell>
  );
}
