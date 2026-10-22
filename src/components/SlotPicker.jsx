import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { api, qs } from '../api.js';
import { useLive } from '../hooks.js';

const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const SPAN = 14; // days per page of the day strip
const PERIODS = [
  ['Morning', 0, 12],
  ['Afternoon', 12, 17],
  ['Evening', 17, 24],
];

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const STATUS_LABEL = { closed: 'Closed', soon: 'Too soon', full: 'Full' };
const STATUS_HINT = {
  closed: 'The practice is closed on this day.',
  soon: (h) => `Sessions need to be booked at least ${h} hours in advance.`,
  full: 'Every time on this day is taken.',
};

/** Why a day has no free times: closed (no working hours), too soon (notice period) or full. */
function dayStatus(date, practice) {
  if (!practice?.workingHours) return 'full';
  const d = DateTime.fromISO(date.toISODate(), { zone: practice.timezone });
  const ranges = practice.workingHours[WEEKDAYS[d.weekday - 1]] || [];
  if (!ranges.length) return 'closed';
  const lastEnd = ranges.map((r) => r.end).sort().at(-1);
  const [h, m] = lastEnd.split(':').map(Number);
  const closesAt = d.set({ hour: h, minute: m });
  return closesAt <= DateTime.now().plus({ hours: practice.minNoticeHours || 0 }) ? 'soon' : 'full';
}

/** Day strip + time grid. Refreshes live when anyone (or Google) takes a slot. */
export default function SlotPicker({ sessionTypeId, excludeToken, maxDaysAhead = 60, practice, selected, onSelect }) {
  const today = DateTime.local().startOf('day');
  const [from, setFrom] = useState(today);
  const [slots, setSlots] = useState(null);
  const [day, setDay] = useState(null);
  const [pulse, setPulse] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // fresh=true asks the server to re-check Google Calendar first (used when a day is clicked)
  const load = useCallback((fresh) => {
    api
      .get('/api/public/slots' + qs({ sessionTypeId, from: from.toISODate(), to: from.plus({ days: SPAN - 1 }).toISODate(), exclude: excludeToken, fresh: fresh === true ? 1 : undefined }))
      .then((s) => {
        setSlots(s);
        if (selectedRef.current && !s.some((x) => x.start === selectedRef.current.start)) onSelect(null); // someone else took it
      });
  }, [sessionTypeId, from, excludeToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);
  useLive('public', {
    reconnected: load,
    availability: () => {
      load();
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    },
  });

  const days = useMemo(() => Array.from({ length: SPAN }, (_, i) => from.plus({ days: i })), [from]);
  const byDay = useMemo(() => {
    const map = {};
    for (const s of slots || []) {
      const k = DateTime.fromISO(s.start).setZone(localTz).toISODate();
      (map[k] ||= []).push(s);
    }
    return map;
  }, [slots]);

  // pick the first day that has times
  useEffect(() => {
    if (!slots) return;
    if (!day || !days.some((d) => d.toISODate() === day)) {
      const first = days.find((d) => byDay[d.toISODate()]?.length);
      setDay((first || days[0]).toISODate());
    }
  }, [slots, days]); // eslint-disable-line react-hooks/exhaustive-deps

  const canPrev = from > today;
  const canNext = from.plus({ days: SPAN }) < today.plus({ days: maxDaysAhead });
  const list = byDay[day] || [];
  const hintFor = (d) => {
    const s = dayStatus(d, practice);
    return s === 'soon' ? STATUS_HINT.soon(practice?.minNoticeHours) : STATUS_HINT[s];
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold">{from.toFormat('LLLL yyyy')}</p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${pulse ? 'text-[var(--color-green)]' : 'text-[var(--color-faint)]'}`}>
            <Radio size={12} /> {pulse ? 'Updated' : 'Live'}
          </span>
          <button type="button" aria-label="Earlier dates" disabled={!canPrev} onClick={() => setFrom((f) => f.minus({ days: SPAN }))} className="rounded-full border border-[var(--color-border)] p-1.5 hover:border-[var(--color-accent)] disabled:opacity-40"><ChevronLeft size={15} /></button>
          <button type="button" aria-label="Later dates" disabled={!canNext} onClick={() => setFrom((f) => f.plus({ days: SPAN }))} className="rounded-full border border-[var(--color-border)] p-1.5 hover:border-[var(--color-accent)] disabled:opacity-40"><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        {days.map((d) => {
          const k = d.toISODate();
          const n = byDay[k]?.length || 0;
          const on = day === k;
          return (
            <button
              key={k}
              type="button"
              disabled={slots !== null && n === 0}
              title={slots !== null && n === 0 ? hintFor(d) : undefined}
              onClick={() => {
                setDay(k);
                load(true); // re-check Google Calendar for the latest busy times
              }}
              className={`flex w-[62px] shrink-0 flex-col items-center rounded-2xl border py-2 transition-all ${
                on ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-[0_8px_18px_-8px_rgba(116,41,195,0.6)]'
                  : n === 0 ? 'cursor-not-allowed border-dashed border-[var(--color-border)] text-[var(--color-faint)] opacity-60'
                  : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)]'
              }`}
            >
              <span className="text-[11px]">{d.hasSame(today, 'day') ? 'Today' : d.toFormat('ccc')}</span>
              <span className="text-[18px] font-semibold leading-tight">{d.toFormat('d')}</span>
              <span className={`text-[10px] ${on ? 'text-white/80' : 'text-[var(--color-faint)]'}`}>{slots === null ? '·' : n ? `${n} free` : STATUS_LABEL[dayStatus(d, practice)]}</span>
            </button>
          );
        })}
      </div>

      {slots === null ? (
        <p className="py-8 text-center text-[13px] text-[var(--color-muted)]">Finding free times…</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-[var(--color-panel-alt)] p-5 text-center text-[13px] text-[var(--color-muted)]">
          No free times in these two weeks. {canNext ? 'Try later dates →' : ''}
        </p>
      ) : (
        PERIODS.map(([label, a, b]) => {
          const inPeriod = list.filter((s) => {
            const h = DateTime.fromISO(s.start).setZone(localTz).hour;
            return h >= a && h < b;
          });
          if (!inPeriod.length) return null;
          return (
            <div key={label} className="mb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-faint)]">{label}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {inPeriod.map((s) => {
                  const on = selected?.start === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onSelect(s)}
                      className={`rounded-xl border py-2.5 text-[13px] tabular-nums transition-all ${
                        on ? 'border-[var(--color-accent)] bg-[var(--color-accent)] font-semibold text-white' : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                      }`}
                    >
                      {DateTime.fromISO(s.start).setZone(localTz).toFormat('h:mm a')}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
      <p className="text-[11.5px] text-[var(--color-faint)]">Times shown in your timezone ({localTz}).</p>
    </div>
  );
}
