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
**Providers**: email — see Phase 4b; storage = local private disk until Cloudflare R2 credentials are supplied (user chose to keep files on server for now).
**Still sample**: dashboard widgets and notifications (Phase 4e/4f). Not yet built: background worker, other public pages (about, work, insights, careers, industries, legal), remaining admin modules.

## Phase 4b — Email delivery, live lead alerts, remaining public pages (implemented)
**Email** (`api/src/providers/email`): MongoDB outbox `emailDeliveries` (written before send, body removed after delivery). Driver `smtp` (nodemailer) when `SMTP_HOST` is set, else `log` (MOCKED: printed to backend log). Env: SMTP_HOST, SMTP_PORT (587 STARTTLS / 465 TLS), SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM=no-reply@kreyszigg.com, EMAIL_ALERT_TO=info@kreyszigg.com. Failed sends retry with exponential backoff (max 6 attempts) via platform cron `.emergent/crons.yml` → `POST /api/cron/email-retry` every 15 min (Bearer WEBHOOK_CRON_SECRET, 202 ack, work backgrounded). New-enquiry alerts go to EMAIL_ALERT_TO only; invites/resets/assignment to the person. Status + test email: `GET /api/v1/admin/system/email`, `POST /api/v1/admin/system/email/test` (settings.manage = Super Admin) → UI `/phobos/settings`.
**Live alerts** (`api/src/modules/notifications`): `notifications` collection; audience = userId (e.g. lead assigned) or permission (`leads.view_all` for new enquiries). SSE stream `GET /api/v1/admin/events` (session re-checked every 25 s; compression disabled for it). `GET /admin/notifications`, `POST /admin/notifications/read-all`, `POST /admin/notifications/:id/read`. UI (`components/admin/useNotifications.js`): pop-up toast, bell badge + list, soft WebAudio chime (mute toggle, saved in localStorage), desktop notification when tab is in background (permission button in bell panel), Live/Offline indicator, 60 s polling fallback, Leads table auto-refreshes (`ks:leads-changed`).
**Public pages**: /about, /work, /insights, /careers, /industries + /industries/[slug] (copy in `web/lib/industries.js`, problems/solutions only), /partnerships, /services, /hire-developers/[slug], /privacy, /terms, /cookies (preferences UI). Unverified business content (team, case studies, articles, jobs, culture) shows public empty states + preview-only ContentSlot markers. Legal pages are DRAFTS pending legal review.

## Phase 4c — Live dashboard, follow-up reminders, case studies, careers (implemented)
**IMPORTANT fix**: `users/routes.js` and `leads/adminRoutes.js` router-level guards are now path-scoped (`router.use(['/users','/invitations'], …)`, `router.use(['/leads','/files'], …)`). A bare `router.use(authorize(...))` on an `/admin` sub-router gates every router mounted after it.
**Dates**: `api/src/utils/dates.js` — business day anchored to India (UTC+05:30, `BUSINESS_TZ_OFFSET_MIN`).
**Dashboard** `GET /api/v1/admin/dashboard?range=today|7|30|90|custom&from&to` → KPIs by status, conversion (win rate = won/closed, lead-to-win = won/total), sources (UTM source → search/social/referrer host → Direct), by type, 6-month trend, recent, follow-ups (overdue / today / next 7 days), plus review queue (content.manage) and new applications (applications.manage). Team Members get `scope: 'mine'` (assigned leads only). UI `components/admin/Dashboard.jsx` (layout customisation in localStorage `ks-dashboard-layout-v2`; refreshes on live alerts).
**Follow-up reminders** `api/src/modules/reminders/service.js`; cron `followup-reminders` 09:00 Asia/Kolkata → `POST /api/cron/followup-reminders` (Bearer WEBHOOK_CRON_SECRET, 202). One email + in-app notification per owner with open leads overdue or due today; unassigned → EMAIL_ALERT_TO. Idempotent per owner per day (`followup:<owner>:<YYYY-MM-DD>` dedupeKey). Manual run: `POST /api/v1/admin/system/reminders/run` (Super Admin).
**Content workflow** `api/src/modules/content/factory.js` for case studies (`/admin/case-studies`) and jobs (`/admin/jobs`): statuses draft → in_review → published / archived. `content.manage` (Admin, Super Admin) creates, edits, publishes, returns with a note, unpublishes, archives, deletes. `content.draft` (Team Member) creates drafts, edits own draft/in-review items, submits, deletes own drafts; sees own + published. Case-study rules: named client requires a name; results require `resultsVerified`. Cover images: `POST /admin/media` (PNG/JPG/WebP ≤5 MB, magic-byte check) served by `GET /public/media/:id`.
**Public**: `/work` (published case studies, industry filter, featured first card) + `/work/[slug]`; `/careers` (open jobs) + `/careers/[slug]` (JobPosting JSON-LD + ApplyForm). Pages are dynamic, so publishing shows immediately.
**Applications** `POST /public/applications` (multipart, CV PDF/DOC/DOCX ≤5 MB required, magic bytes, honeypot + min fill time, rate limit, one per email per role per 24 h, closed/unpublished jobs rejected) → `applications` collection; email to HR_EMAIL (hr@kreyszigg.com), confirmation to the candidate, live alert to applications.manage. Inbox `/phobos/careers/applications`: filter, status (New → Hired/Rejected), notes, private CV download `GET /admin/applications/:id/cv`.

## Phase 4d — Insights blog, team profiles, weekly pipeline email (implemented)
**Articles** (`/admin/articles`, model `Article`, collection `articles`): same draft → in_review → published workflow (factory). Rich-text body from the Phobos toolbar (`components/admin/RichText.jsx`, contentEditable) is re-sanitised server-side with sanitize-html to p/h2/h3/strong/em/ul/ol/li/a(href http/https/mailto, rel noopener)/blockquote/br. readingMinutes = words/220. Fields: category, tags, excerpt, featured, cover image, authorProfileId (published TeamProfile), SEO. Public: `GET /public/articles`, `/public/articles/:slug` → `/insights` (category filter, featured first) and `/insights/[slug]` (byline links to `/about#team-<slug>`, Article JSON-LD).
**Team profiles** (`/admin/team`, model `TeamProfile`): name, title, bio, photo, LinkedIn, isFounder, order; slug from name (`slugFrom: 'name'`). Admins publish/archive (hide); Team Members draft their own. Public `GET /public/team` (founders first, then order) → About page "Our team" section with `id="team-<slug>"` anchors; empty state when none published.
**Weekly pipeline** `api/src/modules/reminders/weekly.js`; cron `weekly-pipeline` Mondays 09:00 Asia/Kolkata → `POST /api/cron/weekly-pipeline`. Previous Mon–Sun (business tz): new leads by type and source, won/lost (from status history in the week), win rate, open pipeline, overdue follow-ups. Sent to EMAIL_ALERT_TO (company view) and every active user (Admins/Super Admins company view; Team Members only their assigned leads) + in-app notification. Idempotent `weekly:<email>:<weekStart>`. Manual: `POST /api/v1/admin/system/weekly/run` (Super Admin).
**Crons** (.emergent/crons.yml): email-retry (*/15), followup-reminders (09:00 IST daily), weekly-pipeline (09:00 IST Mondays).
**Test content**: all QA-created articles, case studies, jobs and profiles were ARCHIVED (hidden from the public site). The public pages show their empty states until real content is published.
