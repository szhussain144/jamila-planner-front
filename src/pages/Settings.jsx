import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BellRing,
  Building2,
  CalendarSync,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  History,
  Layers,
  Mail,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
} from 'lucide-react';
import { api } from '../api.js';
import { useApp } from '../App.jsx';
import { fmt, LOCATION_LABEL } from '../format.js';
import { Alert, Badge, Button, Card, Chips, EmptyState, field, IconButton, Input, SectionTitle, Segmented, Select, Spinner, Toggle } from '../components/ui.jsx';

const TABS = [
  { key: 'practice', label: 'Practice & hours', icon: Building2 },
  { key: 'types', label: 'Session types', icon: Layers },
  { key: 'reminders', label: 'Reminders', icon: BellRing },
  { key: 'google', label: 'Google Calendar', icon: CalendarSync },
  { key: 'website', label: 'Website booking', icon: Globe },
  { key: 'log', label: 'Message log', icon: History },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'practice';
  const { settings, reloadSettings, toast } = useApp();

  useEffect(() => {
    if (params.get('google') === 'connected') toast('Google Calendar connected', 'Two-way sync is now active.');
    if (params.get('google') === 'denied') toast('Google connection cancelled', '', 'error');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveKey = async (key, value) => {
    await api.put(`/api/settings/${key}`, value);
    await reloadSettings();
    toast('Settings saved');
  };

  if (!settings) return <Spinner />;
  return (
    <div className="space-y-5">
      <Segmented options={TABS} value={tab} onChange={(k) => setParams({ tab: k })} />
      <div key={tab} className="page-enter">
        {tab === 'practice' && <PracticeTab settings={settings} save={saveKey} />}
        {tab === 'types' && <TypesTab />}
        {tab === 'reminders' && <RemindersTab settings={settings} save={saveKey} />}
        {tab === 'google' && <GoogleTab settings={settings} />}
        {tab === 'website' && <WebsiteTab />}
        {tab === 'log' && <LogTab tz={settings.practice.timezone} />}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ practice + hours + booking rules
const DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];

function PracticeTab({ settings, save }) {
  const [p, setP] = useState(settings.practice);
  const [hours, setHours] = useState(settings.workingHours);
  const [b, setB] = useState(settings.booking);
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [p.timezone];
  const setRange = (day, i, key, val) => setHours((h) => ({ ...h, [day]: h[day].map((r, j) => (j === i ? { ...r, [key]: val } : r)) }));

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <SectionTitle eyebrow="Profile" title="Your practice" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input wrapClass="sm:col-span-2" label="Practice name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
            <Input label="Your name" value={p.therapistName} onChange={(e) => setP({ ...p, therapistName: e.target.value })} />
            <Select label="Timezone" value={p.timezone} onChange={(e) => setP({ ...p, timezone: e.target.value })}>
              {zones.map((z) => <option key={z}>{z}</option>)}
            </Select>
            <Input label="Your email" hint="daily agenda" type="email" value={p.therapistEmail || ''} onChange={(e) => setP({ ...p, therapistEmail: e.target.value })} />
            <Input label="Your phone" value={p.therapistPhone || ''} onChange={(e) => setP({ ...p, therapistPhone: e.target.value })} />
            <Input wrapClass="sm:col-span-2" label="Address" hint="shown to clients" value={p.address || ''} onChange={(e) => setP({ ...p, address: e.target.value })} />
          </div>
          <div className="mt-5 flex justify-end"><Button onClick={() => save('practice', p)}>Save practice</Button></div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle eyebrow="Online booking" title="Booking rules" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Minimum notice" hint="hours" type="number" value={b.minNoticeHours} onChange={(e) => setB({ ...b, minNoticeHours: +e.target.value })} />
            <Input label="Book up to" hint="days ahead" type="number" value={b.maxDaysAhead} onChange={(e) => setB({ ...b, maxDaysAhead: +e.target.value })} />
            <Input label="Time slot every" hint="minutes" type="number" step="5" value={b.slotIntervalMin} onChange={(e) => setB({ ...b, slotIntervalMin: +e.target.value })} />
            <Input label="Clients can change up to" hint="hours before" type="number" value={b.cancelWindowHours} onChange={(e) => setB({ ...b, cancelWindowHours: +e.target.value })} />
          </div>
          <Toggle className="mt-5" checked={b.requireApproval} onChange={(v) => setB({ ...b, requireApproval: v })} label="Approve website bookings first" description="New online bookings stay pending until you approve them." />
          <div className="mt-5 flex justify-end"><Button onClick={() => save('booking', b)}>Save booking rules</Button></div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionTitle eyebrow="Availability" title="Working hours" />
        <p className="-mt-2 mb-4 text-[12.5px] text-[var(--color-muted)]">Clients can only book inside these hours. Anything busy in your Google Calendar is blocked automatically.</p>
        <div className="divide-y divide-[var(--color-border-soft)]">
          {DAYS.map(([d, label]) => {
            const on = hours[d].length > 0;
            return (
              <div key={d} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
                <div className="w-36 shrink-0 pt-1.5">
                  <Toggle checked={on} onChange={(v) => setHours({ ...hours, [d]: v ? [{ start: '09:00', end: '17:00' }] : [] })} label={label} />
                </div>
                <div className="flex-1 space-y-2">
                  {!on && <p className="pt-2 text-[12.5px] text-[var(--color-faint)]">Closed</p>}
                  {hours[d].map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" className={`${field} w-32`} value={r.start} onChange={(e) => setRange(d, i, 'start', e.target.value)} />
                      <span className="text-[var(--color-faint)]">–</span>
                      <input type="time" className={`${field} w-32`} value={r.end} onChange={(e) => setRange(d, i, 'end', e.target.value)} />
                      <IconButton label="Remove" onClick={() => setHours({ ...hours, [d]: hours[d].filter((_, j) => j !== i) })}><Trash2 size={15} /></IconButton>
                    </div>
                  ))}
                  {on && (
                    <button type="button" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-accent)] hover:underline" onClick={() => setHours({ ...hours, [d]: [...hours[d], { start: '18:00', end: '20:00' }] })}>
                      <Plus size={12} /> Add hours (after a break)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={() => save('workingHours', hours)}>Save hours</Button></div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ session types
function TypesTab() {
  const { toast } = useApp();
  const [types, setTypes] = useState(null);
  const load = () => api.get('/api/session-types').then(setTypes);
  useEffect(() => { load(); }, []);

  const update = (i, k, v) => setTypes((t) => t.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const saveOne = async (t) => {
    if (t.id) await api.put(`/api/session-types/${t.id}`, t);
    else await api.post('/api/session-types', t);
    toast('Session type saved');
    load();
  };

  if (!types) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--color-muted)]">Video sessions get a Google Meet link automatically once Google Calendar is connected.</p>
        <Button onClick={() => setTypes([...types, { name: 'New session', durationMin: 50, bufferMin: 10, priceCents: 0, color: '#7429c3', locationType: 'in_person', isPublic: true, active: true }])}>
          <Plus size={15} /> Add session type
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {types.map((t, i) => (
          <Card key={t.id || `n${i}`} className="overflow-hidden">
            <div className="h-1.5" style={{ background: t.color }} />
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border)]" style={{ background: t.color }} title="Colour">
                  <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={t.color} onChange={(e) => update(i, 'color', e.target.value)} />
                </label>
                <input className={`${field} font-display !text-[15px] font-medium`} value={t.name} onChange={(e) => update(i, 'name', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Length" hint="min" type="number" value={t.durationMin} onChange={(e) => update(i, 'durationMin', +e.target.value)} />
                <Input label="Break after" hint="min" type="number" value={t.bufferMin} onChange={(e) => update(i, 'bufferMin', +e.target.value)} />
                <Input label="Price" type="number" value={t.priceCents / 100} onChange={(e) => update(i, 'priceCents', Math.round(+e.target.value * 100))} />
              </div>
              <Select label="Where" value={t.locationType} onChange={(e) => update(i, 'locationType', e.target.value)}>
                {Object.entries(LOCATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <Input label="Description" hint="shown on booking page" value={t.description || ''} onChange={(e) => update(i, 'description', e.target.value)} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-soft)] pt-4">
                <div className="flex flex-wrap gap-5">
                  <Toggle checked={t.isPublic} onChange={(v) => update(i, 'isPublic', v)} label="Bookable online" />
                  <Toggle checked={t.active} onChange={(v) => update(i, 'active', v)} label="Active" />
                </div>
                <Button size="sm" onClick={() => saveOne(t)}>Save</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ reminders
const CHANNEL_OPTS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];
const describeOffset = (m) => (m % 1440 === 0 ? `${m / 1440} day${m === 1440 ? '' : 's'}` : m % 60 === 0 ? `${m / 60} hour${m === 60 ? '' : 's'}` : `${m} min`);

function RemindersTab({ settings, save }) {
  const [r, setR] = useState(settings.reminders);
  const [p, setP] = useState(settings.privacy);
  const [queue, setQueue] = useState([]);
  useEffect(() => { api.get('/api/reminder-jobs').then(setQueue); }, []);

  const setRule = (i, patch) => setR({ ...r, rules: r.rules.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <SectionTitle eyebrow="For clients" title="Reminder schedule" />
          <Toggle checked={r.sendConfirmation} onChange={(v) => setR({ ...r, sendConfirmation: v })} label="Booking confirmation" description="Sent right after a session is booked, with a link to confirm, reschedule or cancel." />
          <div className="mt-5 space-y-3">
            {r.rules.map((rule, i) => (
              <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-alt)]/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-[13px] font-semibold"><Clock size={14} className="text-[var(--color-accent)]" /> {describeOffset(rule.offsetMin)} before the session</p>
                  <IconButton label="Remove reminder" onClick={() => setR({ ...r, rules: r.rules.filter((_, j) => j !== i) })}><Trash2 size={15} /></IconButton>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select className={`${field} w-40`} value={rule.offsetMin} onChange={(e) => setRule(i, { offsetMin: +e.target.value })}>
                    {[15, 30, 60, 120, 180, 360, 720, 1440, 2880, 4320, 10080].concat(rule.offsetMin).filter((v, k, a) => a.indexOf(v) === k).sort((a, b) => a - b).map((m) => (
                      <option key={m} value={m}>{describeOffset(m)} before</option>
                    ))}
                  </select>
                  <Chips options={CHANNEL_OPTS} value={rule.channels} onChange={(v) => setRule(i, { channels: v })} />
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setR({ ...r, rules: [...r.rules, { offsetMin: 60, channels: ['sms'] }] })}><Plus size={14} /> Add reminder</Button>
          </div>
          <div className="mt-5 space-y-4 border-t border-[var(--color-border-soft)] pt-5">
            <Toggle checked={r.followup.enabled} onChange={(v) => setR({ ...r, followup: { ...r.followup, enabled: v } })} label="Follow-up email" description="Thanks the client and invites them to book their next session." />
            {r.followup.enabled && (
              <Input wrapClass="max-w-xs" label="Send after the session" hint="minutes" type="number" value={r.followup.offsetMin} onChange={(e) => setR({ ...r, followup: { ...r.followup, offsetMin: +e.target.value } })} />
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle eyebrow="For you" title="Your alerts" />
          <div className="space-y-4">
            <Toggle checked={r.dailyAgenda.enabled} onChange={(v) => setR({ ...r, dailyAgenda: { ...r.dailyAgenda, enabled: v } })} label="Daily agenda" description="A summary of today's sessions by email and in the app." />
            {r.dailyAgenda.enabled && <Input wrapClass="max-w-xs" label="Send at" type="time" value={r.dailyAgenda.time} onChange={(e) => setR({ ...r, dailyAgenda: { ...r.dailyAgenda, time: e.target.value } })} />}
            <Input wrapClass="max-w-xs" label="Heads-up before each session" hint="minutes (0 = off)" type="number" value={r.therapistHeadsUpMin} onChange={(e) => setR({ ...r, therapistHeadsUpMin: +e.target.value })} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[12px] text-[var(--color-faint)]">Applies to new and rescheduled sessions.</p>
            <Button onClick={() => save('reminders', r)}>Save reminders</Button>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <SectionTitle eyebrow="Privacy" title="What others can see" action={<ShieldCheck size={18} className="text-[var(--color-green)]" />} />
          <p className="-mt-2 mb-4 text-[12.5px] text-[var(--color-muted)]">Reminders never mention the reason for a session. Choose how sessions are titled in Google Calendar:</p>
          <div className="space-y-2">
            {[
              ['initials', 'Initials only', 'Session – A.K.'],
              ['generic', 'Generic', 'Client session'],
              ['full', 'Full name', 'Session – Ayesha Khan'],
            ].map(([k, label, ex]) => (
              <button key={k} type="button" onClick={() => setP({ ...p, googleTitleMode: k })}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${p.googleTitleMode === k ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${p.googleTitleMode === k ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)]'}`}>
                  {p.googleTitleMode === k && <Check size={12} />}
                </span>
                <span className="flex-1 text-[13px] font-medium">{label}</span>
                <span className="text-[12px] text-[var(--color-muted)]">“{ex}”</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end"><Button onClick={() => save('privacy', p)}>Save privacy</Button></div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle eyebrow="Queue" title={`Scheduled messages (${queue.length})`} />
          {queue.length === 0 ? (
            <EmptyState icon={BellRing} title="Nothing scheduled">Reminders appear here as sessions are booked.</EmptyState>
          ) : (
            <ul className="max-h-[420px] divide-y divide-[var(--color-border-soft)] overflow-y-auto">
              {queue.map((j) => (
                <li key={j.id} className="flex items-center gap-3 py-2.5 text-[12.5px]">
                  <Badge tone="accent">{j.channel}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{j.client_name || j.recipient}</p>
                    <p className="text-[11.5px] text-[var(--color-muted)]">{j.kind}</p>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-[var(--color-muted)]">{fmt(new Date(j.send_at_utc).toISOString(), settings.practice.timezone, 'd LLL, h:mm a')}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Google
function GoogleTab({ settings }) {
  const { toast } = useApp();
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/api/google/status').then(setSt); }, []);

  const connect = async () => {
    try {
      const { url } = await api.get('/api/google/auth-url');
      window.location.href = url;
    } catch (e) {
      toast('Cannot connect', e.message, 'error');
    }
  };
  const act = async (path, msg) => {
    setBusy(true);
    try {
      setSt(await api.post(path));
      toast(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!st) return <Spinner />;
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Card className="overflow-hidden">
        <div className="banner relative p-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><CalendarSync size={22} /></span>
            <div>
              <h2 className="font-display text-[20px] font-medium">Google Calendar</h2>
              <p className="text-[13px] text-white/80">{st.connected ? `Connected as ${st.email}` : 'Two-way, real-time sync'}</p>
            </div>
            {st.connected && <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold"><span className="live-dot h-2 w-2 rounded-full bg-[#4ade80]" /> Syncing</span>}
          </div>
        </div>
        <div className="space-y-5 p-6">
          {!st.configured && (
            <Alert tone="orange">
              <b>One-time setup:</b> in Google Cloud Console enable the Calendar API and create an OAuth client (Web application) with redirect URI{' '}
              <code className="rounded bg-white/60 px-1">{'<API_URL>'}/api/public/google/callback</code>. Then add <code className="rounded bg-white/60 px-1">GOOGLE_CLIENT_ID</code> and{' '}
              <code className="rounded bg-white/60 px-1">GOOGLE_CLIENT_SECRET</code> to <code className="rounded bg-white/60 px-1">.env</code> and restart.
            </Alert>
          )}
          <ul className="space-y-3 text-[13px]">
            {[
              'Sessions appear in Google instantly. Video sessions get a Meet link.',
              'Personal events in Google block those times on your booking page.',
              'Move or delete a session in Google and the app updates and tells the client.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-green)]/10 text-[var(--color-green)]"><Check size={12} /></span>{t}</li>
            ))}
          </ul>
          {st.connected ? (
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => act('/api/google/sync', 'Synced with Google')}><RefreshCw size={14} /> Sync now</Button>
              <Button variant="danger" disabled={busy} onClick={() => window.confirm('Disconnect Google Calendar?') && act('/api/google/disconnect', 'Google Calendar disconnected')}><Unplug size={14} /> Disconnect</Button>
            </div>
          ) : (
            <Button size="lg" disabled={!st.configured} onClick={connect}><CalendarSync size={16} /> Connect Google Calendar</Button>
          )}
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <SectionTitle eyebrow="Status" title="Sync details" />
        <dl className="space-y-3 text-[13px]">
          <Row label="Connection" value={st.connected ? <Badge tone="green">Connected</Badge> : <Badge>Not connected</Badge>} />
          <Row label="Calendar" value={st.calendarId} />
          <Row label="Updates from Google" value={st.pushNotifications ? 'Instant (push)' : 'Every minute'} />
          <Row label="Last sync" value={st.lastSyncAt ? fmt(st.lastSyncAt, settings.practice.timezone) : '—'} />
        </dl>
        {!st.pushNotifications && <p className="mt-4 text-[12px] text-[var(--color-faint)]">Instant push updates switch on automatically when the app runs on an https address.</p>}
      </Card>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-soft)] pb-3 last:border-none">
    <dt className="text-[var(--color-muted)]">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);

// ------------------------------------------------------------------ website embed
function WebsiteTab() {
  const { toast } = useApp();
  const origin = window.location.origin;
  const link = `${origin}/book`;
  const snippet = `<iframe src="${origin}/book?embed=1" style="width:100%;min-height:760px;border:0" title="Book an appointment"></iframe>`;
  const copy = (t) => navigator.clipboard.writeText(t).then(() => toast('Copied to clipboard'));

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Card className="p-5 sm:p-6">
        <SectionTitle eyebrow="Share" title="Your booking page" action={<a href="/book" target="_blank" rel="noreferrer"><Button variant="ghost" size="sm">Preview <ExternalLink size={13} /></Button></a>} />
        <p className="mb-2 text-[12px] font-medium text-[var(--color-ink-2)]">Direct link: for Instagram, WhatsApp or email signatures</p>
        <CodeRow value={link} onCopy={() => copy(link)} />
        <p className="mt-5 mb-2 text-[12px] font-medium text-[var(--color-ink-2)]">Embed on your website (WordPress, Wix, Squarespace, HTML)</p>
        <CodeRow value={snippet} onCopy={() => copy(snippet)} mono />
      </Card>
      <Card className="p-5 sm:p-6">
        <SectionTitle eyebrow="Real time" title="Always up to date" />
        <ul className="space-y-3 text-[13px] text-[var(--color-ink-2)]">
          {['A slot disappears for every visitor the moment it is taken.', 'Busy time in Google Calendar is never offered.', 'Your hours, breaks and notice period are respected.', 'Clients get a private link to confirm, reschedule or cancel.'].map((t) => (
            <li key={t} className="flex gap-2.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]"><Check size={12} /></span>{t}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

const CodeRow = ({ value, onCopy, mono }) => (
  <div className="flex items-stretch gap-2">
    <code className={`flex-1 overflow-x-auto whitespace-nowrap rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-panel-alt)]/60 px-3.5 py-2.5 text-[12.5px] ${mono ? 'font-mono' : ''} scrollbar-none`}>{value}</code>
    <Button variant="ghost" onClick={onCopy}><Copy size={14} /> Copy</Button>
  </div>
);

// ------------------------------------------------------------------ message log
const CH_ICON = { email: Mail, sms: MessageSquare, whatsapp: MessageCircle, inapp: BellRing, web: Globe };

function LogTab({ tz }) {
  const { version } = useApp();
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/api/messages').then(setRows); }, [version]);
  if (!rows) return <Spinner />;
  return (
    <Card className="p-5">
      <SectionTitle eyebrow="Audit trail" title="Every message sent and received" />
      {rows.length === 0 ? (
        <EmptyState icon={History} title="No messages yet" />
      ) : (
        <ul className="divide-y divide-[var(--color-border-soft)]">
          {rows.map((m) => {
            const Icon = CH_ICON[m.channel] || Mail;
            return (
              <li key={m.id} className="row-in flex gap-3 py-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.direction === 'in' ? 'bg-[var(--color-blue)]/10 text-[var(--color-blue)]' : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold">{m.direction === 'in' ? `From ${m.recipient}` : `To ${m.recipient}`}</p>
                    <Badge status={m.status}>{m.status}</Badge>
                    <span className="ml-auto text-[11.5px] text-[var(--color-faint)]">{fmt(new Date(m.created_at).toISOString(), tz)}</span>
                  </div>
                  {m.subject && <p className="mt-0.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">{m.subject}</p>}
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-[12.5px] text-[var(--color-muted)]">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
