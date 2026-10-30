// In-app notifications: persisted in MongoDB, pushed live to connected admins over Server-Sent Events.
// Audience is either a single user (userId) or everyone holding a permission (perm), evaluated server-side.
const { EventEmitter } = require('events');
const { model } = require('mongoose');
const { baseSchema } = require('../../utils/schema');
const { can } = require('../../config/permissions');

const Notification = model('Notification', baseSchema({
  kind: { type: String, index: true },
  title: String,
  body: String,
  link: String,
  leadId: String,
  userId: { type: String, default: null, index: true },
  perm: { type: String, default: null },
  readBy: { type: [String], default: [] },
}), 'notifications');

const hub = new EventEmitter();
hub.setMaxListeners(500);

const visibleTo = (n, user) => (n.userId ? n.userId === user._id : !!n.perm && can(user, n.perm));

function audienceFilter(user) {
  const perms = ['leads.view_all', 'leads.assign', 'users.manage', 'settings.manage', 'content.manage', 'applications.manage', 'newsletter.manage', 'partners.manage'].filter((p) => can(user, p));
  return { $or: [{ userId: user._id }, { userId: null, perm: { $in: perms } }] };
}

const view = (n, user) => ({
  id: n._id, kind: n.kind, title: n.title, body: n.body || '', link: n.link || '', createdAt: n.createdAt,
  unread: !(n.readBy || []).includes(user._id),
});

async function notify({ kind, title, body, link, leadId, userId = null, perm = null }) {
  const n = await Notification.create({ kind, title, body, link, leadId, userId, perm });
  hub.emit('notification', n.toObject());
  return n;
}

module.exports = { Notification, hub, notify, visibleTo, audienceFilter, view };
