# Test credentials (preview environment)

Admin portal: https://softbizz--8sja0ju5.preview.emergentagent.com/phobos/login

| Role | Email | Password |
|---|---|---|
| Super Admin (owner) | admin@kreyszigg.com | Set by the owner via password reset on 2026-10-30. NOT known to the agent, so don't reset it. |
| Admin (QA, preview only) | qa.admin@example.com | QaAdmin#2026xyz |
| Team Member (test) | team.a@example.com | TeamMember#2026x |

Notes:
- The QA Admin is created/reset by `node api/src/scripts/create-test-admin.js` (it refuses to run when NODE_ENV=production). Deactivate it before go-live.
- Invitation-only. No public registration.
- Email is REAL (SMTP mail.kreyszigg.com). Tests send to example.com addresses, which bounce harmlessly.
- Lockout: 5 failed logins lock the account for 15 min. Unlock in dev:
  mongosh kreyszigg --eval 'db.users.updateMany({},{$unset:{lockedUntil:1},$set:{failedLogins:0}})'
- Cron secret: WEBHOOK_CRON_SECRET in /app/api/.env (for calling /api/cron/* manually).
