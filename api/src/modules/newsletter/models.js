const { model } = require('mongoose');
const { baseSchema } = require('../../utils/schema');

const Subscriber = model('Subscriber', baseSchema({
  email: { type: String, unique: true, index: true },
  status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed', index: true },
  source: String,
  consent: { version: String, at: Date },
  unsubToken: { type: String, unique: true, index: true },
  unsubscribedAt: Date,
}), 'subscribers');

const Campaign = model('Campaign', baseSchema({
  subject: String,
  preheader: String,
  body: String,
  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'], default: 'draft', index: true },
  scheduledAt: { type: Date, index: true },
  startedAt: Date,
  sentAt: Date,
  recipients: { type: Number, default: 0 },
  queued: { type: Number, default: 0 },
  authorId: String,
  history: [{ _id: false, kind: String, by: String, note: String, at: Date }],
}), 'campaigns');

const Testimonial = model('Testimonial', baseSchema({
  title: String, // internal label, used for the slug
  quote: String, name: String, role: String, company: String,
  allServices: { type: Boolean, default: false },
  serviceSlugs: { type: [String], default: [] },
  permissionNote: String, permissionDate: Date,
  status: { type: String, enum: ['draft', 'in_review', 'published', 'archived'], default: 'draft', index: true },
  slug: { type: String, unique: true, index: true },
  authorId: { type: String, index: true },
  reviewNote: String, publishedAt: Date,
  history: [{ _id: false, kind: String, by: String, note: String, at: Date }],
}), 'testimonials');

module.exports = { Subscriber, Campaign, Testimonial };
