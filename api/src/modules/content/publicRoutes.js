const { Router } = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { Article, TeamProfile, CaseStudy, Job, Application } = require('./models');
const { Testimonial } = require('../newsletter/models');
const { FileAsset } = require('../leads/models');
const { z, parse } = require('../../middleware/validate');
const { badRequest, notFound } = require('../../utils/errors');
const { putPrivate, readPrivate } = require('../../providers/storage');
const { scanBuffer } = require('../../providers/malwareScanner');
const { sendEmail } = require('../../providers/email');
const { notify } = require('../notifications/service');
const env = require('../../config/env');

const router = Router();
const PUBLIC_CS = 'title slug industry clientDisplay clientName summary technologies coverImageId publishedAt';
const coverUrl = (id) => (id ? `/api/v1/public/media/${id}` : null);
const isOpen = (j) => !j.closesAt || new Date(j.closesAt) > new Date();

// ---- Case studies ----
router.get('/case-studies', async (_req, res) => {
  const rows = await CaseStudy.find({ status: 'published' }).select(PUBLIC_CS).sort({ publishedAt: -1 }).lean();
  res.json({ data: rows.map(({ _id, clientName, clientDisplay, coverImageId, ...r }) => ({ ...r, id: _id, client: clientDisplay === 'named' ? clientName : null, coverUrl: coverUrl(coverImageId) })) });
});

router.get('/case-studies/:slug', async (req, res) => {
  const d = await CaseStudy.findOne({ slug: req.params.slug, status: 'published' }).select('-history -authorId -reviewNote').lean();
  if (!d) throw notFound('Case study not found');
  const { _id, clientName, clientDisplay, coverImageId, results, resultsVerified, ...rest } = d;
  res.json({ data: { ...rest, id: _id, client: clientDisplay === 'named' ? clientName : null, coverUrl: coverUrl(coverImageId), results: resultsVerified ? results : '' } });
});

// ---- Team profiles ----
const profileView = ({ _id, photoId, ...p }) => ({ id: _id, name: p.name, slug: p.slug, title: p.title, bio: p.bio || '', linkedin: p.linkedin || '', isFounder: !!p.isFounder, photoUrl: coverUrl(photoId) });
router.get('/team', async (_req, res) => {
  const rows = await TeamProfile.find({ status: 'published' }).select('name slug title bio photoId linkedin isFounder order').sort({ isFounder: -1, order: 1, name: 1 }).lean();
  res.json({ data: rows.map(profileView) });
});

// ---- Insights articles ----
async function authors(ids) {
  const list = await TeamProfile.find({ _id: { $in: ids.filter(Boolean) }, status: 'published' }).select('name slug title photoId').lean();
  return Object.fromEntries(list.map((p) => [p._id, profileView(p)]));
}
router.get('/articles', async (_req, res) => {
  const rows = await Article.find({ status: 'published' }).select('title slug category tags excerpt readingMinutes coverImageId authorProfileId featured publishedAt').sort({ featured: -1, publishedAt: -1 }).lean();
  const a = await authors(rows.map((r) => r.authorProfileId));
  res.json({ data: rows.map(({ _id, coverImageId, authorProfileId, ...r }) => ({ ...r, id: _id, coverUrl: coverUrl(coverImageId), author: a[authorProfileId] || null })) });
});
router.get('/articles/:slug', async (req, res) => {
  const d = await Article.findOne({ slug: req.params.slug, status: 'published' }).select('-history -authorId -reviewNote').lean();
  if (!d) throw notFound('Article not found');
  const { _id, coverImageId, authorProfileId, ...rest } = d;
  const relatedRows = await Article.find({ status: 'published', _id: { $ne: _id }, $or: [{ category: d.category || '__none__' }, { tags: { $in: d.tags || [] } }] })
    .select('title slug category excerpt readingMinutes coverImageId publishedAt tags').sort({ publishedAt: -1 }).limit(12).lean();
  const score = (r) => (r.category && r.category === d.category ? 2 : 0) + (r.tags || []).filter((x) => (d.tags || []).includes(x)).length;
  const related = relatedRows.sort((x, y) => score(y) - score(x)).slice(0, 3).map(({ _id: rid, coverImageId: cid, tags, ...r }) => ({ ...r, id: rid, coverUrl: coverUrl(cid) }));
  const a = await authors([authorProfileId]);
  res.json({ data: { ...rest, id: _id, coverUrl: coverUrl(coverImageId), author: a[authorProfileId] || null, related } });
});

// ---- Testimonials for a service page ----
router.get('/testimonials', async (req, res) => {
  const service = String(req.query.service || '').slice(0, 80);
  const f = { status: 'published', ...(service ? { $or: [{ allServices: true }, { serviceSlugs: service }] } : {}) };
  const rows = await Testimonial.find(f).select('quote name role company').sort({ publishedAt: -1 }).limit(6).lean();
  res.json({ data: rows.map(({ _id, ...r }) => ({ ...r, id: _id })) });
});

// ---- Jobs ----
const PUBLIC_JOB = 'title slug department location workMode employmentType experience summary closesAt publishedAt';
router.get('/jobs', async (_req, res) => {
  const rows = await Job.find({ status: 'published', $or: [{ closesAt: null }, { closesAt: { $gt: new Date() } }] }).select(PUBLIC_JOB).sort({ publishedAt: -1 }).lean();
  res.json({ data: rows.map(({ _id, ...r }) => ({ ...r, id: _id })) });
});

router.get('/jobs/:slug', async (req, res) => {
  const d = await Job.findOne({ slug: req.params.slug, status: 'published' }).select('-history -authorId -reviewNote').lean();
  if (!d) throw notFound('Job not found');
  const { _id, ...rest } = d;
  res.json({ data: { ...rest, id: _id, open: isOpen(d) } });
});

// ---- Public media (published content images only) ----
router.get('/media/:id', async (req, res) => {
  const f = await FileAsset.findOne({ _id: req.params.id, visibility: 'public', 'owner.type': 'media' }).lean();
  if (!f) throw notFound('Image not found');
  const buf = await readPrivate(f.storageKey);
  res.setHeader('Content-Type', f.mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.send(buf);
});

// ---- Job applications (CV required) ----
const CV = { pdf: '25504446', docx: '504b0304', doc: 'd0cf11e0' };
const cvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 30 } });
const limiter = rateLimit({ windowMs: 10 * 60e3, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many applications. Please wait a few minutes and try again.' } }) });
const o = (max) => z.string().trim().max(max).optional().default('');
const url = z.union([z.literal(''), z.string().trim().max(300).url('Enter a full link starting with https://')]).optional().default('');
const appSchema = z.object({
  jobId: z.string().min(1).max(64), name: z.string().trim().min(2).max(120), email: z.string().trim().email('Enter a valid email address').max(200),
  phone: o(40), location: o(120), linkedin: url, portfolio: url, experience: o(80), coverLetter: o(5000),
});

router.post('/applications', limiter, (req, res, next) => cvUpload.single('cv')(req, res, (err) => (err ? next(badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'CV must be 5 MB or smaller.' : 'Upload failed.', { cv: err.message })) : next())), async (req, res) => {
  const b = req.body || {};
  if (b.website_hp) return res.status(201).json({ data: { id: 'ok' } });
  if (Number.isFinite(Number(b.startedAt)) && Date.now() - Number(b.startedAt) < 2500) throw badRequest('Please take a moment to complete the form.');
  if (b.consent !== 'true') throw badRequest('Please accept the Privacy Policy to continue.', { consent: 'Required' });
  const d = parse(appSchema, b);
  const job = await Job.findOne({ _id: d.jobId, status: 'published' }).lean();
  if (!job || !isOpen(job)) throw badRequest('This role is no longer accepting applications.', { jobId: 'Closed' });
  if (!req.file) throw badRequest('Please attach your CV.', { cv: 'Required' });
  const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
  if (!CV[ext] || !req.file.buffer.subarray(0, 4).toString('hex').startsWith(CV[ext])) throw badRequest('Upload your CV as a PDF or Word document.', { cv: 'Invalid type' });
  const recent = await Application.exists({ jobId: job._id, email: d.email.toLowerCase(), createdAt: { $gt: new Date(Date.now() - 864e5) } });
  if (recent) throw badRequest('We already received your application for this role today.', { email: 'Duplicate' });

  const scan = await scanBuffer(req.file.buffer);
  const { key, driver } = await putPrivate(req.file.buffer, ext, 'private/applications');
  const asset = await FileAsset.create({ storageKey: key, driver, visibility: 'private', originalName: req.file.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 120), mime: req.file.mimetype, ext, size: req.file.size, scan });
  const app = await Application.create({ ...d, email: d.email.toLowerCase(), jobId: job._id, jobTitle: job.title, cvFileId: asset._id, consent: { version: 'privacy-v1', at: new Date() }, history: [{ kind: 'created', to: 'New', at: new Date() }] });
  await FileAsset.updateOne({ _id: asset._id }, { owner: { type: 'application', id: app._id } });

  await sendEmail({ event: 'application.created', to: env.hrEmail, dedupeKey: `application.created:${app._id}`, subject: `New application — ${job.title} — ${d.name}`,
    text: `A new job application was received.\n\nRole: ${job.title}\nName: ${d.name}\nEmail: ${d.email}${d.phone ? `\nPhone: ${d.phone}` : ''}${d.experience ? `\nExperience: ${d.experience}` : ''}\nCV: attached in Phobos\n\nOpen it in Phobos: /phobos/careers/applications?open=${app._id}` });
  await sendEmail({ event: 'application.received', to: d.email, dedupeKey: `application.received:${app._id}`, subject: `We received your application — ${job.title}`,
    text: `Hello ${d.name},\n\nThank you for applying for the ${job.title} role at Kreyszigg Softbizz. Our team will review your application and contact you if your profile matches the role.\n\nKreyszigg Softbizz` });
  await notify({ kind: 'application.created', perm: 'applications.manage', link: `/phobos/careers/applications?open=${app._id}`, title: `New application — ${job.title}`, body: d.name });

  res.status(201).json({ data: { id: app._id } });
});

module.exports = router;
