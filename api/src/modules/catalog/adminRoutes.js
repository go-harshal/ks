// Services Management + Developer Categories (Super Admins & Admins via content.manage).
// One generic CRUD + reorder handler per catalogue collection.
const { Router } = require('express');
const M = require('./models');
const { FileAsset } = require('../leads/models');
const { authorize } = require('../../middleware/auth');
const { z, parse } = require('../../middleware/validate');
const { notFound, badRequest } = require('../../utils/errors');

const t = (max, min = 0) => (min ? z.string().trim().min(min).max(max) : z.string().trim().max(max).optional().default(''));
const slug = z.string().trim().toLowerCase().min(2).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.');
const list = (max, each) => z.array(z.string().trim().min(1).max(each)).max(max).optional().default([]);
const status = z.enum(['draft', 'published']).optional().default('published');

const KINDS = {
  services: {
    Model: M.Service, label: 'service', unique: 'slug',
    schema: z.object({
      name: t(120, 2), slug, group: t(60, 2), summary: t(400, 10), intro: t(1500),
      capabilities: z.array(z.object({ title: t(120, 2), description: t(500) })).max(20).optional().default([]),
      technologies: list(30, 60), heroImageId: t(64), priority: z.boolean().optional().default(false), status,
      seo: z.object({ title: t(70), description: t(170) }).optional().default({ title: '', description: '' }),
    }),
  },
  categories: { Model: M.DevCategory, label: 'developer role', unique: 'slug', schema: z.object({ name: t(80, 2), slug, summary: t(400, 10), skills: list(30, 60), status }) },
  technologies: { Model: M.Technology, label: 'technology', unique: 'name', schema: z.object({ name: t(60, 1), group: t(40, 2), note: t(200) }) },
  levels: { Model: M.ExperienceLevel, label: 'experience level', unique: 'name', schema: z.object({ name: t(60, 2), range: t(60, 1), description: t(500) }) },
  models: { Model: M.EngagementModel, label: 'engagement model', unique: 'name', schema: z.object({ name: t(80, 2), description: t(600, 5), bestFor: t(300) }) },
  industries: { Model: M.Industry, label: 'industry', unique: 'slug', schema: z.object({ name: t(80, 2), slug, status, intro: t(600, 10), problems: list(12, 200), solutions: list(12, 200), serviceSlugs: list(12, 80) }) },
  'hiring-steps': { Model: M.HiringStep, label: 'hiring step', unique: 'title', schema: z.object({ title: t(80, 2), description: t(500, 5) }) },
};

const router = Router();
router.use('/catalog', authorize('content.manage'));
const kind = (req) => { const k = KINDS[req.params.kind]; if (!k) throw notFound('Unknown section'); return k; };
const out = ({ _id, ...r }) => ({ id: _id, ...r, heroUrl: r.heroImageId ? `/api/v1/public/media/${r.heroImageId}` : undefined });

async function check(k, d, id) {
  const key = k.unique;
  if (d[key] !== undefined) {
    const clash = await k.Model.findOne({ [key]: d[key], _id: { $ne: id } }).select('_id').lean();
    if (clash) throw badRequest(`Another ${k.label} already uses this ${key}.`, { [key]: 'Already in use' });
  }
  if (d.heroImageId) {
    const f = await FileAsset.findOne({ _id: d.heroImageId, visibility: 'public', 'owner.type': 'media' }).select('_id').lean();
    if (!f) throw badRequest('Upload the image again.', { heroImageId: 'Not found' });
  }
}

router.get('/catalog/:kind', async (req, res) => {
  const rows = await kind(req).Model.find().sort({ order: 1, createdAt: 1 }).lean();
  res.json({ data: rows.map(out) });
});
router.post('/catalog/:kind', async (req, res) => {
  const k = kind(req);
  const d = parse(k.schema, req.body);
  await check(k, d);
  const last = await k.Model.findOne().sort({ order: -1 }).select('order').lean();
  const doc = await k.Model.create({ ...d, order: (last?.order || 0) + 1, ...(k.Model === M.Service ? { isPlaceholder: false } : {}) });
  res.status(201).json({ data: out(doc.toObject()) });
});
router.put('/catalog/:kind/order', async (req, res) => {
  const k = kind(req);
  const { ids } = parse(z.object({ ids: z.array(z.string().max(64)).min(1).max(500) }), req.body);
  await k.Model.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i + 1 } } } })));
  res.json({ data: { ok: true } });
});
router.patch('/catalog/:kind/:id', async (req, res) => {
  const k = kind(req);
  const doc = await k.Model.findById(req.params.id);
  if (!doc) throw notFound(`That ${k.label} no longer exists.`);
  const parsed = parse(k.schema.partial(), req.body);
  const d = Object.fromEntries(Object.entries(parsed).filter(([key]) => Object.hasOwn(req.body || {}, key))); // ignore Zod defaults on partial updates
  await check(k, d, doc._id);
  Object.assign(doc, d);
  if (k.Model === M.Service) doc.isPlaceholder = false;
  await doc.save();
  res.json({ data: out(doc.toObject()) });
});
router.delete('/catalog/:kind/:id', async (req, res) => {
  const k = kind(req);
  const r = await k.Model.deleteOne({ _id: req.params.id });
  if (!r.deletedCount) throw notFound(`That ${k.label} no longer exists.`);
  res.json({ data: { ok: true } });
});

module.exports = router;
