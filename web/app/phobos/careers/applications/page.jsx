'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { api } from '@/lib/client';

const STATUSES = ['New', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'];
const fmt = (d) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function Inbox() {
  const params = useSearchParams();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(params.get('status') || '');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(params.get('open'));
  const [msg, setMsg] = useState('');
  const load = useCallback(() => {
    const qs = new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) });
    api(`/admin/applications?${qs}`).then((r) => setRows(r.data)).catch((e) => setMsg(e.message));
  }, [status, q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  useEffect(() => { window.addEventListener('ks:leads-changed', load); return () => window.removeEventListener('ks:leads-changed', load); }, [load]);
  const open = rows.find((r) => r.id === openId);

  async function update(body, ok) {
    setMsg('');
    try { await api(`/admin/applications/${openId}`, { method: 'PATCH', body }); setMsg(ok); load(); } catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <div className="adm-page-head"><div><h1 className="adm-h1">Applications</h1><p className="adm-sub">Every application is also emailed to HR. CVs are private and download only here.</p></div></div>
      <p role="status" className="adm-sub" data-testid="applications-message">{msg}</p>
      <section className="adm-w">
        <div className="adm-filters">
          <input className="adm-input" placeholder="Search name, email or role" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search applications" data-testid="applications-search" />
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" data-testid="applications-status-filter">
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="adm-table-wrap"><table className="adm-table" data-testid="applications-table">
          <thead><tr><th>Candidate</th><th>Role</th><th>Experience</th><th>Status</th><th>Received</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5}><span className="adm-sub">No applications yet.</span></td></tr>}
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setOpenId(r.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(r.id)} data-testid={`application-row-${r.id}`}>
                <td><b>{r.name}</b><small>{r.email}</small></td><td>{r.jobTitle}</td><td>{r.experience || '—'}</td>
                <td><span className={`adm-cstatus s-app-${r.status.toLowerCase()}`}>{r.status}</span></td><td><small>{fmt(r.createdAt)}</small></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
      {open && (
        <>
          <div className="adm-drawer-back" onClick={() => setOpenId(null)} aria-hidden="true" />
          <aside className="adm-drawer" role="dialog" aria-modal="true" aria-labelledby="app-title" data-testid="application-drawer">
            <header>
              <div style={{ flex: 1 }}><p className="adm-sub" style={{ margin: 0 }}>{open.jobTitle}</p><h2 id="app-title" className="adm-h1" style={{ fontSize: '1.25rem', margin: '6px 0 0' }}>{open.name}</h2></div>
              <button type="button" className="adm-icon-btn" onClick={() => setOpenId(null)} aria-label="Close" data-testid="application-close"><X aria-hidden="true" /></button>
            </header>
            <div className="body">
              <dl className="adm-dl">
                <dt>Email</dt><dd><a href={`mailto:${open.email}`}>{open.email}</a></dd>
                {open.phone && <><dt>Phone</dt><dd>{open.phone}</dd></>}
                {open.location && <><dt>Location</dt><dd>{open.location}</dd></>}
                {open.experience && <><dt>Experience</dt><dd>{open.experience}</dd></>}
                {open.linkedin && <><dt>LinkedIn</dt><dd><a href={open.linkedin} target="_blank" rel="noreferrer noopener">{open.linkedin}</a></dd></>}
                {open.portfolio && <><dt>Portfolio</dt><dd><a href={open.portfolio} target="_blank" rel="noreferrer noopener">{open.portfolio}</a></dd></>}
                <dt>Received</dt><dd>{fmt(open.createdAt)}</dd>
              </dl>
              {open.cvUrl && <a href={open.cvUrl} className="adm-btn" style={{ width: 'fit-content' }} data-testid="application-cv-download"><Download aria-hidden="true" />Download CV</a>}
              {open.coverLetter && <div className="adm-field"><label>Cover letter</label><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{open.coverLetter}</p></div>}
              <div className="adm-field">
                <label htmlFor="app-status">Status</label>
                <select id="app-status" className="adm-select" value={open.status} onChange={(e) => update({ status: e.target.value }, 'Status updated.')} data-testid="application-status-select">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
              <form className="adm-field" onSubmit={(e) => { e.preventDefault(); const note = new FormData(e.currentTarget).get('note'); e.currentTarget.reset(); update({ note }, 'Note added.'); }}>
                <label htmlFor="app-note">Internal note</label>
                <textarea id="app-note" name="note" className="adm-textarea" rows={3} required data-testid="application-note-input" />
                <button type="submit" className="adm-btn" style={{ width: 'fit-content' }} data-testid="application-note-submit">Add note</button>
              </form>
              {open.notes?.length > 0 && <ul className="adm-list" data-testid="application-notes">{[...open.notes].reverse().map((n, i) => <li key={i}><span className="grow"><b>{n.byName}</b><small style={{ whiteSpace: 'pre-wrap' }}>{n.body}</small></span><small>{fmt(n.at)}</small></li>)}</ul>}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export default function ApplicationsPage() {
  return (
    <AdminShell title="Careers & Applications">
      <nav className="adm-subnav" aria-label="Careers sections">
        <Link href="/phobos/careers" data-testid="careers-subnav-jobs">Job posts</Link>
        <Link href="/phobos/careers/applications" aria-current="page" data-testid="careers-subnav-applications">Applications</Link>
      </nav>
      <Suspense fallback={null}><Inbox /></Suspense>
    </AdminShell>
  );
}
