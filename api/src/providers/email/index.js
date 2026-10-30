// EmailProvider abstraction. SMTP driver is added once the business email provider is confirmed.
// Current driver: "log" — MOCKED delivery: records the attempt in emailDeliveries (no body stored) and
// prints the message to the API log so invitation/reset links can be used during development.
const { model } = require('mongoose');
const { baseSchema } = require('../../utils/schema');

const EmailDelivery = model('EmailDelivery', baseSchema({
  event: String,
  to: String,
  subject: String,
  driver: String,
  status: { type: String, enum: ['queued', 'sent', 'retrying', 'failed', 'logged'] },
  attempts: { type: Number, default: 0 },
  dedupeKey: { type: String, unique: true, sparse: true },
  lastError: String,
}), 'emailDeliveries');

async function sendEmail({ event, to, subject, text, dedupeKey }) {
  const driver = process.env.EMAIL_DRIVER || 'log';
  try {
    await EmailDelivery.create({ event, to, subject, driver, status: driver === 'log' ? 'logged' : 'queued', attempts: 1, dedupeKey });
  } catch (e) {
    if (e.code === 11000) return { duplicate: true };
    throw e;
  }
  if (driver === 'log') console.log(`\n[EMAIL:MOCK] event=${event} to=${to}\nSubject: ${subject}\n${text}\n`);
  return { ok: true };
}

module.exports = { sendEmail, EmailDelivery };
