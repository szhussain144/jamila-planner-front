import { useEffect, useRef } from 'react';
import { API_URL, auth } from './api.js';

const STALE_MS = 35_000; // server pings every 15s; silence this long means the connection is dead

/**
 * Subscribe to Server-Sent Events. `handlers` maps event name → callback.
 * A watchdog reconnects when the server goes quiet (e.g. after a restart behind a proxy,
 * where the browser never notices the upstream dropped) and fires `reconnected` so
 * pages can refetch anything they missed. `status(connected)` reports connection state.
 */
export function useLive(channel, handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    let es;
    let last = Date.now();
    let everConnected = false;
    let closed = false;

    const connect = () => {
      const url = API_URL + (channel === 'admin' ? `/api/stream?token=${encodeURIComponent(auth.token || '')}` : '/api/public/stream');
      es = new EventSource(url);
      const seen = () => (last = Date.now());
      es.addEventListener('hello', (e) => {
        seen();
        ref.current.status?.(true);
        if (everConnected) ref.current.reconnected?.();
        everConnected = true;
        ref.current.hello?.(JSON.parse(e.data || '{}'));
      });
      es.addEventListener('ping', seen);
      es.onerror = () => ref.current.status?.(false);
      for (const name of Object.keys(ref.current)) {
        if (['hello', 'status', 'reconnected'].includes(name)) continue;
        es.addEventListener(name, (e) => {
          seen();
          ref.current[name]?.(JSON.parse(e.data || '{}'));
        });
      }
    };

    connect();
    const watchdog = setInterval(() => {
      if (closed || Date.now() - last < STALE_MS) return;
      ref.current.status?.(false);
      es.close();
      last = Date.now();
      connect();
    }, 5_000);

    return () => {
      closed = true;
      clearInterval(watchdog);
      es.close();
    };
  }, [channel]);
}
