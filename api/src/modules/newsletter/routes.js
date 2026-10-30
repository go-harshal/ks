const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { Subscriber, Campaign } = require('./models');
const { token, clean, fanOut, sendTest } = require('./service');
const { can } = require('../../config/permissions');
const { authorize } = require('../../middleware/auth');
const { z, parse } = require('../../middleware/validate');
const { HttpError, notFound, badRequest } = require('../../utils/errors');
const { EmailDelivery } = require('../../providers/email');

// ---------------- Public ----------------
const pub = Router();
const limiter = rateLimit({ windowMs: 10 * 60e3, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in a few minutes.' } }) });

pub.post('/newsletter/subscribe', limiter, async (req, res) => {
  const b = req.body || {};
  if (b.website_hp) return res.status(201).json({ data: { ok: true } });
  if (b.consent !== true && b.consent !== 'true') throw badRequest('Please agree to receive the newsletter.', { consent: 'Required' });
  const { email } = parse(z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200) }), b);
  const existing = await Subscriber.findOne({ email });
  if (existing) {
    if (existing.status !== 'subscribed') { existing.status = 'subscribed'; existing.unsubscribedAt = undefined; existing.consent = { version: 'newsletter-v1', at: new Date() }; await existing.save(); }
  } else {
    await Subscriber.create({ email, source: String(b.page || '').slice(0, 200), consent: { version: 'newsletter-v1', at: new Date() }, unsubToken: token() });
  }
  res.status(201).json({ data: { ok: true } }); // same response either way — does not reveal whether an address was already on the list
});

async function unsubscribe(req, res) {
  const t = String(req.query.token || req.body?.token || '');
  if (!/^[\w-]{20,64}$/.test(t)) throw badRequest('This unsubscribe link is not valid.');
  const sub = await Subscriber.findOne({ unsubToken: t });
  if (!sub) throw notFound('This unsubscribe link is not valid or has expired.');
  if (sub.status !== 'unsubscribed') { sub.status = 'unsubscribed'; sub.unsubscribedAt = new Date(); await sub.save(); }
  res.json({ data: { ok: true, email: sub.email.replace(/^(.).*(@.*)$/, '$1•••$2') } });
}
pub.post('/newsletter/unsubscribe', unsubscribe); // one-click (RFC 8058) and the website button

// ---------------- Admin ----------------
const admin = Router();
const canSend = (u) => can(u, 'newsletter.manage');
admin.use('/newsletter', (req, _res, next) => { if (!canSend(req.user) && !can(req.user, 'newsletter.draft')) throw new HttpError(403, 'FORBIDDEN', 'You do not have permission for this action.'); next(); });

admin.get('/newsletter/subscribers', authorize('newsletter.manage'), async (req, res) => {
  const q = parse(z.object({ q: z.string().max(100).optional(), status: z.enum(['subscribed', 'unsubscribed']).optional() }), req.query);
  const f = {};
  if (q.status) f.status = q.status;
  if (q.q) f.email = new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [rows, subscribed, unsubscribed] = await Promise.all([
    Subscriber.find(f).sort({ createdAt: -1 }).limit(500).select('email status source createdAt unsubscribedAt').lean(),
    Subscriber.countDocuments({ status: 'subscribed' }), Subscriber.countDocuments({ status: 'unsubscribed' }),
  ]);
  res.json({ data: rows.map(({ _id, ...r }) => ({ ...r, id: _id })), meta: { subscribed, unsubscribed } });
});

admin.get('/newsletter/subscribers/export', authorize('newsletter.manage'), async (_req, res) => {
  const rows = await Subscriber.find().sort({ createdAt: -1 }).lean();
  const cell = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
  const csv = ['email,status,subscribed_at,unsubscribed_at,source', ...rows.map((r) => [r.email, r.status, r.createdAt?.toISOString(), r.unsubscribedAt?.toISOString() || '', r.source].map(cell).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
  res.send(csv);
});

admin.post('/newsletter/subscribers/:id/unsubscribe', authorize('newsletter.manage'), async (req, res) => {
  const r = await Subscriber.updateOne({ _id: req.params.id }, { status: 'unsubscribed', unsubscribedAt: new Date() });
  if (!r.matchedCount) throw notFound('Subscriber not found');
  res.json({ data: { ok: true } });
});
admin.delete('/newsletter/subscribers/:id', authorize('newsletter.manage'), async (req, res) => {
  const r = await Subscriber.deleteOne({ _id: req.params.id });
  if (!r.deletedCount) throw notFound('Subscriber not found');
  res.json({ data: { ok: true } });
});

// Campaigns
const scope = (u) => (canSend(u) ? {} : { authorId: u._id });
const view = (c, u, stats) => ({ ...c, id: c._id, _id: undefined, canEdit: canSend(u) || (c.authorId === u._id && c.status === 'draft'), canSend: canSend(u), stats });
const campaignSchema = z.object({ subject: z.string().trim().min(3).max(150), preheader: z.string().trim().max(150).optional().default(''), body: z.string().max(200000).default('').transform(clean) });

async function stats(id) {
  const agg = await EmailDelivery.aggregate([{ $match: { dedupeKey: { $regex: `^campaign:${id}:` } } }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  return Object.fromEntries(agg.map((a) => [a._id, a.n]));
}
async function load(req) {
  const c = await Campaign.findOne({ _id: req.params.id, ...scope(req.user) });
  if (!c) throw notFound('Newsletter not found');
  return c;
}

admin.get('/newsletter/campaigns', async (req, res) => {
  const rows = await Campaign.find(scope(req.user)).sort({ updatedAt: -1 }).limit(100).lean();
  res.json({ data: rows.map((c) => view(c, req.user)) });
});
admin.get('/newsletter/campaigns/:id', async (req, res) => {
  const c = await load(req);
  res.json({ data: view(c.toObject(), req.user, await stats(c._id)) });
});
admin.post('/newsletter/campaigns', async (req, res) => {
  const d = parse(campaignSchema, req.body);
  const c = await Campaign.create({ ...d, authorId: req.user._id, history: [{ kind: 'created', by: req.user.name, at: new Date() }] });
  res.status(201).json({ data: view(c.toObject(), req.user) });
});
admin.patch('/newsletter/campaigns/:id', async (req, res) => {
  const c = await load(req);
  if (!['draft', 'scheduled'].includes(c.status)) throw badRequest('Sent newsletters cannot be edited.');
  if (!canSend(req.user) && c.authorId !== req.user._id) throw new HttpError(403, 'FORBIDDEN', 'You can edit only your own drafts.');
  Object.assign(c, parse(campaignSchema.partial(), req.body));
  c.history.push({ kind: 'edited', by: req.user.name, at: new Date() });
  await c.save();
  res.json({ data: view(c.toObject(), req.user) });
});
admin.delete('/newsletter/campaigns/:id', async (req, res) => {
  const c = await load(req);
  if (!['draft', 'cancelled'].includes(c.status) || (!canSend(req.user) && c.authorId !== req.user._id)) throw new HttpError(403, 'FORBIDDEN', 'Only unsent drafts can be deleted.');
  await c.deleteOne();
  res.json({ data: { ok: true } });
});
admin.post('/newsletter/campaigns/:id/test', async (req, res) => {
  const c = await load(req);
  if (!c.body) throw badRequest('Write the newsletter before sending a test.');
  await sendTest(c.toObject(), req.user);
  res.status(202).json({ data: { ok: true, to: req.user.email } });
});
admin.post('/newsletter/campaigns/:id/send', authorize('newsletter.manage'), async (req, res) => {
  const { scheduledAt } = parse(z.object({ scheduledAt: z.string().datetime({ offset: true }).optional() }), req.body || {});
  const c = await load(req);
  if (!['draft', 'scheduled'].includes(c.status)) throw badRequest('This newsletter has already been sent.');
  if (!c.body || !c.subject) throw badRequest('Add a subject and content before sending.');
  const subscribers = await Subscriber.countDocuments({ status: 'subscribed' });
  if (!subscribers) throw badRequest('There are no subscribers yet.');
  if (scheduledAt) {
    const when = new Date(scheduledAt);
    if (when.getTime() < Date.now() + 5 * 60e3) throw badRequest('Choose a time at least 5 minutes from now.', { scheduledAt: 'Too soon' });
    c.status = 'scheduled'; c.scheduledAt = when;
    c.history.push({ kind: 'scheduled', by: req.user.name, note: when.toISOString(), at: new Date() });
    await c.save();
    return res.json({ data: view(c.toObject(), req.user) });
  }
  c.status = 'sending'; c.history.push({ kind: 'send', by: req.user.name, note: `${subscribers} subscribers`, at: new Date() });
  await c.save();
  setImmediate(() => fanOut(c._id).catch((e) => console.error('[newsletter] fan-out failed', e.message)));
  return res.status(202).json({ data: view(c.toObject(), req.user) });
});
admin.post('/newsletter/campaigns/:id/cancel', authorize('newsletter.manage'), async (req, res) => {
  const c = await load(req);
  if (c.status !== 'scheduled') throw badRequest('Only scheduled newsletters can be cancelled.');
  c.status = 'draft'; c.scheduledAt = undefined; c.history.push({ kind: 'unscheduled', by: req.user.name, at: new Date() });
  await c.save();
  res.json({ data: view(c.toObject(), req.user) });
});

module.exports = { newsletterPublic: pub, newsletterAdmin: admin };
