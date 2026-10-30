const { Router } = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { model } = require('mongoose');
const { baseSchema } = require('../../utils/schema');
const { Lead, FileAsset } = require('../leads/models');
const { User } = require('../auth/models');
const { authorize } = require('../../middleware/auth');
const { z, parse } = require('../../middleware/validate');
const { notFound, badRequest } = require('../../utils/errors');
const { putPrivate, readPrivate } = require('../../providers/storage');
const { sendEmail } = require('../../providers/email');
const { notify } = require('../notifications/service');
const env = require('../../config/env');
const { DAY, startOfDay } = require('../../utils/dates');

const STAGES = ['Prospect', 'In discussion', 'Agreement sent', 'Active', 'Paused', 'Ended'];
const TYPES = ['White-label', 'Agency', 'Technology', 'Referral'];
const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR'];
const REF_STATUSES = ['Expected', 'Approved', 'Paid', 'Cancelled'];
const id = () => crypto.randomUUID();

const Partner = model('Partner', baseSchema({
  name: { type: String, index: true }, type: { type: String, enum: TYPES }, stage: { type: String, enum: STAGES, default: 'Prospect', index: true },
  contactName: String, email: String, phone: String, website: String, ownerId: String, sourceLeadId: String, summary: String,
  logoId: String, listingApproved: { type: Boolean, default: false, index: true }, listingNote: String, listingApprovedAt: Date, listingApprovedBy: String,
  agreements: [{ _id: false, id: String, title: String, fileId: String, fileName: String, startDate: Date, endDate: Date, renewalNotifiedAt: Date, uploadedAt: Date, by: String }],
  referrals: [{ _id: false, id: String, leadId: String, leadName: String, amount: Number, currency: { type: String, enum: CURRENCIES }, status: { type: String, enum: REF_STATUSES }, note: String, at: Date, by: String }],
  notes: [{ _id: false, body: String, byName: String, at: Date }],
  history: [{ _id: false, kind: String, from: String, to: String, by: String, at: Date }],
}), 'partners');

const router = Router();
router.use('/partners', authorize('partners.manage'));

const names = async () => Object.fromEntries((await User.find().select('name').lean()).map((u) => [u._id, u.name]));
const totals = (p) => (p.referrals || []).filter((r) => r.status !== 'Cancelled').reduce((a, r) => ({ ...a, [r.currency]: (a[r.currency] || 0) + (r.amount || 0) }), {});
const view = (p, n = {}) => { const { _id, ...rest } = p; return { ...rest, id: _id, ownerName: n[p.ownerId] || '', commission: totals(p) }; };
const day = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().transform((v) => (v ? new Date(`${v}T00:00:00+05:30`) : null));
const o = (m) => z.string().trim().max(m).optional().default('');
const partnerSchema = z.object({
  name: z.string().trim().min(2).max(160), type: z.enum(TYPES), stage: z.enum(STAGES).default('Prospect'),
  contactName: o(120), email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address').max(200)]).optional().default(''),
  phone: o(40), website: z.union([z.literal(''), z.string().trim().url('Enter a full link starting with https://').max(300)]).optional().default(''),
  ownerId: o(64), summary: o(3000), logoId: o(64),
  listingApproved: z.coerce.boolean().optional(), listingNote: o(500),
});

/** Approval of a public logo listing must carry a note recording when/how the partner agreed. */
async function applyListing(p, d, user) {
  if (d.logoId) {
    const f = await FileAsset.findOne({ _id: d.logoId, visibility: 'public', 'owner.type': 'media' }).select('_id').lean();
    if (!f) throw badRequest('Upload the logo again.', { logoId: 'Not found' });
  }
  if (d.listingApproved === undefined) return;
  const note = d.listingNote ?? p.listingNote ?? '';
  if (d.listingApproved && !note.trim()) throw badRequest('Add a note recording how the partner approved the listing.', { listingNote: 'Required' });
  if (d.listingApproved !== !!p.listingApproved) {
    p.history.push({ kind: d.listingApproved ? 'listing approved' : 'listing withdrawn', by: user.name, at: new Date() });
    p.listingApprovedAt = d.listingApproved ? new Date() : null;
    p.listingApprovedBy = d.listingApproved ? user.name : '';
  }
}
async function load(req) { const p = await Partner.findById(req.params.id); if (!p) throw notFound('Partner not found'); return p; }
const respond = async (res, p, status = 200) => res.status(status).json({ data: view(p.toObject ? p.toObject() : p, await names()) });

router.get('/partners', async (req, res) => {
  const q = parse(z.object({ q: z.string().max(100).optional(), stage: z.enum(STAGES).optional(), type: z.enum(TYPES).optional() }), req.query);
  const f = {};
  if (q.stage) f.stage = q.stage;
  if (q.type) f.type = q.type;
  if (q.q) f.name = new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [rows, n, stageCounts] = await Promise.all([Partner.find(f).sort({ updatedAt: -1 }).limit(300).lean(), names(), Partner.aggregate([{ $group: { _id: '$stage', n: { $sum: 1 } } }])]);
  res.json({ data: rows.map((p) => view(p, n)), meta: { stages: Object.fromEntries(STAGES.map((s) => [s, stageCounts.find((c) => c._id === s)?.n || 0])) } });
});
router.get('/partners/meta/owners', async (_req, res) => {
  const users = await User.find({ status: 'active' }).select('name').sort({ name: 1 }).lean();
  res.json({ data: users.map((u) => ({ id: u._id, name: u.name })) });
});
router.get('/partners/:id', async (req, res) => respond(res, await load(req)));
router.post('/partners', async (req, res) => {
  const d = parse(partnerSchema, req.body);
  const p = new Partner({ ownerId: req.user._id, history: [{ kind: 'created', to: d.stage, by: req.user.name, at: new Date() }] });
  await applyListing(p, d, req.user);
  Object.assign(p, { ...d, ownerId: d.ownerId || req.user._id });
  await p.save();
  await respond(res, p, 201);
});
router.post('/partners/from-lead/:leadId', async (req, res) => {
  const lead = await Lead.findById(req.params.leadId).lean();
  if (!lead || lead.type !== 'partnership') throw badRequest('Only partnership enquiries can be turned into partners.');
  const existing = await Partner.findOne({ sourceLeadId: lead._id });
  if (existing) return respond(res, existing);
  const pt = lead.payload?.partnershipType || '';
  const p = await Partner.create({
    name: lead.contact?.company || lead.contact?.name, type: TYPES.find((t) => pt.toLowerCase().includes(t.toLowerCase().split('-')[0])) || 'Agency', stage: 'In discussion',
    contactName: lead.contact?.name, email: lead.contact?.email, website: lead.payload?.website || '', ownerId: lead.assigneeId || req.user._id, sourceLeadId: lead._id,
    summary: lead.payload?.requirements || lead.payload?.message || '', history: [{ kind: 'created', to: 'In discussion', by: `${req.user.name} (from enquiry)`, at: new Date() }],
  });
  return respond(res, p, 201);
});
router.patch('/partners/:id', async (req, res) => {
  const p = await load(req);
  const parsed = parse(partnerSchema.partial(), req.body);
  // Zod fills defaults even on partial schemas; keep only the fields actually sent.
  const d = Object.fromEntries(Object.entries(parsed).filter(([k]) => Object.hasOwn(req.body || {}, k)));
  if (d.stage && d.stage !== p.stage) p.history.push({ kind: 'stage', from: p.stage, to: d.stage, by: req.user.name, at: new Date() });
  await applyListing(p, d, req.user);
  Object.assign(p, d);
  await p.save();
  await respond(res, p);
});
router.delete('/partners/:id', async (req, res) => {
  const p = await load(req);
  await FileAsset.updateMany({ _id: { $in: p.agreements.map((a) => a.fileId) } }, { $set: { 'owner.type': 'deleted-partner' } });
  await p.deleteOne();
  res.json({ data: { ok: true } });
});
router.post('/partners/:id/notes', async (req, res) => {
  const p = await load(req);
  const { body } = parse(z.object({ body: z.string().trim().min(1).max(3000) }), req.body);
  p.notes.push({ body, byName: req.user.name, at: new Date() });
  await p.save();
  await respond(res, p);
});

// Agreements (private files)
const ALLOWED = { pdf: '25504446', docx: '504b0304', doc: 'd0cf11e0', png: '89504e47', jpg: 'ffd8ff', jpeg: 'ffd8ff' };
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
router.post('/partners/:id/agreements', (req, res, next) => upload.single('file')(req, res, (err) => (err ? next(badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'File must be 10 MB or smaller.' : 'Upload failed.')) : next())), async (req, res) => {
  const p = await load(req);
  const d = parse(z.object({ title: z.string().trim().min(2).max(160), startDate: day, endDate: day }), req.body || {});
  if (!req.file) throw badRequest('Choose the signed agreement file.', { file: 'Required' });
  const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
  if (!ALLOWED[ext] || !req.file.buffer.subarray(0, 4).toString('hex').startsWith(ALLOWED[ext])) throw badRequest('Upload a PDF, Word document or image.', { file: 'Invalid type' });
  if (d.startDate && d.endDate && d.endDate < d.startDate) throw badRequest('End date must be after the start date.', { endDate: 'Invalid' });
  const { key, driver } = await putPrivate(req.file.buffer, ext, 'private/agreements');
  const fileName = req.file.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 120);
  const asset = await FileAsset.create({ storageKey: key, driver, visibility: 'private', originalName: fileName, mime: req.file.mimetype, ext, size: req.file.size, owner: { type: 'partner', id: p._id } });
  p.agreements.push({ id: id(), title: d.title, fileId: asset._id, fileName, startDate: d.startDate, endDate: d.endDate, uploadedAt: new Date(), by: req.user.name });
  await p.save();
  await respond(res, p, 201);
});
router.get('/partners/:id/agreements/:aid/download', async (req, res) => {
  const p = await load(req);
  const a = p.agreements.find((x) => x.id === req.params.aid);
  const file = a && await FileAsset.findOne({ _id: a.fileId, 'owner.type': 'partner', 'owner.id': p._id }).lean();
  if (!file) throw notFound('Agreement not found');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/"/g, '')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(await readPrivate(file.storageKey));
});
router.delete('/partners/:id/agreements/:aid', async (req, res) => {
  const p = await load(req);
  p.agreements = p.agreements.filter((x) => x.id !== req.params.aid);
  await p.save();
  await respond(res, p);
});

// Referrals & commissions
const refSchema = z.object({ leadId: o(64), leadName: o(160), amount: z.coerce.number().min(0).max(1e10), currency: z.enum(CURRENCIES), status: z.enum(REF_STATUSES).default('Expected'), note: o(1000) });
router.post('/partners/:id/referrals', async (req, res) => {
  const p = await load(req);
  const d = parse(refSchema, req.body);
  if (d.leadId) { const l = await Lead.findById(d.leadId).select('contact').lean(); if (!l) throw badRequest('That lead no longer exists.', { leadId: 'Not found' }); d.leadName = l.contact?.company || l.contact?.name; }
  if (!d.leadName) throw badRequest('Pick the referred lead or enter who was referred.', { leadName: 'Required' });
  p.referrals.push({ ...d, id: id(), at: new Date(), by: req.user.name });
  await p.save();
  await respond(res, p, 201);
});
router.patch('/partners/:id/referrals/:rid', async (req, res) => {
  const p = await load(req);
  const r = p.referrals.find((x) => x.id === req.params.rid);
  if (!r) throw notFound('Referral not found');
  const rd = parse(refSchema.partial().pick({ amount: true, currency: true, status: true, note: true }), req.body);
  Object.assign(r, Object.fromEntries(Object.entries(rd).filter(([k]) => Object.hasOwn(req.body || {}, k))));
  p.markModified('referrals');
  await p.save();
  await respond(res, p);
});
router.delete('/partners/:id/referrals/:rid', async (req, res) => {
  const p = await load(req);
  p.referrals = p.referrals.filter((x) => x.id !== req.params.rid);
  await p.save();
  await respond(res, p);
});

/** Daily (from the 09:00 IST follow-up cron): agreements ending within 30 days → one email + alert each. */
async function runRenewalReminders() {
  const today = startOfDay();
  const horizon = new Date(today.getTime() + 31 * DAY);
  const partners = await Partner.find({ stage: { $ne: 'Ended' }, agreements: { $elemMatch: { endDate: { $gte: today, $lt: horizon }, renewalNotifiedAt: null } } });
  const users = Object.fromEntries((await User.find({ status: 'active' }).select('email').lean()).map((u) => [u._id, u.email]));
  let sent = 0;
  for (const p of partners) {
    for (const a of p.agreements.filter((x) => x.endDate && x.endDate >= today && x.endDate < horizon && !x.renewalNotifiedAt)) {
      const days = Math.round((a.endDate - today) / DAY);
      const end = a.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
      const text = `The agreement "${a.title}" with ${p.name} ends on ${end} (in ${days} days).\n\nReview and renew it in Phobos: /phobos/partners?open=${p._id}`;
      for (const to of [...new Set([env.alertTo, users[p.ownerId]].filter(Boolean))]) {
        // eslint-disable-next-line no-await-in-loop
        await sendEmail({ event: 'partner.renewal', to, dedupeKey: `renewal:${a.id}:${to}`, subject: `Agreement renewal due — ${p.name} (${end})`, text });
      }
      // eslint-disable-next-line no-await-in-loop
      await notify({ kind: 'partner.renewal', perm: 'partners.manage', link: `/phobos/partners?open=${p._id}`, title: `Agreement with ${p.name} ends ${end}`, body: a.title });
      a.renewalNotifiedAt = new Date(); sent += 1;
    }
    p.markModified('agreements');
    await p.save(); // eslint-disable-line no-await-in-loop
  }
  return { renewals: sent };
}

// Public: only Active partners whose listing was approved and who have a logo. Name, type and logo only.
const publicRouter = Router();
publicRouter.get('/partners', async (_req, res) => {
  const rows = await Partner.find({ stage: 'Active', listingApproved: true, logoId: { $nin: [null, ''] } }).select('name type logoId').sort({ name: 1 }).lean();
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ data: rows.map((p) => ({ id: p._id, name: p.name, type: p.type, logoUrl: `/api/v1/public/media/${p.logoId}` })) });
});

module.exports = { partnerRoutes: router, publicPartnerRoutes: publicRouter, runRenewalReminders, STAGES };
