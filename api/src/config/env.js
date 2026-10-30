const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
// Platform-managed secrets (secure key card) may be written to /app/backend/.env; load without overriding.
require('dotenv').config({ path: path.resolve(__dirname, '../../../backend/.env'), quiet: true });

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
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || (process.env.SMTP_PORT === '465')).toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  emailFrom: process.env.EMAIL_FROM || 'no-reply@kreyszigg.com',
  hrEmail: process.env.HR_EMAIL || 'hr@kreyszigg.com',
  alertTo: process.env.EMAIL_ALERT_TO || 'info@kreyszigg.com',
  cronSecret: process.env.WEBHOOK_CRON_SECRET || '',
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

env.isProd = env.nodeEnv === 'production';

module.exports = env;
