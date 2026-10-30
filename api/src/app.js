const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const publicRoutes = require('./modules/public/routes');
const enquiryRoutes = require('./modules/leads/publicRoutes');
const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const leadAdminRoutes = require('./modules/leads/adminRoutes');
const notificationRoutes = require('./modules/notifications/routes');
const { adminSystemRoutes, cronRoutes } = require('./modules/system/routes');
const dashboardRoutes = require('./modules/dashboard/routes');
const contentAdminRoutes = require('./modules/content/adminRoutes');
const contentPublicRoutes = require('./modules/content/publicRoutes');
const { newsletterPublic, newsletterAdmin } = require('./modules/newsletter/routes');
const { analyticsPublic, analyticsAdmin } = require('./modules/analytics/routes');
const catalogAdminRoutes = require('./modules/catalog/adminRoutes');
const { partnerRoutes, publicPartnerRoutes } = require('./modules/partners/routes');
const { requireAuth } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression({ filter: (req, res) => (req.path.endsWith('/admin/events') ? false : compression.filter(req, res)) }));
app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : false, credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use('/api/v1/public/newsletter/unsubscribe', express.urlencoded({ extended: false, limit: '2kb' })); // RFC 8058 one-click POST body
app.use(cookieParser());

const v1 = express.Router();
v1.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
v1.use('/public', publicRoutes);
v1.use('/public', enquiryRoutes);
v1.use('/public', contentPublicRoutes);
v1.use('/public', newsletterPublic);
v1.use('/public', analyticsPublic);
v1.use('/public', publicPartnerRoutes);
v1.use('/auth', authRoutes);
v1.use('/admin', requireAuth, (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
v1.use('/admin', leadAdminRoutes);
v1.use('/admin', userRoutes);
v1.use('/admin', notificationRoutes);
v1.use('/admin', adminSystemRoutes);
v1.use('/admin', dashboardRoutes);
v1.use('/admin', contentAdminRoutes);
v1.use('/admin', newsletterAdmin);
v1.use('/admin', analyticsAdmin);
v1.use('/admin', partnerRoutes);
v1.use('/admin', catalogAdminRoutes);

app.use('/api/v1', v1);
app.use('/api/cron', cronRoutes);
app.get('/api', (_req, res) => res.json({ data: { name: 'Kreyszigg Softbizz API', version: 'v1' } }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
