const { Router } = require('express');
const { authenticator } = require('otplib');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { User, Session, Invitation, AuthToken } = require('./models');
const S = require('./service');
const { requireAuth } = require('../../middleware/auth');
const { z, parse } = require('../../middleware/validate');
const { HttpError, badRequest } = require('../../utils/errors');
const { sendEmail } = require('../../providers/email');
const env = require('../../config/env');

const router = Router();
const limiter = (max, minutes) => rateLimit({ windowMs: minutes * 60e3, limit: max, standardHeaders: 'draft-7', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait and try again.' } }) });

const invalid = () => new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

async function completeLogin(req, res, user) {
  user.failedLogins = 0; user.lockedUntil = undefined; user.lastLoginAt = new Date();
  await user.save();
  await S.createSession(res, user, req);
  S.logSecurity('login_success', { userId: user._id, req });
  res.json({ data: { user: S.safeUser(user) } });
}

router.post('/login', limiter(10, 15), async (req, res) => {
  const { email, password } = parse(z.object({ email: z.string().email(), password: z.string().min(1).max(200) }), req.body);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.status !== 'active') { await S.verifyPassword('$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHQ$ZmFrZWhhc2g', password); throw invalid(); }
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new HttpError(423, 'LOCKED', 'Too many failed attempts. The account is temporarily locked — try again in 15 minutes.');
  if (!(await S.verifyPassword(user.passwordHash, password))) {
    user.failedLogins += 1;
    if (user.failedLogins >= S.POLICY.maxFailures) {
      user.lockedUntil = new Date(Date.now() + S.POLICY.lockMinutes * 60e3); user.failedLogins = 0;
      S.logSecurity('lockout', { userId: user._id, req });
    } else S.logSecurity('login_failure', { userId: user._id, req });
    await user.save();
    throw invalid();
  }
  if (user.twoFactor?.enabled) {
    const challenge = S.randomToken();
    await AuthToken.create({ userId: user._id, type: '2fa_challenge', tokenHash: S.sha256(challenge), expiresAt: new Date(Date.now() + 5 * 60e3) });
    return res.json({ data: { twoFactorRequired: true, challenge } });
  }
  return completeLogin(req, res, user);
});

router.post('/2fa/verify', limiter(10, 15), async (req, res) => {
  const { challenge, code } = parse(z.object({ challenge: z.string(), code: z.string().min(6).max(20) }), req.body);
  const t = await AuthToken.findOne({ tokenHash: S.sha256(challenge), type: '2fa_challenge', usedAt: null, expiresAt: { $gt: new Date() } });
  if (!t) throw new HttpError(401, 'CHALLENGE_EXPIRED', 'Sign-in step expired. Please sign in again.');
  const user = await User.findById(t.userId);
  const clean = code.replace(/\s/g, '');
  let ok = authenticator.verify({ token: clean, secret: user.twoFactor.secret });
  if (!ok) {
    const h = S.sha256(clean.toUpperCase());
    if (user.twoFactor.recoveryHashes.includes(h)) { ok = true; user.twoFactor.recoveryHashes = user.twoFactor.recoveryHashes.filter((x) => x !== h); }
  }
  if (!ok) throw new HttpError(401, 'INVALID_CODE', 'That code is not valid.');
  t.usedAt = new Date(); await t.save();
  return completeLogin(req, res, user);
});

router.post('/logout', requireAuth, async (req, res) => {
  await Session.updateOne({ _id: req.session._id }, { revokedAt: new Date() });
  S.clearSessionCookies(res);
  res.json({ data: { ok: true } });
});

router.get('/me', requireAuth, (req, res) => res.json({ data: { user: S.safeUser(req.user), idleMinutes: S.POLICY.idleMinutes } }));

router.get('/sessions', requireAuth, async (req, res) => {
  const rows = await Session.find({ userId: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ lastSeenAt: -1 }).lean();
  res.json({ data: rows.map((s) => ({ id: s._id, userAgent: s.userAgent, ip: s.ip, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt, current: s._id === req.session._id })) });
});

router.delete('/sessions/:id', requireAuth, async (req, res) => {
  const r = await Session.updateOne({ _id: req.params.id, userId: req.user._id, revokedAt: null }, { revokedAt: new Date() });
  if (!r.modifiedCount) throw new HttpError(404, 'NOT_FOUND', 'Session not found.');
  S.logSecurity('session_revoked', { userId: req.user._id, req });
  res.json({ data: { ok: true } });
});

router.post('/password/change', requireAuth, async (req, res) => {
  const { current, next } = parse(z.object({ current: z.string(), next: z.string() }), req.body);
  if (!(await S.verifyPassword(req.user.passwordHash, current))) throw badRequest('Current password is incorrect.', { current: 'Incorrect' });
  S.assertStrongPassword(next);
  req.user.passwordHash = await S.hashPassword(next); await req.user.save();
  await S.revokeUserSessions(req.user._id, req.session._id);
  S.logSecurity('password_changed', { userId: req.user._id, req });
  res.json({ data: { ok: true } });
});

router.post('/password/forgot', limiter(5, 60), async (req, res) => {
  const { email } = parse(z.object({ email: z.string().email() }), req.body);
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
  if (user) {
    const token = S.randomToken();
    await AuthToken.create({ userId: user._id, type: 'reset', tokenHash: S.sha256(token), expiresAt: new Date(Date.now() + S.POLICY.resetMinutes * 60e3) });
    await sendEmail({ event: 'password_reset', to: user.email, subject: 'Reset your Kreyszigg Softbizz admin password',
      text: `Reset link (valid ${S.POLICY.resetMinutes} minutes): ${env.publicSiteUrl}/phobos/reset/${token}` });
    S.logSecurity('password_reset_requested', { userId: user._id, req });
  }
  res.json({ data: { ok: true, message: 'If an account exists for that email, a reset link has been sent.' } });
});

router.post('/password/reset', limiter(10, 60), async (req, res) => {
  const { token, password } = parse(z.object({ token: z.string(), password: z.string() }), req.body);
  const t = await AuthToken.findOne({ tokenHash: S.sha256(token), type: 'reset', usedAt: null, expiresAt: { $gt: new Date() } });
  if (!t) throw badRequest('This reset link is invalid or has expired.');
  S.assertStrongPassword(password);
  const user = await User.findById(t.userId);
  user.passwordHash = await S.hashPassword(password); user.failedLogins = 0; user.lockedUntil = undefined; await user.save();
  t.usedAt = new Date(); await t.save();
  await S.revokeUserSessions(user._id);
  S.logSecurity('password_reset', { userId: user._id, req });
  res.json({ data: { ok: true } });
});

async function findInvite(token) {
  const inv = await Invitation.findOne({ tokenHash: S.sha256(token), status: 'pending', expiresAt: { $gt: new Date() } });
  if (!inv) throw badRequest('This invitation link is invalid, expired or has been revoked.');
  return inv;
}
router.get('/invitations/:token', async (req, res) => {
  const inv = await findInvite(req.params.token);
  res.json({ data: { name: inv.name, email: inv.email, role: inv.role, expiresAt: inv.expiresAt } });
});
router.post('/invitations/:token', limiter(10, 60), async (req, res) => {
  const inv = await findInvite(req.params.token);
  const { password } = parse(z.object({ password: z.string() }), req.body);
  S.assertStrongPassword(password);
  if (await User.exists({ email: inv.email })) throw badRequest('An account already exists for this email.');
  const user = await User.create({ name: inv.name, email: inv.email, role: inv.role, grants: inv.grants, passwordHash: await S.hashPassword(password) });
  inv.status = 'accepted'; inv.acceptedAt = new Date(); await inv.save();
  S.logSecurity('invite_accepted', { userId: user._id, req });
  await S.createSession(res, user, req);
  res.json({ data: { user: S.safeUser(user) } });
});

// 2FA (TOTP) enrolment for the signed-in user
router.post('/2fa/setup', requireAuth, async (req, res) => {
  const secret = authenticator.generateSecret();
  req.user.twoFactor.pendingSecret = secret; await req.user.save();
  res.json({ data: { secret, otpauthUrl: authenticator.keyuri(req.user.email, 'Kreyszigg Softbizz', secret) } });
});
router.post('/2fa/enable', requireAuth, async (req, res) => {
  const { code } = parse(z.object({ code: z.string().min(6).max(8) }), req.body);
  const secret = req.user.twoFactor.pendingSecret;
  if (!secret || !authenticator.verify({ token: code.replace(/\s/g, ''), secret })) throw badRequest('That code is not valid.', { code: 'Invalid code' });
  const codes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex').toUpperCase());
  req.user.twoFactor = { enabled: true, secret, pendingSecret: undefined, recoveryHashes: codes.map((c) => S.sha256(c)) };
  await req.user.save();
  S.logSecurity('2fa_enabled', { userId: req.user._id, req });
  res.json({ data: { recoveryCodes: codes } });
});
router.post('/2fa/disable', requireAuth, async (req, res) => {
  const { password } = parse(z.object({ password: z.string() }), req.body);
  if (!(await S.verifyPassword(req.user.passwordHash, password))) throw badRequest('Password is incorrect.', { password: 'Incorrect' });
  req.user.twoFactor = { enabled: false, recoveryHashes: [] }; await req.user.save();
  S.logSecurity('2fa_disabled', { userId: req.user._id, req });
  res.json({ data: { ok: true } });
});

module.exports = router;
