const TOKEN_KEY = 'ts_token';

/**
 * Base URL of the backend API, e.g. https://api.yourpractice.com
 * Empty in local dev: requests go to /api and Vite proxies them to the backend.
 */
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const auth = {
  get token() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

async function request(method, url, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  const res = await fetch(API_URL + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && !url.startsWith('/api/public') && !url.includes('/auth/login')) {
    auth.set(null);
    window.location.href = '/login';
    return;
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body || {}),
  put: (url, body) => request('PUT', url, body),
  patch: (url, body) => request('PATCH', url, body),
  del: (url) => request('DELETE', url),
};

export const qs = (params) =>
  '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
