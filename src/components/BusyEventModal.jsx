import { DateTime } from 'luxon';
import { CalendarSync, Clock, ExternalLink, Lock, MapPin, UserRound, Video } from 'lucide-react';
import { Button, Modal } from './ui.jsx';

/** Google descriptions can contain HTML; show them as plain text with clickable links. */
function plainText(html) {
  if (!html) return '';
  const withBreaks = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

function Linkified({ text }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noreferrer" className="break-all text-[var(--color-accent)] underline-offset-2 hover:underline">{p}</a>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function when(ev) {
  const s = DateTime.fromISO(ev.start);
  const e = DateTime.fromISO(ev.end);
  if (ev.allDay) {
    const last = e.minus({ days: 1 });
    return last.hasSame(s, 'day') ? `${s.toFormat('cccc d LLLL')} · All day` : `${s.toFormat('d LLL')} – ${last.toFormat('d LLL yyyy')} · All day`;
  }
  const mins = Math.round(e.diff(s, 'minutes').minutes);
  const dur = mins >= 60 ? `${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ''}` : `${mins} min`;
  const range = s.hasSame(e, 'day') ? `${s.toFormat('h:mm a')} – ${e.toFormat('h:mm a')}` : `${s.toFormat('d LLL h:mm a')} – ${e.toFormat('d LLL h:mm a')}`;
  return `${s.toFormat('cccc d LLLL')} · ${range} (${dur})`;
}

/** Read-only details for an event that lives in the therapist's Google Calendar. */
export default function BusyEventModal({ event, onClose }) {
  const description = plainText(event.description);
  const Row = ({ icon: Icon, children }) => (
    <div className="flex gap-3 text-[13px]">
      <Icon size={16} className="mt-0.5 shrink-0 text-[var(--color-faint)]" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );

  return (
    <Modal
      title={event.title || 'Busy'}
      subtitle={
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-panel-alt)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-muted)]">
          <CalendarSync size={11} /> From your Google Calendar
        </span>
      }
      onClose={onClose}
      width="max-w-lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11.5px] text-[var(--color-faint)]">Edit or delete it in Google; the app updates within a minute.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            {event.htmlLink && (
              <a href={event.htmlLink} target="_blank" rel="noreferrer">
                <Button>Open in Google <ExternalLink size={13} /></Button>
              </a>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Row icon={Clock}>{when(event)}</Row>
        {event.location && (
          <Row icon={MapPin}>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent)]">{event.location}</a>
          </Row>
        )}
        {event.meetLink && (
          <Row icon={Video}>
            <a href={event.meetLink} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-accent)] hover:underline">Join video call</a>
          </Row>
        )}
        {event.organizer && <Row icon={UserRound}>Organised by {event.organizer}</Row>}
        {description && (
          <div className="whitespace-pre-line rounded-xl bg-[var(--color-panel-alt)]/60 px-4 py-3 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
            <Linkified text={description} />
          </div>
        )}
        <div className="flex gap-2.5 rounded-xl border border-[var(--color-border)] px-3.5 py-3 text-[12.5px] text-[var(--color-muted)]">
          <Lock size={14} className="mt-0.5 shrink-0" />
          <span>This time is blocked: clients can't book it on your booking page. Only you can see these details.</span>
        </div>
      </div>
    </Modal>
  );
}
