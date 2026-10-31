# Patchfix remediation plan

Base: `main` at branch creation. All work is isolated on `patchfix`.

## Security remediation

| Priority | File(s) | Change | Verification |
|---|---|---|---|
| P0 | `api/src/config/permissions.js`, `api/src/modules/users/routes.js` | Remove `users.manage` from delegable grants; require explicit Super Admin authority for role changes and Super Admin invitations; reject self-grant changes. | Permission regression tests and authenticated API authorization tests. |
| P1 | `api/src/modules/auth/service.js`, `api/src/modules/auth/routes.js`, `api/src/modules/auth/models.js` | AES-256-GCM encrypt TOTP secrets and pending secrets; lazy-encrypt legacy plaintext after successful verification; atomically consume one-time 2FA challenges. Configure `TOTP_ENCRYPTION_KEY` as a 32-byte base64 key or high-entropy secret. | Round-trip/tamper tests, migration verification, replay/concurrency test. |
| P1 | `api/src/providers/malwareScanner.js`, `api/src/modules/leads/publicRoutes.js`, `api/src/modules/content/publicRoutes.js`, `api/src/modules/content/adminRoutes.js`, `api/src/modules/partners/routes.js` | Scan every current upload route using ClamAV INSTREAM before writing to storage. Fail closed when scanner is unavailable or returns an inconclusive result. Store scan state with asset metadata. | Clean, EICAR, scanner-down, timeout and oversized-buffer tests. |
| P1 | `tests/package.json`, `tests/e2e/security.spec.ts` | Add Playwright command and regression tests for delegated privilege escalation and unauthenticated admin access. | Run Playwright against test environment with Chromium installed. |
| P2 | `api/src/modules/auth/routes.js` | Ensure TOTP recovery-code consumption is atomic; review rate-limit store and challenge attempt limits. | Parallel recovery-code reuse test. |
| P2 | deployment configuration | Supply managed ClamAV endpoint and stable encryption key; restrict network access; use distributed rate-limit storage in multi-instance deployments. | Deployment smoke checks; secrets must not be committed. |

## SEO and crawlability

| File(s) | Change | Verification |
|---|---|---|
| `web/app/robots.js` | Publish robots rules excluding private/admin/API paths and advertise sitemap. | Fetch `/robots.txt` in production. |
| `web/app/sitemap.js` | Generate canonical sitemap entries for public static routes and published services, industries, articles, case studies and open jobs. | Validate XML, canonical host, status codes, no drafts/private routes. |
| `web/app/(public)/layout.jsx` | Add Organization and WebSite JSON-LD using the configured canonical site URL. | Rich Results Test / Schema Markup Validator. |
| Public page route metadata | Ensure unique title, description and canonical URL for indexable routes; add Article, JobPosting and BreadcrumbList data where the relevant page data is available. | Crawl rendered pages; check duplicate/missing metadata and structured-data validity. |
| `web/next.config.mjs` | Keep admin noindex response header; preserve public indexability. | Inspect response headers for public and admin paths. |

## Release gates

0. **Credential exposure response:** repository history/commit metadata on the base branch contains a QA login credential. Treat it as compromised: disable or rotate that account immediately, invalidate sessions, check for reuse, and consider history cleanup after coordinating with repository owners. Do not copy the value into issues, docs or logs.
1. Install dependencies and run API syntax checks, frontend production build, Playwright suite and dependency/security audits.
2. Run scanner integration tests with a real ClamAV service and EICAR test file in an isolated test environment.
3. Validate the 2FA key in deployment secret management; do not store it in source control.
4. Verify the sitemap against the deployed site and submit it to Search Console.
5. Review the diff and open a draft PR from `patchfix` to `main`; do not merge without review.

## Current implementation notes

- The branch is created from `main`; no changes are made to `main`.
- Uploads are now scanned before persistence on all four current upload paths. A configured ClamAV service is required; the scanner intentionally rejects uploads if unavailable.
- Existing plaintext TOTP values are supported only for migration compatibility and are re-encrypted after a successful verification. Rotate/re-enrol 2FA if key management or historic DB exposure is uncertain.
- These source changes are not a certification or penetration-test result. Production acceptance requires the verification gates above.
