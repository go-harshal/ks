const { Router } = require('express');
const crypto = require('crypto');
const env = require('../../config/env');
const { authorize } = require('../../middleware/auth');
const { verifyTransport, sendEmail, processDue, EmailDelivery } = require('../../providers/email');
const { HttpError } = require('../../utils/errors');
const { runFollowupReminders } = require('../reminders/service');

// ---- Admin: email health (Super Admin / settings.manage) ----
const admin = Router();

admin.get('/system/email', authorize('settings.manage'), async (_req, res) => {
  const [status, counts, recent] = await Promise.all([
    verifyTransport(),
    EmailDelivery.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    EmailDelivery.find().sort({ createdAt: -1 }).limit(15).select('event to subject status attempts lastError createdAt sentAt driver').lean(),
  ]);
  res.json({ data: {
    ...status, from: env.emailFrom, alertTo: env.alertTo,
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
    recent: recent.map((r) => ({ id: r._id, event: r.event, to: r.to, subject: r.subject, status: r.status, attempts: r.attempts, lastError: r.lastError || '', driver: r.driver, createdAt: r.createdAt, sentAt: r.sentAt || null })),
  } });
});

admin.post('/system/email/test', authorize('settings.manage'), async (req, res) => {
  await sendEmail({ event: 'system.test', to: req.user.email, subject: 'Kreyszigg Softbizz — test email',
    text: `This test email confirms that the website can send email from ${env.emailFrom}.\nSent by ${req.user.name} at ${new Date().toISOString()}.` });
  res.status(202).json({ data: { ok: true, to: req.user.email } });
});

// ---- Platform cron: email retries ----
const cron = Router();
const seen = new Set();

function checkCronAuth(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(env.cronSecret || '');
  if (!env.cronSecret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid cron credentials.');
}

function cronJob(name, work) {
  cron.post(`/${name}`, (req, res) => {
    // Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    checkCronAuth(req);
    const runId = req.get('x-webhook-id') || req.body?.run_id || '';
    if (runId && seen.has(`${name}:${runId}`)) return res.status(202).json({ data: { duplicate: true } });
    if (runId) { seen.add(`${name}:${runId}`); if (seen.size > 500) seen.clear(); }
    setImmediate(() => work().then((r) => console.log(`[cron] ${name}`, JSON.stringify(r))).catch((e) => console.error(`[cron] ${name}`, e.message)));
    return res.status(202).json({ data: { accepted: true } });
  });
}
cronJob('email-retry', processDue);
cronJob('followup-reminders', runFollowupReminders);

// Manual run for Super Admins (same idempotent job; already-sent owners are skipped for today).
admin.post('/system/reminders/run', authorize('settings.manage'), async (_req, res) => {
  res.json({ data: await runFollowupReminders() });
});

module.exports = { adminSystemRoutes: admin, cronRoutes: cron };
