// Newsletter: single opt-in subscriptions, campaigns (draft → scheduled/sending → sent), per-recipient
// one-click unsubscribe (RFC 8058 List-Unsubscribe + List-Unsubscribe-Post) and a link in every footer.
const { randomBytes } = require('crypto');
const sanitizeHtml = require('sanitize-html');
const { Subscriber, Campaign } = require('./models');
const { sendEmail } = require('../../providers/email');
const env = require('../../config/env');

const token = () => randomBytes(24).toString('base64url');

const clean = (html) => sanitizeHtml(html || '', {
  allowedTags: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'blockquote', 'br'],
  allowedAttributes: { a: ['href'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: { b: 'strong', i: 'em', h1: 'h2', div: 'p' },
  exclusiveFilter: (f) => ['p', 'li', 'h2', 'h3'].includes(f.tag) && !f.text.trim(),
});
const toText = (html) => sanitizeHtml(html.replace(/<\/(p|h2|h3|li|blockquote)>/g, '\n').replace(/<br\s*\/?>/g, '\n'), { allowedTags: [] }).replace(/\n{3,}/g, '\n\n').trim();
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Inline styles for email clients (no <style> support in many).
const STYLE = { h2: 'font-size:20px;line-height:1.3;margin:24px 0 8px;color:#17232f', h3: 'font-size:17px;margin:20px 0 6px;color:#17232f', p: 'margin:0 0 14px', a: 'color:#8c5b3e', blockquote: 'margin:0 0 14px;padding-left:14px;border-left:3px solid #a56f4e;color:#526374', ul: 'margin:0 0 14px;padding-left:20px', ol: 'margin:0 0 14px;padding-left:20px' };
const inline = (html) => html.replace(/<(h2|h3|p|a|blockquote|ul|ol)(\s|>)/g, (_m, tag, after) => `<${tag} style="${STYLE[tag]}"${after}`);

function render(c, unsubUrl) {
  return `<!doctype html><html><body style="margin:0;background:#f5f2eb;font-family:Ubuntu,Arial,sans-serif;color:#17232f">
<span style="display:none;max-height:0;overflow:hidden">${esc(c.preheader || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e2ddd3">
<tr><td style="padding:24px 32px;border-bottom:3px solid #a56f4e;font-weight:700;font-size:16px">Kreyszigg Softbizz · Insights</td></tr>
<tr><td style="padding:28px 32px;font-size:15px;line-height:1.65"><h1 style="margin:0 0 18px;font-size:24px;line-height:1.25">${esc(c.subject)}</h1>${inline(c.body || '')}</td></tr>
<tr><td style="padding:18px 32px;background:#f5f2eb;font-size:12px;color:#526374;line-height:1.6">You receive this because you subscribed on the Kreyszigg Softbizz website.<br><a href="${unsubUrl}" style="color:#526374">Unsubscribe</a> · <a href="${env.publicSiteUrl}/privacy" style="color:#526374">Privacy Policy</a></td></tr>
</table></td></tr></table></body></html>`;
}

const links = (t) => ({
  page: `${env.publicSiteUrl}/newsletter/unsubscribe?token=${t}`,
  oneClick: `${env.publicSiteUrl}/api/v1/public/newsletter/unsubscribe?token=${t}`,
});

function message(c, sub, dedupeKey, event = 'newsletter.campaign') {
  const l = links(sub.unsubToken);
  return {
    event, to: sub.email, dedupeKey, subject: c.subject,
    text: `${c.subject}\n\n${toText(c.body || '')}\n\n—\nUnsubscribe: ${l.page}`,
    html: render(c, l.page),
    headers: { 'List-Unsubscribe': `<${l.oneClick}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

async function sendTest(c, user) {
  const fake = { email: user.email, unsubToken: 'test-preview' };
  return sendEmail({ ...message({ ...c, subject: `[TEST] ${c.subject}` }, fake, undefined, 'newsletter.test') });
}

/** Fan out a campaign to every subscribed address. Idempotent per subscriber via dedupeKey. */
async function fanOut(campaignId) {
  const c = await Campaign.findOneAndUpdate({ _id: campaignId, status: { $in: ['scheduled', 'sending'] } }, { status: 'sending', startedAt: new Date() }, { returnDocument: 'after' }).lean();
  if (!c) return 0;
  const subs = await Subscriber.find({ status: 'subscribed' }).select('email unsubToken').lean();
  let queued = 0;
  for (const sub of subs) {
    // eslint-disable-next-line no-await-in-loop
    const r = await sendEmail(message(c, sub, `campaign:${c._id}:${sub._id}`));
    if (!r.duplicate) queued += 1;
  }
  await Campaign.updateOne({ _id: c._id }, { status: 'sent', sentAt: new Date(), recipients: subs.length, $inc: { queued }, $push: { history: { kind: 'sent', by: 'system', note: `${subs.length} recipients`, at: new Date() } } });
  return subs.length;
}

async function processScheduled() {
  const due = await Campaign.find({ status: 'scheduled', scheduledAt: { $lte: new Date() } }).select('_id').lean();
  // Also resume campaigns interrupted mid-send (idempotent thanks to dedupeKey).
  const stuck = await Campaign.find({ status: 'sending', startedAt: { $lt: new Date(Date.now() - 15 * 60e3) } }).select('_id').lean();
  let n = 0;
  for (const c of [...due, ...stuck]) n += await fanOut(c._id); // eslint-disable-line no-await-in-loop
  return n;
}

module.exports = { token, clean, toText, fanOut, sendTest, processScheduled, links };
