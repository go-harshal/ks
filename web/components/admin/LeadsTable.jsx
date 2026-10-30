'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { api } from '@/lib/client';
import StatusBadge from './StatusBadge';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
const TYPES = ['project', 'hiring', 'partnership', 'contact'];
const fmt = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const toLocalInput = (d) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60e3).toISOString().slice(0, 16) : '');

export default function LeadsTable() {
  const params = useSearchParams();
  const [f, setF] = useState({ q: '', type: params.get('type') || '', status: params.get('status') || '', assignee: '' });
  const [page, setPage] = useState(1);
  const [res, setRes] = useState({ data: [], meta: { total: 0, limit: 20 } });
  const [state, setState] = useState('loading');
  const [openId, setOpenId] = useState(params.get('open'));
  const [me, setMe] = useState(null);
  const [assignees, setAssignees] = useState([]);

  const qs = new URLSearchParams(Object.entries({ ...f, page }).filter(([, v]) => v)).toString();
  const load = useCallback(() => {
    setState('loading');
    api(`/admin/leads?${qs}`).then((r) => { setRes(r); setState('ok'); }).catch(() => setState('error'));
  }, [qs]);
  useEffect(() => { const h = () => load(); window.addEventListener('ks:leads-changed', h); return () => window.removeEventListener('ks:leads-changed', h); }, [load]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    api('/auth/me').then((r) => {
      setMe(r.data.user);
      const p = r.data.user.permissions;
      if (p.includes('*') || p.includes('leads.assign')) api('/admin/leads/assignees').then((a) => setAssignees(a.data)).catch(() => {});
    }).catch(() => {});
  }, []);
  const can = (perm) => me && (me.permissions.includes('*') || me.permissions.includes(perm));
  const set = (k) => (e) => { setPage(1); setF((x) => ({ ...x, [k]: e.target.value })); };
  const pages = Math.max(1, Math.ceil(res.meta.total / res.meta.limit));

  return (
    <>
      <div className="adm-page-head">
        <div><h1 className="adm-h1">Lead Management</h1><p className="adm-sub" data-testid="leads-count">{res.meta.total} enquiries{me && !can('leads.view_all') ? ' assigned to you' : ''}</p></div>
        {can('leads.export') && <a className="adm-btn" href={`/api/v1/admin/leads/export?${qs}`} data-testid="leads-export-csv"><Download aria-hidden="true" />Export CSV</a>}
      </div>
      <section className="adm-w" aria-label="Leads">
        <div className="adm-filters">
          <label className="visually-hidden" htmlFor="lead-q">Search leads</label>
          <input id="lead-q" className="adm-input" placeholder="Search name, company or email" value={f.q} onChange={set('q')} data-testid="leads-search-input" />
          <select className="adm-select" aria-label="Type" value={f.type} onChange={set('type')} data-testid="leads-filter-type"><option value="">All types</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <select className="adm-select" aria-label="Status" value={f.status} onChange={set('status')} data-testid="leads-filter-status"><option value="">All statuses</option>{STATUSES.map((t) => <option key={t}>{t}</option>)}</select>
          {assignees.length > 0 && <select className="adm-select" aria-label="Assignee" value={f.assignee} onChange={set('assignee')} data-testid="leads-filter-assignee"><option value="">All assignees</option><option value="unassigned">Unassigned</option>{assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>}
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table" data-testid="leads-table">
            <thead><tr><th scope="col">Lead</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Assignee</th><th scope="col">Follow-up</th><th scope="col">Received</th></tr></thead>
            <tbody>
              {res.data.map((l) => (
                <tr key={l.id} onClick={() => setOpenId(l.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(l.id)} data-testid={`lead-row-${l.id}`}>
                  <td><b>{l.contact?.company || l.contact?.name}</b><small>{l.contact?.name} · {l.contact?.email}</small></td>
                  <td><span className="adm-type">{l.type}</span></td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>{l.assigneeName || <small>Unassigned</small>}</td>
                  <td><small className={l.followUpAt && new Date(l.followUpAt) < new Date() ? 'adm-overdue' : ''}>{fmt(l.followUpAt)}</small></td>
                  <td><small>{fmt(l.createdAt)}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
          {state === 'loading' && res.data.length === 0 && <div className="adm-empty">Loading…</div>}
          {state === 'error' && <div className="adm-empty" role="alert">Could not load leads. <button type="button" className="adm-btn" onClick={load}>Retry</button></div>}
          {state === 'ok' && res.data.length === 0 && <div className="adm-empty" data-testid="leads-empty"><b>No leads found.</b><span>New enquiries from the website appear here automatically.</span></div>}
        </div>
        <div className="adm-pager"><span>Page {page} of {pages}</span><span style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="adm-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)} data-testid="leads-prev-page">Previous</button>
          <button type="button" className="adm-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} data-testid="leads-next-page">Next</button></span></div>
      </section>
      {openId && <LeadDrawer id={openId} onClose={() => setOpenId(null)} onChange={load} assignees={assignees} />}
    </>
  );
}

function LeadDrawer({ id, onClose, onChange, assignees }) {
  const [lead, setLead] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const reload = useCallback(() => api(`/admin/leads/${id}`).then((r) => setLead(r.data)).catch((e) => setErr(e.message)), [id]);
  useEffect(() => { reload(); const esc = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [reload, onClose]);
  const act = async (fn) => { setErr(''); try { await fn(); await reload(); onChange(); } catch (e) { setErr(e.message); } };

  return (
    <>
      <div className="adm-drawer-back" onClick={onClose} aria-hidden="true" />
      <aside className="adm-drawer" role="dialog" aria-modal="true" aria-labelledby="lead-title" data-testid="lead-detail-drawer">
        <header>
          <div style={{ flex: 1 }}><p className="adm-type">{lead?.type} enquiry</p><h2 id="lead-title" className="adm-h1" style={{ fontSize: '1.3rem' }}>{lead ? lead.contact?.company || lead.contact?.name : 'Loading…'}</h2></div>
          {lead?.type === 'partnership' && <button type="button" className="adm-btn" onClick={() => act(async () => { const r = await api(`/admin/partners/from-lead/${id}`, { method: 'POST' }); window.location.href = `/phobos/partners?open=${r.data.id}`; })} data-testid="lead-create-partner-button">Create partner</button>}
          <button type="button" className="adm-icon-btn" aria-label="Close" onClick={onClose} data-testid="lead-detail-close"><X aria-hidden="true" /></button>
        </header>
        {lead && (
          <div className="body">
            {err && <p role="alert" className="adm-overdue">{err}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="adm-kpi-label">Status<select className="adm-select" style={{ width: '100%' }} value={lead.status} onChange={(e) => act(() => api(`/admin/leads/${id}`, { method: 'PATCH', body: { status: e.target.value } }))} data-testid="lead-detail-status">{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></label>
              {assignees.length > 0 ? (
                <label className="adm-kpi-label">Assignee<select className="adm-select" style={{ width: '100%' }} value={lead.assigneeId || ''} onChange={(e) => act(() => api(`/admin/leads/${id}/assign`, { method: 'POST', body: { assigneeId: e.target.value || null } }))} data-testid="lead-detail-assignee"><option value="">Unassigned</option>{assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
              ) : <p className="adm-sub">Assigned to {lead.assigneeName || '—'}</p>}
            </div>
            <label className="adm-kpi-label">Follow-up
              <span style={{ display: 'flex', gap: 8 }}>
                <input type="datetime-local" className="adm-date" defaultValue={toLocalInput(lead.followUpAt)} key={lead.followUpAt} onBlur={(e) => e.target.value && act(() => api(`/admin/leads/${id}`, { method: 'PATCH', body: { followUpAt: new Date(e.target.value).toISOString() } }))} data-testid="lead-detail-followup" />
                {lead.followUpAt && <button type="button" className="adm-btn" onClick={() => act(() => api(`/admin/leads/${id}`, { method: 'PATCH', body: { followUpAt: null } }))} data-testid="lead-detail-clear-followup">Clear</button>}
              </span>
            </label>
            <dl className="adm-dl">
              <dt>Name</dt><dd>{lead.contact?.name}</dd>
              <dt>Email</dt><dd><a href={`mailto:${lead.contact?.email}`}>{lead.contact?.email}</a></dd>
              {Object.entries(lead.payload || {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k.replace(/([A-Z])/g, ' $1')}</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{String(v)}</dd></div>)}
              <dt>Source</dt><dd>{lead.source?.page || '—'}{lead.source?.utm?.utm_source ? ` · ${lead.source.utm.utm_source}` : ''}</dd>
              <dt>Consent</dt><dd>{lead.consent?.version} · {fmt(lead.consent?.at)}</dd>
              <dt>Received</dt><dd>{fmt(lead.createdAt)}</dd>
            </dl>
            {lead.files?.length > 0 && <div><p className="adm-kpi-label">Attachments</p>{lead.files.map((x) => <a key={x.id} className="adm-btn" href={`/api/v1/admin/files/${x.id}/download`} data-testid={`lead-attachment-${x.id}`}><Download aria-hidden="true" />{x.name} ({Math.ceil(x.size / 1024)} KB · {x.scan})</a>)}</div>}
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) act(async () => { await api(`/admin/leads/${id}/notes`, { method: 'POST', body: { body: note } }); setNote(''); }); }} style={{ display: 'grid', gap: 8 }}>
              <label className="adm-kpi-label" htmlFor="note">Internal note</label>
              <textarea id="note" className="adm-input" style={{ height: 80, padding: 10 }} value={note} onChange={(e) => setNote(e.target.value)} data-testid="lead-note-input" />
              <button type="submit" className="adm-btn adm-btn--primary" style={{ width: 'fit-content' }} data-testid="lead-note-submit">Add note</button>
            </form>
            <ul className="adm-list" data-testid="lead-notes-list">{lead.notes.map((n) => <li key={n.id}><span className="grow"><b style={{ whiteSpace: 'pre-wrap' }}>{n.body}</b><small>{n.authorName} · {fmt(n.createdAt)}</small></span></li>)}</ul>
            <div><p className="adm-kpi-label">History</p><ul className="adm-list">{[...lead.history].reverse().map((h, i) => <li key={i}><span className="grow"><small>{h.kind}{h.to ? ` → ${h.to}` : ''}{h.by ? ` · ${h.by}` : ''} · {fmt(h.at)}</small></span></li>)}</ul></div>
          </div>
        )}
      </aside>
    </>
  );
}
