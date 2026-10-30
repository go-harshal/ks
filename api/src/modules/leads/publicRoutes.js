const { Router } = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { Lead, FileAsset } = require('./models');
const { z, parse } = require('../../middleware/validate');
const { badRequest } = require('../../utils/errors');
const { putPrivate } = require('../../providers/storage');
const { sendEmail } = require('../../providers/email');
const { notify } = require('../notifications/service');
const env = require('../../config/env');

const router = Router();
const MAX_BYTES = 10 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1, fields: 40 } });
const CONSENT_VERSION = 'privacy-v1';

// Allowed extensions → expected file signature (magic bytes)
const SIGS = {
  pdf: ['25504446'], png: ['89504e47'], jpg: ['ffd8ff'], jpeg: ['ffd8ff'],
  docx: ['504b0304'], xlsx: ['504b0304'], pptx: ['504b0304'], zip: ['504b0304'],
  doc: ['d0cf11e0'], xls: ['d0cf11e0'], ppt: ['d0cf11e0'],
};

const s = (max, min = 0) => z.string().trim().min(min).max(max);
const opt = (max) => z.string().trim().max(max).optional().default('');
const email = z.string().trim().email('Enter a valid email address').max(200);

const SCHEMAS = {
  project: z.object({ name: s(120, 2), email, company: opt(160), projectType: s(80, 1), services: opt(400), description: s(5000, 20), budget: opt(80), timeline: opt(80) }),
  hiring: z.object({ name: s(120, 2), email, company: opt(160), role: s(160, 2), developers: z.coerce.number().int().min(1).max(100), experience: s(80, 1), engagement: s(80, 1), duration: opt(80), requirements: opt(5000) }),
  partnership: z.object({ name: s(120, 2), email, company: s(160, 2), website: opt(300), partnershipType: s(80, 1), services: opt(400), requirements: s(5000, 20) }),
  contact: z.object({ name: s(120, 2), email, company: opt(160), subject: s(200, 3), message: s(5000, 10) }),
};
const LABELS = { project: 'project enquiry', hiring: 'developer hiring enquiry', partnership: 'partnership enquiry', contact: 'contact form submission' };

const limiter = rateLimit({ windowMs: 10 * 60e3, limit: 6, standardHeaders: 'draft-7', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many submissions. Please wait a few minutes and try again.' } }) });

router.post('/enquiries', limiter, (req, res, next) => upload.single('attachment')(req, res, (err) => {
  if (err) return next(badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'Attachment must be 10 MB or smaller.' : 'Upload failed.', { attachment: err.message }));
  return next();
}), async (req, res) => {
  const b = req.body || {};
  // Spam controls: honeypot + minimum fill time
  if (b.website_hp) return res.status(201).json({ data: { id: 'ok' } });
  if (Number.isFinite(Number(b.startedAt)) && Date.now() - Number(b.startedAt) < 2500) throw badRequest('Please take a moment to complete the form.');
  const type = String(b.type || '');
  if (!SCHEMAS[type]) throw badRequest('Unknown enquiry type.', { type: 'Invalid' });
  if (b.consent !== 'true') throw badRequest('Please accept the Privacy Policy to continue.', { consent: 'Required' });
  const data = parse(SCHEMAS[type], b);
  const idempotencyKey = typeof b.idempotencyKey === 'string' && /^[\w-]{16,64}$/.test(b.idempotencyKey) ? b.idempotencyKey : undefined;
  if (idempotencyKey) {
    const existing = await Lead.findOne({ idempotencyKey }).lean();
    if (existing) return res.status(200).json({ data: { id: existing._id, duplicate: true } });
  }

  let fileId;
  if (req.file) {
    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    const sig = req.file.buffer.subarray(0, 4).toString('hex');
    if (!SIGS[ext] || !SIGS[ext].some((p) => sig.startsWith(p))) throw badRequest('Attachment type not allowed. Use PDF, Word, Excel, PowerPoint, PNG, JPG or ZIP.', { attachment: 'Invalid type' });
    const { key, driver } = await putPrivate(req.file.buffer, ext);
    const asset = await FileAsset.create({ storageKey: key, driver, visibility: 'private', originalName: req.file.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 120), mime: req.file.mimetype, ext, size: req.file.size, scan: { state: 'unscanned' } });
    fileId = asset._id;
  }

  const { name, email: em, company, website, ...payload } = data;
  const lead = await Lead.create({
    type, contact: { name, email: em.toLowerCase(), company, website }, payload,
    attachments: fileId ? [fileId] : [],
    source: { page: String(b.page || '').slice(0, 300), landing: String(b.landing || '').slice(0, 200), referrer: String(b.referrer || '').slice(0, 300), context: String(b.context || '').slice(0, 120),
      utm: ['utm_source', 'utm_medium', 'utm_campaign'].reduce((a, k) => (b[k] ? { ...a, [k]: String(b[k]).slice(0, 100) } : a), {}) },
    consent: { version: CONSENT_VERSION, at: new Date() },
    idempotencyKey,
    history: [{ kind: 'created', to: 'New', at: new Date() }],
  });
  if (fileId) await FileAsset.updateOne({ _id: fileId }, { owner: { type: 'lead', id: lead._id } });

  // Email alert to the company inbox (EMAIL_ALERT_TO) + live in-app alert for users who can see all leads.
  const who = company || name;
  const summary = [`Type: ${LABELS[type]}`, `Name: ${name}`, `Email: ${em}`, company && `Company: ${company}`, fileId && 'Attachment: yes (download in Phobos)'].filter(Boolean).join('\n');
  await sendEmail({ event: `lead.created.${type}`, to: env.alertTo, dedupeKey: `lead.created:${lead._id}`,
    subject: `New ${LABELS[type]} — ${who}`, text: `A new ${LABELS[type]} was received on the website.\n\n${summary}\n\nOpen it in Phobos: /phobos/leads?open=${lead._id}` });
  await notify({ kind: 'lead.created', perm: 'leads.view_all', leadId: lead._id, link: `/phobos/leads?open=${lead._id}`,
    title: `New ${LABELS[type]} — ${who}`, body: payload.projectType || payload.role || payload.partnershipType || payload.subject || '' });

  res.status(201).json({ data: { id: lead._id } });
});

module.exports = router;
