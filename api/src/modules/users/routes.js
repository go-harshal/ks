const { Router } = require('express');
const { User, Session, Invitation } = require('../auth/models');
const S = require('../auth/service');
const { authorize } = require('../../middleware/auth');
const { z, parse } = require('../../middleware/validate');
const { HttpError, badRequest, notFound } = require('../../utils/errors');
const { GRANTABLE } = require('../../config/permissions');
const { sendEmail } = require('../../providers/email');
const env = require('../../config/env');

const router = Router();
// Scoped to this module's paths only — a bare router.use() would gate every later /admin router too.
router.use(['/users', '/invitations'], authorize('users.manage'));

const role = z.enum(['super_admin', 'admin', 'team_member']);

router.get('/users', async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ data: users.map(S.safeUser) });
});

router.patch('/users/:id', async (req, res) => {
  const body = parse(z.object({ role: role.optional(), grants: z.array(z.enum(GRANTABLE)).optional(), name: z.string().min(1).max(120).optional() }), req.body);
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  if (user._id === req.user._id && body.role && body.role !== 'super_admin') throw badRequest('You cannot remove your own Super Admin role.');
  const before = user.role;
  Object.assign(user, body); await user.save();
  if (body.role && body.role !== before) { await S.revokeUserSessions(user._id); S.logSecurity('role_change', { userId: user._id, req, meta: { from: before, to: body.role, by: req.user._id } }); }
  res.json({ data: S.safeUser(user) });
});

router.post('/users/:id/:action', async (req, res) => {
  if (!['deactivate', 'reactivate'].includes(req.params.action)) throw notFound('Unknown action');
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('User not found');
  if (user._id === req.user._id) throw badRequest('You cannot deactivate your own account.');
  user.status = req.params.action === 'deactivate' ? 'deactivated' : 'active'; await user.save();
  if (user.status === 'deactivated') await S.revokeUserSessions(user._id);
  S.logSecurity(`user_${req.params.action}d`, { userId: user._id, req, meta: { by: req.user._id } });
  res.json({ data: S.safeUser(user) });
});

router.get('/users/:id/sessions', async (req, res) => {
  const rows = await Session.find({ userId: req.params.id, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ lastSeenAt: -1 }).lean();
  res.json({ data: rows.map((s) => ({ id: s._id, userAgent: s.userAgent, ip: s.ip, lastSeenAt: s.lastSeenAt })) });
});
router.delete('/users/:id/sessions/:sid', async (req, res) => {
  const r = await Session.updateOne({ _id: req.params.sid, userId: req.params.id, revokedAt: null }, { revokedAt: new Date() });
  if (!r.modifiedCount) throw notFound('Session not found');
  res.json({ data: { ok: true } });
});

const inviteView = (i) => ({ id: i._id, name: i.name, email: i.email, role: i.role, status: i.status === 'pending' && i.expiresAt < new Date() ? 'expired' : i.status, expiresAt: i.expiresAt, createdAt: i.createdAt });

async function issueInvite(inv, inviter) {
  const token = S.randomToken();
  inv.tokenHash = S.sha256(token);
  inv.expiresAt = new Date(Date.now() + S.POLICY.inviteHours * 3600e3);
  inv.status = 'pending';
  await inv.save();
  await sendEmail({ event: 'invitation', to: inv.email, subject: 'You have been invited to the Kreyszigg Softbizz admin',
    text: `${inviter} invited you as ${inv.role}. Set your password (link valid ${S.POLICY.inviteHours} hours): ${env.publicSiteUrl}/phobos/invite/${token}` });
  return token;
}

router.get('/invitations', async (_req, res) => {
  res.json({ data: (await Invitation.find().sort({ createdAt: -1 }).limit(200)).map(inviteView) });
});
router.post('/invitations', async (req, res) => {
  const body = parse(z.object({ name: z.string().min(1).max(120), email: z.string().email(), role, grants: z.array(z.enum(GRANTABLE)).optional() }), req.body);
  const email = body.email.toLowerCase();
  if (await User.exists({ email })) throw new HttpError(409, 'EXISTS', 'A user with this email already exists.');
  await Invitation.updateMany({ email, status: 'pending' }, { status: 'revoked' });
  const inv = new Invitation({ ...body, email, invitedBy: req.user._id });
  await issueInvite(inv, req.user.name);
  S.logSecurity('invite_sent', { userId: req.user._id, req, meta: { email } });
  res.status(201).json({ data: inviteView(inv) });
});
router.post('/invitations/:id/:action', async (req, res) => {
  if (!['resend', 'revoke'].includes(req.params.action)) throw notFound('Unknown action');
  const inv = await Invitation.findById(req.params.id);
  if (!inv || inv.status === 'accepted') throw notFound('Invitation not found or already accepted');
  if (req.params.action === 'resend') await issueInvite(inv, req.user.name);
  else { inv.status = 'revoked'; await inv.save(); }
  S.logSecurity(`invite_${req.params.action === 'resend' ? 'resent' : 'revoked'}`, { userId: req.user._id, req, meta: { email: inv.email } });
  res.json({ data: inviteView(inv) });
});

module.exports = router;
