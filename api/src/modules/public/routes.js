const { Router } = require('express');
const {
  Service,
  ProcessStep,
  Technology,
  DevCategory,
  ExperienceLevel,
  EngagementModel,
  HiringStep,
  Industry,
} = require('../catalog/models');
const { Settings, toPublic } = require('../settings/model');
const { notFound } = require('../../utils/errors');

const router = Router();
const lean = (q) => q.lean({ virtuals: false }).then((rows) => rows.map(clean));
function clean(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

router.get('/settings', async (_req, res) => {
  const doc = await Settings.findById('site').lean();
  res.json({ data: toPublic(doc) });
});

router.get('/services', async (_req, res) => {
  const data = await lean(
    Service.find({ status: 'published' })
      .select('name slug group summary priority order')
      .sort({ order: 1 })
  );
  res.json({ data });
});

router.get('/services/:slug', async (req, res) => {
  const doc = await Service.findOne({ slug: req.params.slug, status: 'published' }).select('-isPlaceholder').lean();
  if (!doc) throw notFound('Service not found');
  res.json({ data: clean(doc) });
});

router.get('/process-steps', async (_req, res) => {
  res.json({ data: await lean(ProcessStep.find().sort({ order: 1 })) });
});

router.get('/hiring-catalog', async (_req, res) => {
  const [technologies, categories, levels, models, steps] = await Promise.all([
    lean(Technology.find().sort({ order: 1 })),
    lean(DevCategory.find({ status: 'published' }).sort({ order: 1 })),
    lean(ExperienceLevel.find().sort({ order: 1 })),
    lean(EngagementModel.find().sort({ order: 1 })),
    lean(HiringStep.find().sort({ order: 1 })),
  ]);
  res.json({ data: { technologies, categories, levels, models, steps } });
});

router.get('/industries', async (_req, res) => {
  res.json({ data: await lean(Industry.find({ status: 'published' }).sort({ order: 1 })) });
});

module.exports = router;
