# Therapy Scheduler: Frontend

React (Vite) app for the therapy scheduler. It covers:

- The therapist's dashboard and calendar.
- Clients and settings.
- The public booking page (`/book`).
- The client's manage-booking page (`/a/:token`).

It is styled with Tailwind v4 and lucide icons.

The API lives in a separate repo, **therapy-scheduler-backend**.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` starts the app on http://localhost:5173. In local dev, leave `VITE_API_URL` empty. Requests to `/api` are then forwarded by Vite to the backend at `DEV_API_PROXY` (default `http://localhost:4000`), so the backend must be running.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL, for example `https://api.yourpractice.com`. It is baked in at build time. Leave it empty to use the dev proxy. |
| `DEV_API_PROXY` | Dev only: where `/api` is forwarded when `VITE_API_URL` is empty. |

## Build and deploy

```bash
npm run build
```

This writes a static site to `dist/`. Host it on Netlify, Vercel, Cloudflare Pages, S3 or any static host.

- **Routing:** this is a single-page app, so every path must serve `index.html`. `public/_redirects` (Netlify, Cloudflare) and `vercel.json` (Vercel) are included for that.
- **Backend setting:** set the backend's `FRONTEND_URL` (or `CORS_ORIGINS`) to this site's address, so the API accepts its requests and reminder links point here.

## Layout

```
src/
  api.js             fetch wrapper (uses VITE_API_URL), auth token
  hooks.js           useLive: Server-Sent Events with heartbeat + auto-reconnect
  App.jsx            routes, top bar, notifications, toasts
  pages/             Dashboard, CalendarPage, Clients, Settings, Book, Manage, Login
  components/        ui kit, AppointmentModal, SlotPicker, PublicShell
  styles.css         Tailwind theme (Salonifix design language)
```
