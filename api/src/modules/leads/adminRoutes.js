const { Router } = require('express');
const { Lead, LeadNote, FileAsset, LEAD_TYPES, LEAD_STATUSES } = require('./models');
const { User } = require('../auth/models');
const { authorize } = require('../../middleware/auth');
const { can } = require('../../config/permissions');
const { z, parse } = require('../../middleware/validate');
const { HttpError, notFound } = require('../../utils/errors');
const { readPrivate } = require('../../providers/storage');
const { sendEmail } = require('../../providers/email');

const router = Router();

// Record-level scope: Team Members see only leads assigned to them.
const scope = (user) => (can(user, 'leads.view_all') ? {} : { assigneeId: user._id });
const requireLeadAccess = (req, _res, next) => {
  if (!can(req.user, 'leads.view_all') && !can(req.user, 'leads.view_assigned')) throw new HttpError(403, 'FORBIDDEN', 'You do not have access to leads.');
  next();
};
router.use(requireLeadAccess);

async function loadLead(req) {
  const lead = await Lead.findOne({ _id: req.params.id, ...scope(req.user) });
  if (!lead) throw notFound('Lead not found'); // 404 also for out-of-scope, so existence is not revealed
  return lead;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function buildFilter(req) {
  const q = parse(z.object({
    q: z.string().max(100).optional(), type: z.enum(LEAD_TYPES).optional(), status: z.enum(LEAD_STATUSES).optional(),
    assignee: z.string().max(64).optional(), from: z.string().optional(), to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
  }), req.query);
  const f = { ...scope(req.user) };
  if (q.type) f.type = q.type;
  if (q.status) f.status = q.status;
  if (q.assignee && can(req.user, 'leads.view_all')) f.assigneeId = q.assignee === 'unassigned' ? null : q.assignee;
  if (q.from || q.to) f.createdAt = { ...(q.from ? { $gte: new Date(q.from) } : {}), ...(q.to ? { $lte: new Date(`${q.to}T23:59:59Z`) } : {}) };
  if (q.q) { const rx = new RegExp(esc(q.q), 'i'); f.$or = [{ 'contact.name': rx }, { 'contact.email': rx }, { 'contact.company': rx }, { _id: q.q }]; }
  return { f, q };
}

const view = (l, users = {}) => ({
  id: l._id, type: l.type, status: l.status, contact: l.contact, payload: l.payload, source: l.source, consent: l.consent,
  assigneeId: l.assigneeId || null, assigneeName: l.assigneeId ? users[l.assigneeId] || 'Unknown user' : null,
  followUpAt: l.followUpAt || null, attachments: l.attachments || [], history: l.history || [], createdAt: l.createdAt, updatedAt: l.updatedAt,
});
const userNames = async () => Object.fromEntries((await User.find().select('name').lean()).map((u) => [u._id, u.name]));

router.get('/leads', async (req, res) => {
  const { f, q } = buildFilter(req);
  const [rows, total, names] = await Promise.all([Lead.find(f).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(), Lead.countDocuments(f), userNames()]);
  res.json({ data: rows.map((l) => view(l, names)), meta: { page: q.page, limit: q.limit, total } });
});

router.get('/leads/export', authorize('leads.export'), async (req, res) => {
  const { f } = buildFilter(req);
  const [rows, names] = await Promise.all([Lead.find(f).sort({ createdAt: -1 }).limit(5000).lean(), userNames()]);
  const cell = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; }; // CSV-injection safe
  const head = ['ID', 'Type', 'Status', 'Name', 'Email', 'Company', 'Assignee', 'Follow-up', 'Source page', 'Received'];
  const csv = [head, ...rows.map((l) => [l._id, l.type, l.status, l.contact?.name, l.contact?.email, l.contact?.company, names[l.assigneeId] || '', l.followUpAt?.toISOString() || '', l.source?.page, l.createdAt.toISOString()])]
    .map((r) => r.map(cell).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(`\uFEFF${csv}`);
});

router.get('/leads/assignees', authorize('leads.assign'), async (_req, res) => {
  const users = await User.find({ status: 'active' }).select('name role').sort({ name: 1 }).lean();
  res.json({ data: users.map((u) => ({ id: u._id, name: u.name, role: u.role })) });
});

router.get('/leads/:id', async (req, res) => {
  const lead = await loadLead(req);
  const [notes, files, names] = await Promise.all([
    LeadNote.find({ leadId: lead._id }).sort({ createdAt: -1 }).lean(),
    FileAsset.find({ _id: { $in: lead.attachments } }).select('originalName size ext scan createdAt').lean(),
    userNames(),
  ]);
  res.json({ data: { ...view(lead.toObject(), names), notes: notes.map((n) => ({ id: n._id, body: n.body, authorName: n.authorName, createdAt: n.createdAt })),
    files: files.map((x) => ({ id: x._id, name: x.originalName, size: x.size, scan: x.scan?.state })) } });
});

router.patch('/leads/:id', async (req, res) => {
  const body = parse(z.object({ status: z.enum(LEAD_STATUSES).optional(), followUpAt: z.string().datetime({ offset: true }).nullable().optional() }).strict(), req.body);
  const lead = await loadLead(req);
  const at = new Date();
  if (body.status && body.status !== lead.status) { lead.history.push({ kind: 'status', from: lead.status, to: body.status, by: req.user.name, at }); lead.status = body.status; }
  if (body.followUpAt !== undefined) { lead.followUpAt = body.followUpAt ? new Date(body.followUpAt) : null; lead.history.push({ kind: 'followup', to: body.followUpAt || 'cleared', by: req.user.name, at }); }
  await lead.save();
  res.json({ data: view(lead.toObject(), await userNames()) });
});

router.post('/leads/:id/assign', authorize('leads.assign'), async (req, res) => {
  const { assigneeId } = parse(z.object({ assigneeId: z.string().nullable() }), req.body);
  const lead = await loadLead(req);
  let assignee = null;
  if (assigneeId) { assignee = await User.findOne({ _id: assigneeId, status: 'active' }); if (!assignee) throw notFound('User not found'); }
  lead.history.push({ kind: 'assign', from: lead.assigneeId || '', to: assignee?.name || 'Unassigned', by: req.user.name, at: new Date() });
  lead.assigneeId = assignee?._id || null;
  await lead.save();
  if (assignee) await sendEmail({ event: 'lead.assigned', to: assignee.email, dedupeKey: `lead.assigned:${lead._id}:${assignee._id}:${lead.history.length}`,
    subject: `Lead assigned to you — ${lead.contact?.company || lead.contact?.name}`, text: `Open in Phobos: /phobos/leads?open=${lead._id}` });
  res.json({ data: view(lead.toObject(), await userNames()) });
});

router.post('/leads/:id/notes', async (req, res) => {
  const { body } = parse(z.object({ body: z.string().trim().min(1).max(5000) }), req.body);
  const lead = await loadLead(req);
  const note = await LeadNote.create({ leadId: lead._id, authorId: req.user._id, authorName: req.user.name, body });
  res.status(201).json({ data: { id: note._id, body: note.body, authorName: note.authorName, createdAt: note.createdAt } });
});

// Private attachment download — RBAC re-checked against the owning lead every time.
router.get('/files/:id/download', async (req, res) => {
  const file = await FileAsset.findOne({ _id: req.params.id, visibility: 'private' });
  if (!file || file.owner?.type !== 'lead') throw notFound('File not found');
  const lead = await Lead.findOne({ _id: file.owner.id, ...scope(req.user) }).select('_id').lean();
  if (!lead) throw notFound('File not found');
  const buf = await readPrivate(file.storageKey);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/"/g, '')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(buf);
});

module.exports = router;
