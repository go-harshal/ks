const { Router } = require('express');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const { Article, TeamProfile, CaseStudy, Job, Application, APPLICATION_STATUSES, WORK_MODES, EMPLOYMENT_TYPES } = require('./models');
const { FileAsset } = require('../leads/models');
const { contentRoutes } = require('./factory');
const { authorize } = require('../../middleware/auth');
const { can } = require('../../config/permissions');
const { z, parse } = require('../../middleware/validate');
const { HttpError, notFound, badRequest } = require('../../utils/errors');
const { putPrivate, readPrivate } = require('../../providers/storage');

const router = Router();
const t = (max, min = 0) => z.string().trim().min(min).max(max);
const o = (max) => z.string().trim().max(max).optional().default('');
const slug = z.string().trim().max(80).regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers and hyphens').optional();

const caseStudySchema = z.object({
  title: t(160, 3), slug, industry: o(80), clientDisplay: z.enum(['confidential', 'named']).default('confidential'), clientName: o(160),
  summary: t(400, 10), challenge: o(8000), approach: o(8000), solution: o(8000), results: o(4000), resultsVerified: z.boolean().default(false),
  technologies: z.union([z.array(t(60, 1)).max(30), z.string().max(1000).transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 30))]).default([]),
  coverImageId: o(64), seoTitle: o(70), seoDescription: o(170),
});
// Cross-field rules checked on the final document (create and edit) — no unverified results, no unnamed "named" client.
const checkCaseStudy = (d) => {
  if (d.clientDisplay === 'named' && !d.clientName) throw badRequest('Enter the client name or mark the case study as confidential.', { clientName: 'Required' });
  if (d.results && !d.resultsVerified) throw badRequest('Confirm the results are verified and approved for publication, or remove them.', { resultsVerified: 'Required' });
};

const jobSchema = z.object({
  title: t(160, 3), slug, department: o(80), location: t(120, 2), workMode: z.enum(WORK_MODES), employmentType: z.enum(EMPLOYMENT_TYPES),
  experience: o(80), summary: t(600, 10), responsibilities: o(6000), requirements: o(6000), niceToHave: o(4000),
  closesAt: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().transform((v) => (v ? new Date(`${v}T23:59:59+05:30`) : null)),
});


router.use(contentRoutes({ base: 'case-studies', Model: CaseStudy, schema: caseStudySchema, check: checkCaseStudy, label: 'Case study', adminPath: '/phobos/case-studies', publicPath: '/work' }));
router.use(contentRoutes({ base: 'jobs', Model: Job, schema: jobSchema, label: 'Job post', adminPath: '/phobos/careers', publicPath: '/careers' }));

// ---- Insights articles: rich text is sanitised server-side to a small allow-list ----
const clean = (html) => sanitizeHtml(html, {
  allowedTags: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'blockquote', 'br'],
  allowedAttributes: { a: ['href'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: { b: 'strong', i: 'em', h1: 'h2', div: 'p', a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  exclusiveFilter: (f) => ['p', 'li', 'h2', 'h3'].includes(f.tag) && !f.text.trim(),
});
const articleSchema = z.object({
  title: t(160, 3), slug, category: o(60), excerpt: t(400, 10), featured: z.boolean().default(false),
  tags: z.union([z.array(t(40, 1)).max(15), z.string().max(600).transform((v) => v.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 15))]).default([]),
  body: z.string().max(200000).default('').transform(clean),
  coverImageId: o(64), authorProfileId: o(64), seoTitle: o(70), seoDescription: o(170),
});
const checkArticle = (d) => {
  if (d.body !== undefined) {
    const words = sanitizeHtml(d.body || '', { allowedTags: [] }).split(/\s+/).filter(Boolean).length;
    d.readingMinutes = Math.max(1, Math.round(words / 220));
  }
};
router.use(contentRoutes({ base: 'articles', Model: Article, schema: articleSchema, check: checkArticle, label: 'Article', adminPath: '/phobos/insights', publicPath: '/insights' }));

// ---- Team & founder profiles ----
const profileSchema = z.object({
  name: t(120, 2), slug, title: t(120, 2), bio: o(2000), photoId: o(64), linkedin: z.union([z.literal(''), z.string().trim().max(300).url('Enter a full link starting with https://')]).optional().default(''),
  isFounder: z.boolean().default(false), order: z.coerce.number().int().min(0).max(999).default(100),
});
router.use(contentRoutes({ base: 'team', Model: TeamProfile, schema: profileSchema, label: 'Profile', slugFrom: 'name', adminPath: '/phobos/team', publicPath: '/about#team' }));

// ---- Testimonials (publish only with consent; permission note optional per business decision) ----
const { Testimonial } = require('../newsletter/models');
const testimonialSchema = z.object({
  title: o(160), slug, quote: t(1500, 10), name: t(120, 2), role: o(120), company: o(160),
  allServices: z.boolean().default(false),
  serviceSlugs: z.union([z.array(z.string().max(80)).max(20), z.string().max(80).transform((v) => (v ? [v] : []))]).default([]),
  permissionNote: o(1000),
  permissionDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().transform((v) => (v ? new Date(`${v}T00:00:00+05:30`) : null)),
});
const checkTestimonial = (d) => { if (d.name !== undefined && !d.title) d.title = [d.name, d.company].filter(Boolean).join(' — '); };
router.use(contentRoutes({ base: 'testimonials', Model: Testimonial, schema: testimonialSchema, check: checkTestimonial, label: 'Testimonial', adminPath: '/phobos/testimonials', publicPath: '/services' }));

// ---- Public image upload for content (cover images) ----
const IMG = { png: (b) => b.subarray(0, 4).toString('hex') === '89504e47', jpg: (b) => b.subarray(0, 3).toString('hex') === 'ffd8ff', jpeg: (b) => b.subarray(0, 3).toString('hex') === 'ffd8ff', webp: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' };
const imgUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
router.post('/media', (req, _res, next) => { if (!can(req.user, 'content.manage') && !can(req.user, 'content.draft')) throw new HttpError(403, 'FORBIDDEN', 'You do not have permission for this action.'); next(); },
  (req, res, next) => imgUpload.single('file')(req, res, (err) => (err ? next(badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : 'Upload failed.')) : next())),
  async (req, res) => {
    if (!req.file) throw badRequest('Choose an image to upload.', { file: 'Required' });
    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    if (!IMG[ext] || !IMG[ext](req.file.buffer)) throw badRequest('Use a PNG, JPG or WebP image.', { file: 'Invalid type' });
    const { key, driver } = await putPrivate(req.file.buffer, ext, 'public/media');
    const asset = await FileAsset.create({ storageKey: key, driver, visibility: 'public', originalName: req.file.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 120), mime: ext === 'jpg' ? 'image/jpeg' : `image/${ext}`, ext, size: req.file.size, owner: { type: 'media', id: req.user._id } });
    res.status(201).json({ data: { id: asset._id, url: `/api/v1/public/media/${asset._id}` } });
  });

// ---- Careers inbox (applications.manage) ----
const view = (a) => { const { _id, ...rest } = a; return { ...rest, id: _id, cvUrl: a.cvFileId ? `/api/v1/admin/applications/${_id}/cv` : null }; };

router.get('/applications', authorize('applications.manage'), async (req, res) => {
  const q = parse(z.object({ status: z.enum(APPLICATION_STATUSES).optional(), jobId: z.string().max(64).optional(), q: z.string().max(100).optional() }), req.query);
  const f = {};
  if (q.status) f.status = q.status;
  if (q.jobId) f.jobId = q.jobId;
  if (q.q) { const rx = new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); f.$or = [{ name: rx }, { email: rx }, { jobTitle: rx }]; }
  const rows = await Application.find(f).sort({ createdAt: -1 }).limit(300).lean();
  res.json({ data: rows.map(view) });
});

router.patch('/applications/:id', authorize('applications.manage'), async (req, res) => {
  const d = parse(z.object({ status: z.enum(APPLICATION_STATUSES).optional(), note: z.string().trim().min(1).max(3000).optional() }).strict(), req.body);
  const app = await Application.findById(req.params.id);
  if (!app) throw notFound('Application not found');
  if (d.status && d.status !== app.status) { app.history.push({ kind: 'status', from: app.status, to: d.status, by: req.user.name, at: new Date() }); app.status = d.status; }
  if (d.note) app.notes.push({ body: d.note, by: req.user._id, byName: req.user.name, at: new Date() });
  await app.save();
  res.json({ data: view(app.toObject()) });
});

router.get('/applications/:id/cv', authorize('applications.manage'), async (req, res) => {
  const app = await Application.findById(req.params.id).lean();
  const file = app?.cvFileId && await FileAsset.findOne({ _id: app.cvFileId, visibility: 'private', 'owner.type': 'application' }).lean();
  if (!file) throw notFound('CV not found');
  const buf = await readPrivate(file.storageKey);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/"/g, '')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(buf);
});

module.exports = router;
