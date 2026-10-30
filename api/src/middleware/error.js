const { HttpError } = require('../utils/errors');

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
  }
  console.error(`[${req.method} ${req.path}]`, err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } });
}

module.exports = { notFoundHandler, errorHandler };
