---
name: testing-mml-dashboard
description: How to run and smoke-test the Mml (Jahez) admin dashboard locally — dev server, login credentials, unit tests, and build.
---

# Testing the Mml (Jahez) admin dashboard

## Commands
- `npm test` — vitest unit tests (vitest.config.ts, tests in src/lib/*.test.ts and src/constants/*.test.ts).
- `npm run build` — vite build + esbuild bundle of server.ts to dist/server.cjs.
- `npm run dev` — runs `tsx server.ts`: Express on **http://localhost:3000** with Vite in middleware mode. No separate Vite port.
- `npm run lint` (tsc --noEmit) has a preexisting error in vite.config.ts on main — not a regression signal by itself.

## Login (Arabic RTL UI)
- The login screen authenticates against the Firestore `adminUsers` collection, but there is a hardcoded fallback super admin in `src/components/LoginScreen.tsx` (~line 78): identifier `admin@gmail.com` (or `771122334` or `admin`) with password `admin123`. This works even if Firestore is empty/unreachable.
- Seeded admins (src/services/seedData.ts): admin@gmail.com/admin123, majdallmany3@gmail.com/admin123, others use password123.
- Auth state persists in localStorage key `jahez_auth_user` — clear it to get back to the login screen.

## App structure
- SPA with tab-based sidebar navigation (no routes/URLs per view). Sidebar items include: الرئيسية (dashboard), المتاجر والخدمات (stores), إدارة الطلبات (orders), أسطول وطلبات فزعة (Fazaa fleet), الإدارة والأدوار (admin users), إعدادات النظام.
- Firebase config is committed in `firebase-applet-config.json`; Firestore reads work without extra credentials (stores/orders data loads live).
- The Gemini report endpoint (`POST /api/gemini/report`) requires `GEMINI_API_KEY` in `.env`; without it the server logs "API key should be set" warnings but everything else works.
- Dev console shows a Vite HMR websocket connection warning — harmless, dev-only.

## Devin Secrets Needed
- None for basic smoke testing. `GEMINI_API_KEY` only if testing the AI analytical report feature.
