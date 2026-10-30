# Kreyszigg Softbizz — Phase 2: Architecture & Development Plan

Status: **APPROVED** with changes: admin path is `/phobos`; Q1, Q3, Q5 defaults confirmed; placeholder images allowed.
Inputs: approved Phase 1 plan (`PLANNING.md`) + client change: **Ubuntu typography**.

Working assumptions for the Phase 1 questions you haven't answered yet. Each can be changed at this gate:
- **Q1 build environment**: build the approved Next.js (JSX) + Express stack in this workspace and replace the FastAPI/TypeScript starter.
- **Q3 PRD gaps**: use the defaults proposed in G-3…G-13.
- **Q4 imagery**: typographic, imagery-light direction until real assets arrive. Team, Portfolio and Testimonials stay hidden while empty.
- **Q5 logo**: use the supplied files exactly as given, on light surfaces only. In the footer the logo sits on a Warm Ivory plate. A white version needs your approval.

---

## 1. Key architecture decisions (ADR summary)

| # | Decision | Why | Alternatives rejected |
|---|---|---|---|
| AD-1 | **Monorepo, two apps**: `web/` (Next.js 16, App Router, JS/JSX) and `api/` (Express 5). A third process, `worker`, reuses `api/` code with a different entrypoint. | Matches PRD §11 (separate apps). Shared code is kept in one repo for one deploy pipeline. | Next.js API routes (the PRD forbids them as the backend) |
| AD-2 | **Admin lives inside the Next app at `/admin`**, with its own route group, layout, CSS tokens and theme, set to noindex and rendered client-side. | One frontend container (PRD §11.2) and shared build tooling, with a completely separate visual system (PRD §8.6). | A third frontend app (extra container and RAM on the free VM) |
| AD-3 | **Server-side sessions in MongoDB**, sent as an opaque cookie (`ks_sid`, HttpOnly, Secure, SameSite=Lax), plus a CSRF double-submit token. | Needed for single-session logout, idle and absolute expiry, instant revocation on deactivation (§12.1). | Stateless JWT (can't be revoked per session without a denylist) |
| AD-4 | **Mongo-backed job queue** (`jobs` collection) processed by the `worker` container. | Provides retry/backoff, dedupe keys and scheduled reminders with no Redis, which saves RAM and cost on the free tier. | BullMQ + Redis (extra service) |
| AD-5 | **Socket.IO** for real-time notifications, authenticated with the session cookie and using per-user rooms. Worker → API delivery goes through a lightweight Mongo "outbox" polled every 2 s by the API. | Works through Nginx + Cloudflare. Does not need Atlas change streams (M0 limits). | SSE (no bidirectional ack); change streams (tier-dependent) |
| AD-6 | **Mongoose** ODM + **Zod** validation (plain JS). | Schema-level indexes and hooks. Zod schemas can be shared with the frontend for identical client/server validation. | Raw driver (more boilerplate); Joi (cannot share cleanly) |
| AD-7 | **StorageProvider abstraction** with drivers `r2` (S3 API) and `local` (dev/test). | PRD §11.4 portability; works before R2 credentials exist. | Direct R2 calls in controllers |
| AD-8 | **EmailProvider abstraction**, default `smtp` (nodemailer), plus `log` driver for dev. | Existing business email (§7.8); newsletter provider must be configurable (§16.1). | Hard-wiring a SaaS email API |
| AD-9 | **CSS Modules + CSS custom properties**, no UI kit on the public site; a small in-house admin component library. | Avoids the generic template look (PRD §4.2) and keeps the JS bundle small for Core Web Vitals. | Tailwind/shadcn defaults, MUI (recognisable "AI template" look, heavier) |
| AD-10 | **Public pages: SSG/ISR** with on-demand revalidation (`POST /api/revalidate` on the Next side, called by Express after publish, protected by a shared secret). | SEO + performance (§14), with admin edits live within seconds. | Full SSR on every request (slower, more VM load) |
| AD-11 | **Ubuntu font self-hosted** via `@fontsource/ubuntu` (weights 400, 500, 700 + 400 italic), with `font-display: swap` and preloading. | Client decision; Ubuntu Font Licence allows web embedding. Ubuntu has no 600 weight, so "Semibold" roles use **Medium 500**. The supplied wordmark appears to be set in a similar humanist face, which makes the type cohesive. | Google Fonts CDN (third-party request, privacy) |

---

## 2. Repository & folder structure

```
kreyszigg-softbizz/
├── web/                         # Next.js 16 — JavaScript/JSX only
│   ├── app/
│   │   ├── (public)/            # public route group, brand layout
│   │   │   ├── layout.jsx       # Header, Footer, WhatsApp FAB, CookieBanner
│   │   │   ├── page.jsx         # Home
│   │   │   ├── about/{page.jsx, team/, approach/}
│   │   │   ├── services/{page.jsx, [slug]/page.jsx}
│   │   │   ├── hire-developers/{page.jsx, technologies/, models/, [category]/}
│   │   │   ├── work/{page.jsx, [slug]/page.jsx}
│   │   │   ├── industries/{page.jsx, [slug]/page.jsx}
│   │   │   ├── partnerships/page.jsx
│   │   │   ├── insights/{page.jsx, [slug]/, category/[slug]/, tag/[slug]/}
│   │   │   ├── careers/{page.jsx, [slug]/page.jsx}
│   │   │   ├── contact/page.jsx
│   │   │   ├── privacy/ terms/ cookies/
│   │   │   └── newsletter/{confirm/, unsubscribe/}
│   │   ├── admin/               # admin area, separate layout + theme, noindex
│   │   │   ├── login/ invite/[token]/ reset/[token]/ two-factor/
│   │   │   ├── (shell)/layout.jsx   # Sidebar, Topbar, NotificationBell, ThemeToggle, IdleTimer
│   │   │   ├── (shell)/dashboard/  leads/{page.jsx,[id]/}  portfolio/  services/
│   │   │   ├── (shell)/developer-categories/  insights/  careers/  team/  testimonials/
│   │   │   ├── (shell)/partnerships/  newsletter/  reports/  users/  settings/  notifications/  profile/
│   │   ├── api/revalidate/route.js  # ISR hook only (no business logic)
│   │   ├── sitemap.js  robots.js  not-found.jsx  error.jsx
│   ├── components/
│   │   ├── public/   (layout/, sections/, forms/, cards/, media/)
│   │   ├── admin/    (shell/, data-table/, forms/, widgets/, charts/, editors/)
│   │   └── shared/   (Button, Field, Dialog, Toast, Icon, VisuallyHidden, Logo)
│   ├── lib/          api-client.js, seo.js, analytics.js (consent-aware GA4), consent.js,
│   │                 whatsapp.js, socket.js, validators/ (re-exported shared Zod)
│   ├── styles/       tokens.public.css, tokens.admin.css, globals.css, typography.css
│   ├── public/brand/ (supplied logo files, unmodified)
│   └── next.config.mjs, jsconfig.json, Dockerfile
├── api/                         # Express 5 — JavaScript
│   ├── src/
│   │   ├── app.js  server.js  worker.js
│   │   ├── config/        env.js (validated env), constants.js, permissions.js
│   │   ├── db/            connect.js, indexes.js, seed/
│   │   ├── middleware/    auth.js, authorize.js, csrf.js, rateLimit.js, validate.js,
│   │   │                  upload.js, error.js, requestId.js, sanitize.js, idempotency.js
│   │   ├── modules/       one folder per domain:
│   │   │   auth/ users/ invitations/ sessions/ leads/ notes/ followups/
│   │   │   notifications/ email/ newsletter/ files/ services/ portfolio/
│   │   │   devcategories/ blog/ careers/ applications/ team/ testimonials/
│   │   │   partnerships/ industries/ pages/ settings/ dashboard/ reports/
│   │   │   backups/ security/ public/
│   │   │   └─ each: model.js, schema.js (Zod), service.js, controller.js, routes.js
│   │   ├── providers/     storage/{index,r2,local}.js, email/{index,smtp,log}.js,
│   │   │                  scanner/{index,clamav,none}.js, images/sharp.js
│   │   ├── jobs/          queue.js, handlers/{sendEmail, followupReminder, overdueCheck,
│   │   │                  backup, restoreTest, retentionPurge, cleanup}.js, scheduler.js
│   │   ├── realtime/      socket.js, outbox.js
│   │   └── utils/         tokens.js, crypto.js, pagination.js, csv.js, xlsx.js, dates.js
│   ├── tests/             unit/, integration/ (supertest + mongodb-memory-server), rbac/
│   └── Dockerfile
├── shared/                validation schemas + enums used by both apps (lead statuses, types…)
├── deploy/                docker-compose.yml, docker-compose.dev.yml, nginx/, certbot/,
│                          scripts/{backup.sh, restore.sh, restore-test.sh}
├── docs/                  ARCHITECTURE.md, API.md, ENV.md, DEPLOYMENT.md, BACKUP_RESTORE.md,
│                          SECURITY.md, QA_CHECKLIST.md, CONTENT_GUIDE.md
└── .env.example  .github/workflows/ci.yml
```

In this Emergent workspace, `web/` is served on port 3000 (preview) and `api/` on port 8001 (`/api` proxy), with the in-pod MongoDB.

---

## 3. Component architecture

**Public (brand system).** Pages are composed from a deliberately varied section library, not one repeated card block:
`HeroEditorial` (asymmetric headline + CTA pair), `StatementBand`, `ServiceIndex` (numbered typographic index, not cards), `SplitFeature`, `ProcessTimeline` (7 stages, horizontal on desktop, vertical on mobile), `TechMatrix` (grouped taxonomy table), `EngagementModelsTable`, `CaseStudyMosaic`, `CaseStudyBody`, `ArticleList`, `QuoteBlock` (only renders authorized testimonials), `CTAPanel`, `FAQAccordion`, `Breadcrumbs`, `JsonLd`.
Forms: `EnquiryForm` (config-driven: project/hiring/partnership/contact), `ApplicationForm`, `NewsletterForm`. All share `Field`, `FileDrop`, `ConsentCheckbox`, `FormStatus` (aria-live), plus honeypot and idempotency key.
Global: `Header` + `MegaMenu` + `MobileDrawer`, `Footer`, `WhatsAppButton` (contextual message map), `MeetingCTA` (respects the settings toggle), `CookieBanner` + `CookiePreferences`.

**Admin (separate system).** The `AdminShell` contains Sidebar (filtered by permissions), Topbar, `NotificationBell`, `ThemeToggle` and `IdleTimer`.
Reusable building blocks: `DataTable` (server pagination/sort/filter/search, column config, bulk actions, export), `RecordForm` (Zod-driven), `RichTextEditor` (Tiptap, output sanitized server-side), `MediaPicker`, `SEOFields`, `PublishControls` (draft/preview/publish/schedule), `ConfirmDialog`, `EmptyState`/`ErrorState`/`Skeleton`, `StatusBadge`, `DateRangeFilter`.
Dashboard: a `WidgetGrid` (dnd-kit, keyboard-accessible drag + "move up/down" fallback) rendering registered widgets: `KpiWidget`, `DistributionChart`, `TrendChart`, `RecentLeads`, `UpcomingFollowups`, `WebsiteAnalytics`, `SubscribersWidget`, `ActivityWidget`. Charts use Recharts.

Data fetching: TanStack Query in admin; server-side `fetch` with ISR tags on the public site.

---

## 4. API architecture (`/api/v1`)

Conventions: JSON; envelope `{ data, meta }` / errors `{ error: { code, message, fields? } }`; list query `?page&limit(≤100)&sort=-createdAt&q&filter[...]`; Zod validation on body/query/params; `requestId` on every response; rate limits per route group. State-changing admin routes require the session + CSRF header.

| Domain | Public endpoints | Admin endpoints (permission) |
|---|---|---|
| Auth | — | `POST /auth/login`, `/auth/2fa/verify`, `/auth/logout`, `GET /auth/me`, `POST /auth/password/forgot`, `/auth/password/reset`, `GET/POST /auth/invitations/:token` (accept), `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/2fa/setup|enable|disable` |
| Users | — | `GET/POST /admin/users` (`users.manage`), `PATCH /admin/users/:id`, `POST /admin/users/:id/deactivate|reactivate`, `GET /admin/users/:id/sessions`, `DELETE …/sessions/:sid`; `GET/POST /admin/invitations`, `POST …/:id/resend`, `POST …/:id/revoke` |
| Leads | `POST /public/enquiries` (type-specific schema, multipart) | `GET /admin/leads` (scope-filtered), `GET/PATCH /admin/leads/:id`, `POST …/:id/assign` (`leads.assign`), `GET/POST …/:id/notes`, `GET/POST/PATCH …/:id/followups`, `GET /admin/followups?view=upcoming|overdue`, `GET /admin/leads/export?format=csv|xlsx` (`leads.export`) |
| Files | — | `GET /admin/files/:id/download` (RBAC check, returns 60-second signed URL), `POST /admin/media` (public uploads), `POST /admin/files/:id/release` (quarantine) |
| Content (services, process, devcategories, technologies, models, levels, industries, portfolio, blog, categories, tags, team, testimonials, partnerships, pages) | `GET /public/<resource>` and `/public/<resource>/:slug` (published only), `GET /public/search?q=` (insights) | `GET/POST /admin/<resource>`, `GET/PATCH/DELETE /admin/<resource>/:id`, `POST …/:id/publish|unpublish`, `GET …/:id/preview-token`, `PATCH /admin/<resource>/reorder` (`content.manage`) |
| Careers | `GET /public/jobs`, `GET /public/jobs/:slug`, `POST /public/jobs/:id/apply` | `/admin/jobs` CRUD + archive; `/admin/applications` list/detail/status (`applications.manage`) |
| Newsletter | `POST /public/newsletter/subscribe`, `GET /public/newsletter/confirm?token=`, `POST /public/newsletter/unsubscribe` | `GET /admin/subscribers`, `PATCH …/:id`, `GET …/export` (`newsletter.manage`) |
| Notifications | — | `GET /admin/notifications`, `GET …/unread-count`, `POST …/:id/read`, `POST …/read-all`, `GET/PUT /admin/me/notification-preferences`; SA: `GET/PUT /admin/notification-rules`, `GET/PUT /admin/email-templates/:event`, `GET /admin/email-deliveries`, `POST /admin/settings/test-email` |
| Dashboard / Reports | — | `GET /admin/dashboard/widgets?from&to`, `GET/PUT/DELETE /admin/me/dashboard-layout`, `GET /admin/reports/*`, `…/export` (`reports.view`) |
| Settings | `GET /public/settings` (public-safe subset only) | `GET/PUT /admin/settings/:group` (`settings.manage`) |
| Tracking | `POST /public/events` (whatsapp_click, meeting_click — no PII, consent-aware) | — |
| Backups | — | `GET /admin/backups`, `POST /admin/backups/run` (Super Admin only) |
| DSR / privacy | — | `GET /admin/privacy/lookup?email=`, `POST /admin/privacy/export|anonymize` (Super Admin only) |

A full OpenAPI-style reference will be delivered as `docs/API.md` during build.

---

## 5. MongoDB collections & relationships

All documents use a string `_id` (UUID v4), `createdAt`/`updatedAt` (UTC) and soft-delete where relevant. Arrows show references.

| Collection | Key fields | Relations / indexes |
|---|---|---|
| `users` | name, email(unique, lowercased), role(`super_admin`/`admin`/`team_member`), grants[], status(`invited`/`active`/`deactivated`), passwordHash(argon2id), twoFactor{enabled, secretEnc, recoveryHashes[]}, failedLogins, lockedUntil, prefs{theme, emailPrefs{event:bool}}, lastLoginAt | email unique |
| `invitations` | email, role, grants, tokenHash, expiresAt, invitedBy→users, status(`pending`/`accepted`/`revoked`/`expired`) | tokenHash unique; TTL cleanup |
| `sessions` | userId→users, idHash, ip(truncated), userAgent, createdAt, lastSeenAt, expiresAt, revokedAt | idHash unique; TTL on expiresAt |
| `authTokens` | userId, type(`reset`/`2fa_challenge`), tokenHash, expiresAt, usedAt | TTL |
| `leads` | type(`project`/`hiring`/`partnership`/`contact`), status(6), contact{name,email,company,website}, payload{…type-specific}, attachments[]→fileAssets, source{utm, referrer, page, cta}, consent{version, at}, assigneeId→users, nextFollowUpAt, idempotencyKey, spamScore | idx: status+createdAt, type+createdAt, assigneeId+status, nextFollowUpAt, text(name,email,company); idempotencyKey unique sparse |
| `leadNotes` | leadId→leads, authorId→users, body | leadId+createdAt |
| `leadEvents` | leadId, actorId, kind(`status`/`assign`/`followup`/`created`), from, to | operational history for the lead record (not a global audit log) |
| `followUps` | leadId→leads, ownerId→users, dueAt, note, status(`open`/`done`/`cancelled`), remindedUpcomingAt, remindedOverdueAt | dueAt+status; ownerId |
| `notifications` | recipientId→users, event(10 enum), title, body, ref{type,id}, readAt, dedupeKey | recipientId+readAt+createdAt; (recipientId+dedupeKey) unique |
| `notificationRules` | event, inApp{roles[]}, email{enabledByDefault, userCanOptOut, userCanOptIn, recipientsMode, extraAddresses[]} | event unique |
| `emailTemplates` | event, subject, html, text, variables[], updatedBy | event unique |
| `emailDeliveries` | event, templateVersion, to(masked in UI), providerMessageId, status(`queued`/`sending`/`sent`/`retrying`/`failed`), attempts, lastError{code, message(sanitised)}, dedupeKey, nextAttemptAt | dedupeKey unique; status+nextAttemptAt |
| `jobs` | type, payload, status, attempts, maxAttempts, runAt, lockedAt, lockedBy, dedupeKey, lastError | status+runAt; dedupeKey unique sparse |
| `outbox` | userIds[], event, data, deliveredAt | TTL 1h |
| `services` | name, slug, category(mega-menu group), summary, sections[], capabilities[], priority, order, seo{}, status, isPlaceholder | slug unique |
| `processSteps` | order, title, description, appliesTo[] | — |
| `devCategories` | name, slug, summary, skills[], technologyIds[]→technologies, seo, status | slug unique |
| `technologies` | name, group(frontend/backend/mobile/database/cloud/other), order | — |
| `engagementModels`, `experienceLevels`, `hiringSteps` | name, description, order (levels: yearsMin/Max) | — |
| `industries` | name, slug, problems[], solutions[], relatedServiceIds[], seo, status | slug unique |
| `portfolioProjects` | title, slug, industryId→industries, overview, challenge, approach, solution, technologyIds[], coverImage→fileAssets, gallery[]→fileAssets, results[]{text, verified}, testimonialId→testimonials, confidentiality(`public`/`anonymized`/`confidential`), isDemo, status, seo | slug unique; status+industryId |
| `testimonials` | quote, personName, role, company, permission{granted, evidenceNote, date, approvedBy}, status | publish blocked unless permission.granted |
| `teamMembers` | name, title, bio, photo→fileAssets, links, isFounder, order, verified, status | — |
| `partnershipTypes`, `partners` | name, description, order / partner name, logo, url, authorizedAt, status | — |
| `blogPosts` | title, slug, excerpt, body(sanitised HTML), coverImage, authorId→teamMembers, categoryIds[], tagIds[], featured, status(`draft`/`scheduled`/`published`), publishAt, readingMinutes, seo | slug unique; status+publishAt; text index |
| `blogCategories`, `tags` | name, slug | slug unique |
| `jobOpenings` | title, slug, description, employmentType, experience, location, status(`draft`/`open`/`closed`/`archived`), publishedAt, closedAt | slug unique |
| `applications` | jobId→jobOpenings, applicant{name,email,phone,links}, coverNote, cvFileId→fileAssets, consent, status(New/Reviewing/Shortlisted/Interview/Offered/Hired/Rejected) | jobId+status |
| `newsletterSubscribers` | email(unique), status(`pending`/`confirmed`/`unsubscribed`), confirmTokenHash, unsubscribeToken, consent{source, page, version, at, ipHash}, confirmedAt, unsubscribedAt | email unique |
| `fileAssets` | storageKey, bucket(`public`/`private`), originalName, mime, size, sha256, visibility, owner{type,id}, scan{state(`pending`/`clean`/`infected`/`unscanned`), at}, variants[] (public images) | owner.type+owner.id |
| `contentPages` | key(`about-story`, `about-approach`, `privacy`, `terms`, `cookies`, `careers-culture`, `partnerships`), sections[], version, status, seo | key unique |
| `websiteSettings` | single document grouped as: contact, whatsapp, meeting, social, emailRouting, ack, analytics, uploads, security, notifications, backups, features | singleton |
| `dashboardPreferences` | userId→users(unique), widgets[{id, visible, order, size}] | userId unique |
| `securityEvents` | kind(login_success/failure, lockout, password_reset, invite_sent/accepted/revoked, role_change, user_deactivated, 2fa_change, session_revoked), userId, ip(truncated), meta | createdAt; TTL 180 days (operational security record only) |
| `trackingEvents` | kind(whatsapp_click/meeting_click/form_submit), page, context, day | aggregate counts only, no PII |
| `backupJobs` | trigger(scheduled/manual), startedAt, endedAt, status, objectKey, sizeBytes, sha256, retentionClass(daily/weekly), verifiedAt, error | createdAt |
| `consentRecords` | subjectType, subjectId, policyKey, version, granted, at | — |

---

## 6. Authentication & authorization

- **Login flow**:
  1. Rate limit (IP + email) → constant-time check → argon2id verify.
  2. On failure, increment `failedLogins`. 5 failures → `lockedUntil = now + 15 min`, a security event, and notification event #10.
  3. If 2FA is enabled or required, return a short-lived challenge → TOTP or recovery code.
  4. Create the session, rotate the cookie, and record a security event.
- **Session policy**: idle timeout (default 30 min; server slides `lastSeenAt`, client `IdleTimer` warns at 2 min) and absolute timeout (12 h). Sessions are revoked on deactivation, password change or role change (except the current session).
- **Invitations**: Super Admin creates → 32-byte random token (only the SHA-256 hash is stored) → email link valid 72 h → invitee sets a policy-compliant password → user becomes active. Resend issues a new token and invalidates the old one. Revoke marks it revoked.
- **Password reset**: always responds "if the account exists…" (prevents finding out which emails have accounts). The token is valid 30 min and single-use. A successful reset revokes all sessions.
- **RBAC**: `config/permissions.js` maps roles to permission sets. `authorize('leads.export')` middleware checks role permissions plus per-user `grants`, and Super Admin-only permissions can't be granted to a Team Member.
- **Record-level scope**: `leadScope(user)` returns `{}` for Admin+ and `{ assigneeId: user._id }` for Team Members. It is applied in every lead/note/follow-up/file query. Out-of-scope requests return 404, so the record's existence isn't revealed.
- **Field-level rules**: Team Members may only change `status` and follow-ups, and add notes. Any other field in the body → 403.
- Notification click-through is re-authorized when the target record loads, and file downloads are re-authorized before a URL is signed.

---

## 7. File upload & storage

Flow: `multer` (memory, size cap from settings) → extension allow-list + magic-byte check (`file-type`) + MIME match → safe key `private/leads/2026/05/<uuid>.<ext>` → upload to R2 → `fileAssets` record with `scan.state=pending` → `scanFile` job (ClamAV if enabled; otherwise `unscanned`). Infected files are moved to `quarantine/` and trigger event #10.

- **Private bucket**: no public access. Downloads only via the API, which issues a 60-second presigned GET with `Content-Disposition: attachment`.
- **Public bucket** (CMS media): `sharp` generates WebP/AVIF variants (480/960/1600w) and strips EXIF. Files are served from the R2 public domain or a custom subdomain, with alt text required.
- **Defaults** (editable): attachments PDF/DOC/DOCX/PPT/PPTX/XLS/XLSX/PNG/JPG/ZIP up to 10 MB; CVs PDF/DOC/DOCX up to 5 MB; images JPG/PNG/WebP up to 8 MB.

---

## 8. Notification & email architecture

```
domain event (e.g. lead.created)
   └─> notify(event, ref, context)
         ├─ resolve recipients: rules.inApp roles ∩ record scope (Team Members only if assigned)
         ├─ insert notifications (unique recipientId+dedupeKey)  → outbox → Socket.IO room user:<id>
         └─ for each recipient where email allowed (SA rule ∧ user pref within limits)
               enqueue job sendEmail (dedupeKey = event:refId:recipient[:occurrence])
worker: sendEmail → render template (Handlebars, escaped vars) → provider.send
        success → delivery.status=sent, providerMessageId
        failure → retrying, backoff 1m,5m,15m,1h,6h (max 5) → failed + event #10 if repeated
```

- **Dedupe keys**: e.g. `lead.created:<leadId>:<userId>`, `followup.upcoming:<followUpId>:<dueAtISO>`, `followup.overdue:<followUpId>:<dueAtISO>`. Rescheduling a follow-up creates a new occurrence key.
- **Scheduler** (worker, every minute, timezone from settings): finds open follow-ups with `dueAt - leadTime ≤ now` and no `remindedUpcomingAt`; marks them atomically, then notifies. Overdue works the same way at `dueAt + grace`.
- **Events → default recipients**:
  - #1–4 (new enquiries): Super Admin + Admin, plus the routed email alias.
  - #5 (job application): Admin+ with `applications.manage`.
  - #6 (newsletter subscription): Admin+, in-app only by default.
  - #7 (lead assigned): the assignee.
  - #8–9 (follow-ups): follow-up owner + assignee.
  - #10 (admin/security activity): Super Admin.
  - All of these are editable by Super Admin.
- **Templates**: per event (subject/html/text) with a variable whitelist, preview with sample data, and reset to default. System templates (invitation, password reset, newsletter confirmation, acknowledgement) can also be edited.
- **Logs**: `emailDeliveries` stores status, attempts, error code and sanitized message. No message bodies or secrets. Recipients are partially masked in the UI.
- **Test email**: Settings → Email → "Send test" sends to the address entered, synchronously, and shows the provider response or error.

---

## 9. Admin dashboard architecture

`GET /admin/dashboard/widgets?from&to&tz` returns all widget datasets in one call, computed with Mongo aggregation pipelines and scoped by role (a Team Member's widgets count only their assigned leads; subscriber and activity widgets are hidden without permission).
Layout is stored in `dashboardPreferences` (order, visibility, size) and saved on change. "Restore default" deletes the user's layout document.
Drill-down: each KPI or chart segment links to `/admin/leads?status=…&from=…&to=…`.
"Website analytics" widget: first-party counts from `trackingEvents` + lead sources. A GA4 Data API panel is added if credentials are supplied.

---

## 10. Environment configuration (summary — full list in `docs/ENV.md`)

| Variable | Used by | Notes |
|---|---|---|
| `NODE_ENV`, `PUBLIC_SITE_URL` (`https://softbizz.kreyszigg.com`), `API_PUBLIC_URL` | web, api | canonical URLs |
| `MONGO_URL`, `MONGO_DB` | api, worker | Atlas SRV string in prod |
| `SESSION_SECRET`, `CSRF_SECRET`, `ENCRYPTION_KEY` (2FA secrets at rest), `REVALIDATE_SECRET` | api, web | 32+ byte random |
| `CORS_ORIGINS`, `TRUST_PROXY` | api | |
| `STORAGE_DRIVER` (`r2`/`local`), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PUBLIC`, `R2_BUCKET_PRIVATE`, `R2_PUBLIC_BASE_URL` | api, worker | |
| `EMAIL_DRIVER` (`smtp`/`log`), `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | worker, api | never exposed to the frontend |
| `SCANNER_DRIVER` (`clamav`/`none`), `CLAMAV_HOST` | worker | |
| `BACKUP_R2_BUCKET`, `BACKUP_R2_ACCESS_KEY_ID`, `BACKUP_R2_SECRET_ACCESS_KEY`, `BACKUP_ENCRYPTION_PUBLIC_KEY` | worker | separate credentials; private key kept offline by the custodian |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` (optional) | web / api | optional extra spam protection |
| `NEXT_PUBLIC_*` | web | only non-secret values; GA4 ID is read from public settings at runtime |
| `SEED_SUPERADMIN_EMAIL` | api (one-time CLI) | first Super Admin is created with a CLI command that emails an invitation, not via a public form |

Business-level settings (WhatsApp number, meeting URLs, social links, routing, analytics IDs, policies) live in `websiteSettings` and are editable in admin, not in env.

---

## 11. Deployment architecture

- **docker-compose.yml**: `nginx` (ports 80/443), `web` (Next standalone, port 3000), `api` (port 8001), `worker`, optional `clamav`, `certbot`. All are on an internal network; only nginx is exposed. Containers run as non-root with healthchecks and `restart: unless-stopped`.
- **Nginx**: TLS (Let's Encrypt), HTTP→HTTPS redirect, HSTS, gzip + brotli, cache headers for `/_next/static` (immutable), `/api/` → api, `/socket.io/` → api (WebSocket upgrade), everything else → web, `client_max_body_size 12m`, real-IP from Cloudflare.
- **DNS**: one record only, `softbizz` (A → VM IP) in Cloudflare. The root domain, MX, SPF, DKIM and DMARC records are not touched. The runbook includes a before/after DNS export check.
- **CI** (GitHub Actions): lint, tests, a "no .ts/.tsx" guard, then building images. Deploy = SSH pull + `docker compose up -d` with rollback to the previous image tag.
- **Free-tier limits** (to verify at launch):
  - OCI Ampere capacity may be unavailable; the AMD micro VM (1 GB) cannot run ClamAV.
  - Atlas M0: 512 MB storage and no managed backups.
  - R2: 10 GB storage and 1M Class A operations per month free.
  - SMTP sending quotas from your provider.

---

## 12. Build sequence after approval

Phase 3 (design system + Home, a Service detail page, Hire Developers, and admin Dashboard/Leads screens in both themes) → your visual approval → Phases 4a–4f per the plan, each ending with the Rule 13 report.
