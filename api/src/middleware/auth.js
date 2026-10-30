const { Session, User } = require('../modules/auth/models');
const { sha256, COOKIE, POLICY } = require('../modules/auth/service');
const { can } = require('../config/permissions');
const { HttpError } = require('../utils/errors');

const unauth = () => new HttpError(401, 'UNAUTHENTICATED', 'Please sign in.');

/** Validates the session cookie, idle + absolute expiry, active user; enforces CSRF on unsafe methods. */
async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) throw unauth();
  const session = await Session.findOne({ tokenHash: sha256(token), revokedAt: null });
  const now = Date.now();
  if (!session || session.expiresAt.getTime() < now || session.lastSeenAt.getTime() + POLICY.idleMinutes * 60e3 < now) {
    if (session && !session.revokedAt) await Session.updateOne({ _id: session._id }, { revokedAt: new Date() });
    throw new HttpError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
  }
  const user = await User.findById(session.userId);
  if (!user || user.status !== 'active') throw unauth();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('x-csrf-token') !== session.csrf) {
    throw new HttpError(403, 'CSRF', 'Security token missing or invalid. Refresh the page and try again.');
  }
  if (now - session.lastSeenAt.getTime() > 30e3) await Session.updateOne({ _id: session._id }, { lastSeenAt: new Date() });
  req.user = user;
  req.session = session;
  next();
}

const authorize = (perm) => (req, _res, next) => {
  if (!can(req.user, perm)) throw new HttpError(403, 'FORBIDDEN', 'You do not have permission for this action.');
  next();
};

module.exports = { requireAuth, authorize };
