# Kreyszigg Softbizz — Phase 1: PRD Understanding & Planning

Status: **APPROVED by client** (Phase 1). Change on approval: typography is **Ubuntu** instead of Segoe UI (supersedes PRD §4.1 typography and resolves G-2). No application code has been written.
Source of truth: `Kreyszigg_Softbizz_Website_PRD.docx` (read in full: Sections 1–18, Appendices A–C).

---

## A. Understanding of Kreyszigg Softbizz and its business objectives

Kreyszigg Softbizz is a software development and technology talent company. It serves startups, SMBs, other software companies/agencies, digital & marketing agencies, e-commerce businesses, international businesses and individual entrepreneurs, worldwide.

**It makes money in two ways (both equally core):**

1. **Software development services (project delivery)**. Clients bring a product or business problem. Kreyszigg Softbizz delivers it end to end through a 7-stage process (Discovery → Planning & Architecture → UI/UX → Agile Development → QA → Deployment → Maintenance). There are 11 services; the top priorities are **Mobile App Development** and **Web Application Development**. There is no public pricing: every engagement starts with "Request a Quote".
2. **Developer hiring / staff augmentation**. Clients hire individual developers or whole teams. They choose from 10 developer categories, a technology list (frontend, backend, mobile, database, cloud, other), 4 experience levels (guidelines only, not availability claims) and 6 engagement models (monthly dedicated, dedicated team, hourly, part-time, fixed-price, contract-to-hire). Hiring follows a 6-step process.

There is also a third, smaller path: **agency and technology partnerships** (white-label/collaboration).

**Business objectives:** qualified project leads, qualified hiring leads, partnership leads, brand credibility, and organic visibility (SEO + insights).
**Operating principle:** *credibility over hype*. Nothing fabricated: no fake clients, numbers, testimonials, logos, awards or availability claims. Demo content must be clearly labelled and unpublished by default.

The product is a **public, SEO-first website** plus a **secure admin platform with a lightweight built-in CRM**. It is meant to run on free tiers first (OCI + Atlas + Cloudflare) and stay portable to paid infrastructure.

---

## B. Approved scope summary

### B1. Sitemap / public pages
| Area | Pages |
|---|---|
| Home | `/` — Hero (project CTA + hiring CTA), trust/credibility (verified only), services overview, featured work, hire-developers teaser, why us (evidence-based), 7-stage process, testimonials (authorized only), latest insights, final CTA |
| About | `/about` (Our Story), `/about/team`, `/about/approach` |
| Services | `/services` + 11 detail pages: custom-software, web-application (10 sub-capabilities), mobile-app (8 sub-capabilities), saas, website-design-development, ui-ux, ecommerce, cloud-devops, api-integration, maintenance-support, it-consulting |
| Hire Developers | `/hire-developers` (dedicated developers), `/hire-developers/technologies`, `/hire-developers/models` (engagement + experience levels + 6-step process), `/hire-developers/[category]` × 10, hiring form |
| Our Work | `/work` (filter by industry & technology), `/work/[slug]` case study (overview, challenge, approach, solution, stack, gallery, verified results, authorized feedback, related projects, CTA; confidential/anonymized and DEMO flags) |
| Industries | `/industries` + 12 detail pages (PRD §6.7; target markets, not claims) |
| Partnerships | `/partnerships` + partnership enquiry form |
| Insights | `/insights`, `/insights/category/[slug]`, `/insights/tag/[slug]`, `/insights/[slug]` (author, reading time, share, search/filter, featured) |
| Careers | `/careers` (culture), `/careers/[slug]` job detail + application with CV upload |
| Contact | `/contact` hub: project / hiring / partnership / general contact forms (tabbed by context), email, WhatsApp, Schedule a Meeting |
| Legal | `/privacy`, `/terms`, `/cookies` + cookie preferences centre |
| Utility | `/newsletter/confirm`, `/newsletter/unsubscribe`, 404/500, `sitemap.xml`, `robots.txt` |
| Admin (separate, noindex) | `/admin/login`, `/admin/invite/[token]`, `/admin/reset/[token]`, `/admin/*` modules |

Global: sticky header with services mega menu, mobile accessible drawer, primary CTA "Let's Discuss Your Project", 4-column Deep Slate footer (newsletter, social, legal, back-to-top), floating WhatsApp button (public only, with message pre-filled per page context), cookie consent banner.

### B2. Admin modules (all 14, all backed by real MongoDB data)
1. **Dashboard**: 12 widgets (total/new/qualified/proposals/won-lost, distribution, monthly trend, recent enquiries, upcoming follow-ups, website analytics, subscribers, administrative activity). Date filters: Today/7/30/90/Custom. Each user can drag to reorder, show/hide, save and reset their own layout. Drill-down links on widgets.
2. **Lead Management**: 4 lead types; 6 statuses; assignment; internal notes; follow-ups (upcoming/overdue); search/filter by type, status, date and assignee; CSV/XLSX export; attachments; history; source and page context; record-level RBAC.
3. **Portfolio & Case Studies**: full CRUD, gallery, confidentiality and demo flags, draft/preview/publish, SEO fields.
4. **Services Management**: 11 services, priority/order, sections, SEO fields, publish state; the 7-stage process editor lives here.
5. **Developer Categories**: categories, technologies taxonomy, experience levels, engagement models, hiring process steps.
6. **Blog / Insights**: posts, categories, tags, authors, featured, draft/preview/publish/schedule, SEO fields.
7. **Careers & Applications**: jobs (draft/open/closed/archived) and applications (status pipeline, secure CV download).
8. **Team & Founder Profiles**: profiles, photos, order, publish state, verification flag.
9. **Testimonials**: attribution, quote, permission/approval evidence, publish state (cannot be published without approval).
10. **Partnerships**: partnership-page content, partnership types, authorized partner entries (see G-7).
11. **Newsletter Subscribers**: list, status, consent records, unsubscribe, CSV export.
12. **Analytics & Reports**: enquiry counts, source, status, conversion funnel, trends, exports (RBAC-filtered).
13. **User & Role Management**: invitations (time-limited, resend, revoke), activate/deactivate, roles and grants, sessions, 2FA policy, security log view.
14. **Website Settings**: contact channels, WhatsApp, meeting links and on/off toggle, social links, email routing, SMTP test email, notification default rules, email templates, analytics IDs, upload limits, security policy, backup controls, legal/static page content.

Plus user-level features: profile, password, 2FA enrolment, theme toggle (light/dark, saved per user, follows the OS setting on first visit), email notification preferences, notification centre.

### B3. Roles
| Capability | Super Admin | Admin / Manager | Team Member |
|---|---|---|---|
| Settings, security policy, SMTP, backups, notification rules | ✅ | ❌ (unless granted) | ❌ |
| Users, invitations, roles, sessions of others | ✅ | ❌ (unless granted) | ❌ |
| Content modules (services, portfolio, blog, careers, team, testimonials, partnerships, dev categories) | ✅ | ✅ | ❌ |
| All leads, assign, export, reports | ✅ | ✅ | ❌ |
| Assigned leads: view, permitted status updates, notes, follow-ups | ✅ | ✅ | ✅ (assigned only) |
| Applications / subscribers | ✅ | ✅ | ❌ (proposed, see G-9) |
| Own profile, password, 2FA, theme, email prefs, notifications | ✅ | ✅ | ✅ |

All checks are enforced in Express middleware and at the record-query level. Hidden buttons are never treated as authorization.

### B4. Conversion workflows
1. **Project enquiry**: name, business email, company, project type, services, description, budget (optional), timeline, attachment (optional), consent.
2. **Hire developers**: name, email, company, role/technology, number of devs, experience level, engagement model, duration, extra requirements, consent.
3. **Partnership**: name/company, email, website, partnership type, services, collaboration requirements, consent.
4. **General contact**: fields not specified in the PRD; proposed name, email, subject, message, consent (G-4).
5. **Job application**: job reference, name, email, phone, links, cover note, CV upload, consent.
6. **Newsletter**: email + consent → double opt-in email → confirmed. One-click unsubscribe.
7. **WhatsApp**: click-to-chat with context-aware prefilled text; click tracked.
8. **Schedule a Meeting**: external URL or approved embed. Separate links for project, hiring and partnership. Super Admin on/off toggle.
9. **Email enquiry**: mailto links to the configured aliases.

Common pipeline for every form: client + server validation → honeypot + time-trap + rate limit (+ optional Turnstile) → idempotency key → store Lead (type, source, UTM, referrer, page context, consent version + timestamp) → private file to R2 + scan → in-app notification + email to routed recipients (deduplicated) → optional acknowledgement email to the submitter → success state → GA4 conversion event (no PII).

### B5. Notifications (10 events)
New project enquiry · New hiring enquiry · New partnership enquiry · New contact submission · New job application · New newsletter subscription · Lead assigned · Upcoming follow-up · Overdue follow-up · Important admin/security activity (e.g. lockout, new-device login, role change, user deactivated, 2FA disabled, backup failed, repeated email failure).

Channels: real-time in-app (WebSocket, unread badge, history, mark read / mark all, click-through re-checked against permissions, role-filtered) + email (Super Admin defaults per event → user opt-in/out within those limits; editable templates per event; queued delivery with bounded exponential-backoff retry; delivery log showing queued/sent/failed/retrying with error codes; dedupe keys; test email). Follow-up reminders come from a backend scheduler worker with configurable lead time and timezone, one reminder per follow-up occurrence.

---

## C. Requirement Traceability Matrix

Priority: **P0** = launch-blocking core · **P1** = required for launch · **P2** = required, can land last before launch.
Status for every row: **Planned** (nothing has been implemented yet).

### C1. Foundation & Architecture
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| ARC-01 | Next.js frontend, JS/JSX only, no TS (§11.1, App. B) | frontend | P0 | Stack decision G-1 | Repo contains zero .ts/.tsx; `next build` passes | Planned |
| ARC-02 | Separate Express REST API, versioned `/api/v1` (§10.1) | backend | P0 | G-1 | All endpoints under /api/v1; consistent JSON envelope & error format | Planned |
| ARC-03 | MongoDB primary DB, file binaries never in Mongo (§13.1) | backend | P0 | Atlas URI | Collections + indexes created; no binary fields | Planned |
| ARC-04 | Env-driven config, secrets server-side only (§11.4, §12.2) | both | P0 | — | `.env.example` documented; no secret in client bundle (bundle grep) | Planned |
| ARC-05 | Storage abstraction (R2 replaceable) (§11.4) | backend | P0 | R2 creds | StorageProvider interface; R2 + local-disk driver | Planned |
| ARC-06 | Docker + Compose: Next, Express, Nginx (+worker) (§11.2) | devops | P0 | — | `docker compose up` brings full stack up | Planned |
| ARC-07 | Public read endpoints separated from admin endpoints (§10.1) | backend | P0 | — | `/api/v1/public/*` vs `/api/v1/admin/*` routers | Planned |
| ARC-08 | Pagination, sorting, filtering on admin lists (§10.1, §8.1) | backend | P0 | — | Every admin list accepts page/limit/sort/q/filters | Planned |
| ARC-09 | Idempotency for form submissions & jobs (§10.1) | backend | P0 | — | Duplicate submission with same key returns the original result | Planned |
| ARC-10 | API + env documentation (§10.1, App. B) | docs | P1 | — | API.md + ENV.md complete | Planned |
| ARC-11 | Seed/initialization strategy; demo content unpublished (App. B) | backend | P1 | — | `seed` script idempotent; demo flagged + unpublished | Planned |

### C2. Brand & Design
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| BRD-01 | Use supplied logo/secondary mark unaltered (§4.1) | design | P0 | Vector/transparent assets (F-1) | Logo pixel-identical, never recoloured without approval | Planned |
| BRD-02 | Palette #17232F / #F5F2EB / #FFFFFF / #A56F4E (§4.1) | design | P0 | — | Tokens defined; only these brand colours + neutrals | Planned |
| BRD-03 | Typography: **Ubuntu** (client change, replaces Segoe UI); headings Bold/Medium, body Regular, nav/buttons/labels Medium; fallback Arial, sans-serif | design | P0 | — (self-hosted, Ubuntu Font Licence) | Ubuntu self-hosted (no CDN); weights per role on all OSes | Planned |
| BRD-04 | Editorial, asymmetric, non-generic layouts; no AI clichés (§4.2) | design | P0 | Design approval (Phase 3) | Each page type has a distinct composition; client sign-off | Planned |
| BRD-05 | Authentic imagery only; no misleading stock (§4.2) | design | P1 | Real photos/screenshots (F-3) | No stock imagery implying team/office/clients | Planned |
| BRD-06 | Subtle interactions; respect reduced motion (§4.2, §15) | frontend | P1 | — | `prefers-reduced-motion` disables motion | Planned |
| BRD-07 | Voice: professional, no hype, placeholders flagged (§4.3) | content | P1 | Content from client | Placeholders visibly flagged in admin | Planned |
| BRD-08 | Separate admin visual system, Light/Dark (§8.6) | admin | P0 | — | Theme toggle, saved per user, OS default on first visit | Planned |

### C3. Navigation & Global UI
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| NAV-01 | Desktop nav: Home, About, Services mega menu, Our Work, Hire Developers, Insights, Careers, CTA (§5.2) | frontend | P0 | — | All items route correctly | Planned |
| NAV-02 | Sticky header with subtle transitions (§5.2) | frontend | P1 | — | Header compacts on scroll | Planned |
| NAV-03 | Categorized services mega menu (§5.2) | frontend | P0 | — | Keyboard accessible; links to all 11 services | Planned |
| NAV-04 | Accessible mobile drawer (§5.2) | frontend | P0 | — | Focus trap, Esc closes, aria attributes | Planned |
| NAV-05 | Primary CTA → project enquiry with context (§5.2) | frontend | P0 | — | Opens contact with `?type=project` preselected | Planned |
| NAV-06 | Admin login separate from public nav (§5.2) | frontend | P0 | — | No admin link in public UI | Planned |
| NAV-07 | 4-column footer, newsletter, social, legal, back-to-top (§5.3) | frontend | P0 | — | Stacks on mobile; all links valid | Planned |
| NAV-08 | Configurable social links with enable flags, a11y labels, new tab (§5.4) | settings | P1 | Social URLs (F-2) | Toggling in admin updates footer | Planned |
| NAV-09 | Social sharing metadata (§5.4) | SEO | P1 | — | OG/Twitter tags on every page | Planned |

### C4. Public Pages
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| PUB-01 | Homepage with 10 sections (§6.1) | frontend | P0 | Content | All sections render from CMS data; empty sections hidden gracefully | Planned |
| PUB-02 | About: Story, Team, Approach (§5.1) | frontend | P0 | Team content | Pages render; team from Team module | Planned |
| PUB-03 | Services listing + 11 detail pages (§5.1, §6.2) | frontend | P0 | — | All 11 reachable & editable | Planned |
| PUB-04 | Mobile app page with 8 capability areas (§6.3) | content | P0 | — | All listed items present | Planned |
| PUB-05 | Web app page with 10 capability areas (§6.4) | content | P0 | — | All listed items present | Planned |
| PUB-06 | Hire Developers: tech taxonomy, 10 categories, 4 levels, 6 models, 6-step process, form (§6.5) | frontend | P0 | — | All taxonomy items from Developer Categories module | Planned |
| PUB-07 | Portfolio landing with industry/technology filters (§6.6) | frontend | P0 | Real projects | Filters work, SEO URLs | Planned |
| PUB-08 | Case study detail with all sections, related projects, confidential + DEMO labels (§6.6) | frontend | P0 | — | DEMO badge visible; confidential hides client name | Planned |
| PUB-09 | Industry landing + 12 detail pages (§6.7) | frontend | P1 | G-5 | Pages render; case studies linked only if verified | Planned |
| PUB-10 | Insights listing, categories/tags, featured, search/filter, author, reading time, share (§6.8) | frontend | P0 | — | Search and filter work; reading time computed | Planned |
| PUB-11 | Careers landing, listings, job detail, application with CV (§6.9) | frontend | P0 | — | Application persisted with private CV | Planned |
| PUB-12 | 7-stage process on Home/About/Services, editable (§6.10) | both | P0 | — | Edit in admin reflects on all three | Planned |
| PUB-13 | Partnerships page + enquiry path (§5.1) | frontend | P0 | — | Form submits as Partnership lead | Planned |
| PUB-14 | Contact hub with forms + channels (§5.1, §7.1) | frontend | P0 | — | All channels functional | Planned |
| PUB-15 | Privacy, Terms, Cookie Policy + preferences (§12.3) | frontend | P0 | Legal text (F-9) | Pages editable; preferences persisted | Planned |
| PUB-16 | Draft/preview/publish workflow (§16) | both | P1 | — | Draft previewable via signed preview link, not public | Planned |

### C5. Conversion
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| CNV-01 | Project form with specified fields (§7.2) | forms | P0 | — | Optional fields optional; persisted as lead | Planned |
| CNV-02 | Hire form with specified fields (§7.3) | forms | P0 | — | Persisted as Hiring lead | Planned |
| CNV-03 | Partnership form (§7.4) | forms | P0 | — | Persisted as Partnership lead | Planned |
| CNV-04 | General contact form (§7.1, §8.3) | forms | P0 | G-4 | Persisted as Contact lead | Planned |
| CNV-05 | Client + server validation, accessible errors (§7.5) | forms | P0 | — | Server rejects invalid; errors announced (aria-live) | Planned |
| CNV-06 | Spam prevention & throttling (§7.5) | backend | P0 | Optional Turnstile key | Honeypot/time-trap/rate-limit verified | Planned |
| CNV-07 | Success confirmation + optional acknowledgement email (§7.5) | forms | P0 | SMTP | Ack email toggle in settings | Planned |
| CNV-08 | Notify configured recipients, store in admin (§7.5) | backend | P0 | SMTP, routing | Routed per type | Planned |
| CNV-09 | Status, source, page-context tracking (§7.5) | backend | P0 | — | Lead stores source, UTM, referrer, page | Planned |
| CNV-10 | Secure attachments, private storage (§7.5, §13.1) | uploads | P0 | R2 | No public URL; signed URL only for authorized users | Planned |
| CNV-11 | Consent capture + timestamp/version (§7.5) | forms | P0 | Policy version | Consent object stored | Planned |
| CNV-12 | WhatsApp floating click-to-chat, contextual text, not in admin (§7.6) | frontend | P0 | WA number (F-2) | Opens wa.me with page text | Planned |
| CNV-13 | Meeting booking: URL/embed, 3 contexts, toggle (§7.7) | settings | P1 | Booking URLs (F-4) | Disabled → CTA hidden everywhere | Planned |
| CNV-14 | Email routing via existing provider; aliases confirmed (§7.8) | email | P0 | SMTP + aliases (F-5) | Routing table editable | Planned |

### C6. Admin General & Modules
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| ADM-01 | Secure portal, functional modules, persistent data (§8.1) | admin | P0 | — | No static mock screens | Planned |
| ADM-02 | CRUD, pagination, search, filters (§8.1) | admin | P0 | — | All lists | Planned |
| ADM-03 | Loading/empty/error/success states (§8.1) | admin | P0 | — | Every view | Planned |
| ADM-04 | Confirm destructive ops (§8.1) | admin | P0 | — | Confirm dialog on delete/revoke/deactivate | Planned |
| ADM-05 | Backend role check on every protected op (§8.1) | backend | P0 | — | Automated RBAC test suite | Planned |
| ADM-06 | Responsive admin (§8.1) | admin | P1 | — | Tablet/mobile usable | Planned |
| MOD-01 | Dashboard (§8.4) | admin | P0 | — | 12 widgets, real data | Planned |
| MOD-02 | Lead Management (§8.3) | crm | P0 | — | see LEAD-* | Planned |
| MOD-03 | Portfolio & Case Studies (§6.6) | cms | P0 | — | CRUD + gallery + flags | Planned |
| MOD-04 | Services Management (§6.2) | cms | P0 | — | 11 services + process editor | Planned |
| MOD-05 | Developer Categories (§6.5) | cms | P0 | — | Categories, techs, levels, models, steps | Planned |
| MOD-06 | Blog / Insights (§6.8) | cms | P0 | — | Posts, categories, tags, draft/publish | Planned |
| MOD-07 | Careers & Applications (§6.9) | cms/ats | P0 | — | Jobs + application pipeline + archive | Planned |
| MOD-08 | Team & Founder Profiles | cms | P1 | — | CRUD + ordering + photos | Planned |
| MOD-09 | Testimonials (permission/approval) | cms | P1 | — | Cannot publish without approval | Planned |
| MOD-10 | Partnerships | cms | P1 | G-7 | Content + partner entries | Planned |
| MOD-11 | Newsletter Subscribers (§16.1) | newsletter | P0 | — | see NWS-* | Planned |
| MOD-12 | Analytics & Reports (§14.2) | reports | P1 | — | RBAC-filtered, exportable | Planned |
| MOD-13 | User & Role Management (§12.1) | auth | P0 | — | see AUTH-* | Planned |
| MOD-14 | Website Settings (§10 WebsiteSettings) | settings | P0 | — | All config groups editable | Planned |

### C7. Lead Management / CRM
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| LEAD-01 | 4 types: Project, Hiring, Partnership, Contact | crm | P0 | — | Filterable by type | Planned |
| LEAD-02 | 6 statuses New→Contacted→Qualified→Proposal Sent→Won/Lost | crm | P0 | — | Status change recorded in history | Planned |
| LEAD-03 | Assign to team members; owner shown | crm | P0 | — | Assignment triggers notification | Planned |
| LEAD-04 | Internal notes with author/timestamp | crm | P0 | — | Notes list chronological | Planned |
| LEAD-05 | Follow-up date/time; upcoming & overdue views | crm | P0 | Scheduler | Views correct in configured timezone | Planned |
| LEAD-06 | Search + filter by type/status/date/assignee | crm | P0 | — | Combined filters work | Planned |
| LEAD-07 | CSV/XLSX export with permission checks | crm | P0 | — | Team Member denied (403) | Planned |
| LEAD-08 | Record detail: payload, attachments, history, source, timestamps | crm | P0 | — | All visible | Planned |
| LEAD-09 | Team Members see assigned only; Admin all; Super full | crm | P0 | — | 403/404 on unassigned access via API | Planned |
| LEAD-10 | Team Member updates only permitted status fields | crm | P0 | G-9 | Server rejects forbidden fields | Planned |

### C8. Dashboard
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| DSH-01 | 12 widgets incl. website analytics & admin activity (§8.4) | dashboard | P0 | GA4 Data API (G-8) | All render from real data | Planned |
| DSH-02 | Date filters Today/7/30/90/Custom applied consistently | dashboard | P0 | — | One filter drives all widgets | Planned |
| DSH-03 | Chart hover details, drill-down, empty states | dashboard | P1 | — | Click widget → filtered lead list | Planned |
| DSH-04 | Rearrange, show/hide, save, restore default, per user (§8.5) | dashboard | P0 | — | Layout survives logout; independent per user | Planned |
| DSH-05 | Admin activity widget limited to operational data (§8.4) | dashboard | P1 | — | Shows security/delivery events only | Planned |

### C9. Notifications & Email
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| NTF-01..10 | Ten events (§9.1) | notify | P0 | — | Each event generates notification for correct recipients | Planned |
| NTF-11 | Bell with unread count | notify | P0 | — | Count accurate | Planned |
| NTF-12 | Real-time without refresh | notify | P0 | WebSocket via Nginx | New lead appears in <3s in another session | Planned |
| NTF-13 | History, mark read, mark all read | notify | P0 | — | Persisted | Planned |
| NTF-14 | Click-through with permission recheck | notify | P0 | — | Unauthorized target → 403 page | Planned |
| NTF-15 | Role-based visibility | notify | P0 | — | Team Member never notified of unassigned leads | Planned |
| EML-01 | Email alerts via existing business provider (§9.3) | email | P0 | SMTP (F-5) | Delivered to inbox | Planned |
| EML-02 | Super Admin default rules; user prefs within limits | email | P0 | — | User cannot enable an event the SA disabled/forbade | Planned |
| EML-03 | Configurable templates per event | email | P1 | — | Edit + preview with variables; sanitized | Planned |
| EML-04 | Test-email in settings | email | P0 | SMTP | Result + error shown | Planned |
| EML-05 | Bounded retry with backoff | email | P0 | — | Simulated failure → retries → failed | Planned |
| EML-06 | Delivery status + error log (queued/sent/failed/retrying) | email | P0 | — | Log view, no message bodies/secrets | Planned |
| EML-07 | Dedup via idempotency keys | email | P0 | — | Same event twice → one email | Planned |
| EML-08 | Scheduler for follow-ups; timezone, lead time, no duplicate reminders (§9.5) | worker | P0 | G-12 | One reminder per occurrence | Planned |

### C10. Authentication & Security
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| AUTH-01 | SA creates users, secure time-limited invitation | auth | P0 | SMTP | Token hashed; expired link rejected | Planned |
| AUTH-02 | Invitee sets password; no public registration | auth | P0 | — | No register endpoint exists | Planned |
| AUTH-03 | Resend & revoke invitations | auth | P0 | — | Revoked token rejected | Planned |
| AUTH-04 | Deactivate/reactivate users | auth | P0 | — | Deactivation kills sessions | Planned |
| AUTH-05 | Strong password policy + strength meter | auth | P0 | G-11 | Policy enforced server-side; breached-password check optional | Planned |
| AUTH-06 | Time-limited password reset | auth | P0 | SMTP | No user enumeration | Planned |
| AUTH-07 | Configurable session expiry + inactivity logout | auth | P0 | — | Idle timeout logs out (client + server) | Planned |
| AUTH-08 | Lockout/throttling on failed logins | auth | P0 | — | N failures → lockout + security notification | Planned |
| AUTH-09 | Optional 2FA configurable by SA | auth | P1 | G-10 | TOTP enrol/verify/recovery codes; SA can require | Planned |
| AUTH-10 | Individual session logout | auth | P0 | — | Session list; revoke one | Planned |
| SEC-01 | Argon2id/bcrypt hashing | backend | P0 | — | Argon2id used | Planned |
| SEC-02 | Secure httpOnly cookies, rotation, revocation | backend | P0 | — | Secure/HttpOnly/SameSite; rotation on login | Planned |
| SEC-03 | XSS, CSRF, injection, brute force protection | backend | P0 | — | Helmet/CSP, CSRF token, sanitize, Mongo operator injection guard | Planned |
| SEC-04 | Rate limiting on auth & public forms | backend | P0 | — | 429 beyond threshold | Planned |
| SEC-05 | No hashes/tokens/secrets in responses or bundles | backend | P0 | — | Automated response-shape tests | Planned |
| SEC-06 | No PII in analytics or logs | both | P0 | — | Event payload review | Planned |
| SEC-07 | Least-privilege DB/storage/backup creds | devops | P1 | — | Separate keys documented | Planned |
| SEC-08 | OWASP review before production | QA | P1 | — | Report delivered | Planned |
| SEC-09 | Security records only, no full audit-log module (§2.3) | backend | P0 | — | Only auth/security/delivery logs exist | Planned |

### C11. Privacy & Legal
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| PRV-01 | Privacy/Terms/Cookie pages + cookie preferences (§12.3) | frontend | P0 | Legal text | Preferences gate GA4 | Planned |
| PRV-02 | Explicit consent on forms | forms | P0 | — | Required checkbox; version stored | Planned |
| PRV-03 | Retention/deletion rules | backend | P1 | Retention periods (G-13) | Scheduled purge per config | Planned |
| PRV-04 | Data subject access/correction/deletion support | admin | P1 | G-13 | Export/anonymize/delete by email | Planned |
| PRV-05 | Consent-aware analytics (Consent Mode) | frontend | P0 | — | No GA cookies before consent | Planned |

### C12. Files, Backup, Recovery
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| FIL-01 | R2 public + private buckets, metadata in Mongo | storage | P0 | R2 (F-6) | FileAsset records | Planned |
| FIL-02 | Short-lived signed downloads for private files | storage | P0 | — | Link expires; RBAC enforced before issue | Planned |
| FIL-03 | Type/MIME/extension/size/signature validation | storage | P0 | — | Spoofed file rejected | Planned |
| FIL-04 | Malware scanning where feasible + quarantine | storage | P1 | ClamAV RAM (G-14) | EICAR test file quarantined | Planned |
| FIL-05 | Safe generated keys | storage | P0 | — | UUID keys | Planned |
| FIL-06 | Limits/types configurable in admin | settings | P1 | — | Settings applied server-side | Planned |
| FIL-07 | Optimized public images (WebP/AVIF, responsive) | storage | P1 | — | sharp variants + next/image | Planned |
| BKP-01 | Automated daily Mongo backups, encrypted, separate location | ops | P0 | Destination + key (F-8) | Daily job logged | Planned |
| BKP-02 | Retention 7 daily + 4 weekly, configurable | ops | P1 | — | Old backups pruned | Planned |
| BKP-03 | Manual backup by Super Admin | ops | P1 | — | Button triggers job | Planned |
| BKP-04 | Documented restore + periodic restore tests | ops | P0 | — | Restore test executed & logged | Planned |
| BKP-05 | Backup status monitoring + failure notification | ops | P1 | — | Failure → event #10 | Planned |

### C13. SEO, Analytics, Performance, Accessibility
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| SEO-01 | Unique titles/descriptions, editable | seo | P0 | — | No duplicates across pages | Planned |
| SEO-02 | Canonical URLs (subdomain) | seo | P0 | — | Canonical = https://softbizz.kreyszigg.com/... | Planned |
| SEO-03 | XML sitemap + robots.txt (dynamic) | seo | P0 | — | Includes published content only | Planned |
| SEO-04 | Schema.org: Organization, Service, Article, Breadcrumb, JobPosting | seo | P1 | — | Validates in Rich Results test | Planned |
| SEO-05 | OG/social metadata | seo | P0 | — | Per-page OG image/title | Planned |
| SEO-06 | Alt text required on images | cms | P1 | — | Admin enforces alt | Planned |
| SEO-07 | Internal linking services↔industries↔work↔insights | content | P1 | — | Related blocks | Planned |
| SEO-08 | SSR/SSG for public; noindex admin | seo | P0 | — | Admin has noindex + robots disallow | Planned |
| SEO-09 | Search Console verification (configurable) | seo | P1 | GSC token (F-7) | Meta tag/DNS TXT documented | Planned |
| SEO-10 | No hreflang unless variants published | seo | P2 | — | None emitted | Planned |
| ANL-01 | GA4 with configurable ID, consent-gated | analytics | P0 | GA4 ID (F-7) | Events in DebugView | Planned |
| ANL-02 | Conversion events for 3 forms + contact; WhatsApp & meeting clicks | analytics | P0 | — | No PII in params | Planned |
| ANL-03 | Admin analytics from persisted data, RBAC-respecting | reports | P1 | — | Matches DB counts | Planned |
| PRF-01 | Core Web Vitals toward Good; WebP/AVIF; lazy load; code split; caching; compression; CDN-ready | perf | P1 | — | Lighthouse measured & reported (no invented numbers) | Planned |
| A11Y-01 | WCAG 2.2 AA target, keyboard, focus, contrast, semantics, labels, reduced motion | a11y | P0 | — | axe scan + manual keyboard test | Planned |
| A11Y-02 | Responsive phone/tablet/laptop/desktop; no horizontal scroll | frontend | P0 | — | 360/768/1280/1536 checks | Planned |
| A11Y-03 | Chrome, Edge, Firefox, Safari | QA | P1 | — | Cross-browser run | Planned |

### C14. Newsletter
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| NWS-01 | Forms in footer + Insights | newsletter | P0 | — | Both submit | Planned |
| NWS-02 | Double opt-in verification | newsletter | P0 | SMTP | Pending until confirmed | Planned |
| NWS-03 | Unsubscribe flow (token) | newsletter | P0 | — | One-click unsubscribe | Planned |
| NWS-04 | Admin management + CSV export (RBAC) | newsletter | P0 | — | Export permission enforced | Planned |
| NWS-05 | Consent source/time tracking | newsletter | P0 | — | Stored | Planned |
| NWS-06 | Configurable provider; no paid campaign platform | newsletter | P1 | — | SMTP default, provider-agnostic interface | Planned |

### C15. Hosting & Deployment
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| DEP-01 | OCI Always Free VM + Docker Compose | devops | P0 | OCI account (F-10) | Stack runs on VM | Planned |
| DEP-02 | Nginx: / → Next, /api → Express (+WebSocket) | devops | P0 | — | Routing verified | Planned |
| DEP-03 | MongoDB Atlas | devops | P0 | Atlas (F-10) | Connected with IP allow-list | Planned |
| DEP-04 | Cloudflare DNS: only `softbizz` record; root & email DNS untouched | devops | P0 | CF access | Runbook explicitly lists the single record | Planned |
| DEP-05 | Let's Encrypt + auto renewal | devops | P0 | DNS | certbot renewal timer | Planned |
| DEP-06 | GitHub repo | devops | P1 | GitHub account | Code pushed | Planned |
| DEP-07 | Deploy, rollback, backup/restore, migration docs | docs | P0 | — | Docs delivered | Planned |
| DEP-08 | Free-tier limitations documented; no paid service without approval | docs | P0 | — | Limitations section | Planned |

### C16. QA & Launch
| ID | PRD requirement | Module | Pri | Dependencies | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| QA-01 | §17.1 functional acceptance (14 items) | QA | P0 | All above | Every item evidenced | Planned |
| QA-02 | §17.2 security acceptance (9 items) | QA | P0 | — | Automated + manual tests | Planned |
| QA-03 | §17.3 UX/a11y/perf acceptance | QA | P0 | — | Report | Planned |
| QA-04 | §17.4 launch checklist (12 items) | QA | P0 | Client inputs | Signed off | Planned |
| QA-05 | Definition of done / deferred items documented (App. C) | PM | P0 | — | Deferred list with owner/reason/stage | Planned |

---

## D. Proposed technical architecture

```
Browser ──HTTPS──> Cloudflare DNS (softbizz.kreyszigg.com only)
                      │
                OCI VM (Docker Compose)
   ┌──────────────────┼────────────────────────────────────┐
   │  nginx (TLS, gzip/brotli, caching, rate-limit, WS)    │
   │     ├── /            → web   (Next.js, App Router, JSX, SSR/SSG/ISR)
   │     ├── /api/*       → api   (Express REST /api/v1 + Socket.IO)
   │  worker (Node: email queue, follow-up scheduler, backups, retention)
   │  clamav (optional, malware scanning — RAM permitting)  │
   │  certbot (Let's Encrypt renewal)                       │
   └───────────────────────────────────────────────────────┘
        │                    │                     │
   MongoDB Atlas      Cloudflare R2 (public +   Existing business
   (app data, jobs,    private buckets; backup   SMTP (kreyszigg.com)
    sessions)          bucket w/ separate keys)
```

- **Frontend (`web/`)**: Next.js (App Router), `.js`/`.jsx` only. The public site uses SSG/ISR with on-demand revalidation when admin publishes. The admin lives under `/admin` in the same Next app, as a client-rendered area with its own layout, design tokens and theme, set to `noindex`. Plain CSS Modules + CSS variables for both design systems (no utility-template look). `next/image` for optimization. Socket.IO client for notifications.
- **Backend (`api/`)**: Express, layered as routes → controllers → services → repositories. Libraries: Mongoose for models, Zod for validation (JS), helmet, CORS allow-list, express-rate-limit (Mongo store), CSRF double-submit token, mongo-sanitize, argon2, otplib (TOTP), nodemailer (SMTP), @aws-sdk/client-s3 (R2), multer (memory → validation → R2), file-type (magic bytes), sharp (image variants), exceljs (XLSX) and Socket.IO with cookie auth.
- **Auth**: server-side sessions in Mongo (opaque random id in a Secure, HttpOnly, SameSite=Lax cookie). This makes it possible to list sessions, revoke a single session, enforce idle and absolute timeouts, and rotate the session on login or privilege change. Roles + per-user grants are checked by `authorize(permission)` middleware, and record-level scopes are applied inside lead queries.
- **Jobs**: a Mongo-backed job queue (`jobs` collection with unique dedupe key, status, attempts, nextRunAt). It runs in the `worker` container using atomic `findOneAndUpdate` locking, with no Redis needed. This covers email sending/retry, follow-up reminders, the daily backup, retention purge and newsletter confirmation mails.
- **Real-time**: the API emits to per-user Socket.IO rooms. The worker emits through a Mongo-backed adapter, or a polling bridge if the Atlas tier blocks change streams.
- **Storage**: a `StorageProvider` interface with an R2 driver and a local driver for dev. Private files are only served through `GET /admin/files/:id/download`, which runs an RBAC check and returns a 60-second presigned URL.
- **Backups**: a worker job runs `mongodump`, gzips, encrypts (age/AES-256), uploads to a separate R2 bucket with separate credentials, prunes to 7 daily + 4 weekly, writes a `backupJobs` record, and sends a failure notification if it fails. A restore-test script restores into a scratch database and verifies document counts.
- **Collections (logical)**: users, invitations, sessions, roles/permissions config, leads, leadNotes, leadEvents (status/assignment history, not an audit log), followUps, notifications, notificationRules, emailTemplates, emailDeliveries, jobs, services, processSteps, devCategories, technologies, engagementModels, experienceLevels, portfolioProjects, industries, testimonials, teamMembers, partnershipContent/partners, blogPosts, blogCategories, tags, jobs(openings)→`jobOpenings`, applications, newsletterSubscribers, fileAssets, websiteSettings, contentPages (About/legal), dashboardPreferences, securityEvents, backupJobs, consentRecords.

---

## E. Development phases & dependencies

| Phase | Deliverable | Needs from you | Exit gate |
|---|---|---|---|
| 1 (this) | PRD understanding, scope, RTM, architecture outline | Approval + answers to F/G | Your approval |
| 2 | Detailed architecture: folder structures, API spec, collections & relations, auth/RBAC matrix, storage, notification, email, env config, deployment | G-1 decision | Your approval |
| 3 | Design system (public + admin light/dark). Homepage + 2 representative internal pages (Service detail, Hire Developers) + admin dashboard/lead screens built as real pages | Logo vectors, imagery decision, font decision | Your visual approval |
| 4a | Foundation: repo, Docker, Express skeleton, Mongo, auth (invite, login, sessions, reset, lockout, 2FA), RBAC, settings | SMTP (can use dev mail catcher until provided) | Tested |
| 4b | Public site: all pages, nav, footer, legal, SEO base | Content (placeholders flagged until supplied) | Tested |
| 4c | Conversion: 4 forms + applications + newsletter, uploads/R2, WhatsApp, meeting, routing | R2, WhatsApp number, booking URLs | E2E tested |
| 4d | Admin content modules (Services, Portfolio, Dev Categories, Blog, Careers, Team, Testimonials, Partnerships, Newsletter, Settings) | — | E2E tested |
| 4e | CRM: leads, assignment, notes, follow-ups, exports; dashboard widgets + customization; reports | — | E2E + RBAC tested |
| 4f | Notifications: 10 events, real-time, rules, preferences, templates, queue/retry/dedupe, logs, test email, scheduler | SMTP live creds | Tested incl. failure simulation |
| 5 | Security hardening + OWASP review, privacy features (retention, DSR) | Retention/policy values | Report |
| 6 | Docker/Nginx/TLS/OCI deployment, backups + restore test, runbooks | OCI, Atlas, Cloudflare, GitHub access | Deployed on subdomain |
| 7 | SEO, GA4/GSC, consent, CWV optimisation | GA4 ID, GSC access | Measured results |
| 8–9 | Full QA, final acceptance pack (12 items in your §13) | Real content, legal review | Launch sign-off |

---

## F. Missing information / credentials required

1. **Logo files** in vector (SVG) or transparent PNG, plus a white/reversed version for the Deep Slate footer. The uploads are raster images on an off-white background. A white variant means recolouring, which needs your approval.
2. **Contact channels**: confirmed email aliases and routing per lead type, WhatsApp Business number, phone (if any), social profile URLs.
3. **Imagery**: real team/office/work photography and product screenshots, or approval for an imagery-light typographic direction.
4. **Meeting booking**: provider and URLs (project / hiring / partnership), or embed code.
5. **Email**: existing business email provider name and SMTP host/port/user/password (or API), sender address, and SPF/DKIM status.
6. **Cloudflare R2**: account ID, public bucket, private bucket, backup bucket, separate access keys, public asset domain.
7. **GA4** Measurement ID; Search Console verification method; optionally GA4 Data API service account (for the dashboard "Website analytics" widget).
8. **Backup policy**: destination, encryption-key custodian, RPO/RTO, restore-test cadence.
9. **Content**: company story, founder/team bios and photos, real portfolio projects with client permission, authorized testimonials, job openings, legal policy text (or approval to draft templates for counsel review).
10. **Infrastructure access** when we reach Phase 6: OCI account, MongoDB Atlas, Cloudflare DNS (subdomain record only), GitHub repository.
11. **Security policy values**: password minimum, idle timeout, absolute session length, lockout threshold/duration, invitation and reset link expiry, 2FA policy.
12. **Notification rules**: which events send email by default, recipient mapping, reminder lead time, business timezone.

---

## G. Conflicts, ambiguities and technical limitations

| # | Issue | Why it matters | Proposed resolution |
|---|---|---|---|
| G-1 | **Build environment vs approved stack.** The Emergent workspace preview is pre-wired for FastAPI + Vite/React (TypeScript). The PRD mandates Next.js (JSX) + Express. | Using the template stack would violate §11.1. Using Next/Express means reconfiguring the preview's process runners, so Emergent's one-click hosting for this template may not apply. You would deploy to OCI yourself per §11.2, which is the approved plan anyway. | Build the approved stack (Next.js JSX in `web/`, Express in `api/`) in this workspace. Rewire the preview so `web` serves port 3000 and `api` serves port 8001, using the in-pod MongoDB for development. Remove the template's FastAPI/TS code. **Needs your approval.** |
| G-2 | **RESOLVED: client chose Ubuntu typography.** Original issue — **Segoe UI licensing.** Segoe UI is a proprietary Microsoft font and cannot legally be self-hosted as a web font without a licence. It is only present on Windows devices. | On macOS, iOS, Android and Linux, visitors would see Arial, which hurts the premium editorial feel. | Option A: the stack `"Segoe UI", Selawik, Arial, sans-serif`, with **Selawik** (Microsoft's open-licensed, metrically compatible Segoe UI substitute) self-hosted for non-Windows devices. Option B: the PRD as written (Segoe UI → Arial). Option C: you buy a Segoe UI web licence. Recommendation: **A**. |
| G-3 | Sitemap (§5.1) omits **Industries**, but §6.7 requires industry pages. The desktop nav omits Partnerships/Industries/Contact. | Placement is undefined. | Put Industries in the Services mega menu (a separate column) and the footer. Put Partnerships in the footer Company column and on the Contact hub. Contact is reached through the primary CTA and the footer. |
| G-4 | The **Contact** lead type exists but its form fields are not specified. | Field list needed. | Name, email, company (optional), subject, message, consent. |
| G-5 | No admin module is listed for **Industries**, **About/Legal page content** or the **process steps**, yet §6.10/§17.1 say they must be editable. The ContentPage entity exists. | Without a home in admin, these items wouldn't be editable. | Industries and process steps go under **Services Management**. About/Legal/Culture content pages go under **Website Settings → Pages**. No new module is created. |
| G-6 | Dashboard **"Website analytics"** widget: GA4 data is only available in admin through the GA4 Data API, which needs a service account. | Credential dependency. | First-party metrics (enquiry sources, landing pages from lead context, WhatsApp/meeting click counts logged without PII). GA4 Data API is added if you provide credentials. |
| G-7 | The **Partnerships** module is ambiguous: partnership enquiries are already handled in Leads. | Could duplicate Leads. | The module manages the partnerships page content, partnership types (shown in the form dropdown) and *authorized* partner entries (unpublished until verified). Enquiries stay in Leads. |
| G-8 | **Administrative activity widget** vs the exclusion of an audit log. | Scope creep risk. | Limit the widget to security events (logins, lockouts, invitations, role changes), email-delivery failures and backup status. |
| G-9 | Team Member "permitted status fields" and access to **applications/subscribers** are undefined. "Unless explicitly granted" implies per-user grants. | RBAC detail. | Team Members can set any of the 6 statuses on assigned leads but cannot reassign, delete or export. Applications and subscribers are Admin+ only. Super Admin can grant specific extra permissions per user (e.g. `users.manage`, `settings.manage`, `applications.view`). |
| G-10 | **2FA method** not specified. | Cost and complexity. | TOTP authenticator apps + one-time recovery codes. No SMS (it costs money). Super Admin chooses: off / optional / required for selected roles. |
| G-11 | **Security policy defaults** not specified. | Need values to implement. | Min 12 chars with complexity; 30-minute idle timeout; 12-hour absolute session; 5 failures → 15-minute lockout; invitations valid 72 h; reset links 30 min. All editable by Super Admin. |
| G-12 | **Scheduler timezone and lead time** not specified. | Reminder behaviour. | Business timezone Asia/Kolkata (editable). Upcoming reminder 60 minutes before. Overdue notice once at due time + 15 minutes. One reminder per follow-up occurrence. No recurrence for now (each follow-up is one occurrence). |
| G-13 | **Retention periods and DSR process** not specified. | Required by §12.3. | Lost/closed leads 24 months; applications 12 months; unconfirmed newsletter sign-ups 30 days. Super Admin tool to export or anonymize/delete all records for an email address. Legal counsel to confirm. |
| G-14 | **Malware scanning on the free VM.** ClamAV needs about 1.5–3 GB RAM. The OCI Always Free AMD micro VM has 1 GB; the Ampere A1 (up to 24 GB) is enough but often hard to obtain. | Feasibility. | Ship an optional ClamAV container, enabled when RAM allows. Otherwise uploaded files are marked "unscanned/quarantined" until an admin releases them. |
| G-15 | **Atlas free tier (M0)** has 512 MB storage and no built-in Atlas backups. Some features (change streams, connection limits) are constrained. | Backups and real-time design. | Use our own mongodump-to-R2 backups (already planned). Real-time does not rely on change streams. Monitor storage. |
| G-16 | **Content gap.** No real company story, team, projects or testimonials have been provided. The PRD forbids inventing them. | Homepage trust sections would be empty. | Service, hiring, process, industry and legal-template copy will be written in factual, non-claim language. Story, team, portfolio and testimonial sections render only from published admin data and are hidden when empty. Any demo entries are marked DEMO and unpublished. |
| G-17 | The PRD's "Prepared" date is 30 Oct 2026. Free-tier terms (OCI, Atlas, R2) change over time. | Planning accuracy. | Terms will be re-verified at deployment time, and limitations documented per DEP-08. |
| G-18 | **WhatsApp on Contact page vs admin**: the floating button is public-only. | Clarification. | Confirmed: never rendered in admin. |

---

## Implementation checklist (Rule 12): progress log

| Phase | Status | Evidence |
|---|---|---|
| 1 PRD understanding & RTM | ✅ Approved | Client approval; typography changed to Ubuntu |
| 2 Architecture | ✅ Approved with changes | Admin path `/phobos`; Q1/Q3/Q5 defaults confirmed; placeholder images allowed |
| 3 Design system + representative pages | 🟡 Built, awaiting visual approval | Home, Mobile App service page (all 11 service routes), Hire Developers, `/phobos` dashboard + leads (sample data), light/dark |
| 4a–4f, 5–9 | ⏳ Not started | — |

Partially started in Phase 3: ARC-01 (JSX only, verified by file scan), ARC-02 (`/api/v1` skeleton + public read routes), ARC-03, ARC-11 (seed), BRD-01/02/03/06/08, NAV-01..07, PUB-01/03/04/05/06/12 (rendering only; admin editing comes in Phase 4d), CNV-12 (component built, disabled until a number is configured), SEO-02/05/08 (canonical, OG, noindex admin), SEO-04 (Service + Breadcrumb JSON-LD).
Each stays "In progress" until its admin, permissions and tests are complete.
