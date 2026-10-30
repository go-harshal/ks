const { Router } = require('express');
const { Lead } = require('../leads/models');
const { User } = require('../auth/models');
const { CaseStudy, Job, Application } = require('../content/models');
const { can } = require('../../config/permissions');
const { z, parse } = require('../../middleware/validate');
const { DAY, startOfDay, parseDay, monthKey, dayKey } = require('../../utils/dates');
const { LEAD_STATUSES, LEAD_TYPES } = require('../leads/models');

const router = Router();
const OPEN = { status: { $nin: ['Won', 'Lost'] } };

function sourceOf(l) {
  const utm = l.source?.utm?.utm_source;
  if (utm) return utm.toLowerCase();
  const ref = l.source?.referrer || '';
  try {
    if (ref) {
      const host = new URL(ref).hostname.replace(/^www\./, '');
      if (/google|bing|duckduckgo|yahoo/.test(host)) return 'Search';
      if (/linkedin|facebook|instagram|twitter|x\.com|t\.co/.test(host)) return 'Social';
      return host;
    }
  } catch { /* malformed referrer */ }
  return 'Direct / unknown';
}

router.get('/dashboard', async (req, res) => {
  const q = parse(z.object({ range: z.enum(['today', '7', '30', '90', 'custom']).default('30'), from: z.string().optional(), to: z.string().optional() }), req.query);
  const company = can(req.user, 'leads.view_all');
  const scope = company ? {} : { assigneeId: req.user._id };
  const today = startOfDay();
  let from; let to = new Date();
  if (q.range === 'custom') {
    from = parseDay(q.from) || new Date(0);
    const t = parseDay(q.to); if (t) to = new Date(t.getTime() + DAY - 1);
  } else {
    from = new Date(today.getTime() - (Number(q.range === 'today' ? 1 : q.range) - 1) * DAY);
  }
  const inRange = { ...scope, createdAt: { $gte: from, $lte: to } };
  const sixMonthsAgo = new Date(today); sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5); sixMonthsAgo.setUTCDate(1);

  const [rangeLeads, trendLeads, followLeads, names] = await Promise.all([
    Lead.find(inRange).select('type status source contact createdAt').sort({ createdAt: -1 }).lean(),
    Lead.find({ ...scope, createdAt: { $gte: sixMonthsAgo } }).select('status createdAt').lean(),
    Lead.find({ ...scope, ...OPEN, followUpAt: { $ne: null, $lt: new Date(today.getTime() + 8 * DAY) } }).select('contact followUpAt assigneeId status type').sort({ followUpAt: 1 }).lean(),
    User.find().select('name').lean().then((u) => Object.fromEntries(u.map((x) => [x._id, x.name]))),
  ]);

  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  const byType = Object.fromEntries(LEAD_TYPES.map((t) => [t, 0]));
  const sources = {};
  rangeLeads.forEach((l) => { byStatus[l.status] += 1; byType[l.type] += 1; const s = sourceOf(l); sources[s] = (sources[s] || 0) + 1; });
  const won = byStatus.Won; const lost = byStatus.Lost; const total = rangeLeads.length;

  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(today); d.setUTCDate(15); d.setUTCMonth(d.getUTCMonth() - i);
    months.push({ key: monthKey(d), month: d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Asia/Kolkata' }), Enquiries: 0, Won: 0 });
  }
  trendLeads.forEach((l) => { const m = months.find((x) => x.key === monthKey(l.createdAt)); if (m) { m.Enquiries += 1; if (l.status === 'Won') m.Won += 1; } });

  const endToday = new Date(today.getTime() + DAY);
  const fu = (l) => ({ id: l._id, name: l.contact?.company || l.contact?.name, type: l.type, status: l.status, followUpAt: l.followUpAt, assigneeName: l.assigneeId ? names[l.assigneeId] || 'Unknown user' : 'Unassigned' });
  const overdue = followLeads.filter((l) => l.followUpAt < today);
  const dueToday = followLeads.filter((l) => l.followUpAt >= today && l.followUpAt < endToday);
  const upcoming = followLeads.filter((l) => l.followUpAt >= endToday);

  const extras = {};
  if (can(req.user, 'content.manage')) {
    const [cs, jobs] = await Promise.all([CaseStudy.countDocuments({ status: 'in_review' }), Job.countDocuments({ status: 'in_review' })]);
    extras.reviewQueue = { caseStudies: cs, jobs };
  }
  if (can(req.user, 'applications.manage')) {
    extras.applications = { new: await Application.countDocuments({ status: 'New' }), total: await Application.countDocuments({}) };
  }

  if (can(req.user, 'reports.view')) extras.analytics = true;
  res.json({ data: {
    scope: company ? 'company' : 'mine',
    range: { key: q.range, from: dayKey(from), to: dayKey(to) },
    today: dayKey(),
    kpis: { total, byStatus, open: total - won - lost },
    conversion: { won, lost, closed: won + lost, winRate: won + lost ? Math.round((won / (won + lost)) * 100) : null, leadToWin: total ? Math.round((won / total) * 100) : null },
    byType,
    sources: Object.entries(sources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    trend: months.map(({ key, ...m }) => m),
    recent: rangeLeads.slice(0, 6).map((l) => ({ id: l._id, name: l.contact?.company || l.contact?.name, type: l.type, status: l.status, source: sourceOf(l), createdAt: l.createdAt })),
    followups: { overdueCount: overdue.length, todayCount: dueToday.length, upcomingCount: upcoming.length, overdue: overdue.slice(0, 8).map(fu), today: dueToday.slice(0, 8).map(fu), upcoming: upcoming.slice(0, 5).map(fu) },
    ...extras,
  } });
});

module.exports = router;
