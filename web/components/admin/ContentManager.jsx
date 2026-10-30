'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { X, Plus, ExternalLink } from 'lucide-react';
import { api } from '@/lib/client';
import RichText from './RichText';

const STATUS = { draft: 'Draft', in_review: 'In review', published: 'Published', archived: 'Archived' };
const fmt = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

/** Generic list + editor for publishable content. `fields`: [{ name, label, type, required, options|optionsUrl, hint, full }] */
export default function ContentManager({ base, label, plural, publicBase, fields, columns, intro }) {
  const params = useSearchParams();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(params.get('status') || '');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(params.get('open'));
  const [msg, setMsg] = useState('');
  const [opts, setOpts] = useState({});
  const load = useCallback(() => {
    const qs = new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) });
    api(`/admin/${base}?${qs}`).then((r) => setRows(r.data)).catch((e) => setMsg(e.message));
  }, [base, status, q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    fields.filter((f) => f.optionsUrl).forEach((f) => fetch(f.optionsUrl).then((r) => r.json()).then((d) => setOpts((o) => ({ ...o, [f.name]: d.data.map((x) => [x[f.optionKey || 'slug'], x.name]) }))).catch(() => {}));
  }, [fields]);

  return (
    <>
      <div className="adm-page-head">
        <div><h1 className="adm-h1">{plural}</h1><p className="adm-sub">{intro}</p></div>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setOpenId('new')} data-testid={`${base}-new-button`}><Plus aria-hidden="true" />New {label.toLowerCase()}</button>
      </div>
      <p role="status" className="adm-sub" data-testid={`${base}-message`}>{msg}</p>
      <section className="adm-w">
        <div className="adm-filters">
          <input className="adm-input" placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by title" data-testid={`${base}-search`} />
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" data-testid={`${base}-status-filter`}>
            <option value="">All statuses</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="adm-table-wrap"><table className="adm-table" data-testid={`${base}-table`}>
          <thead><tr><th>Title</th>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th>Status</th><th>Author</th><th>Updated</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length + 4}><span className="adm-sub">Nothing here yet. Use “New {label.toLowerCase()}” to add the first one.</span></td></tr>}
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setOpenId(r.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(r.id)} data-testid={`${base}-row-${r.slug}`}>
                <td><b>{r.title}</b><small>/{publicBase}/{r.slug}</small></td>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key] || '—'}</td>)}
                <td><span className={`adm-cstatus s-${r.status}`}>{STATUS[r.status]}</span></td>
                <td><small>{r.authorName}</small></td><td><small>{fmt(r.updatedAt)}</small></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
      {openId && <Editor key={openId} id={openId} base={base} label={label} fields={fields} opts={opts} onClose={() => setOpenId(null)} onSaved={(id) => { load(); if (id) setOpenId(id); }} />}
    </>
  );
}

function Editor({ id, base, label, fields, opts, onClose, onSaved }) {
  const isNew = id === 'new';
  const [doc, setDoc] = useState(isNew ? { status: 'draft', canEdit: true } : null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [returnNote, setReturnNote] = useState('');

  useEffect(() => { if (!isNew) api(`/admin/${base}/${id}`).then((r) => setDoc(r.data)).catch((e) => setMsg(e.message)); }, [base, id, isNew]);
  useEffect(() => { const esc = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [onClose]);

  const collect = (form) => {
    const fd = new FormData(form); const out = {};
    fields.forEach((f) => {
      if (f.type === 'checkbox') out[f.name] = fd.get(f.name) === 'on';
      else if (f.type === 'image') out[f.name] = doc?.[f.name] || '';
      else if (f.type === 'checkboxes') out[f.name] = fd.getAll(f.name).map(String);
      else out[f.name] = String(fd.get(f.name) ?? '');
    });
    return out;
  };

  async function run(fn, ok) {
    setBusy(true); setMsg(''); setErrors({});
    try { const r = await fn(); if (r?.data) setDoc(r.data); setMsg(ok); onSaved(isNew ? r?.data?.id : null); return r; } catch (e) { setErrors(e.body?.error?.fields || {}); setMsg(e.message); return null; } finally { setBusy(false); }
  }
  const save = (form) => run(() => api(isNew ? `/admin/${base}` : `/admin/${base}/${id}`, { method: isNew ? 'POST' : 'PATCH', body: collect(form) }), 'Saved.');
  const act = (action, ok, body) => run(() => api(`/admin/${base}/${doc.id}/${action}`, { method: 'POST', body: body || {} }), ok);

  async function upload(e, name) {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.set('file', file);
    setBusy(true); setMsg('');
    try { const r = await api('/admin/media', { method: 'POST', form: fd }); setDoc((d) => ({ ...d, [name]: r.data.id })); setMsg('Image uploaded — save to keep it.'); } catch (err) { setMsg(err.message); } finally { setBusy(false); }
  }

  const ro = doc && !doc.canEdit;
  return (
    <>
      <div className="adm-drawer-back" onClick={onClose} aria-hidden="true" />
      <aside className="adm-drawer adm-drawer--wide" role="dialog" aria-modal="true" aria-labelledby="cm-title" data-testid={`${base}-editor`}>
        <header>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="adm-sub" style={{ margin: 0 }}>{isNew ? `New ${label.toLowerCase()}` : <span className={`adm-cstatus s-${doc?.status}`} data-testid={`${base}-editor-status`}>{STATUS[doc?.status]}</span>}</p>
            <h2 id="cm-title" className="adm-h1" style={{ fontSize: '1.25rem', margin: '6px 0 0' }}>{doc?.title || `Untitled ${label.toLowerCase()}`}</h2>
          </div>
          {doc?.publicUrl && <a href={doc.publicUrl} target="_blank" rel="noreferrer" className="adm-btn" data-testid={`${base}-view-live`}><ExternalLink aria-hidden="true" />View live</a>}
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close editor" data-testid={`${base}-editor-close`}><X aria-hidden="true" /></button>
        </header>
        {!doc ? <div className="body"><p className="adm-sub">{msg || 'Loading…'}</p></div> : (
          <form className="body adm-form" onSubmit={(e) => { e.preventDefault(); save(e.currentTarget); }} noValidate>
            {doc.reviewNote && doc.status === 'draft' && <p className="adm-note" role="note" data-testid={`${base}-review-note`}><b>Changes requested:</b> {doc.reviewNote}</p>}
            {ro && <p className="adm-note" role="note">You can view this item but not edit it. {doc.status === 'published' ? 'Ask an Admin to change published items.' : ''}</p>}
            <fieldset disabled={ro || busy} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {fields.map((f) => {
                const fid = `cm-${f.name}`; const err = errors[f.name]; const v = doc[f.name];
                const common = { id: fid, name: f.name, 'aria-invalid': Boolean(err), 'data-testid': `${base}-field-${f.name}` };
                return (
                  <div key={f.name} className="adm-field" style={{ gridColumn: f.full || ['textarea', 'richtext', 'checkboxes'].includes(f.type) ? '1 / -1' : undefined }}>
                    {f.type === 'checkbox' ? (
                      <label className="adm-check"><input type="checkbox" {...common} defaultChecked={Boolean(v)} />{f.label}</label>
                    ) : <label htmlFor={fid}>{f.label}{f.required && <span aria-hidden="true"> *</span>}</label>}
                    {f.type === 'checkboxes' && (
                      <div className="adm-checks" data-testid={`${base}-field-${f.name}`}>
                        {(f.options || opts[f.name] || []).map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return <label key={val} className="adm-check"><input type="checkbox" name={f.name} value={val} defaultChecked={(v || []).includes(val)} data-testid={`${base}-field-${f.name}-${val}`} />{lab}</label>; })}
                      </div>
                    )}
                    {f.type === 'richtext' && <RichText name={f.name} initial={v || ''} testId={`${base}-field-${f.name}`} labelId={fid} />}
                    {f.type === 'textarea' && <textarea {...common} className="adm-textarea" rows={f.rows || 4} defaultValue={v || ''} />}
                    {f.type === 'select' && (
                      <select {...common} className="adm-select" defaultValue={v || f.default || ''}>
                        {!f.required && <option value="">—</option>}
                        {(f.options || opts[f.name] || []).map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return <option key={val} value={val}>{lab}</option>; })}
                      </select>
                    )}
                    {['text', 'date', 'number'].includes(f.type) && <input {...common} type={f.type} className="adm-input" defaultValue={f.type === 'date' && v ? String(v).slice(0, 10) : Array.isArray(v) ? v.join(', ') : v || ''} />}
                    {f.type === 'image' && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {v ? <img src={`/api/v1/public/media/${v}`} alt="Image preview" style={{ width: 120, height: 72, objectFit: 'cover', border: '1px solid var(--a-border)' }} data-testid={`${base}-${f.name}-preview`} /> : <span className="adm-sub">No image</span>}
                        <input id={fid} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => upload(e, f.name)} data-testid={`${base}-field-${f.name}-upload`} />
                        {v && <button type="button" className="adm-btn" onClick={() => setDoc((d) => ({ ...d, [f.name]: '' }))} data-testid={`${base}-${f.name}-remove`}>Remove</button>}
                      </div>
                    )}
                    {f.hint && <small className="adm-sub">{f.hint}</small>}
                    {err && <small className="adm-err" data-testid={`${base}-error-${f.name}`}>{String(err)}</small>}
                  </div>
                );
              })}
            </fieldset>
            <p role="status" className="adm-sub" data-testid={`${base}-editor-message`}>{msg}</p>
            <div className="adm-actions">
              {doc.canEdit && <button type="submit" className="adm-btn" disabled={busy} data-testid={`${base}-save-button`}>{isNew ? 'Create draft' : 'Save changes'}</button>}
              {!isNew && doc.status === 'draft' && doc.canEdit && !doc.canPublish && <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => act('submit', 'Submitted for review. An Admin will publish it.')} data-testid={`${base}-submit-button`}>Submit for review</button>}
              {!isNew && doc.canPublish && doc.status !== 'published' && <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => act('publish', 'Published to the website.')} data-testid={`${base}-publish-button`}>Publish</button>}
              {!isNew && doc.canPublish && doc.status === 'published' && <button type="button" className="adm-btn" disabled={busy} onClick={() => act('unpublish', 'Unpublished — moved back to draft.')} data-testid={`${base}-unpublish-button`}>Unpublish</button>}
              {!isNew && doc.canPublish && doc.status !== 'archived' && <button type="button" className="adm-btn" disabled={busy} onClick={() => act('archive', 'Archived.')} data-testid={`${base}-archive-button`}>Archive</button>}
              {!isNew && (doc.canPublish || (doc.canEdit && doc.status === 'draft')) && (
                <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={async () => { if (window.confirm(`Delete this ${label.toLowerCase()} permanently?`)) { await run(() => api(`/admin/${base}/${doc.id}`, { method: 'DELETE' }), 'Deleted.'); onClose(); } }} data-testid={`${base}-delete-button`}>Delete</button>
              )}
            </div>
            {!isNew && doc.canPublish && doc.status === 'in_review' && (
              <div className="adm-field" style={{ borderTop: '1px solid var(--a-border)', paddingTop: 14 }}>
                <label htmlFor="cm-return">Request changes from the author</label>
                <textarea id="cm-return" className="adm-textarea" rows={2} value={returnNote} onChange={(e) => setReturnNote(e.target.value)} data-testid={`${base}-return-note`} />
                <button type="button" className="adm-btn" style={{ width: 'fit-content' }} disabled={busy || !returnNote.trim()} onClick={() => act('return', 'Returned to the author with your note.', { note: returnNote })} data-testid={`${base}-return-button`}>Return to author</button>
              </div>
            )}
            {!isNew && doc.history?.length > 0 && (
              <div className="adm-field"><label>History</label>
                <ul className="adm-list" data-testid={`${base}-history`}>{[...doc.history].reverse().slice(0, 8).map((h, i) => <li key={i}><span className="grow"><b>{h.kind.replace('_', ' ')}</b>{h.note && <small>{h.note}</small>}</span><small>{h.by} · {fmt(h.at)}</small></li>)}</ul>
              </div>
            )}
          </form>
        )}
      </aside>
    </>
  );
}
