# Test credentials (preview environment)

Admin portal: https://softbizz--8sja0ju5.preview.emergentagent.com/phobos/login

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@kreyszigg.com | Kreyszigg#Admin2026 |
| Team Member (test) | team.a@example.com | TeamMember#2026x |

Notes:
- Invitation-only. No public registration. New users: Super Admin invites from /phobos/users.
- Email is MOCKED: invite/reset links are written to /var/log/supervisor/backend.out.log
  (grep "phobos/invite/" or "phobos/reset/").
- Lockout: 5 failed logins locks the account for 15 min. Unlock in dev:
  mongosh kreyszigg --eval 'db.users.updateMany({},{$unset:{lockedUntil:1},$set:{failedLogins:0}})'
- 2FA is off for both accounts. It can be turned on per user in /phobos/profile.
- Change the Super Admin password before go-live.
