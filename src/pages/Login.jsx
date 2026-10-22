import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CalendarSync, Globe, ShieldCheck } from 'lucide-react';
import { api, auth } from '../api.js';
import { Alert, Button, Card, Input, Mark } from '../components/ui.jsx';

const HIGHLIGHTS = [
  { icon: CalendarSync, name: 'Google Calendar sync', intro: 'Two-way and real time, no double-bookings.' },
  { icon: Globe, name: 'Website booking', intro: 'Clients book themselves, 24/7.' },
  { icon: BellRing, name: 'Smart reminders', intro: 'Email, SMS and WhatsApp, on autopilot.' },
  { icon: ShieldCheck, name: 'Privacy first', intro: 'No clinical details in any message.' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api.post('/api/auth/login', { email, password });
      auth.set(token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wash flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="page-enter grid w-full max-w-5xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="banner relative hidden overflow-hidden rounded-[var(--radius-card)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="flex items-center gap-2 text-[var(--color-navy-accent)]">
            <Mark size={26} />
            <span className="font-display text-[16px] font-semibold text-white">Practice Scheduler</span>
          </div>
          <div className="my-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-navy-accent)]">For therapists & counselors</p>
            <h1 className="font-display text-[40px] font-medium leading-[1.06] tracking-tight">Less admin. More time for the people you help.</h1>
            <p className="mt-4 max-w-sm text-[15px] text-[var(--color-navy-ink-2)]">Every session, booking and reminder runs from one calm screen.</p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, name, intro }) => (
              <li key={name} className="rounded-xl border border-white/12 bg-white/8 p-3.5 backdrop-blur">
                <Icon size={16} className="mb-2 text-[var(--color-navy-accent)]" />
                <p className="text-[13px] font-semibold">{name}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-navy-ink-2)]">{intro}</p>
              </li>
            ))}
          </ul>
        </div>

        <Card className="self-center p-8 sm:p-10">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2 text-[var(--color-accent)] lg:hidden">
              <Mark size={24} />
              <span className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Practice Scheduler</span>
            </div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Sign in</p>
            <h2 className="font-display text-[30px] font-medium leading-tight">Welcome back</h2>
            <p className="mt-2 text-[14px] text-[var(--color-muted)]">Enter your details to open your practice dashboard.</p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <Input label="Email" type="email" placeholder="you@yourpractice.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <Alert>{error}</Alert>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
