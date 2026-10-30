# Kreyszigg Softbizz — Living Spec

Status: **Phase 3 (UI/UX design system + representative pages) built. Awaiting client visual approval.**
Plan docs: `memory/PLANNING.md` (Phase 1, approved), `memory/ARCHITECTURE.md` (Phase 2, approved with admin path = `/phobos`), `/app/design_guidelines.json`.

## Stack (client-mandated)
- `web/`: Next.js 16 App Router, **JavaScript/JSX only**, CSS Modules + CSS variables (no UI kit), Ubuntu font self-hosted (@fontsource/ubuntu 400/500/700).
- `api/`: Express 5 REST at `/api/v1`, Mongoose, MongoDB (in-pod `kreyszigg` DB for dev).
- The old FastAPI/Vite TypeScript template was moved to `/app/_legacy_template/` (not used).
- Preview runners (supervisor): `backend` = `node --watch src/server.js` in `/app/api` (port 8001); `frontend` = `yarn preview` (`next build && next start`, port 3000) in `/app/web`.
  - Production mode is used because the Next dev HMR websocket gets a 502 through the preview ingress, which blocks hydration.
  - **Frontend edits need `sudo supervisorctl restart frontend`** (about 30 s rebuild).
- Next rewrites `/api/*` → `API_INTERNAL_URL` (default http://localhost:8001).

## Built so far
- Public: `/` Home (10 PRD sections; trust/featured work/testimonials/insights are hidden when empty; dashed "design-review slots" show only when `NEXT_PUBLIC_SHOW_CONTENT_SLOTS=true`), `/services/[slug]` (all 11 services, SSG + ISR 60 s), `/hire-developers`.
- Global: sticky header + services mega menu (plus an Industries column), mobile drawer (focus trap, Esc), Deep Slate footer (logo on an ivory plate), WhatsApp FAB (renders only if configured), cookie banner (localStorage `ks-consent`), branded 404.
- Newsletter form: UI and validation only. It explicitly states subscriptions open in Phase 4c and stores nothing.
- Admin design preview: `/phobos` (Dashboard) and `/phobos/leads`.
  - **SAMPLE DATA ONLY**: no auth, nothing persisted server-side.
  - Light/dark theme (OS default on first visit, `localStorage ks-admin-theme`).
  - Widget show/hide/reorder/reset (localStorage), date filters, KPI drill-down to leads, leads search/filter/pagination/detail drawer, client-side CSV export of sample data.
  - The other 12 modules appear as disabled "Phase 4" items.
- `/planning.html` and `/architecture.html` are static renders of the plan docs.

## API (public, read-only so far)
`GET /api/v1/health`, `/api/v1/public/settings` (public-safe subset), `/public/services`, `/public/services/:slug` (404 envelope if missing), `/public/process-steps`, `/public/hiring-catalog` (technologies 25, categories 10, levels 4, models 6, steps 6), `/public/industries` (12).
Envelope: `{data}` / `{error:{code,message}}`.

## Seed (`cd /app/api && yarn seed`, idempotent)
- 11 services (draft copy, `isPlaceholder: true`).
- 7 process steps and the hiring taxonomy, all from the PRD.
- 12 industries.
- Settings: contact email `hello@kreyszigg.com` (PRD-suggested, **unverified**); WhatsApp/meeting/social **disabled** until the client supplies them.

## Design decisions
- Muted Copper (#A56F4E) fails AA for small text, so it is used for large numerals, rules and focus rings only. Small copper text uses `--copper-ink #8C5B3E`. Primary buttons are Deep Slate.
- Placeholder images (Unsplash/Pexels, abstract architecture/texture only) carry a visible "Placeholder image" tag.

## Auth / credentials
None yet (Phase 4a). No accounts exist.
