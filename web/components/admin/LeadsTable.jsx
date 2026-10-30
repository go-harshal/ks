'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { ASSIGNEES, buildSampleLeads, STATUSES, TYPES } from './sampleData';
import StatusBadge from './StatusBadge';

const PAGE = 12;
const fmt = (d) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function LeadsTable() {
  const params = useSearchParams();
  const [leads, setLeads] = useState(() => buildSampleLeads());
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [assignee, setAssignee] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);

  useEffect(() => { setPage(1); }, [q, type, status, assignee]);
  useEffect(() => {
    if (!openId) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setOpenId(null); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [openId]);

  const filtered = useMemo(() => leads.filter((l) =>
    (!type || l.type === type) && (!status || l.status === status) && (!assignee || l.assignee === assignee) &&
    (!q || `${l.name} ${l.company} ${l.email} ${l.id}`.toLowerCase().includes(q.toLowerCase()))
  ), [leads, q, type, status, assignee]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);
  const open = leads.find((l) => l.id === openId);

  function exportCsv() {
    const head = ['ID', 'Name', 'Company', 'Email', 'Type', 'Status', 'Assignee', 'Source', 'Created'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [head, ...filtered.map((l) => [l.id, l.name, l.company, l.email, l.type, l.status, l.assignee, l.source, l.createdAt])]
      .map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'sample-leads.csv' });
    a.click(); URL.revokeObjectURL(url);
  }
  const update = (id, patch) => setLeads((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1 className="adm-h1">Lead Management</h1>
          <p className="adm-sub">{filtered.length} of {leads.length} enquiries · sample data</p>
        </div>
        <button type="button" className="adm-btn" onClick={exportCsv} data-testid="leads-export-csv"><Download aria-hidden="true" />Export CSV</button>
      </div>

      <section className="adm-w" aria-label="Leads">
        <div className="adm-filters">
          <label className="visually-hidden" htmlFor="lead-q">Search leads</label>
          <input id="lead-q" className="adm-input" placeholder="Search name, company, email or ID" value={q} onChange={(e) => setQ(e.target.value)} data-testid="leads-search-input" />
          <Select id="f-type" label="Type" value={type} onChange={setType} options={TYPES} testId="leads-filter-type" />
          <Select id="f-status" label="Status" value={status} onChange={setStatus} options={STATUSES} testId="leads-filter-status" />
          <Select id="f-assignee" label="Assignee" value={assignee} onChange={setAssignee} options={ASSIGNEES} testId="leads-filter-assignee" />
          {(q || type || status || assignee) && (
            <button type="button" className="adm-btn" onClick={() => { setQ(''); setType(''); setStatus(''); setAssignee(''); }} data-testid="leads-clear-filters">Clear</button>
          )}
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table" data-testid="leads-table">
            <thead><tr><th scope="col">Lead</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Assignee</th><th scope="col">Follow-up</th><th scope="col">Received</th></tr></thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} onClick={() => setOpenId(l.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setOpenId(l.id); }} data-testid={`lead-row-${l.id}`}>
                  <td><b>{l.company}</b><small>{l.name} · {l.id}</small></td>
                  <td><span className="adm-type">{l.type}</span></td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>{l.assignee}</td>
                  <td>{l.followUpAt ? <small className={new Date(l.followUpAt) < new Date() ? 'adm-overdue' : ''}>{fmt(l.followUpAt)}</small> : <small>—</small>}</td>
                  <td><small>{fmt(l.createdAt)}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="adm-empty" data-testid="leads-empty"><b>No leads match these filters.</b><span>Try clearing a filter or searching another term.</span></div>}
        </div>
        <div className="adm-pager">
          <span>Page {page} of {pages}</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="adm-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)} data-testid="leads-prev-page">Previous</button>
            <button type="button" className="adm-btn" disabled={page === pages} onClick={() => setPage((p) => p + 1)} data-testid="leads-next-page">Next</button>
          </span>
        </div>
      </section>

      {open && (
        <>
          <div className="adm-drawer-back" onClick={() => setOpenId(null)} aria-hidden="true" />
          <aside className="adm-drawer" role="dialog" aria-modal="true" aria-labelledby="lead-title" data-testid="lead-detail-drawer">
            <header>
              <div style={{ flex: 1 }}>
                <p className="adm-type">{open.type} enquiry · {open.id}</p>
                <h2 id="lead-title" className="adm-h1" style={{ fontSize: '1.3rem' }}>{open.company}</h2>
              </div>
              <button type="button" className="adm-icon-btn" aria-label="Close" onClick={() => setOpenId(null)} data-testid="lead-detail-close"><X aria-hidden="true" /></button>
            </header>
            <div className="body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Select id="d-status" label="Status" value={open.status} onChange={(v) => update(open.id, { status: v })} options={STATUSES} testId="lead-detail-status" visibleLabel />
                <Select id="d-assignee" label="Assignee" value={open.assignee} onChange={(v) => update(open.id, { assignee: v })} options={ASSIGNEES} testId="lead-detail-assignee" visibleLabel />
              </div>
              <dl className="adm-dl">
                <dt>Contact</dt><dd>{open.name}</dd>
                <dt>Email</dt><dd>{open.email}</dd>
                <dt>Interest</dt><dd>{open.service}</dd>
                <dt>Source</dt><dd>{open.source}</dd>
                <dt>Received</dt><dd>{fmt(open.createdAt)}</dd>
                <dt>Follow-up</dt><dd>{open.followUpAt ? fmt(open.followUpAt) : 'None scheduled'}</dd>
              </dl>
              <p className="adm-sub" style={{ fontSize: '0.8rem' }}>Internal notes, follow-up scheduling, attachments and history are built in Phase 4e. Changes here are local to this preview.</p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function Select({ id, label, value, onChange, options, testId, visibleLabel = false }) {
  return (
    <span style={{ display: 'grid', gap: 4 }}>
      <label htmlFor={id} className={visibleLabel ? 'adm-kpi-label' : 'visually-hidden'}>{label}</label>
      <select id={id} className="adm-select" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId}>
        {!visibleLabel && <option value="">All {label.toLowerCase()}s</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </span>
  );
}
