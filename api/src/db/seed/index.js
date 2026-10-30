/* Idempotent seed: upserts catalogue content by natural key. Safe to run repeatedly. */
const { connect, mongoose } = require('../connect');
const M = require('../../modules/catalog/models');
const { Settings } = require('../../modules/settings/model');
const data = require('./data');

async function upsertAll(Model, rows, key) {
  for (const row of rows) {
    await Model.updateOne({ [key]: row[key] }, { $setOnInsert: row }, { upsert: true });
  }
}

async function run() {
  await connect();
  await upsertAll(
    M.Service,
    data.services.map((s, i) => ({ ...s, order: i + 1, status: 'published', isPlaceholder: true })),
    'slug'
  );
  await upsertAll(M.ProcessStep, data.processSteps, 'order');
  await upsertAll(M.Technology, data.technologies, 'name');
  await upsertAll(M.DevCategory, data.devCategories, 'slug');
  await upsertAll(M.ExperienceLevel, data.experienceLevels, 'name');
  await upsertAll(M.EngagementModel, data.engagementModels, 'name');
  await upsertAll(M.HiringStep, data.hiringSteps, 'order');
  await upsertAll(M.Industry, data.industries, 'slug');
  await Settings.updateOne({ _id: 'site' }, { $setOnInsert: data.settings }, { upsert: true });
  await Promise.all(Object.values(M).map((Model) => Model.syncIndexes()));
  console.log('Seed complete');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
