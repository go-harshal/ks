// EmailProvider with a MongoDB outbox.
// Driver "smtp" (nodemailer) is used whenever SMTP_HOST is configured; otherwise "log" = MOCKED delivery
// (message printed to the API log so invite/reset links still work in development).
// Every email is written to `emailDeliveries` BEFORE sending; the body is removed once delivered.
// Failed sends are retried with exponential backoff by the platform cron (POST /api/cron/email-retry).
const { model } = require('mongoose');
const nodemailer = require('nodemailer');
const { baseSchema } = require('../../utils/schema');
const env = require('../../config/env');

const MAX_ATTEMPTS = 6;

const EmailDelivery = model('EmailDelivery', baseSchema({
  event: String,
  to: String,
  subject: String,
  text: { type: String, select: false },
  driver: String,
  status: { type: String, enum: ['queued', 'sending', 'sent', 'retrying', 'failed', 'logged'], index: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, index: true },
  sentAt: Date,
  messageId: String,
  dedupeKey: { type: String, unique: true, sparse: true },
  lastError: String,
}), 'emailDeliveries');

const driver = () => (env.smtp.host ? 'smtp' : 'log');

let transporter;
function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      requireTLS: !env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      pool: true,
      maxConnections: 3,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const absolutize = (text) => text.replace(/(^|\s)(\/phobos\/[^\s]*)/g, (_m, sp, p) => `${sp}${env.publicSiteUrl}${p}`);

function renderHtml(subject, text) {
  const body = esc(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#8c5b3e">$1</a>')
    .replace(/\n/g, '<br>');
  return `<!doctype html><html><body style="margin:0;background:#f5f2eb;font-family:Ubuntu,Arial,sans-serif;color:#17232f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e2ddd3">
<tr><td style="padding:24px 32px;border-bottom:3px solid #a56f4e;font-weight:700;font-size:16px">Kreyszigg Softbizz</td></tr>
<tr><td style="padding:28px 32px"><h1 style="margin:0 0 16px;font-size:20px">${esc(subject)}</h1><p style="margin:0;font-size:15px;line-height:1.6">${body}</p></td></tr>
<tr><td style="padding:16px 32px;background:#f5f2eb;font-size:12px;color:#526374">This is an automated message from the Kreyszigg Softbizz website. Please do not reply to this address.</td></tr>
</table></td></tr></table></body></html>`;
}

async function deliver(id) {
  const job = await EmailDelivery.findOneAndUpdate(
    { _id: id, status: { $in: ['queued', 'retrying'] } },
    { status: 'sending' },
    { returnDocument: 'after' },
  ).select('+text');
  if (!job) return;
  if (job.driver === 'log') {
    console.log(`\n[EMAIL:MOCK] event=${job.event} to=${job.to}\nSubject: ${job.subject}\n${job.text}\n`);
    await EmailDelivery.updateOne({ _id: id }, { status: 'logged', sentAt: new Date(), $unset: { text: 1 } });
    return;
  }
  try {
    const info = await getTransport().sendMail({
      from: env.emailFrom, to: job.to, subject: job.subject, text: job.text, html: renderHtml(job.subject, job.text),
    });
    await EmailDelivery.updateOne({ _id: id }, { status: 'sent', sentAt: new Date(), messageId: info.messageId, $unset: { text: 1, lastError: 1 } });
  } catch (err) {
    const attempts = job.attempts + 1;
    const failed = attempts >= MAX_ATTEMPTS;
    await EmailDelivery.updateOne({ _id: id }, {
      status: failed ? 'failed' : 'retrying',
      attempts,
      lastError: String(err.message || err).replace(/pass\w*[=:]\S+/gi, '[redacted]').slice(0, 300),
      nextAttemptAt: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60e3),
      ...(failed ? { $unset: { text: 1 } } : {}),
    });
    console.error(`[email] ${job.event} to ${job.to} failed (attempt ${attempts}): ${err.code || ''} ${err.message}`);
  }
}

/** Queue an email (idempotent by dedupeKey) and attempt delivery straight away in the background. */
async function sendEmail({ event, to, subject, text, dedupeKey }) {
  let doc;
  try {
    doc = await EmailDelivery.create({
      event, to, subject, text: absolutize(text), driver: driver(), status: 'queued', attempts: 0, nextAttemptAt: new Date(), dedupeKey,
    });
  } catch (e) {
    if (e.code === 11000) return { duplicate: true };
    throw e;
  }
  setImmediate(() => deliver(doc._id).catch((e) => console.error('[email] deliver error', e.message)));
  return { ok: true, id: doc._id };
}

/** Retry due emails. Also recovers jobs stuck in "sending" (e.g. process restarted mid-send). */
async function processDue(limit = 50) {
  await EmailDelivery.updateMany({ status: 'sending', updatedAt: { $lt: new Date(Date.now() - 10 * 60e3) } }, { status: 'retrying', nextAttemptAt: new Date() });
  const due = await EmailDelivery.find({ status: { $in: ['queued', 'retrying'] }, nextAttemptAt: { $lte: new Date() } })
    .sort({ nextAttemptAt: 1 }).limit(limit).select('_id').lean();
  for (const d of due) await deliver(d._id);
  return due.length;
}

async function verifyTransport() {
  if (driver() === 'log') return { driver: 'log', ok: false, message: 'SMTP is not configured — emails are written to the server log (MOCKED).' };
  try {
    await getTransport().verify();
    return { driver: 'smtp', ok: true, message: `Connected to ${env.smtp.host}:${env.smtp.port} and signed in.` };
  } catch (e) {
    return { driver: 'smtp', ok: false, message: `${e.code || 'ERROR'}: ${e.message}`.slice(0, 300) };
  }
}

module.exports = { sendEmail, processDue, verifyTransport, EmailDelivery, driver };
