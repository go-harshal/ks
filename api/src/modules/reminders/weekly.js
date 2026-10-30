// Weekly pipeline digest (Mondays 09:00 India time via platform cron).
// Covers the previous Monday–Sunday in the business timezone. Recipients:
//   • every active user — Super Admins/Admins (leads.view_all) get company-wide figures, Team Members only their assigned leads;
//   • the company inbox (EMAIL_ALERT_TO) gets the company-wide version.
// Idempotent per recipient per week via email dedupeKey `weekly:<recipient>:<weekStart>`.
const { Lead } = require('../leads/models');
const { User } = require('../auth/models');
const { sendEmail } = require('../../providers/email');
const { notify } = require('../notifications/service');
const { can } = require('../../config/permissions');
const env = require('../../config/env');
const { DAY, OFFSET, startOfDay, dayKey } = require('../../utils/dates');

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

function weekBounds(now = Date.now()) {
  const today = startOfDay(now);
  const dow = new Date(today.getTime() + OFFSET).getUTCDay(); // 0=Sun … 1=Mon in business timezone
  const thisMonday = new Date(today.getTime() - ((dow + 6) % 7) * DAY);
  return { from: new Date(thisMonday.getTime() - 7 * DAY), to: thisMonday, today };
}

function summarise(leads, { from, to, today }) {
  const inWeek = (d) => d && d >= from && d < to;
  const created = leads.filter((l) => inWeek(l.createdAt));
  const moved = (status) => leads.filter((l) => (l.history || []).some((h) => h.kind === 'status' && h.to === status && inWeek(new Date(h.at))));
  const won = moved('Won'); const lost = moved('Lost');
  const byType = {}; const bySource = {};
  created.forEach((l) => {
    byType[l.type] = (byType[l.type] || 0) + 1;
    const src = l.source?.utm?.utm_source || (l.source?.referrer ? 'Referral / search' : 'Direct / unknown');
    bySource[src] = (bySource[src] || 0) + 1;
  });
  const open = leads.filter((l) => !['Won', 'Lost'].includes(l.status));
  const overdue = open.filter((l) => l.followUpAt && l.followUpAt < today).sort((a, b) => a.followUpAt - b.followUpAt);
  return { created, won, lost, byType, bySource, open, overdue };
}

function render(s, { from, to }, who) {
  const name = (l) => l.contact?.company || l.contact?.name;
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none';
  return [
    who ? `Good morning ${who},` : 'Good morning,',
    `Here is the pipeline for ${fmt(from)} – ${fmt(new Date(to.getTime() - 1))}.`,
    '',
    `New leads: ${s.created.length}${s.created.length ? ` (${top(s.byType)})` : ''}`,
    `Sources: ${top(s.bySource)}`,
    `Won: ${s.won.length}${s.won.length ? ` — ${s.won.map(name).join(', ')}` : ''}`,
    `Lost: ${s.lost.length}${s.lost.length ? ` — ${s.lost.map(name).join(', ')}` : ''}`,
    `Win rate this week: ${pct(s.won.length, s.won.length + s.lost.length)}`,
    `Open pipeline now: ${s.open.length}`,
    '',
    s.overdue.length ? `OVERDUE FOLLOW-UPS (${s.overdue.length})\n${s.overdue.slice(0, 15).map((l) => `• ${name(l)} — due ${fmt(l.followUpAt)}\n  /phobos/leads?open=${l._id}`).join('\n')}${s.overdue.length > 15 ? `\n…and ${s.overdue.length - 15} more` : ''}` : 'No overdue follow-ups.',
    '',
    'Full dashboard: /phobos',
  ].join('\n');
}

async function runWeeklyDigest(now = Date.now()) {
  const bounds = weekBounds(now);
  const key = dayKey(bounds.from);
  const all = await Lead.find({ $or: [{ createdAt: { $gte: bounds.from } }, { 'history.at': { $gte: bounds.from } }, { status: { $nin: ['Won', 'Lost'] } }] })
    .select('type status contact source assigneeId followUpAt createdAt history').lean();
  const company = summarise(all, bounds);
  const users = await User.find({ status: 'active' }).select('name email role grants').lean();
  const subject = (s, mine) => `Weekly pipeline${mine ? ' (your leads)' : ''}: ${s.created.length} new, ${s.won.length} won, ${s.lost.length} lost, ${s.overdue.length} overdue`;

  let sent = 0;
  const send = async (to, s, who, mine, userId) => {
    const r = await sendEmail({ event: 'weekly.pipeline', to, dedupeKey: `weekly:${to}:${key}`, subject: subject(s, mine), text: render(s, bounds, who) });
    if (r.duplicate) return;
    sent += 1;
    if (userId) await notify({ kind: 'weekly.pipeline', userId, link: '/phobos', title: subject(s, mine), body: `Week of ${fmt(bounds.from)}` });
  };
  await send(env.alertTo, company, null, false, null);
  for (const u of users) {
    if (u.email === env.alertTo) continue;
    const mine = !can(u, 'leads.view_all');
    const s = mine ? summarise(all.filter((l) => l.assigneeId === u._id), bounds) : company;
    // eslint-disable-next-line no-await-in-loop
    await send(u.email, s, u.name.split(' ')[0], mine, u._id);
  }
  return { week: key, recipients: users.length + 1, sent, newLeads: company.created.length, won: company.won.length, lost: company.lost.length, overdue: company.overdue.length };
}

module.exports = { runWeeklyDigest, weekBounds };
