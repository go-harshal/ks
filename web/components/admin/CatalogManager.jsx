'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, GripVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { api } from '@/lib/client';

const toSlug = (v) => String(v || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const set = (o, path, v) => { const [k, ...rest] = path.split('.'); return { ...o, [k]: rest.length ? set(o[k] || {}, rest.join('.'), v) : v }; };

/**
 * Ordered list + edit drawer for one catalogue collection (/admin/catalog/:kind).
 * fields: [{ name, label, type: text|textarea|slug|lines|pairs|image|checkbox|status|group, required, hint, max }]
 */
export default function CatalogManager({ kind, label, plural, fields, title, subtitle, publicHref, blank = {} }) {
  const [rows, setRows] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(null); // null | 'new' | row
  const [dragging, setDragging] = useState(null);
  const listRef = useRef(null);
  const base = kind.replace(/[^a-z]/g, '-');

  const load = useCallback(() => api(`/admin/catalog/${kind}`).then((r) => { setRows(r.data); setDirty(false); }).catch((e) => { setRows([]); setMsg(e.message); }), [kind]);
  useEffect(() => { load(); }, [load]);

  const move = (from, to) => { if (to < 0 || to >= rows.length || from === to) return; setRows((l) => { const n = [...l]; n.splice(to, 0, n.splice(from, 1)[0]); return n; }); setDirty(true); setMsg(''); };
  const startDrag = (e, index) => {
    e.preventDefault();
    let cur = index;
    setDragging(index);
    const onMove = (ev) => {
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-index]');
      if (!row || !listRef.current?.contains(row)) return;
      const to = Number(row.dataset.index);
      if (to !== cur) { const from = cur; setRows((l) => { const n = [...l]; n.splice(to, 0, n.splice(from, 1)[0]); return n; }); cur = to; setDragging(to); setDirty(true); setMsg(''); }
    };
    const onUp = () => { setDragging(null); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
  };
  const saveOrder = async () => { try { await api(`/admin/catalog/${kind}/order`, { method: 'PUT', body: { ids: rows.map((r) => r.id) } }); setDirty(false); setMsg('Order saved. The website updates within a minute.'); } catch (e) { setMsg(e.message); } };
  const primary = fields[0].name;
  const groups = [...new Set((rows || []).map((r) => r.group).filter(Boolean))];

  return (
    <section className="adm-w" style={{ padding: 20 }} data-testid={`catalog-${base}`}>
      <div className="adm-page-head" style={{ marginBottom: 8 }}>
        <div><h2 className="adm-w-title">{title || plural}</h2>{subtitle && <p className="adm-sub">{subtitle}</p>}</div>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="adm-btn" disabled={!dirty} onClick={saveOrder} data-testid={`catalog-${base}-save-order`}>Save order</button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setOpen('new')} data-testid={`catalog-${base}-add`}><Plus aria-hidden="true" />Add {label}</button>
        </span>
      </div>
      <p role="status" className="adm-sub" data-testid={`catalog-${base}-message`}>{msg}</p>
      {!rows ? <p className="adm-sub">Loading…</p> : rows.length === 0 ? <p className="adm-sub" data-testid={`catalog-${base}-empty`}>No {plural.toLowerCase()} yet.</p> : (
        <ol className="adm-list" ref={listRef} data-testid={`catalog-${base}-list`}>
          {rows.map((r, i) => (
            <li key={r.id} data-index={i} style={{ gap: 10, opacity: dragging === i ? 0.5 : 1, transition: 'opacity 0.15s ease' }} data-testid={`catalog-${base}-item-${r.id}`}>
              <button type="button" className="adm-icon-btn" aria-label={`Drag to reorder ${r[primary]}`} style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={(e) => startDrag(e, i)} data-testid={`catalog-${base}-grip-${r.id}`}><GripVertical aria-hidden="true" size={16} /></button>
              <span className="adm-sub" style={{ width: 22 }}>{i + 1}</span>
              <button type="button" className="grow" style={{ textAlign: 'left', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }} onClick={() => setOpen(r)} data-testid={`catalog-${base}-open-${r.id}`}>
                <b>{r[primary]}</b>
                <small>{[r.group, r.range, r.status === 'draft' ? 'Hidden (draft)' : null, r.priority ? 'Priority' : null].filter(Boolean).join(' · ') || (r.summary || r.description || r.note || '').slice(0, 90)}</small>
              </button>
              <button type="button" className="adm-icon-btn" aria-label={`Move ${r[primary]} up`} disabled={i === 0} onClick={() => move(i, i - 1)} data-testid={`catalog-${base}-up-${r.id}`}><ArrowUp aria-hidden="true" /></button>
              <button type="button" className="adm-icon-btn" aria-label={`Move ${r[primary]} down`} disabled={i === rows.length - 1} onClick={() => move(i, i + 1)} data-testid={`catalog-${base}-down-${r.id}`}><ArrowDown aria-hidden="true" /></button>
            </li>
          ))}
        </ol>
      )}
      {open && <Editor key={open === 'new' ? 'new' : open.id} kind={kind} base={base} label={label} fields={fields} groups={groups} publicHref={publicHref}
        initial={open === 'new' ? { status: 'published', ...blank } : open} onClose={() => setOpen(null)} onSaved={(m) => { setMsg(m); load(); }} />}
    </section>
  );
}

function Editor({ kind, base, label, fields, groups, initial, onClose, onSaved, publicHref }) {
  const isNew = !initial.id;
  const [doc, setDoc] = useState(initial);
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  useEffect(() => { const esc = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [onClose]);

  const change = (name, v) => setDoc((d) => {
    let n = set(d, name, v);
    if (isNew && !slugTouched && name === fields[0].name && fields.some((f) => f.type === 'slug')) n = { ...n, slug: toSlug(v) };
    return n;
  });
  const upload = async (e, name) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file); setBusy(true); setErr('');
    try { const r = await api('/admin/media', { method: 'POST', form: fd }); setDoc((d) => ({ ...d, [name]: r.data.id, heroUrl: r.data.url })); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setFieldErr({});
    const body = {};
    for (const f of fields) {
      const key = f.name.split('.')[0];
      if (body[key] !== undefined) continue;
      let v = doc[key];
      if (f.type === 'pairs') v = (v || []).filter((p) => p.title?.trim());
      if (f.type === 'checkbox') v = !!v;
      body[key] = v ?? (f.type === 'lines' || f.type === 'pairs' ? [] : '');
    }
    try {
      await api(isNew ? `/admin/catalog/${kind}` : `/admin/catalog/${kind}/${initial.id}`, { method: isNew ? 'POST' : 'PATCH', body });
      onSaved(isNew ? `${label[0].toUpperCase()}${label.slice(1)} added.` : 'Changes saved. The website updates within a minute.'); onClose();
    } catch (x) { setErr(x.message); setFieldErr(x.fields || {}); setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api(`/admin/catalog/${kind}/${initial.id}`, { method: 'DELETE' }); onSaved(`${initial[fields[0].name]} deleted.`); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };

  const fieldEl = (f) => {
    const id = `${base}-f-${f.name.replace('.', '-')}`;
    const v = get(doc, f.name);
    const tid = `catalog-${base}-field-${f.name.replace('.', '-')}`;
    const fe = fieldErr[f.name.split('.').pop()] || fieldErr[f.name];
    const labelEl = <label htmlFor={id}>{f.label}{f.required ? ' *' : ''}</label>;
    const hint = (f.hint || fe) && <small className={fe ? 'adm-overdue' : 'adm-sub'}>{fe || f.hint}</small>;
    if (f.type === 'checkbox') return <label key={f.name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={!!v} onChange={(e) => change(f.name, e.target.checked)} data-testid={tid} />{f.label}</label>;
    if (f.type === 'status') return <div key={f.name} className="adm-field">{labelEl}<select id={id} className="adm-select" value={v || 'published'} onChange={(e) => change(f.name, e.target.value)} data-testid={tid}><option value="published">Shown on the website</option><option value="draft">Hidden (draft)</option></select></div>;
    if (f.type === 'textarea') return <div key={f.name} className="adm-field">{labelEl}<textarea id={id} rows={f.rows || 3} className="adm-textarea" maxLength={f.max} value={v || ''} onChange={(e) => change(f.name, e.target.value)} data-testid={tid} />{hint}</div>;
    if (f.type === 'lines') return <div key={f.name} className="adm-field">{labelEl}<textarea id={id} rows={4} className="adm-textarea" value={(v || []).join('\n')} onChange={(e) => change(f.name, e.target.value.split('\n').map((x) => x.replace(/^\s+/, '')).filter((x, i, a) => x || i === a.length - 1))} data-testid={tid} /><small className="adm-sub">One per line.</small></div>;
    if (f.type === 'image') return (
      <div key={f.name} className="adm-field"><span className="adm-kpi-label">{f.label}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {v ? <img src={doc.heroUrl || `/api/v1/public/media/${v}`} alt="" style={{ width: 160, height: 90, objectFit: 'cover', border: '1px solid var(--a-border)' }} data-testid={`${tid}-preview`} /> : <span className="adm-sub">Using the shared placeholder image.</span>}
          <label className="adm-btn" style={{ cursor: 'pointer' }}>Upload image<input type="file" accept=".png,.jpg,.jpeg,.webp" hidden onChange={(e) => upload(e, f.name)} data-testid={`${tid}-upload`} /></label>
          {v && <button type="button" className="adm-btn" onClick={() => change(f.name, '')} data-testid={`${tid}-remove`}>Remove</button>}
        </div>{hint}</div>
    );
    if (f.type === 'pairs') {
      const items = v || [];
      const upd = (i, k, val) => change(f.name, items.map((p, j) => (j === i ? { ...p, [k]: val } : p)));
      return (
        <div key={f.name} className="adm-field"><span className="adm-kpi-label">{f.label}</span>
          <ol className="adm-list" data-testid={tid}>
            {items.map((p, i) => (
              <li key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8 }}>
                <span style={{ display: 'grid', gap: 6 }}>
                  <input className="adm-input" placeholder="Title" aria-label={`Capability ${i + 1} title`} value={p.title || ''} onChange={(e) => upd(i, 'title', e.target.value)} data-testid={`${tid}-title-${i}`} />
                  <textarea className="adm-textarea" rows={2} placeholder="Short description" aria-label={`Capability ${i + 1} description`} value={p.description || ''} onChange={(e) => upd(i, 'description', e.target.value)} data-testid={`${tid}-desc-${i}`} />
                </span>
                <span style={{ display: 'grid', gap: 4, alignContent: 'start' }}>
                  <button type="button" className="adm-icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => { const n = [...items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; change(f.name, n); }}><ArrowUp aria-hidden="true" /></button>
                  <button type="button" className="adm-icon-btn" aria-label={`Remove capability ${i + 1}`} onClick={() => change(f.name, items.filter((_, j) => j !== i))} data-testid={`${tid}-remove-${i}`}><Trash2 aria-hidden="true" /></button>
                </span>
              </li>
            ))}
          </ol>
          <button type="button" className="adm-btn" style={{ width: 'fit-content' }} onClick={() => change(f.name, [...items, { title: '', description: '' }])} data-testid={`${tid}-add`}><Plus aria-hidden="true" />Add capability</button>
        </div>
      );
    }
    return (
      <div key={f.name} className="adm-field">{labelEl}
        <input id={id} className="adm-input" maxLength={f.max} value={v || ''} list={f.type === 'group' ? `${id}-opts` : undefined}
          onChange={(e) => { if (f.type === 'slug') setSlugTouched(true); change(f.name, f.type === 'slug' ? toSlug(e.target.value) : e.target.value); }} data-testid={tid} />
        {f.type === 'group' && <datalist id={`${id}-opts`}>{groups.map((g) => <option key={g} value={g} />)}</datalist>}
        {f.type === 'slug' && publicHref && <small className="adm-sub">Page address: {publicHref}/{v || '…'}{!isNew && v !== initial.slug ? ' — changing it breaks old links.' : ''}</small>}
        {hint}
      </div>
    );
  };

  return (
    <>
      <div className="adm-drawer-back" onClick={onClose} aria-hidden="true" />
      <aside className="adm-drawer adm-drawer--wide" role="dialog" aria-modal="true" aria-labelledby={`${base}-ed-title`} data-testid={`catalog-${base}-drawer`}>
        <header>
          <div style={{ flex: 1 }}><p className="adm-sub" style={{ margin: 0 }}>{isNew ? `New ${label}` : `Edit ${label}`}</p><h2 id={`${base}-ed-title`} className="adm-h1" style={{ fontSize: '1.25rem', margin: '6px 0 0' }}>{get(doc, fields[0].name) || `New ${label}`}</h2></div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close" data-testid={`catalog-${base}-close`}><X aria-hidden="true" /></button>
        </header>
        <form className="body adm-form" onSubmit={save} style={{ display: 'grid', gap: 14 }} noValidate>
          {err && <p role="alert" className="adm-overdue" data-testid={`catalog-${base}-error`}>{err}</p>}
          {fields.map(fieldEl)}
          <div className="adm-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={busy} data-testid={`catalog-${base}-save`}>{busy ? 'Saving…' : isNew ? `Add ${label}` : 'Save changes'}</button>
            {!isNew && !confirmDel && <button type="button" className="adm-btn adm-btn--danger" onClick={() => setConfirmDel(true)} data-testid={`catalog-${base}-delete`}>Delete</button>}
            {confirmDel && (
              <span role="alertdialog" aria-label="Confirm delete" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} data-testid={`catalog-${base}-delete-confirm`}>
                <small>Delete “{get(doc, fields[0].name)}” permanently{publicHref ? ' and remove its page' : ''}?</small>
                <button type="button" className="adm-btn adm-btn--danger" disabled={busy} onClick={remove} data-testid={`catalog-${base}-delete-yes`}>Yes, delete</button>
                <button type="button" className="adm-btn" onClick={() => setConfirmDel(false)} data-testid={`catalog-${base}-delete-no`}>Cancel</button>
              </span>
            )}
          </div>
        </form>
      </aside>
    </>
  );
}
