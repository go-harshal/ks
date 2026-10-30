const { randomUUID } = require('crypto');
const { Schema } = require('mongoose');

/** Base schema options: string UUID ids, timestamps, clean JSON output (no __v, id instead of _id). */
function baseSchema(definition, options = {}) {
  const schema = new Schema(
    { _id: { type: String, default: randomUUID }, ...definition },
    {
      timestamps: true,
      versionKey: false,
      toJSON: {
        transform(_doc, ret) {
          ret.id = ret._id;
          delete ret._id;
          return ret;
        },
      },
      ...options,
    }
  );
  return schema;
}

const PUBLICATION = ['draft', 'published', 'archived'];

module.exports = { baseSchema, PUBLICATION };
