const { Router } = require('express');
const { Session } = require('../auth/models');
const { Notification, hub, visibleTo, audienceFilter, view } = require('./service');
const { notFound } = require('../../utils/errors');

const router = Router();

router.get('/notifications', async (req, res) => {
  const f = audienceFilter(req.user);
  const [items, unread] = await Promise.all([
    Notification.find(f).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ ...f, readBy: { $ne: req.user._id } }),
  ]);
  res.json({ data: { items: items.map((n) => view(n, req.user)), unread } });
});

router.post('/notifications/read-all', async (req, res) => {
  await Notification.updateMany({ ...audienceFilter(req.user), readBy: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });
  res.json({ data: { ok: true } });
});

router.post('/notifications/:id/read', async (req, res) => {
  const r = await Notification.updateOne({ _id: req.params.id, ...audienceFilter(req.user) }, { $addToSet: { readBy: req.user._id } });
  if (!r.matchedCount) throw notFound('Notification not found');
  res.json({ data: { ok: true } });
});

// Live stream (Server-Sent Events). Session is re-validated on every heartbeat so a revoked/expired
// session or deactivated user stops receiving events within ~25 seconds.
router.get('/events', async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n\n');
  const user = req.user;
  const sessionId = req.session._id;
  const onNotif = (n) => { if (visibleTo(n, user)) res.write(`event: notification\ndata: ${JSON.stringify(view(n, user))}\n\n`); };
  hub.on('notification', onNotif);
  const beat = setInterval(async () => {
    const ok = await Session.exists({ _id: sessionId, revokedAt: null, expiresAt: { $gt: new Date() } }).catch(() => true);
    if (!ok) { res.write('event: session-ended\ndata: {}\n\n'); res.end(); return; }
    res.write(': ping\n\n');
  }, 25000);
  req.on('close', () => { clearInterval(beat); hub.off('notification', onNotif); });
});

module.exports = router;
