const { model } = require('mongoose');
const { baseSchema } = require('../../utils/schema');

const LEAD_TYPES = ['project', 'hiring', 'partnership', 'contact'];
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

const Lead = model('Lead', baseSchema({
  type: { type: String, enum: LEAD_TYPES, required: true, index: true },
  status: { type: String, enum: LEAD_STATUSES, default: 'New', index: true },
  contact: { name: String, email: String, company: String, website: String },
  payload: Object,
  attachments: [String], // FileAsset ids
  source: { page: String, referrer: String, utm: Object, context: String },
  consent: { version: String, at: Date },
  assigneeId: { type: String, index: true },
  followUpAt: Date,
  idempotencyKey: { type: String, unique: true, sparse: true },
  history: [{ _id: false, kind: String, from: String, to: String, by: String, at: Date }],
}), 'leads');

const LeadNote = model('LeadNote', baseSchema({
  leadId: { type: String, index: true },
  authorId: String,
  authorName: String,
  body: String,
}), 'leadNotes');

const FileAsset = model('FileAsset', baseSchema({
  storageKey: String,
  driver: String,
  visibility: { type: String, enum: ['public', 'private'] },
  originalName: String,
  mime: String,
  ext: String,
  size: Number,
  owner: { type: { type: String }, id: String },
  scan: { state: { type: String, default: 'unscanned' } },
}), 'fileAssets');

module.exports = { Lead, LeadNote, FileAsset, LEAD_TYPES, LEAD_STATUSES };
