// Shared admin CRUD + editorial workflow for publishable content (case studies, job posts).
// Super Admin / Admin (content.manage): create, edit anything, publish, return with note, unpublish, archive, delete.
// Team Member (content.draft): create drafts, edit/delete OWN drafts, submit for review. Cannot publish.
const { Router } = require('express');
const { User } = require('../auth/models');
const { can } = require('../../config/permissions');
const { z, parse } = require('../../middleware/validate');
const { HttpError, notFound, badRequest } = require('../../utils/errors');
const { notify } = require('../notifications/service');

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'item';
const forbidden = (m = 'You do not have permission for this action.') => new HttpError(403, 'FORBIDDEN', m);

async function uniqueSlug(Model, wanted, selfId) {
  const base = slugify(wanted);
  let slug = base; let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, _id: { $ne: selfId } })) { slug = `${base}-${n}`; n += 1; }
  return slug;
}

function contentRoutes({ base, Model, schema, label, adminPath, publicPath, check = () => {} }) {
  const r = Router();
  const canPublish = (u) => can(u, 'content.manage');
  const canDraft = (u) => canPublish(u) || can(u, 'content.draft');
  const scope = (u) => (canPublish(u) ? {} : { $or: [{ authorId: u._id }, { status: 'published' }] });
  const editable = (doc, u) => canPublish(u) || (doc.authorId === u._id && ['draft', 'in_review'].includes(doc.status));
  const names = async () => Object.fromEntries((await User.find().select('name').lean()).map((x) => [x._id, x.name]));
  const view = (d, u, n = {}) => {
    const { _id, history, ...rest } = d;
    return { ...rest, id: _id, authorName: n[d.authorId] || 'Unknown user', history: history || [], canEdit: editable(d, u), canPublish: canPublish(u), publicUrl: d.status === 'published' ? `${publicPath}/${d.slug}` : null };
  };

  r.use(`/${base}`, (req, _res, next) => { if (!canDraft(req.user)) throw forbidden(); next(); });

  async function load(req) {
    const doc = await Model.findOne({ _id: req.params.id, ...scope(req.user) });
    if (!doc) throw notFound(`${label} not found`);
    return doc;
  }
  const log = (doc, kind, req, note) => doc.history.push({ kind, by: req.user.name, note, at: new Date() });

  r.get(`/${base}`, async (req, res) => {
    const q = parse(z.object({ status: z.enum(['draft', 'in_review', 'published', 'archived']).optional(), q: z.string().max(100).optional() }), req.query);
    const f = { ...scope(req.user) };
    if (q.status) f.status = q.status;
    if (q.q) f.title = new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [rows, n] = await Promise.all([Model.find(f).sort({ updatedAt: -1 }).limit(200).lean(), names()]);
    res.json({ data: rows.map((d) => view(d, req.user, n)) });
  });

  r.get(`/${base}/:id`, async (req, res) => {
    const doc = await load(req);
    res.json({ data: view(doc.toObject(), req.user, await names()) });
  });

  r.post(`/${base}`, async (req, res) => {
    const data = parse(schema, req.body);
    check(data);
    const doc = new Model({ ...data, slug: await uniqueSlug(Model, data.slug || data.title), status: 'draft', authorId: req.user._id });
    log(doc, 'created', req);
    await doc.save();
    res.status(201).json({ data: view(doc.toObject(), req.user, await names()) });
  });

  r.patch(`/${base}/:id`, async (req, res) => {
    const doc = await load(req);
    if (!editable(doc, req.user)) throw forbidden('Only drafts you wrote can be edited. Ask an Admin to change published items.');
    const data = parse(schema.partial(), req.body);
    if (data.slug !== undefined || (data.title && !doc.slug)) data.slug = await uniqueSlug(Model, data.slug || data.title || doc.title, doc._id);
    else delete data.slug;
    Object.assign(doc, data);
    check(doc);
    log(doc, 'edited', req);
    await doc.save();
    res.json({ data: view(doc.toObject(), req.user, await names()) });
  });

  const transition = (action, { from, to, publisherOnly, onDone }) => r.post(`/${base}/:id/${action}`, async (req, res) => {
    const doc = await load(req);
    if (publisherOnly && !canPublish(req.user)) throw forbidden('Only Admins and Super Admins can do this.');
    if (!publisherOnly && !editable(doc, req.user)) throw forbidden();
    if (!from.includes(doc.status)) throw badRequest(`This ${label.toLowerCase()} is ${doc.status.replace('_', ' ')} and cannot be changed this way.`);
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 1000) : '';
    if (action === 'return' && !note) throw badRequest('Add a note explaining what needs to change.', { note: 'Required' });
    doc.status = to;
    if (to === 'published' && !doc.publishedAt) doc.publishedAt = new Date();
    if (action === 'return') doc.reviewNote = note; else if (['submit', 'publish'].includes(action)) doc.reviewNote = '';
    log(doc, action, req, note);
    await doc.save();
    if (onDone) await onDone(doc, req, note);
    res.json({ data: view(doc.toObject(), req.user, await names()) });
  });

  const link = (doc) => `${adminPath}?open=${doc._id}`;
  transition('submit', { from: ['draft'], to: 'in_review', onDone: (doc, req) => notify({ kind: 'content.review', perm: 'content.manage', link: link(doc), title: `${label} ready for review — ${doc.title}`, body: `Submitted by ${req.user.name}` }) });
  transition('publish', { from: ['draft', 'in_review', 'archived'], to: 'published', publisherOnly: true, onDone: (doc, req) => (doc.authorId !== req.user._id ? notify({ kind: 'content.published', userId: doc.authorId, link: link(doc), title: `Published: ${doc.title}`, body: `by ${req.user.name}` }) : null) });
  transition('return', { from: ['in_review'], to: 'draft', publisherOnly: true, onDone: (doc, req, note) => notify({ kind: 'content.returned', userId: doc.authorId, link: link(doc), title: `Changes requested — ${doc.title}`, body: note }) });
  transition('unpublish', { from: ['published'], to: 'draft', publisherOnly: true });
  transition('archive', { from: ['draft', 'in_review', 'published'], to: 'archived', publisherOnly: true });

  r.delete(`/${base}/:id`, async (req, res) => {
    const doc = await load(req);
    if (!canPublish(req.user) && !(doc.authorId === req.user._id && doc.status === 'draft')) throw forbidden('You can delete only your own drafts.');
    await doc.deleteOne();
    res.json({ data: { ok: true } });
  });

  return r;
}

module.exports = { contentRoutes, slugify };
