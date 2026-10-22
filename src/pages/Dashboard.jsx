import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CalendarSync,
  Clock,
  Globe,
  Hourglass,
  Mail,
  MessageCircle,
  MessageSquare,
  Settings,
  UserRoundX,
  Users,
  Video,
} from 'lucide-react';
import { DateTime } from 'luxon';
import { api } from '../api.js';
import { useApp } from '../App.jsx';
import { Avatar, Badge, Button, Card, EmptyState, SectionTitle, Spinner, StatCard } from '../components/ui.jsx';
import { STATUS_LABEL } from '../format.js';

export default function Dashboard() {
  const { version } = useApp();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard').then(setData);
  }, [version]);

  if (!data) return <Spinner />;
  const today = data.today || [];
  const confirmedToday = today.filter((a) => a.status === 'confirmed').length;
  const clientConfirmed = today.filter((a) => a.clientConfirmedAt).length;
  const pct = today.length ? Math.round((clientConfirmed / today.length) * 100) : 0;
  const nextUp = today.find((a) => new Date(a.end) > new Date());
  const ch = data.channels;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Hero: today's sessions */}
        <Card className="banner relative overflow-hidden border-none p-6 sm:p-7 lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-medium text-white/80">Today · {DateTime.now().toFormat('cccc d LLLL')}</p>
              <p className="mt-3 text-[56px] font-semibold leading-none tracking-tight">{today.length}</p>
              <p className="mt-2 text-[13px] text-white/80">{today.length === 1 ? 'session' : 'sessions'} on your calendar today</p>
              {nextUp && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] backdrop-blur">
                  <Clock size={13} /> Next: {nextUp.clientName || 'Session'} at {DateTime.fromISO(nextUp.start).toFormat('h:mm a')}
                </p>
              )}
            </div>
            <div className="w-full max-w-xs space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur">
                  <p className="text-[11px] text-white/75">Confirmed</p>
                  <p className="text-[20px] font-semibold">{confirmedToday}</p>
                </div>
                <div className="flex-1 rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur">
                  <p className="text-[11px] text-white/75">Awaiting approval</p>
                  <p className="text-[20px] font-semibold">{data.pending}</p>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[11.5px] text-white/80">
                  <span>Clients who confirmed attendance</span>
                  <span className="font-semibold text-white">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <StatCard label="Upcoming sessions" value={data.upcoming} sub="Booked from today onwards" icon={CalendarCheck} />
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard label="Awaiting approval" value={data.pending} sub="Website requests to review" icon={Hourglass} />
        <StatCard label="No-show rate" value={`${Math.round(data.noShowRate * 100)}%`} sub="Last 30 days" icon={UserRoundX} />
        <StatCard label="Reminders sent" value={data.messagesSent30} sub="Last 30 days" icon={BellRing} />
        <StatCard label="Cancelled" value={data.last30?.cancelled || 0} sub="Last 30 days" icon={CalendarDays} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle
            eyebrow="Next 7 days"
            title="Upcoming sessions"
            action={
              <Link to="/calendar">
                <Button variant="ghost" size="sm">Open calendar <ArrowRight size={13} /></Button>
              </Link>
            }
          />
          {data.next.length ? (
            <ol className="relative space-y-1.5 before:absolute before:top-3 before:bottom-3 before:left-[27px] before:w-px before:bg-[var(--color-border)]">
              {data.next.map((a) => {
                const d = DateTime.fromISO(a.start);
                return (
                  <li key={a.id}>
                    <Link
                      to={`/calendar?appt=${a.id}`}
                      className="relative flex items-center justify-between gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-panel-alt)]/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative z-10 flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] leading-none">
                          <span className="text-[10px] font-semibold uppercase text-[var(--color-faint)]">{d.toFormat('ccc')}</span>
                          <span className="mt-0.5 text-[15px] font-semibold text-[var(--color-accent)]">{d.toFormat('d')}</span>
                        </div>
                        <Avatar name={a.clientName || a.title || 'Session'} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-semibold">{a.clientName || a.title || 'Personal block'}</p>
                          <p className="flex items-center gap-1.5 truncate text-[12px] text-[var(--color-muted)]">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.color || 'var(--color-accent)' }} />
                            {a.typeName || 'Session'} · {d.toFormat('h:mm a')}
                            {a.locationType === 'video' && <Video size={12} />}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {a.clientConfirmedAt && <Badge tone="blue">Client confirmed</Badge>}
                        <Badge status={a.status}>{STATUS_LABEL[a.status]}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState icon={CalendarDays} title="Nothing booked yet" action={<Link to="/settings?tab=website"><Button variant="ghost" size="sm">Share your booking page</Button></Link>}>
              New website bookings and sessions you add will show up here.
            </EmptyState>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle eyebrow="Connected" title="Integrations" />
            <ul className="space-y-1">
              <Integration icon={CalendarSync} name="Google Calendar" ok={data.google.connected}
                detail={data.google.connected ? `${data.google.email || 'Connected'} · ${data.google.pushNotifications ? 'live push' : 'syncing every minute'}` : data.google.configured ? 'Ready to connect' : 'Add OAuth keys in .env'} />
              <Integration icon={Mail} name="Email" ok={ch.email} detail={ch.email ? 'SMTP connected' : 'Demo mode: logged, not sent'} />
              <Integration icon={MessageSquare} name="SMS" ok={ch.sms} detail={ch.sms ? 'Twilio connected' : 'Demo mode'} />
              <Integration icon={MessageCircle} name="WhatsApp" ok={ch.whatsapp} detail={ch.whatsapp ? 'Twilio connected' : 'Demo mode'} />
              <Integration icon={BellRing} name="In-app alerts" ok detail="Live" />
            </ul>
            <Link to="/settings?tab=google" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-accent)] hover:underline">
              Manage integrations <ArrowRight size={12} />
            </Link>
          </Card>

          <Card className="p-5">
            <SectionTitle eyebrow="Shortcuts" title="Quick actions" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/calendar?new=1', label: 'New session', icon: CalendarPlus },
                { to: '/clients', label: 'Clients', icon: Users },
                { to: '/settings?tab=website', label: 'Booking page', icon: Globe },
                { to: '/settings?tab=reminders', label: 'Reminders', icon: Settings },
              ].map((q) => (
                <Link key={q.label} to={q.to} className="group flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40 hover:shadow-[var(--shadow-card)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-white">
                    <q.icon size={15} />
                  </span>
                  <span className="text-[12.5px] font-semibold">{q.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Integration({ icon: Icon, name, ok, detail }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-1 py-2">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ok ? 'bg-[var(--color-green)]/10 text-[var(--color-green)]' : 'bg-[var(--color-panel-alt)] text-[var(--color-faint)]'}`}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">{name}</p>
        <p className="truncate text-[11.5px] text-[var(--color-muted)]">{detail}</p>
      </div>
      <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-[var(--color-green)]' : 'bg-[var(--color-border)]'}`} />
    </li>
  );
}
