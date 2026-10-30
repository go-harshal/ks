// First-party, consent-gated page analytics. The browser sends a page view ONLY after the visitor accepts
// analytics cookies. No IP address, user agent or personal data is stored: only path, day, a random
// per-tab session id (hashed), referrer host and UTM source. Raw events expire after 400 days.
const { Router } = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { model, Schema } = require('mongoose');
const { Lead } = require('../leads/models');
const { authorize } = require('../../middleware/auth');
const { z, parse } = require('../../middleware/validate');
const { DAY, startOfDay, dayKey, parseDay } = require('../../utils/dates');

const PageView = model('PageView', new Schema({
  path: { type: String, index: true }, day: { type: String, index: true }, sid: String, landing: Boolean,
  refHost: String, utm: String, at: { type: Date, default: Date.now, expires: 400 * 86400 },
}, { versionKey: false }), 'pageViews');

const pub = Router();
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor/i;
const cleanPath = (p) => {
  const s = String(p || '').split('#')[0].split('?')[0].slice(0, 200);
  return /^\/[\w\-/.%]*$/.test(s) && !s.startsWith('/phobos') && !s.startsWith('/api') ? (s.length > 1 ? s.replace(/\/$/, '') : s) : null;
};

pub.post('/analytics/pageview', rateLimit({ windowMs: 60e3, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }), async (req, res) => {
  const b = req.body || {};
  const path = cleanPath(b.path);
  if (!path || BOT.test(req.get('user-agent') || '') || b.consent !== true) return res.status(204).end();
  let refHost = '';
  try { if (b.referrer) { const h = new URL(String(b.referrer)).hostname.replace(/^www\./, ''); if (h !== req.hostname) refHost = h.slice(0, 100); } } catch { /* ignore */ }
  await PageView.create({
    path, day: dayKey(), landing: !!b.landing, refHost, utm: String(b.utm || '').toLowerCase().replace(/[^\w.-]/g, '').slice(0, 60),
    sid: crypto.createHash('sha256').update(String(b.sid || '').slice(0, 64)).digest('hex').slice(0, 24),
  });
  return res.status(204).end();
});

const admin = Router();
admin.get('/analytics', authorize('reports.view'), async (req, res) => {
  const q = parse(z.object({ range: z.enum(['today', '7', '30', '90', 'custom']).default('30'), from: z.string().optional(), to: z.string().optional() }), req.query);
  const today = startOfDay();
  let from = new Date(today.getTime() - (Number(q.range === 'today' ? 1 : q.range === 'custom' ? 30 : q.range) - 1) * DAY);
  let to = new Date(today.getTime() + DAY);
  if (q.range === 'custom') { from = parseDay(q.from) || from; const t = parseDay(q.to); if (t) to = new Date(t.getTime() + DAY); }
  const fromKey = dayKey(from); const toKey = dayKey(to.getTime() - 1);
  const match = { day: { $gte: fromKey, $lte: toKey } };
  const [totals, days, pages, refs, leads] = await Promise.all([
    PageView.aggregate([{ $match: match }, { $group: { _id: null, views: { $sum: 1 }, sids: { $addToSet: '$sid' } } }, { $project: { views: 1, sessions: { $size: '$sids' } } }]),
    PageView.aggregate([{ $match: match }, { $group: { _id: '$day', views: { $sum: 1 }, sids: { $addToSet: '$sid' } } }, { $project: { views: 1, sessions: { $size: '$sids' } } }, { $sort: { _id: 1 } }]),
    PageView.aggregate([{ $match: match }, { $group: { _id: '$path', views: { $sum: 1 }, sids: { $addToSet: '$sid' }, entries: { $sum: { $cond: ['$landing', 1, 0] } } } },
      { $project: { views: 1, entries: 1, sessions: { $size: '$sids' } } }, { $sort: { views: -1 } }, { $limit: 25 }]),
    PageView.aggregate([{ $match: { ...match, landing: true } }, { $group: { _id: { $cond: [{ $ne: ['$utm', ''] }, '$utm', { $cond: [{ $ne: ['$refHost', ''] }, '$refHost', 'Direct / unknown'] }] }, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }]),
    Lead.find({ createdAt: { $gte: from, $lt: to } }).select('source.landing source.page').lean(),
  ]);
  const byLanding = {};
  let attributed = 0;
  leads.forEach((l) => { const p = cleanPath(l.source?.landing); if (p) { attributed += 1; byLanding[p] = (byLanding[p] || 0) + 1; } });
  const series = [];
  for (let t = from.getTime(); t < to.getTime(); t += DAY) { const k = dayKey(t); const d = days.find((x) => x._id === k); series.push({ day: k.slice(5), Views: d?.views || 0, Sessions: d?.sessions || 0 }); }
  const t0 = totals[0] || { views: 0, sessions: 0 };
  res.json({ data: {
    range: { from: fromKey, to: toKey },
    totals: { views: t0.views, sessions: t0.sessions, enquiries: leads.length, attributed, conversion: t0.sessions ? Math.min(100, Math.round((attributed / t0.sessions) * 1000) / 10) : null },
    series: series.slice(-92),
    pages: pages.map((p) => ({ path: p._id, views: p.views, sessions: p.sessions, entries: p.entries, enquiries: byLanding[p._id] || 0, conversion: p.entries ? Math.round(((byLanding[p._id] || 0) / p.entries) * 1000) / 10 : null })),
    sources: refs.map((r) => ({ source: r._id, sessions: r.n })),
    unattributed: leads.length - attributed,
  } });
});

module.exports = { analyticsPublic: pub, analyticsAdmin: admin };
