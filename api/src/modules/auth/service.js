const crypto = require('crypto');
const argon2 = require('argon2');
const env = require('../../config/env');
const { Session, SecurityEvent } = require('./models');
const { badRequest } = require('../../utils/errors');
const { permsFor } = require('../../config/permissions');

const POLICY = {
  idleMinutes: Number(process.env.SESSION_IDLE_MINUTES || 30),
  absoluteHours: Number(process.env.SESSION_ABSOLUTE_HOURS || 12),
  maxFailures: 5,
  lockMinutes: 15,
  inviteHours: 72,
  resetMinutes: 30,
};

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');
const hashPassword = (p) => argon2.hash(p, { type: argon2.argon2id });
const verifyPassword = (hash, p) => argon2.verify(hash, p).catch(() => false);

function assertStrongPassword(p) {
  const issues = [];
  if (typeof p !== 'string' || p.length < 12) issues.push('at least 12 characters');
  if (!/[a-z]/.test(p || '')) issues.push('a lowercase letter');
  if (!/[A-Z]/.test(p || '')) issues.push('an uppercase letter');
  if (!/\d/.test(p || '')) issues.push('a number');
  if (!/[^A-Za-z0-9]/.test(p || '')) issues.push('a symbol');
  if (issues.length) throw badRequest(`Password must contain ${issues.join(', ')}.`, { password: issues });
}

const COOKIE = 'ks_sid';
const CSRF_COOKIE = 'ks_csrf';
const cookieOpts = (httpOnly) => ({ httpOnly, secure: env.isProd, sameSite: 'lax', path: '/' });

async function createSession(res, user, req) {
  const token = randomToken();
  const csrf = randomToken();
  const now = new Date();
  await Session.create({
    userId: user._id,
    tokenHash: sha256(token),
    csrf,
    ip: (req.ip || '').replace(/\.\d+$/, '.0'), // truncated IP
    userAgent: (req.get('user-agent') || '').slice(0, 200),
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + POLICY.absoluteHours * 3600e3),
  });
  res.cookie(COOKIE, token, { ...cookieOpts(true), maxAge: POLICY.absoluteHours * 3600e3 });
  res.cookie(CSRF_COOKIE, csrf, { ...cookieOpts(false), maxAge: POLICY.absoluteHours * 3600e3 });
}

function clearSessionCookies(res) {
  res.clearCookie(COOKIE, cookieOpts(true));
  res.clearCookie(CSRF_COOKIE, cookieOpts(false));
}

const revokeUserSessions = (userId, exceptId) =>
  Session.updateMany({ userId, revokedAt: null, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }, { revokedAt: new Date() });

function logSecurity(kind, { userId, email, req, meta } = {}) {
  return SecurityEvent.create({ kind, userId, email, ip: req ? (req.ip || '').replace(/\.\d+$/, '.0') : undefined, meta }).catch(() => {});
}

function safeUser(u) {
  return {
    id: u._id, name: u.name, email: u.email, role: u.role, grants: u.grants || [], status: u.status,
    twoFactorEnabled: Boolean(u.twoFactor?.enabled), lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
    permissions: permsFor(u),
  };
}

module.exports = {
  POLICY, COOKIE, sha256, randomToken, hashPassword, verifyPassword, assertStrongPassword,
  createSession, clearSessionCookies, revokeUserSessions, logSecurity, safeUser,
};
