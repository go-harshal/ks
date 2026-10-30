const { model } = require('mongoose');
const { baseSchema, PUBLICATION } = require('../../utils/schema');

const seo = { title: String, description: String };

const Service = model(
  'Service',
  baseSchema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    group: { type: String, required: true }, // mega-menu group
    summary: { type: String, required: true },
    intro: String,
    capabilities: [{ _id: false, title: String, description: String }],
    technologies: [String],
    heroImageId: String,
    priority: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: PUBLICATION, default: 'draft' },
    isPlaceholder: { type: Boolean, default: true }, // copy drafted, pending client approval
    seo,
  }),
  'services'
);

const ProcessStep = model(
  'ProcessStep',
  baseSchema({ order: Number, title: String, description: String }),
  'processSteps'
);

const Technology = model(
  'Technology',
  baseSchema({ name: String, group: String, note: String, order: Number }),
  'technologies'
);

const DevCategory = model(
  'DevCategory',
  baseSchema({
    name: String,
    slug: { type: String, unique: true },
    summary: String,
    skills: [String],
    order: Number,
    status: { type: String, enum: PUBLICATION, default: 'published' },
  }),
  'devCategories'
);

const ExperienceLevel = model(
  'ExperienceLevel',
  baseSchema({ name: String, range: String, description: String, order: Number }),
  'experienceLevels'
);

const EngagementModel = model(
  'EngagementModel',
  baseSchema({ name: String, description: String, bestFor: String, order: Number }),
  'engagementModels'
);

const HiringStep = model(
  'HiringStep',
  baseSchema({ order: Number, title: String, description: String }),
  'hiringSteps'
);

const Industry = model(
  'Industry',
  baseSchema({
    name: String,
    slug: { type: String, unique: true },
    order: Number,
    status: { type: String, enum: PUBLICATION, default: 'published' },
  }),
  'industries'
);

module.exports = {
  Service,
  ProcessStep,
  Technology,
  DevCategory,
  ExperienceLevel,
  EngagementModel,
  HiringStep,
  Industry,
};
