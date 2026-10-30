// Morning follow-up reminders: one email (and in-app notification) per owner, only if they have
// open leads with a follow-up date that is overdue or due today (business timezone, see utils/dates).
// Unassigned leads are summarised to the company inbox. Idempotent per owner per day via email dedupeKey.
const { Lead } = require('../leads/models');
const { User } = require('../auth/models');
const { sendEmail } = require('../../providers/email');
const { notify } = require('../notifications/service');
const env = require('../../config/env');
const { DAY, startOfDay, dayKey } = require('../../utils/dates');

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' });
const line = (l) => `• ${l.contact?.company || l.contact?.name} (${l.type}, ${l.status}) — follow-up ${fmt(l.followUpAt)}\n  /phobos/leads?open=${l._id}`;

async function runFollowupReminders() {
  const today = startOfDay();
  const end = new Date(today.getTime() + DAY);
  const key = dayKey();
  const leads = await Lead.find({ followUpAt: { $ne: null, $lt: end }, status: { $nin: ['Won', 'Lost'] } })
    .select('contact type status followUpAt assigneeId').sort({ followUpAt: 1 }).lean();
  const groups = {};
  leads.forEach((l) => { (groups[l.assigneeId || 'unassigned'] ||= []).push(l); });
  const users = Object.fromEntries((await User.find({ _id: { $in: Object.keys(groups) }, status: 'active' }).select('name email').lean()).map((u) => [u._id, u]));

  let sent = 0;
  for (const [owner, list] of Object.entries(groups)) {
    const user = users[owner];
    const to = user ? user.email : env.alertTo; // unassigned (or deactivated owner) → company inbox
    const overdue = list.filter((l) => l.followUpAt < today);
    const due = list.filter((l) => l.followUpAt >= today);
    const parts = [
      user ? `Good morning ${user.name.split(' ')[0]},` : 'Good morning,',
      user ? 'Here are your lead follow-ups for today.' : 'These leads have follow-ups due but no owner assigned.',
      overdue.length ? `\nOVERDUE (${overdue.length})\n${overdue.map(line).join('\n')}` : '',
      due.length ? `\nDUE TODAY (${due.length})\n${due.map(line).join('\n')}` : '',
      '\nUpdate the follow-up date or status in Phobos once done: /phobos/leads',
    ].filter(Boolean);
    // eslint-disable-next-line no-await-in-loop
    const r = await sendEmail({ event: 'followup.reminder', to, dedupeKey: `followup:${owner}:${key}`,
      subject: `Follow-ups for ${fmt(today)}: ${overdue.length} overdue, ${due.length} due today`, text: parts.join('\n') });
    if (r.duplicate) continue;
    sent += 1;
    // eslint-disable-next-line no-await-in-loop
    await notify({ kind: 'followup.reminder', ...(user ? { userId: owner } : { perm: 'leads.assign' }), link: '/phobos',
      title: user ? `Follow-ups: ${overdue.length} overdue, ${due.length} due today` : `Unassigned follow-ups due: ${list.length}`, body: 'Morning reminder' });
  }
  return { owners: Object.keys(groups).length, sent, leads: leads.length, day: key };
}

module.exports = { runFollowupReminders };
