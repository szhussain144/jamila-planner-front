import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarPlus, CheckCheck, Globe, Lock, Video } from 'lucide-react';
import { api, qs } from '../api.js';
import { useApp } from '../App.jsx';
import AppointmentModal from '../components/AppointmentModal.jsx';
import BusyEventModal from '../components/BusyEventModal.jsx';
import { Button, Card, Toggle } from '../components/ui.jsx';

const DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

export default function CalendarPage() {
  const { version, toast, settings } = useApp();
  const [range, setRange] = useState(null);
  const [data, setData] = useState({ appointments: [], external: [] });
  const [modal, setModal] = useState(null);
  const [busyEvent, setBusyEvent] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [types, setTypes] = useState([]);
  const [params, setParams] = useSearchParams();
  const calRef = useRef();

  const load = useCallback(() => {
    if (range) api.get('/api/calendar' + qs({ from: range.start.toISOString(), to: range.end.toISOString() })).then(setData);
  }, [range]);
  useEffect(load, [load, version]);
  useEffect(() => {
    api.get('/api/session-types').then((t) => setTypes(t.filter((x) => x.active)));
  }, [version]);

  useEffect(() => {
    if (params.get('new')) setModal({ start: null });
    if (params.get('appt')) setModal({ id: Number(params.get('appt')) });
  }, [params]);

  const closeModal = () => {
    setModal(null);
    if (params.toString()) setParams({});
  };

  const events = useMemo(() => {
    const appts = data.appointments
      .filter((a) => showCancelled || a.status !== 'cancelled')
      .map((a) => ({
        id: `a${a.id}`,
        title: a.clientName || a.title || 'Personal block',
        start: a.start,
        end: a.end,
        classNames: ['ts-event'],
        editable: a.status !== 'cancelled',
        extendedProps: { appt: a },
      }));
    const ext = data.external.map((e) => ({
      id: `g${e.id}`,
      title: e.title || 'Busy',
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      editable: false,
      classNames: ['ts-event', 'ts-busy'],
      extendedProps: { external: e },
    }));
    return [...appts, ...ext];
  }, [data, showCancelled]);

  const businessHours = useMemo(() => {
    const wh = settings?.workingHours || {};
    return Object.entries(wh).flatMap(([d, ranges]) => ranges.map((r) => ({ daysOfWeek: [DOW[d]], startTime: r.start, endTime: r.end })));
  }, [settings]);

  const move = async (info) => {
    const a = info.event.extendedProps.appt;
    const body = { start: info.event.start.toISOString(), end: info.event.end?.toISOString() };
    try {
      await api.patch(`/api/appointments/${a.id}`, body);
      toast('Session moved', 'Client notified and Google Calendar updated.');
    } catch (err) {
      if (/overlap/i.test(err.message) && window.confirm(`${err.message}. Move anyway?`)) {
        await api.patch(`/api/appointments/${a.id}`, { ...body, force: true });
      } else {
        info.revert();
        toast('Could not move', err.message, 'error');
      }
    }
    load();
  };

  const counts = useMemo(() => {
    const live = data.appointments.filter((a) => a.status !== 'cancelled');
    return { total: live.length, pending: live.filter((a) => a.status === 'pending').length, busy: data.external.length };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {types.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-[12px] text-[var(--color-ink-2)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} /> {t.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-[12px] text-[var(--color-ink-2)]">
            <span className="busy-hatch h-2.5 w-2.5 rounded-full" /> Busy in Google
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Toggle checked={showCancelled} onChange={setShowCancelled} label="Show cancelled" />
          <Button onClick={() => setModal({ start: null })}><CalendarPlus size={15} /> New session</Button>
        </div>
      </div>

      <Card className="p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-4 text-[12px] text-[var(--color-muted)]">
          <span><b className="text-[var(--color-ink)]">{counts.total}</b> sessions in view</span>
          {counts.pending > 0 && <span><b className="text-[var(--color-accent)]">{counts.pending}</b> awaiting approval</span>}
          <span><b className="text-[var(--color-ink)]">{counts.busy}</b> busy blocks from Google</span>
          <span className="ml-auto hidden sm:inline">Tip: drag to reschedule · click an empty slot to book</span>
        </div>
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView={window.innerWidth < 700 ? 'timeGridDay' : 'timeGridWeek'}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' }}
          buttonText={{ today: 'Today', day: 'Day', week: 'Week', month: 'Month' }}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          allDaySlot
          nowIndicator
          selectable
          selectMirror
          editable
          dayMaxEvents={3}
          eventResizableFromStart={false}
          businessHours={businessHours}
          events={events}
          eventContent={renderEvent}
          datesSet={(r) => setRange((prev) => (prev && +prev.start === +r.start && +prev.end === +r.end ? prev : { start: r.start, end: r.end }))}
          select={(s) => {
            setModal({ start: s.start.toISOString(), end: s.end.toISOString() });
            calRef.current?.getApi().unselect();
          }}
          eventClick={(info) => {
            const { appt, external } = info.event.extendedProps;
            if (appt) setModal({ id: appt.id });
            else if (external) setBusyEvent(external);
          }}
          eventDrop={move}
          eventResize={move}
        />
      </Card>

      {busyEvent && <BusyEventModal event={busyEvent} onClose={() => setBusyEvent(null)} />}
      {modal && (
        <AppointmentModal
          {...modal}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            load();
          }}
        />
      )}
    </div>
  );
}

/** Session chip: tinted fill + coloured edge, status cues. */
function renderEvent(arg) {
  const { appt, external } = arg.event.extendedProps;
  if (external) {
    return (
      <div className="busy-hatch flex h-full items-start gap-1 overflow-hidden rounded-lg px-1.5 py-1 text-[11.5px] text-[var(--color-ink-2)]">
        <Lock size={11} className="mt-0.5 shrink-0" />
        <span className="truncate font-medium">{arg.event.title}</span>
      </div>
    );
  }
  const color = appt.status === 'cancelled' ? '#9aa1ad' : appt.color || '#7429c3';
  const pending = appt.status === 'pending';
  const month = arg.view.type === 'dayGridMonth';
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg px-1.5 py-1 text-[11.5px] leading-tight text-[var(--color-ink)] ${appt.status === 'cancelled' ? 'line-through opacity-70' : ''}`}
      style={{
        background: `color-mix(in srgb, ${color} 15%, #fffefc)`,
        borderStyle: pending ? 'dashed dashed dashed solid' : 'none none none solid',
        borderWidth: pending ? '1px 1px 1px 3px' : '0 0 0 3px',
        borderColor: color,
      }}
    >
      <div className="flex items-center gap-1">
        {!month && <span className="shrink-0 font-semibold tabular-nums" style={{ color }}>{arg.timeText}</span>}
        {month && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />}
        <span className="truncate font-semibold">{arg.event.title}</span>
      </div>
      {!month && (
        <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[var(--color-muted)]">
          <span className="truncate">{appt.typeName}</span>
          {appt.locationType === 'video' && <Video size={10} className="shrink-0" />}
          {appt.source === 'website' && <Globe size={10} className="shrink-0" title="Booked online" />}
          {appt.clientConfirmedAt && <CheckCheck size={11} className="shrink-0 text-[var(--color-green)]" />}
        </div>
      )}
    </div>
  );
}
