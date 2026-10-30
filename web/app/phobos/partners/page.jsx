'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, Download, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { api } from '@/lib/client';

const STAGES = ['Prospect', 'In discussion', 'Agreement sent', 'Active', 'Paused', 'Ended'];
const TYPES = ['White-label', 'Agency', 'Technology', 'Referral'];
const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR'];
const REF = ['Expected', 'Approved', 'Paid', 'Cancelled'];
const SYM = { INR: '₹', USD: '$', GBP: '£', EUR: '€' };
const money = (c) => Object.entries(c || {}).map(([k, v]) => `${SYM[k]}${Number(v).toLocaleString('en-IN')}`).join(' · ') || '—';
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—');
const days = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / 864e5) : null);

function Pipeline() {
  const params = useSearchParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stage, setStage] = useState('');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(params.get('open'));
  const load = useCallback(() => {
    const qs = new URLSearchParams({ ...(stage ? { stage } : {}), ...(q ? { q } : {}) });
    api(`/admin/partners?${qs}`).then((r) => { setRows(r.data); setMeta(r.meta); }).catch(() => {});
  }, [stage, q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  return (
    <>
      <div className="adm-page-head">
        <div><h1 className="adm-h1">Partner pipeline</h1><p className="adm-sub">Agencies, white-label, technology and referral partners, with agreements and commissions.</p></div>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setOpenId('new')} data-testid="partners-new-button"><Plus aria-hidden="true" />New partner</button>
      </div>
      {meta && (
        <div className="adm-seg" role="group" aria-label="Stage" style={{ flexWrap: 'wrap' }} data-testid="partners-stage-filter">
          <button type="button" aria-pressed={!stage} onClick={() => setStage('')}>All</button>
          {STAGES.map((s) => <button key={s} type="button" aria-pressed={stage === s} onClick={() => setStage(s)} data-testid={`partners-stage-${s.replace(/\s/g, '-').toLowerCase()}`}>{s} ({meta.stages[s]})</button>)}
        </div>
      )}
      <section className="adm-w">
        <div className="adm-filters"><input className="adm-input" placeholder="Search partner name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search partners" data-testid="partners-search" /></div>
        <div className="adm-table-wrap"><table className="adm-table" data-testid="partners-table">
          <thead><tr><th>Partner</th><th>Type</th><th>Stage</th><th>Next agreement end</th><th>Referrals</th><th>Commission</th><th>Owner</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7}><span className="adm-sub">No partners yet. Add one, or open a partnership enquiry in Leads and choose “Create partner”.</span></td></tr>}
            {rows.map((p) => {
              const next = (p.agreements || []).filter((a) => a.endDate && days(a.endDate) >= 0).sort((a, b) => new Date(a.endDate) - new Date(b.endDate))[0];
              return (
                <tr key={p.id} onClick={() => setOpenId(p.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(p.id)} data-testid={`partner-row-${p.id}`}>
                  <td><b>{p.name}</b><small>{p.contactName}</small></td><td>{p.type}</td><td><span className="adm-cstatus">{p.stage}</span></td>
                  <td>{next ? <span className={days(next.endDate) <= 30 ? 'adm-overdue' : ''}>{fmt(next.endDate)}</span> : '—'}</td>
                  <td>{p.referrals?.length || 0}</td><td>{money(p.commission)}</td><td><small>{p.ownerName}</small></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </section>
      <Showcase refresh={rows} />
      {openId && <Drawer key={openId} id={openId} onClose={() => setOpenId(null)} onChange={(nid) => { load(); if (nid) setOpenId(nid); }} />}
    </>
  );
}

/** Drag (or move with the arrow buttons) the publicly listed partners into the order shown on /partnerships. */
function Showcase({ refresh }) {
  const [list, setList] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [dragging, setDragging] = useState(null);
  const listRef = useRef(null);
  useEffect(() => { api('/admin/partners/meta/showcase').then((r) => { setList(r.data); setDirty(false); }).catch(() => setList([])); }, [refresh]);
  const move = (from, to) => { if (to < 0 || to >= list.length || from === to) return; const next = [...list]; next.splice(to, 0, next.splice(from, 1)[0]); setList(next); setDirty(true); setMsg(''); };
  // Pointer-based drag (mouse and touch): the row under the pointer becomes the drop position.
  const startDrag = (e, index) => {
    e.preventDefault();
    let cur = index;
    setDragging(index);
    const onMove = (ev) => {
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-index]');
      if (!row || !listRef.current?.contains(row)) return;
      const to = Number(row.dataset.index);
      if (to !== cur) { const from = cur; setList((l) => { const next = [...l]; next.splice(to, 0, next.splice(from, 1)[0]); return next; }); cur = to; setDragging(to); setDirty(true); setMsg(''); }
    };
    const onUp = () => { setDragging(null); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };
  const save = async () => { try { await api('/admin/partners/meta/showcase', { method: 'PUT', body: { ids: list.map((x) => x.id) } }); setDirty(false); setMsg('Order saved. The Partnerships page updates within a minute.'); } catch (e) { setMsg(e.message); } };
  if (!list) return null;
  return (
    <section className="adm-w" style={{ padding: 20 }} data-testid="showcase-order">
      <div className="adm-page-head" style={{ marginBottom: 8 }}>
        <div><h2 className="adm-w-title">Showcase order</h2><p className="adm-sub">Drag to set the order logos appear on the public Partnerships page.</p></div>
        <button type="button" className="adm-btn adm-btn--primary" disabled={!dirty} onClick={save} data-testid="showcase-save-button">Save order</button>
      </div>
      <p role="status" className="adm-sub" data-testid="showcase-message">{msg}</p>
      {list.length === 0 ? <p className="adm-sub" data-testid="showcase-empty">No partners are listed yet. A partner appears here once it is Active, has a logo and its listing is approved.</p> : (
        <ol className="adm-list" ref={listRef} data-testid="showcase-list">
          {list.map((x, i) => (
            <li key={x.id} data-index={i} style={{ gap: 12, opacity: dragging === i ? 0.5 : 1, transition: 'opacity 0.15s ease' }} data-testid={`showcase-item-${x.id}`}>
              <button type="button" className="adm-icon-btn" aria-label={`Drag to reorder ${x.name}`} style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={(e) => startDrag(e, i)} data-testid={`showcase-grip-${x.id}`}><GripVertical aria-hidden="true" size={16} /></button>
              <span className="adm-sub" style={{ width: 20 }}>{i + 1}</span>
              <img src={x.logoUrl} alt="" style={{ height: 32, width: 72, objectFit: 'contain', background: '#fff' }} />
              <span className="grow"><b>{x.name}</b><small>{x.type}</small></span>
              <button type="button" className="adm-icon-btn" aria-label={`Move ${x.name} up`} disabled={i === 0} onClick={() => move(i, i - 1)} data-testid={`showcase-up-${x.id}`}><ArrowUp aria-hidden="true" /></button>
              <button type="button" className="adm-icon-btn" aria-label={`Move ${x.name} down`} disabled={i === list.length - 1} onClick={() => move(i, i + 1)} data-testid={`showcase-down-${x.id}`}><ArrowDown aria-hidden="true" /></button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Drawer({ id, onClose, onChange }) {
  const isNew = id === 'new';
  const [p, setP] = useState(isNew ? { stage: 'Prospect', type: 'Agency' } : null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [leadQ, setLeadQ] = useState('');
  const [leadHits, setLeadHits] = useState([]);
  const [users, setUsers] = useState([]);
  const [logoId, setLogoId] = useState('');
  const [approved, setApproved] = useState(false);
  useEffect(() => { if (p?.id) { setLogoId(p.logoId || ''); setApproved(!!p.listingApproved); } }, [p?.id, p?.logoId, p?.listingApproved]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!isNew) api(`/admin/partners/${id}`).then((r) => setP(r.data)).catch((e) => setMsg(e.message)); }, [id, isNew]);
  useEffect(() => { api('/admin/partners/meta/owners').then((r) => setUsers(r.data)).catch(() => {}); }, []);
  useEffect(() => { if (leadQ.length < 2) { setLeadHits([]); return undefined; } const t = setTimeout(() => api(`/admin/leads?q=${encodeURIComponent(leadQ)}&limit=6`).then((r) => setLeadHits(r.data)).catch(() => {}), 250); return () => clearTimeout(t); }, [leadQ]);
  useEffect(() => { const esc = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [onClose]);

  async function run(fn, ok, reopen) {
    setBusy(true); setMsg('');
    try { const r = await fn(); if (r?.data?.id) setP(r.data); setMsg(ok); onChange(reopen ? r.data.id : null); return r; } catch (e) { setMsg(e.message); return null; } finally { setBusy(false); }
  }
  const field = (fd, k) => String(fd.get(k) ?? '');
  const save = (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const body = Object.fromEntries(['name', 'type', 'stage', 'contactName', 'email', 'phone', 'website', 'ownerId', 'summary', 'listingNote'].map((k) => [k, field(fd, k)])); body.logoId = logoId; body.listingApproved = fd.get('listingApproved') === 'on'; run(() => api(isNew ? '/admin/partners' : `/admin/partners/${id}`, { method: isNew ? 'POST' : 'PATCH', body }), 'Saved.', isNew); };
  const uploadLogo = async (e) => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); setBusy(true); try { const r = await api('/admin/media', { method: 'POST', form: fd }); setLogoId(r.data.id); setMsg('Logo uploaded — save to keep it.'); } catch (err) { setMsg(err.message); } finally { setBusy(false); } };
  const uploadAgreement = (e) => { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); run(() => api(`/admin/partners/${p.id}/agreements`, { method: 'POST', form: fd }), 'Agreement uploaded.').then((r) => r && form.reset()); };
  const addReferral = (e) => { e.preventDefault(); const form = e.currentTarget; const fd = new FormData(form); run(() => api(`/admin/partners/${p.id}/referrals`, { method: 'POST', body: { leadId: field(fd, 'leadId'), leadName: field(fd, 'leadName'), amount: field(fd, 'amount') || '0', currency: field(fd, 'currency'), status: field(fd, 'status'), note: field(fd, 'note') } }), 'Referral added.').then((r) => { if (r) { form.reset(); setLeadQ(''); } }); };

  return (
    <>
      <div className="adm-drawer-back" onClick={onClose} aria-hidden="true" />
      <aside className="adm-drawer adm-drawer--wide" role="dialog" aria-modal="true" aria-labelledby="pt-title" data-testid="partner-drawer">
        <header>
          <div style={{ flex: 1 }}><p className="adm-sub" style={{ margin: 0 }}>{isNew ? 'New partner' : `${p?.type || ''} · ${p?.stage || ''}`}</p><h2 id="pt-title" className="adm-h1" style={{ fontSize: '1.25rem', margin: '6px 0 0' }}>{p?.name || 'New partner'}</h2></div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close" data-testid="partner-close"><X aria-hidden="true" /></button>
        </header>
        {!p ? <div className="body"><p className="adm-sub">{msg || 'Loading…'}</p></div> : (
          <div className="body adm-form">
            <p role="status" className="adm-sub" data-testid="partner-message">{msg}</p>
            <form onSubmit={save} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {[['name', 'Partner / company name *'], ['contactName', 'Contact person'], ['email', 'Email'], ['phone', 'Phone'], ['website', 'Website']].map(([k, l]) => (
                <div key={k} className="adm-field"><label htmlFor={`pt-${k}`}>{l}</label><input id={`pt-${k}`} name={k} className="adm-input" defaultValue={p[k] || ''} data-testid={`partner-${k}-input`} /></div>
              ))}
              <div className="adm-field"><label htmlFor="pt-type">Type</label><select id="pt-type" name="type" className="adm-select" defaultValue={p.type} data-testid="partner-type-select">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="adm-field"><label htmlFor="pt-stage">Stage</label><select id="pt-stage" name="stage" className="adm-select" defaultValue={p.stage} data-testid="partner-stage-select">{STAGES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="adm-field"><label htmlFor="pt-owner">Owner</label><select id="pt-owner" name="ownerId" className="adm-select" defaultValue={p.ownerId || ''} data-testid="partner-owner-select"><option value="">Me</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div className="adm-field" style={{ gridColumn: '1 / -1' }}><label htmlFor="pt-summary">Summary</label><textarea id="pt-summary" name="summary" rows={3} className="adm-textarea" defaultValue={p.summary || ''} data-testid="partner-summary-input" /></div>
              <fieldset className="adm-field" style={{ gridColumn: '1 / -1', border: '1px solid var(--a-border)', padding: 12, display: 'grid', gap: 10 }} data-testid="partner-listing">
                <legend style={{ padding: '0 6px', fontWeight: 600 }}>Public listing on the Partnerships page</legend>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {logoId ? <img src={`/api/v1/public/media/${logoId}`} alt={`${p.name || 'Partner'} logo`} style={{ height: 48, maxWidth: 160, objectFit: 'contain', background: '#fff', border: '1px solid var(--a-border)', padding: 4 }} data-testid="partner-logo-preview" /> : <span className="adm-sub">No logo yet.</span>}
                  <label className="adm-btn" style={{ cursor: 'pointer' }}>Upload logo<input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={uploadLogo} hidden data-testid="partner-logo-upload" /></label>
                  {logoId && <button type="button" className="adm-btn" onClick={() => setLogoId('')} data-testid="partner-logo-remove">Remove logo</button>}
                </div>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="listingApproved" checked={approved} onChange={(e) => setApproved(e.target.checked)} data-testid="partner-listing-approved" />Listing approved by the partner</label>
                <div className="adm-field"><label htmlFor="pt-lnote">Approval note {approved ? '*' : ''} (who agreed, when and how)</label><input id="pt-lnote" name="listingNote" className="adm-input" defaultValue={p.listingNote || ''} placeholder="e.g. Approved by email from their director, 12 Mar" data-testid="partner-listing-note" /></div>
                <small className="adm-sub" data-testid="partner-listing-status">{p.listingApproved && p.listingApprovedAt ? `Approved by ${p.listingApprovedBy} on ${fmt(p.listingApprovedAt)}. ` : ''}Shown publicly only when approved, a logo is uploaded and the stage is Active.</small>
              </fieldset>
              <div className="adm-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="adm-btn adm-btn--primary" disabled={busy} data-testid="partner-save-button">{isNew ? 'Create partner' : 'Save changes'}</button>
                {!isNew && <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={async () => { if (window.confirm(`Delete ${p.name}? Agreements and referrals are removed too.`)) { await run(() => api(`/admin/partners/${p.id}`, { method: 'DELETE' }), 'Deleted.'); onClose(); } }} data-testid="partner-delete-button">Delete</button>}
              </div>
            </form>

            {!isNew && <>
              <h3 className="adm-w-title" style={{ marginTop: 8 }}>Agreements</h3>
              <ul className="adm-list" data-testid="partner-agreements">
                {p.agreements.length === 0 && <li><span className="adm-sub">No agreements uploaded.</span></li>}
                {p.agreements.map((a) => (
                  <li key={a.id}>
                    <span className="grow"><b>{a.title}</b><small>{fmt(a.startDate)} → <span className={a.endDate && days(a.endDate) <= 30 && days(a.endDate) >= 0 ? 'adm-overdue' : ''}>{fmt(a.endDate)}</span>{a.renewalNotifiedAt ? ' · renewal reminder sent' : ''}</small></span>
                    <a className="adm-icon-btn" href={`/api/v1/admin/partners/${p.id}/agreements/${a.id}/download`} aria-label={`Download ${a.title}`} data-testid={`agreement-download-${a.id}`}><Download aria-hidden="true" /></a>
                    <button type="button" className="adm-icon-btn" aria-label={`Remove ${a.title}`} onClick={() => window.confirm('Remove this agreement?') && run(() => api(`/admin/partners/${p.id}/agreements/${a.id}`, { method: 'DELETE' }), 'Agreement removed.')} data-testid={`agreement-remove-${a.id}`}><Trash2 aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
              <form onSubmit={uploadAgreement} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }} data-testid="agreement-form">
                <div className="adm-field" style={{ gridColumn: '1 / -1' }}><label htmlFor="ag-title">Agreement title *</label><input id="ag-title" name="title" className="adm-input" required data-testid="agreement-title-input" /></div>
                <div className="adm-field"><label htmlFor="ag-start">Start date</label><input id="ag-start" name="startDate" type="date" className="adm-input" data-testid="agreement-start-input" /></div>
                <div className="adm-field"><label htmlFor="ag-end">End date (renewal reminder 30 days before)</label><input id="ag-end" name="endDate" type="date" className="adm-input" data-testid="agreement-end-input" /></div>
                <div className="adm-field"><label htmlFor="ag-file">Signed file (PDF, Word, image ≤10 MB) *</label><input id="ag-file" name="file" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" required data-testid="agreement-file-input" /></div>
                <button type="submit" className="adm-btn" style={{ width: 'fit-content' }} disabled={busy} data-testid="agreement-upload-button">Upload agreement</button>
              </form>

              <h3 className="adm-w-title" style={{ marginTop: 8 }}>Referrals & commission <small className="adm-sub" data-testid="partner-commission-total">({money(p.commission)} excl. cancelled)</small></h3>
              <ul className="adm-list" data-testid="partner-referrals">
                {p.referrals.length === 0 && <li><span className="adm-sub">No referrals recorded.</span></li>}
                {p.referrals.map((r) => (
                  <li key={r.id}>
                    <span className="grow"><b>{r.leadId ? <a href={`/phobos/leads?open=${r.leadId}`}>{r.leadName}</a> : r.leadName}</b><small>{SYM[r.currency]}{Number(r.amount).toLocaleString('en-IN')} {r.currency}{r.note ? ` · ${r.note}` : ''}</small></span>
                    <select className="adm-select" value={r.status} aria-label="Commission status" onChange={(e) => run(() => api(`/admin/partners/${p.id}/referrals/${r.id}`, { method: 'PATCH', body: { status: e.target.value } }), 'Commission status updated.')} data-testid={`referral-status-${r.id}`}>{REF.map((s) => <option key={s}>{s}</option>)}</select>
                    <button type="button" className="adm-icon-btn" aria-label="Remove referral" onClick={() => window.confirm('Remove this referral?') && run(() => api(`/admin/partners/${p.id}/referrals/${r.id}`, { method: 'DELETE' }), 'Referral removed.')} data-testid={`referral-remove-${r.id}`}><Trash2 aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
              <form onSubmit={addReferral} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }} data-testid="referral-form">
                <div className="adm-field" style={{ gridColumn: '1 / -1', position: 'relative' }}>
                  <label htmlFor="rf-lead">Referred lead (search) or name *</label>
                  <input id="rf-lead" name="leadName" className="adm-input" value={leadQ} onChange={(e) => setLeadQ(e.target.value)} autoComplete="off" data-testid="referral-lead-input" />
                  <input type="hidden" name="leadId" value={leadHits.find((l) => (l.contact?.company || l.contact?.name) === leadQ)?.id || ''} />
                  {leadHits.length > 0 && !leadHits.some((l) => (l.contact?.company || l.contact?.name) === leadQ) && (
                    <ul className="adm-list" style={{ border: '1px solid var(--a-border)', padding: 6 }} data-testid="referral-lead-results">
                      {leadHits.map((l) => <li key={l.id}><button type="button" className="adm-btn" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setLeadQ(l.contact?.company || l.contact?.name)} data-testid={`referral-lead-pick-${l.id}`}>{l.contact?.company || l.contact?.name} <small className="adm-sub">· {l.type} · {l.status}</small></button></li>)}
                    </ul>
                  )}
                </div>
                <div className="adm-field"><label htmlFor="rf-amt">Commission</label><input id="rf-amt" name="amount" type="number" min="0" step="0.01" className="adm-input" data-testid="referral-amount-input" /></div>
                <div className="adm-field"><label htmlFor="rf-cur">Currency</label><select id="rf-cur" name="currency" className="adm-select" data-testid="referral-currency-select">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div className="adm-field"><label htmlFor="rf-status">Status</label><select id="rf-status" name="status" className="adm-select" data-testid="referral-status-select">{REF.slice(0, 3).map((c) => <option key={c}>{c}</option>)}</select></div>
                <div className="adm-field"><label htmlFor="rf-note">Note</label><input id="rf-note" name="note" className="adm-input" data-testid="referral-note-input" /></div>
                <button type="submit" className="adm-btn" style={{ width: 'fit-content' }} disabled={busy || !leadQ.trim()} data-testid="referral-add-button">Add referral</button>
              </form>

              <h3 className="adm-w-title" style={{ marginTop: 8 }}>Notes</h3>
              <form onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const body = String(new FormData(form).get('body') || ''); if (body.trim()) run(() => api(`/admin/partners/${p.id}/notes`, { method: 'POST', body: { body } }), 'Note added.').then(() => form.reset()); }} style={{ display: 'grid', gap: 8 }}>
                <textarea name="body" rows={2} className="adm-textarea" aria-label="New note" data-testid="partner-note-input" />
                <button type="submit" className="adm-btn" style={{ width: 'fit-content' }} data-testid="partner-note-submit">Add note</button>
              </form>
              <ul className="adm-list">{[...p.notes].reverse().map((n, i) => <li key={i}><span className="grow"><b style={{ whiteSpace: 'pre-wrap' }}>{n.body}</b><small>{n.byName} · {fmt(n.at)}</small></span></li>)}</ul>
              <p className="adm-sub" style={{ fontSize: '0.78rem' }}>History: {p.history.map((h) => `${h.kind}${h.to ? ` → ${h.to}` : ''} (${h.by}, ${fmt(h.at)})`).join(' · ')}</p>
            </>}
          </div>
        )}
      </aside>
    </>
  );
}

export default function PartnersPage() {
  return <AdminShell title="Partnerships"><Suspense fallback={null}><Pipeline /></Suspense></AdminShell>;
}
