'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Download, Send, FlaskConical, CalendarClock } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import RichText from '@/components/admin/RichText';
import { api } from '@/lib/client';

const LABEL = { draft: 'Draft', scheduled: 'Scheduled', sending: 'Sending', sent: 'Sent', cancelled: 'Cancelled' };
const fmt = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—');

function Campaigns({ canManage }) {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const load = useCallback(() => api('/admin/newsletter/campaigns').then((r) => setRows(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <div className="adm-page-head">
        <div><h2 className="adm-h1" style={{ fontSize: '1.3rem' }}>Newsletters</h2><p className="adm-sub">{canManage ? 'Send a test to yourself, then send now or schedule it.' : 'Write drafts; an Admin sends them.'}</p></div>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setOpenId('new')} data-testid="newsletter-new-button"><Plus aria-hidden="true" />New newsletter</button>
      </div>
      <section className="adm-w"><div className="adm-table-wrap"><table className="adm-table" data-testid="newsletter-campaigns-table">
        <thead><tr><th>Subject</th><th>Status</th><th>Recipients</th><th>Scheduled / sent (IST)</th><th>Updated</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5}><span className="adm-sub">No newsletters yet.</span></td></tr>}
          {rows.map((c) => (
            <tr key={c.id} onClick={() => setOpenId(c.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(c.id)} data-testid={`newsletter-row-${c.id}`}>
              <td><b>{c.subject}</b>{c.preheader && <small>{c.preheader}</small>}</td>
              <td><span className={`adm-cstatus s-${c.status === 'sent' ? 'published' : c.status === 'scheduled' ? 'in_review' : 'draft'}`}>{LABEL[c.status]}</span></td>
              <td>{c.recipients || '—'}</td><td><small>{fmt(c.sentAt || c.scheduledAt)}</small></td><td><small>{fmt(c.updatedAt)}</small></td>
            </tr>
          ))}
        </tbody>
      </table></div></section>
      {openId && <Editor key={openId} id={openId} onClose={() => setOpenId(null)} onSaved={(id) => { load(); if (id) setOpenId(id); }} />}
    </>
  );
}

function Editor({ id, onClose, onSaved }) {
  const isNew = id === 'new';
  const [c, setC] = useState(isNew ? { status: 'draft', canEdit: true } : null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [when, setWhen] = useState('');
  useEffect(() => { if (!isNew) api(`/admin/newsletter/campaigns/${id}`).then((r) => setC(r.data)).catch((e) => setMsg(e.message)); }, [id, isNew]);
  useEffect(() => { const esc = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [onClose]);

  async function run(fn, ok, reselect) {
    setBusy(true); setMsg('');
    try { const r = await fn(); if (r?.data?.id) setC((x) => ({ ...x, ...r.data })); setMsg(ok); onSaved(reselect ? r?.data?.id : null); return r; } catch (e) { setMsg(e.message); return null; } finally { setBusy(false); }
  }
  const save = (form) => {
    const fd = new FormData(form);
    const body = { subject: String(fd.get('subject') || ''), preheader: String(fd.get('preheader') || ''), body: String(fd.get('body') || '') };
    return run(() => api(isNew ? '/admin/newsletter/campaigns' : `/admin/newsletter/campaigns/${id}`, { method: isNew ? 'POST' : 'PATCH', body }), 'Saved.', isNew);
  };
  const editable = c && c.canEdit && ['draft', 'scheduled'].includes(c.status);

  return (
    <>
      <div className="adm-drawer-back" onClick={onClose} aria-hidden="true" />
      <aside className="adm-drawer adm-drawer--wide" role="dialog" aria-modal="true" aria-labelledby="nl-title" data-testid="newsletter-editor">
        <header>
          <div style={{ flex: 1 }}>
            <p className="adm-sub" style={{ margin: 0 }} data-testid="newsletter-editor-status">{isNew ? 'New newsletter' : `${LABEL[c?.status] || ''}${c?.scheduledAt && c.status === 'scheduled' ? ` · ${fmt(c.scheduledAt)} IST` : ''}`}</p>
            <h2 id="nl-title" className="adm-h1" style={{ fontSize: '1.25rem', margin: '6px 0 0' }}>{c?.subject || 'Untitled newsletter'}</h2>
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close" data-testid="newsletter-editor-close"><X aria-hidden="true" /></button>
        </header>
        {!c ? <div className="body"><p className="adm-sub">{msg || 'Loading…'}</p></div> : (
          <form className="body adm-form" onSubmit={(e) => { e.preventDefault(); save(e.currentTarget); }} noValidate>
            <fieldset disabled={!editable || busy} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 14 }}>
              <div className="adm-field"><label htmlFor="nl-subject">Subject *</label><input id="nl-subject" name="subject" className="adm-input" defaultValue={c.subject || ''} maxLength={150} data-testid="newsletter-subject-input" /></div>
              <div className="adm-field"><label htmlFor="nl-pre">Preview text (shown next to the subject in inboxes)</label><input id="nl-pre" name="preheader" className="adm-input" defaultValue={c.preheader || ''} maxLength={150} data-testid="newsletter-preheader-input" /></div>
              <div className="adm-field"><label htmlFor="nl-body">Content</label><RichText name="body" initial={c.body || ''} testId="newsletter-body" labelId="nl-body" /></div>
            </fieldset>
            <p className="adm-sub" style={{ fontSize: '0.78rem' }}>An unsubscribe link and the one-click unsubscribe header are added to every email automatically.</p>
            <p role="status" className="adm-sub" data-testid="newsletter-editor-message">{msg}</p>
            <div className="adm-actions">
              {editable && <button type="submit" className="adm-btn" disabled={busy} data-testid="newsletter-save-button">{isNew ? 'Create draft' : 'Save changes'}</button>}
              {!isNew && editable && <button type="button" className="adm-btn" disabled={busy} onClick={() => run(() => api(`/admin/newsletter/campaigns/${c.id}/test`, { method: 'POST' }), 'Test sent to your inbox. Save first if you changed anything.')} data-testid="newsletter-test-button"><FlaskConical aria-hidden="true" />Send test to me</button>}
              {!isNew && c.canSend && c.status === 'draft' && <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => window.confirm('Send this newsletter to all subscribers now?') && run(() => api(`/admin/newsletter/campaigns/${c.id}/send`, { method: 'POST', body: {} }), 'Sending to all subscribers…')} data-testid="newsletter-send-button"><Send aria-hidden="true" />Send now</button>}
              {!isNew && c.canSend && c.status === 'scheduled' && <button type="button" className="adm-btn" disabled={busy} onClick={() => run(() => api(`/admin/newsletter/campaigns/${c.id}/cancel`, { method: 'POST' }), 'Schedule cancelled — back to draft.')} data-testid="newsletter-cancel-button">Cancel schedule</button>}
              {!isNew && editable && c.status === 'draft' && <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={async () => { if (window.confirm('Delete this draft?')) { await run(() => api(`/admin/newsletter/campaigns/${c.id}`, { method: 'DELETE' }), 'Deleted.'); onClose(); } }} data-testid="newsletter-delete-button">Delete</button>}
            </div>
            {!isNew && c.canSend && c.status === 'draft' && (
              <div className="adm-field" style={{ borderTop: '1px solid var(--a-border)', paddingTop: 14 }}>
                <label htmlFor="nl-when">Schedule for later (your local time)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input id="nl-when" type="datetime-local" className="adm-input" value={when} onChange={(e) => setWhen(e.target.value)} data-testid="newsletter-schedule-input" />
                  <button type="button" className="adm-btn" disabled={busy || !when} onClick={() => run(() => api(`/admin/newsletter/campaigns/${c.id}/send`, { method: 'POST', body: { scheduledAt: new Date(when).toISOString() } }), 'Scheduled. It goes out within 15 minutes of the chosen time.')} data-testid="newsletter-schedule-button"><CalendarClock aria-hidden="true" />Schedule</button>
                </div>
              </div>
            )}
            {c.stats && Object.keys(c.stats).length > 0 && <p className="adm-sub" data-testid="newsletter-delivery-stats">Delivery: {Object.entries(c.stats).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>}
          </form>
        )}
      </aside>
    </>
  );
}

function Subscribers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(() => {
    const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) });
    api(`/admin/newsletter/subscribers?${qs}`).then((r) => { setRows(r.data); setMeta(r.meta); }).catch((e) => setMsg(e.message));
  }, [q, status]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const act = async (fn, ok, confirmText) => { if (confirmText && !window.confirm(confirmText)) return; try { await fn(); setMsg(ok); load(); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <div className="adm-page-head">
        <div><h2 className="adm-h1" style={{ fontSize: '1.3rem' }}>Subscribers</h2><p className="adm-sub" data-testid="subscribers-counts">{meta ? `${meta.subscribed} subscribed · ${meta.unsubscribed} unsubscribed` : 'Loading…'}</p></div>
        <a href="/api/v1/admin/newsletter/subscribers/export" className="adm-btn" data-testid="subscribers-export"><Download aria-hidden="true" />Export CSV</a>
      </div>
      <p role="status" className="adm-sub" data-testid="subscribers-message">{msg}</p>
      <section className="adm-w">
        <div className="adm-filters">
          <input className="adm-input" placeholder="Search email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search email" data-testid="subscribers-search" />
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" data-testid="subscribers-status-filter"><option value="">All</option><option value="subscribed">Subscribed</option><option value="unsubscribed">Unsubscribed</option></select>
        </div>
        <div className="adm-table-wrap"><table className="adm-table" data-testid="subscribers-table">
          <thead><tr><th>Email</th><th>Status</th><th>Joined</th><th>Signed up on</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5}><span className="adm-sub">No subscribers yet.</span></td></tr>}
            {rows.map((r) => (
              <tr key={r.id} style={{ cursor: 'default' }} data-testid={`subscriber-row-${r.email}`}>
                <td>{r.email}</td><td>{r.status}</td><td><small>{fmt(r.createdAt)}</small></td><td><small>{r.source || '—'}</small></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {r.status === 'subscribed' && <button type="button" className="adm-btn" onClick={() => act(() => api(`/admin/newsletter/subscribers/${r.id}/unsubscribe`, { method: 'POST' }), 'Unsubscribed.')} data-testid={`subscriber-unsubscribe-${r.email}`}>Unsubscribe</button>}
                  <button type="button" className="adm-btn adm-btn--danger" onClick={() => act(() => api(`/admin/newsletter/subscribers/${r.id}`, { method: 'DELETE' }), 'Deleted permanently.', `Delete ${r.email} permanently (privacy request)?`)} data-testid={`subscriber-delete-${r.email}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
    </>
  );
}

export default function NewsletterAdminPage() {
  const [tab, setTab] = useState('campaigns');
  const [canManage, setCanManage] = useState(false);
  useEffect(() => { api('/auth/me').then((r) => { const p = r.data.user.permissions; setCanManage(p.includes('*') || p.includes('newsletter.manage')); }).catch(() => {}); }, []);
  return (
    <AdminShell title="Newsletter">
      <h1 className="adm-h1">Newsletter</h1>
      <nav className="adm-subnav" aria-label="Newsletter sections">
        <a href="#campaigns" aria-current={tab === 'campaigns' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); setTab('campaigns'); }} data-testid="newsletter-tab-campaigns">Newsletters</a>
        {canManage && <a href="#subscribers" aria-current={tab === 'subscribers' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); setTab('subscribers'); }} data-testid="newsletter-tab-subscribers">Subscribers</a>}
      </nav>
      {tab === 'campaigns' ? <Campaigns canManage={canManage} /> : <Subscribers />}
    </AdminShell>
  );
}
