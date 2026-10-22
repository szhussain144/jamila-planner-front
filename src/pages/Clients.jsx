import { useEffect, useState } from 'react';
import { GraduationCap, Mail, MessageCircle, MessageSquare, Phone, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { api, qs } from '../api.js';
import { useApp } from '../App.jsx';
import { fmt, STATUS_LABEL } from '../format.js';
import { Alert, Avatar, Badge, Button, Card, Chips, Drawer, EmptyState, field, Input, Spinner, Textarea, Toggle } from '../components/ui.jsx';

const EMPTY = {
  name: '', email: '', phone: '', isMinor: false, guardianName: '', guardianEmail: '', guardianPhone: '',
  notifyChannels: ['email', 'sms', 'whatsapp'], notifyGuardian: false, notes: '',
};
const CHANNELS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

export default function Clients() {
  const { toast, version, settings } = useApp();
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => api.get('/api/clients' + qs({ q })).then(setList);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [q, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (id) => setSelected(await api.get(`/api/clients/${id}`));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-faint)]" />
          <input className={`${field} pl-10`} placeholder="Search by name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={() => setSelected({ ...EMPTY })}><UserPlus size={15} /> Add client</Button>
      </div>

      <Card className="p-5">
        {list === null ? (
          <Spinner />
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title={q ? 'No matches' : 'No clients yet'}>
            {q ? 'Try a different name or number.' : 'Clients are created automatically when someone books on your website, or add one now.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-faint)]">
                  <th className="pr-4 pb-3">Client</th>
                  <th className="pr-4 pb-3">Contact</th>
                  <th className="pr-4 pb-3">Reminders via</th>
                  <th className="pr-4 pb-3">Upcoming</th>
                  <th className="pb-3">Total sessions</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {list.map((c) => (
                  <tr key={c.id} onClick={() => open(c.id)} className="row-in cursor-pointer border-b border-[var(--color-border-soft)] transition-colors last:border-none hover:bg-[var(--color-panel-alt)]/60">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={34} />
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          {c.isMinor && <Badge tone="orange" className="mt-0.5"><GraduationCap size={11} /> Student · minor</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[12.5px] text-[var(--color-muted)]">
                      {c.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {c.email}</p>}
                      {c.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {c.phone}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1">
                        {CHANNELS.filter((ch) => c.notifyChannels.includes(ch.key)).map((ch) => (
                          <span key={ch.key} title={ch.label} className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]"><ch.icon size={12} /></span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{c.upcoming ? <Badge tone="blue">{c.upcoming} upcoming</Badge> : <span className="text-[var(--color-faint)]">—</span>}</td>
                    <td className="py-3 font-semibold">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <ClientDrawer
          key={selected.id || 'new'}
          client={selected}
          tz={settings?.practice?.timezone}
          onClose={() => setSelected(null)}
          onSaved={(c) => {
            toast('Client saved');
            load();
            open(c.id);
          }}
          onDeleted={() => {
            toast('Client deleted');
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ClientDrawer({ client, tz, onClose, onSaved, onDeleted }) {
  const [f, setF] = useState({ ...EMPTY, ...client });
  const [error, setError] = useState('');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setError('');
    try {
      onSaved(client.id ? await api.put(`/api/clients/${client.id}`, f) : await api.post('/api/clients', f));
    } catch (err) {
      setError(err.message);
    }
  };

  const footer = (
    <div className="flex items-center justify-between gap-2">
      {client.id ? (
        <Button variant="danger" size="sm" onClick={() => window.confirm('Delete this client? Their past sessions are kept.') && api.del(`/api/clients/${client.id}`).then(onDeleted)}>
          <Trash2 size={14} /> Delete
        </Button>
      ) : <span />}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Save client</Button>
      </div>
    </div>
  );

  return (
    <Drawer
      title={client.id ? client.name : 'New client'}
      subtitle={client.id ? `Client since ${fmt(new Date(client.createdAt).toISOString(), tz, 'LLLL yyyy')}` : 'Contact details and reminder preferences'}
      onClose={onClose}
      footer={footer}
    >
      <div className="space-y-5">
        {client.id && (
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-panel-alt)]/70 p-3">
            <Avatar name={client.name} size={44} />
            <div className="grid flex-1 grid-cols-2 gap-2 text-center">
              <div><p className="text-[18px] font-semibold">{client.appointments?.length || 0}</p><p className="text-[11px] text-[var(--color-muted)]">Sessions</p></div>
              <div><p className="text-[18px] font-semibold">{client.appointments?.filter((a) => a.status === 'no_show').length || 0}</p><p className="text-[11px] text-[var(--color-muted)]">No-shows</p></div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Input label="Full name" value={f.name} onChange={(e) => set('name', e.target.value)} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={f.email || ''} onChange={(e) => set('email', e.target.value)} />
            <Input label="Phone" hint="with country code" placeholder="+92…" value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-[var(--color-ink-2)]">Send reminders by</p>
            <Chips options={CHANNELS} value={f.notifyChannels} onChange={(v) => set('notifyChannels', v)} />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] p-4">
          <Toggle checked={f.isMinor} onChange={(v) => set('isMinor', v)} label="Student under 18" description="Add a parent or guardian who can receive reminders too." />
          {f.isMinor && (
            <div className="space-y-3">
              <Input label="Parent / guardian name" value={f.guardianName || ''} onChange={(e) => set('guardianName', e.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Guardian email" type="email" value={f.guardianEmail || ''} onChange={(e) => set('guardianEmail', e.target.value)} />
                <Input label="Guardian phone" value={f.guardianPhone || ''} onChange={(e) => set('guardianPhone', e.target.value)} />
              </div>
              <Toggle checked={f.notifyGuardian} onChange={(v) => set('notifyGuardian', v)} label="Also remind the guardian" />
            </div>
          )}
        </div>

        <Textarea label="Private notes" hint="Only you can see these" rows={3} value={f.notes || ''} onChange={(e) => set('notes', e.target.value)} />
        {error && <Alert>{error}</Alert>}

        {client.appointments && (
          <div>
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-faint)]">Session history</p>
            {client.appointments.length === 0 ? (
              <p className="text-[12.5px] text-[var(--color-muted)]">No sessions yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border-soft)] rounded-xl border border-[var(--color-border)]">
                {client.appointments.slice().reverse().map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.color || 'var(--color-accent)' }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{a.typeName || 'Session'}</p>
                      <p className="text-[11.5px] text-[var(--color-muted)]">{fmt(a.start, tz)}</p>
                    </div>
                    <Badge status={a.status}>{STATUS_LABEL[a.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
