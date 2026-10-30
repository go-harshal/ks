// Dev/preview only: creates (or resets) a QA Admin account used by automated tests. Never run in production.
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const { User } = require('../modules/auth/models');
const { hashPassword } = require('../modules/auth/service');
(async () => {
  if (env.nodeEnv === 'production') { console.error('Refusing to run in production.'); process.exit(1); }
  await mongoose.connect(env.mongoUrl, { dbName: env.mongoDb });
  const email = 'qa.admin@example.com';
  const passwordHash = await hashPassword('QaAdmin#2026xyz');
  await User.updateOne({ email }, { $set: { name: 'QA Admin', role: 'admin', status: 'active', passwordHash, failedLogins: 0 }, $unset: { lockedUntil: 1 } }, { upsert: true });
  console.log('QA admin ready:', email);
  await mongoose.disconnect();
})();
