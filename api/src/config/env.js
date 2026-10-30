const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8001),
  mongoUrl: required('MONGO_URL'),
  mongoDb: required('MONGO_DB'),
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'https://softbizz.kreyszigg.com',
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

env.isProd = env.nodeEnv === 'production';

module.exports = env;
