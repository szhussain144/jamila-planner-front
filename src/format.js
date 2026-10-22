import { DateTime } from 'luxon';

export const fmt = (iso, tz, f = "ccc d LLL, h:mm a") => DateTime.fromISO(iso).setZone(tz || 'local').toFormat(f);
export const fmtTime = (iso, tz) => fmt(iso, tz, 'h:mm a');
export const fmtDay = (iso, tz) => fmt(iso, tz, 'cccc, d LLLL yyyy');

export const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No-show',
};

export const LOCATION_LABEL = { in_person: 'In person', video: 'Video call', phone: 'Phone call' };
