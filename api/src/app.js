const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const env = require('./config/env');
const publicRoutes = require('./modules/public/routes');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.corsOrigins.length ? env.corsOrigins : false,
    credentials: true,
  })
);
app.use(express.json({ limit: '200kb' }));

const v1 = express.Router();
v1.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
v1.use('/public', publicRoutes);

app.use('/api/v1', v1);
app.get('/api', (_req, res) => res.json({ data: { name: 'Kreyszigg Softbizz API', version: 'v1' } }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
