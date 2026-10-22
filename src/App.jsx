import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  Users,
  X,
} from 'lucide-react';
import { api, auth } from './api.js';
import { Mark } from './components/ui.jsx';
import { useLive } from './hooks.js';
import Book from './pages/Book.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Clients from './pages/Clients.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Manage from './pages/Manage.jsx';
import Settings from './pages/Settings.jsx';

const AppContext = createContext({ version: 0, toast: () => {}, settings: null });
export const useApp = () => useContext(AppContext);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/book" element={<Book />} />
      <Route path="/a/:token" element={<Manage />} />
      <Route path="/*" element={auth.token ? <AdminShell /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const HEADINGS = {
  '/': { eyebrow: 'Home', title: 'Welcome back', subtitle: "Here's how your week is shaping up." },
  '/calendar': { eyebrow: 'Schedule', title: 'Calendar', subtitle: 'Your sessions, website bookings and Google Calendar in one view.' },
  '/clients': { eyebrow: 'Clients', title: 'Clients', subtitle: 'Everyone you see, with their contact and reminder preferences.' },
  '/settings': { eyebrow: 'Manage', title: 'Settings', subtitle: 'Hours, session types, reminders and integrations.' },
};

function AdminShell() {
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [connected, setConnected] = useState(false);
  const { pathname } = useLocation();

  const reloadSettings = useCallback(() => api.get('/api/settings').then(setSettings), []);
  useEffect(() => {
    reloadSettings();
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  }, [reloadSettings]);

  const toast = useCallback((title, body, type = 'success') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, title, body, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useLive('admin', {
    status: setConnected,
    reconnected: () => setVersion((v) => v + 1), // refetch anything missed while offline
    calendar: () => setVersion((v) => v + 1),
    notification: (n) => {
      setInbox((list) => [{ ...n, id: Math.random(), unread: true }, ...list].slice(0, 30));
      toast(n.title, n.body, 'info');
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(n.title, { body: n.body });
    },
  });

  const heading = HEADINGS[pathname] || HEADINGS['/'];

  return (
    <AppContext.Provider value={{ version, toast, settings, reloadSettings }}>
      <div className="min-h-screen bg-[var(--color-bg)]">
        <TopNav practice={settings?.practice} inbox={inbox} setInbox={setInbox} connected={connected} />
        <div className="wash">
          <main className="relative mx-auto max-w-[1360px] px-4 pb-12 lg:px-6">
            <div key={pathname} className="page-enter">
              <div className="flex flex-wrap items-end justify-between gap-4 pt-7 pb-6 lg:pt-9">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">{heading.eyebrow}</p>
                  <h1 className="font-display text-[28px] font-medium leading-tight tracking-tight lg:text-[34px]">
                    {pathname === '/' && settings?.practice?.therapistName ? `Welcome back, ${settings.practice.therapistName.split(' ').slice(-1)[0]}` : heading.title}
                  </h1>
                  <p className="mt-1.5 text-[14px] text-[var(--color-muted)]">{heading.subtitle}</p>
                </div>
              </div>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
      <Toasts toasts={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </AppContext.Provider>
  );
}

const tabBase = 'flex items-center gap-2 rounded-[9px] px-3 py-2 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy-accent)]';
const tabOn = 'bg-white/12 font-semibold text-[var(--color-navy-ink)]';
const tabOff = 'text-[var(--color-navy-ink-2)] hover:bg-white/6 hover:text-[var(--color-navy-ink)]';

function TopNav({ practice, inbox, setInbox, connected }) {
  const [mobile, setMobile] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => setMobile(false), [pathname]);

  const logout = () => {
    auth.set(null);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-navy)] shadow-[0_1px_0_rgba(255,255,255,0.04),0_8px_24px_-12px_rgba(24,50,74,0.6)]">
      <div className="mx-auto flex h-14 max-w-[1360px] items-center gap-4 px-4 lg:px-6">
        <button type="button" aria-label="Menu" onClick={() => setMobile((v) => !v)} className="-ml-1 rounded-lg p-1.5 text-[var(--color-navy-ink-2)] hover:text-white md:hidden">
          {mobile ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/" className="flex shrink-0 items-center gap-2 text-[var(--color-navy-accent)]">
          <Mark size={24} />
          <span className="hidden font-display text-[15px] font-semibold tracking-tight text-[var(--color-navy-ink)] sm:inline">{practice?.name || 'Practice'}</span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `${tabBase} ${isActive ? tabOn : tabOff}`}>
              <n.icon size={15} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 text-[11.5px] text-[var(--color-navy-ink-2)] lg:flex" title="Real-time sync">
            <span className={`h-2 w-2 rounded-full ${connected ? 'live-dot bg-[#4ade80]' : 'bg-white/30'}`} />
            {connected ? 'Live' : 'Connecting…'}
          </span>
          <a href="/book" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[12.5px] text-[var(--color-navy-ink)] hover:bg-white/6 lg:inline-flex">
            Booking page <ExternalLink size={12} />
          </a>
          <Link to="/calendar?new=1" className="hidden items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#8a3fdc] sm:inline-flex">
            <CalendarPlus size={14} /> New session
          </Link>
          <NotificationBell inbox={inbox} setInbox={setInbox} />
          <button type="button" onClick={logout} title="Log out" aria-label="Log out" className="rounded-lg p-1.5 text-[var(--color-navy-ink-2)] hover:bg-white/6 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </div>
      {mobile && (
        <nav className="menu-in border-t border-white/10 px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `${tabBase} ${isActive ? tabOn : tabOff}`}>
              <n.icon size={15} />
              {n.label}
            </NavLink>
          ))}
          <Link to="/calendar?new=1" className={`${tabBase} ${tabOff}`}><CalendarPlus size={15} /> New session</Link>
          <a href="/book" target="_blank" rel="noreferrer" className={`${tabBase} ${tabOff}`}><ExternalLink size={15} /> Booking page</a>
        </nav>
      )}
    </header>
  );
}

function NotificationBell({ inbox, setInbox }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = inbox.filter((n) => n.unread).length;
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          setInbox((l) => l.map((n) => ({ ...n, unread: false })));
        }}
        className="relative rounded-lg p-1.5 text-[var(--color-navy-ink-2)] hover:bg-white/6 hover:text-white"
      >
        <Bell size={18} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-red)] px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="menu-in absolute right-0 top-[calc(100%+10px)] z-50 w-80 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-panel)] p-2 shadow-[0_30px_70px_rgba(32,34,53,0.18)]">
          <p className="px-3 pt-1.5 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-faint)]">Notifications</p>
          {inbox.length === 0 && <p className="px-3 pb-3 text-[12.5px] text-[var(--color-muted)]">You're all caught up. New bookings, confirmations and changes appear here live.</p>}
          <div className="max-h-80 overflow-y-auto">
            {inbox.map((n) => (
              <div key={n.id} className="rounded-xl px-3 py-2 hover:bg-[var(--color-panel-alt)]">
                <p className="text-[13px] font-semibold text-[var(--color-ink)]">{n.title}</p>
                {n.body && <p className="text-[12px] text-[var(--color-muted)]">{n.body}</p>}
                <p className="mt-0.5 text-[10.5px] text-[var(--color-faint)]">{new Date(n.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TOAST_ICON = { success: CircleCheck, error: CircleAlert, info: Info };
function Toasts({ toasts, dismiss }) {
  return (
    <div className="fixed right-4 bottom-4 z-[80] flex flex-col items-end gap-2">
      {toasts.map((t) => {
        const Icon = TOAST_ICON[t.type] || Info;
        const coloured = t.type === 'success' || t.type === 'error';
        return (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            className={`toast-in relative flex max-w-xs cursor-pointer items-start gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-[13px] shadow-[0_16px_36px_-14px_rgba(32,34,53,0.45)] ${
              t.type === 'success' ? 'bg-[var(--color-green)] text-white' : t.type === 'error' ? 'bg-[var(--color-red)] text-white' : 'border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-ink)]'
            }`}
          >
            <Icon size={16} className={`mt-0.5 shrink-0 ${coloured ? '' : 'text-[var(--color-accent)]'}`} />
            <span>
              <span className="block font-semibold">{t.title}</span>
              {t.body && <span className={`block ${coloured ? 'text-white/85' : 'text-[var(--color-muted)]'}`}>{t.body}</span>}
            </span>
            <span aria-hidden className={`toast-timer absolute inset-x-0 bottom-0 h-[3px] ${coloured ? 'bg-white/40' : 'bg-[var(--color-accent)]/40'}`} style={{ animationDuration: '4500ms' }} />
          </div>
        );
      })}
    </div>
  );
}
