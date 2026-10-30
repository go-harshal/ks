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

## Phase 4a — Secure admin sign-in, roles and live enquiries (implemented)
**Auth (Express `/api/v1/auth/*`)**: invitation-only, no public registration. Passwords bcrypt-hashed (12+ chars, upper/lower/number/symbol). Server-side sessions in MongoDB (`sessions`), httpOnly SameSite cookie + double-submit CSRF token (`x-csrf-token`) on every mutating request. Idle expiry (shown in `/auth/me` as `idleMinutes`), 5 failed logins → 15-min lockout, rate-limited login/forgot/reset/invite. Optional TOTP 2FA with one-time recovery codes (`/auth/2fa/setup|enable|disable|verify`). Per-device session list + revoke (`/auth/sessions`). Password change signs out other sessions; role change/deactivation signs the user out everywhere. Security events logged.
**Roles (server-enforced, `src/config/permissions.js`)**: `super_admin` (all), `admin` (manager: leads incl. export/assign, users except super-admin), `team_member` (only leads assigned to them; no export, no users → 403/404).
**Bootstrap**: `node src/scripts/create-superadmin.js <email> "<name>"` prints a time-limited invite link. First Super Admin = admin@kreyszigg.com (see test_credentials.md).
**Users (`/api/v1/admin/users`, `/admin/invitations`)**: invite, resend, revoke, change role, deactivate/reactivate. UI: `/phobos/users`.
**Admin UI**: `/phobos/login`, `/phobos/forgot`, `/phobos/invite/[token]`, `/phobos/reset/[token]`, `/phobos/profile` (password, 2FA, sessions). All `/phobos/*` pages redirect to login without a valid session.
**Public enquiries (`POST /api/v1/enquiries/:type`, type = project|hiring|partnership|contact)**: multipart, validated, consent recorded (version + timestamp), honeypot + min fill time (2.5 s) anti-bot, rate-limited, idempotent duplicate guard. Attachments (project/hiring/partnership): allow-listed types verified by magic bytes, size-capped, random storage keys, private; downloads only via authenticated `/api/v1/admin/files/:id/download` with RBAC. UI: `/contact` (tabs; `?type=` deep-link).
**Leads (`/api/v1/admin/leads`)**: list/search/filter (type, status, assignee), pagination, detail, status (New, Contacted, Qualified, Proposal Sent, Won, Lost), assignee, follow-up date, internal notes, history/audit trail, CSV export. UI: `/phobos/leads`.
**Providers**: email = MOCKED (written to backend log) until SMTP/provider is configured; storage = local private disk until Cloudflare R2 credentials are supplied (same interface).
**Still sample**: dashboard widgets and notifications (Phase 4e/4f). Not yet built: background worker, other public pages (about, work, insights, careers, industries, legal), remaining admin modules.
