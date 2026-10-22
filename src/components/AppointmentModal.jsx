import { useEffect, useState } from 'react';
import {
  Ban,
  BellRing,
  CalendarSync,
  CheckCheck,
  CircleCheck,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  Send,
  UserPlus,
  UserRoundX,
  Video,
} from 'lucide-react';
import { api } from '../api.js';
import { useApp } from '../App.jsx';
import { fmt, LOCATION_LABEL, STATUS_LABEL } from '../format.js';
import { Alert, Avatar, Badge, Button, Input, Modal, Select, Textarea } from './ui.jsx';

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function nextHalfHour() {
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d.toISOString();
}

const CH_ICON = { email: Mail, sms: MessageSquare, whatsapp: MessageCircle, inapp: BellRing };
const KIND_LABEL = { confirmation: 'Booking confirmation', reminder: 'Reminder', followup: 'Follow-up', cancellation: 'Cancellation notice', reschedule: 'Reschedule notice', headsup: 'Heads-up for you' };

export default function AppointmentModal({ id, start, end, onClose, onSaved }) {
  const { toast, settings } = useApp();
  const tz = settings?.practice?.timezone;
  const [types, setTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [appt, setAppt] = useState(null);
  const [form, setForm] = useState({
    clientId: '',
    newClient: { name: '', email: '', phone: '' },
    sessionTypeId: '',
    start: toLocalInput(start || nextHalfHour()),
    durationMin: start && end ? Math.round((new Date(end) - new Date(start)) / 60000) : '',
    notes: '',
    location: '',
    status: 'confirmed',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNew = (k, v) => setForm((f) => ({ ...f, newClient: { ...f.newClient, [k]: v } }));

  useEffect(() => {
    api.get('/api/session-types').then((t) => {
      const active = t.filter((x) => x.active);
      setTypes(active);
      if (!id) setForm((f) => ({ ...f, sessionTypeId: f.sessionTypeId || active[0]?.id || '', durationMin: f.durationMin || active[0]?.durationMin || 50 }));
    });
    api.get('/api/clients').then(setClients);
    if (id)
      api.get(`/api/appointments/${id}`).then((a) => {
        setAppt(a);
        setForm((f) => ({
          ...f,
          clientId: a.clientId || '',
          sessionTypeId: a.sessionTypeId || '',
          start: toLocalInput(a.start),
          durationMin: Math.round((new Date(a.end) - new Date(a.start)) / 60000),
          notes: a.notes || '',
          location: a.location || '',
          status: a.status,
        }));
      });
  }, [id]);

  const onType = (val) => {
    const t = types.find((x) => String(x.id) === String(val));
    setForm((f) => ({ ...f, sessionTypeId: val, durationMin: t ? t.durationMin : f.durationMin }));
  };

  const save = async (extra = {}, force = false) => {
    setBusy(true);
    setError('');
    const startDate = new Date(form.start);
    const body = {
      sessionTypeId: form.sessionTypeId ? Number(form.sessionTypeId) : null,
      start: startDate.toISOString(),
      end: new Date(startDate.getTime() + Number(form.durationMin || 50) * 60000).toISOString(),
      notes: form.notes,
      location: form.location,
      status: form.status,
      force,
      ...extra,
    };
    try {
      if (id) await api.patch(`/api/appointments/${id}`, { ...body, clientId: form.clientId ? Number(form.clientId) : null });
      else if (form.clientId === 'new') await api.post('/api/appointments', { ...body, client: form.newClient });
      else await api.post('/api/appointments', { ...body, clientId: form.clientId ? Number(form.clientId) : null });
      toast(id ? 'Session updated' : 'Session booked', 'Reminders scheduled and calendars synced.');
      onSaved();
    } catch (err) {
      if (/available|overlap/i.test(err.message) && !force && window.confirm(`${err.message}. Book anyway (double-book)?`)) {
        setBusy(false);
        return save(extra, true);
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this session? The client will be notified.')) return;
    save({ status, ...(status === 'cancelled' ? { cancelReason: 'Cancelled by therapist' } : {}) });
  };

  const selectedClient = clients.find((c) => String(c.id) === String(form.clientId));
  const title = id ? appt?.clientName || appt?.title || 'Session' : 'New session';

  const subtitle = appt ? (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <Badge status={appt.status}>{STATUS_LABEL[appt.status]}</Badge>
      {appt.clientConfirmedAt && <Badge tone="blue"><CheckCheck size={11} /> Client confirmed</Badge>}
      {appt.source === 'website' && <Badge tone="neutral"><Globe size={11} /> Booked online</Badge>}
      <Badge tone={appt.googleEventId ? 'green' : 'neutral'}><CalendarSync size={11} /> {appt.googleEventId ? 'In Google Calendar' : 'Not in Google yet'}</Badge>
    </div>
  ) : (
    'Reminders go out automatically on the schedule in Settings.'
  );

  const footer = (
    <div className="flex flex-col gap-3">
      {appt && appt.status !== 'cancelled' && (
        <div className="flex flex-wrap gap-2">
          {appt.status === 'pending' && <Button variant="subtle" size="sm" onClick={() => setStatus('confirmed')}><CircleCheck size={14} /> Approve</Button>}
          <Button variant="subtle" size="sm" onClick={() => setStatus('completed')}><CheckCheck size={14} /> Completed</Button>
          <Button variant="subtle" size="sm" onClick={() => setStatus('no_show')}><UserRoundX size={14} /> No-show</Button>
          <Button variant="subtle" size="sm" onClick={() => api.post(`/api/appointments/${id}/resend`).then(() => toast('Confirmation re-sent'))}><Send size={14} /> Resend confirmation</Button>
          <Button variant="danger" size="sm" onClick={() => setStatus('cancelled')}><Ban size={14} /> Cancel session</Button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        {appt?.status === 'cancelled' ? <Button variant="subtle" size="sm" onClick={() => setStatus('confirmed')}><RotateCcw size={14} /> Restore</Button> : <span />}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button disabled={busy} onClick={() => save()}>{busy ? 'Saving…' : id ? 'Save changes' : 'Book session'}</Button>
        </div>
      </div>
    </div>
  );

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose} footer={footer} width="max-w-2xl">
      <div className="space-y-5">
        {appt?.meetLink && appt.status !== 'cancelled' && (
          <a href={appt.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-[13px] font-semibold text-[var(--color-accent-dark)] hover:bg-[var(--color-accent)]/15">
            <Video size={16} /> Join video session <span className="ml-auto truncate font-normal opacity-75">{appt.meetLink}</span>
          </a>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select label="Client" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">No client (personal block)</option>
              {!id && <option value="new">+ Add a new client…</option>}
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
            </Select>
            {selectedClient && (
              <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-[var(--color-panel-alt)]/70 px-3 py-2 text-[12px] text-[var(--color-muted)]">
                <Avatar name={selectedClient.name} size={26} />
                <span className="truncate">{[selectedClient.email, selectedClient.phone].filter(Boolean).join(' · ') || 'No contact details'}</span>
                {selectedClient.isMinor && <Badge tone="orange">Minor</Badge>}
              </div>
            )}
          </div>

          {form.clientId === 'new' && (
            <div className="grid gap-3 rounded-2xl border border-dashed border-[var(--color-accent)]/35 bg-[var(--color-accent-soft)]/40 p-4 sm:col-span-2 sm:grid-cols-2">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-accent-dark)] sm:col-span-2"><UserPlus size={14} /> New client</p>
              <Input wrapClass="sm:col-span-2" label="Full name" value={form.newClient.name} onChange={(e) => setNew('name', e.target.value)} />
              <Input label="Email" type="email" value={form.newClient.email} onChange={(e) => setNew('email', e.target.value)} />
              <Input label="Phone" placeholder="+92 300 1234567" value={form.newClient.phone} onChange={(e) => setNew('phone', e.target.value)} />
            </div>
          )}

          <Select wrapClass="sm:col-span-2" label="Session type" value={form.sessionTypeId} onChange={(e) => onType(e.target.value)}>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.durationMin} min · {LOCATION_LABEL[t.locationType]}</option>)}
          </Select>
          <Input label="Starts" type="datetime-local" value={form.start} onChange={(e) => set('start', e.target.value)} />
          <Input label="Duration" hint="minutes" type="number" min="5" step="5" value={form.durationMin} onChange={(e) => set('durationMin', e.target.value)} />
          <Input wrapClass="sm:col-span-2" label="Room / location" placeholder="Optional" value={form.location} onChange={(e) => set('location', e.target.value)} />
          <Textarea wrapClass="sm:col-span-2" label="Private notes" hint="Only visible to you" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {appt?.reminders?.length > 0 && (
          <div>
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-faint)]">Reminder schedule</p>
            <ul className="divide-y divide-[var(--color-border-soft)] rounded-xl border border-[var(--color-border)]">
              {appt.reminders.map((r) => {
                const Icon = CH_ICON[r.channel] || BellRing;
                return (
                  <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-panel-alt)] text-[var(--color-ink-2)]"><Icon size={13} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{KIND_LABEL[r.kind] || r.kind}</p>
                      <p className="truncate text-[11.5px] text-[var(--color-muted)]">{r.channel} → {r.recipient}</p>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-[var(--color-muted)]">{fmt(new Date(r.send_at_utc).toISOString(), tz, 'd LLL, h:mm a')}</span>
                    <Badge status={r.status}>{r.status}</Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <Alert>{error}</Alert>}
      </div>
    </Modal>
  );
}
