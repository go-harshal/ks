const { z } = require('zod');
const { badRequest } = require('../utils/errors');

/** Parses req[part] with a Zod schema; replaces it with parsed data or throws a 400 with field errors. */
const parse = (schema, data) => {
  const r = schema.safeParse(data);
  if (!r.success) {
    const fields = {};
    r.error.issues.forEach((i) => { fields[i.path.join('.') || '_'] = i.message; });
    throw badRequest('Please check the highlighted fields.', fields);
  }
  return r.data;
};

module.exports = { z, parse };
