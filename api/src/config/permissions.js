// Role → permission map. Backend is the source of truth; frontend only mirrors it for display.
const ROLES = ['super_admin', 'admin', 'team_member'];

const SUPER_ONLY = ['users.manage', 'settings.manage', 'backups.manage', 'privacy.manage'];

const ROLE_PERMS = {
  super_admin: ['*'],
  admin: ['content.manage', 'leads.view_all', 'leads.assign', 'leads.export', 'reports.view', 'applications.manage', 'newsletter.manage'],
  team_member: ['leads.view_assigned'],
};

// Extra permissions a Super Admin may grant per user (never Super-only ones to Team Members).
const GRANTABLE = ['leads.export', 'leads.assign', 'leads.view_all', 'applications.manage', 'newsletter.manage', 'reports.view', 'content.manage', 'users.manage', 'settings.manage'];

function permsFor(user) {
  const base = ROLE_PERMS[user.role] || [];
  if (base.includes('*')) return ['*'];
  const grants = (user.grants || []).filter((g) => GRANTABLE.includes(g) && !(user.role === 'team_member' && SUPER_ONLY.includes(g)));
  return [...new Set([...base, ...grants])];
}

function can(user, perm) {
  const p = permsFor(user);
  return p.includes('*') || p.includes(perm);
}

module.exports = { ROLES, ROLE_PERMS, GRANTABLE, SUPER_ONLY, permsFor, can };
