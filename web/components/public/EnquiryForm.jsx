'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';
import s from './EnquiryForm.module.css';

const TABS = [
  { key: 'project', label: 'Start a project' },
  { key: 'hiring', label: 'Hire developers' },
  { key: 'partnership', label: 'Partnership' },
  { key: 'contact', label: 'General enquiry' },
];
const SERVICE_OPTS = ['Mobile App Development', 'Web Application Development', 'Custom Software Development', 'SaaS Product Development', 'Website Design & Development', 'UI/UX Design', 'E-commerce Development', 'Cloud Solutions & DevOps', 'API Development & Integration', 'Software Maintenance & Support', 'IT Consulting'];
const FIELDS = {
  project: [
    ['name', 'Your name', 'text', true], ['email', 'Business email', 'email', true], ['company', 'Company', 'text'],
    ['projectType', 'Project type', 'select', true, ['New product', 'Redesign or rebuild', 'Add features to existing software', 'Integration', 'Not sure yet']],
    ['services', 'Service', 'select', false, SERVICE_OPTS],
    ['description', 'Describe your project', 'textarea', true],
    ['budget', 'Budget (optional)', 'select', false, ['Under ₹5 lakh / $6k', '₹5–15 lakh / $6–18k', '₹15–40 lakh / $18–50k', 'Above ₹40 lakh / $50k', 'Prefer to discuss']],
    ['timeline', 'Timeline', 'select', false, ['As soon as possible', '1–3 months', '3–6 months', 'Flexible']],
  ],
  hiring: [
    ['name', 'Your name', 'text', true], ['email', 'Email', 'email', true], ['company', 'Company', 'text'],
    ['role', 'Role or technology', 'text', true], ['developers', 'Number of developers', 'number', true],
    ['experience', 'Experience level', 'select', true, ['Junior (0–2 years)', 'Mid-level (2–5 years)', 'Senior (5–8 years)', 'Lead / Architect (8+ years)']],
    ['engagement', 'Engagement model', 'select', true, ['Monthly Dedicated Developer', 'Dedicated Development Team', 'Hourly Hiring', 'Part-time Developer', 'Fixed-price Project Development', 'Contract-to-Hire']],
    ['duration', 'Duration', 'select', false, ['Under 3 months', '3–6 months', '6–12 months', '12+ months']],
    ['requirements', 'Additional requirements', 'textarea'],
  ],
  partnership: [
    ['name', 'Your name', 'text', true], ['company', 'Company', 'text', true], ['email', 'Email', 'email', true], ['website', 'Website', 'url'],
    ['partnershipType', 'Partnership type', 'select', true, ['White-label development', 'Agency partnership', 'Technology partnership', 'Referral partnership', 'Other']],
    ['services', 'Services of interest', 'text'], ['requirements', 'Collaboration requirements', 'textarea', true],
  ],
  contact: [['name', 'Your name', 'text', true], ['email', 'Email', 'email', true], ['company', 'Company', 'text'], ['subject', 'Subject', 'text', true], ['message', 'Message', 'textarea', true]],
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`).replace(/[^\w-]/g, '');

export default function EnquiryForm() {
  const params = useSearchParams();
  const initial = TABS.some((t) => t.key === params.get('type')) ? params.get('type') : 'project';
  const [type, setType] = useState(initial);
  const [state, setState] = useState({ kind: 'idle' });
  const [errors, setErrors] = useState({});
  const started = useRef(Date.now());
  const key = useRef(uid());
  const formRef = useRef(null);
  const serviceParam = params.get('service');

  useEffect(() => { setErrors({}); setState({ kind: 'idle' }); started.current = Date.now(); key.current = uid(); }, [type]);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs = {};
    FIELDS[type].forEach(([n, l, t, req]) => { const v = String(fd.get(n) || '').trim(); if (req && !v) errs[n] = `${l.replace(' (optional)', '')} is required.`; if (t === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errs[n] = 'Enter a valid email address.'; });
    const file = fd.get('attachment');
    if (file && file.size > 10 * 1024 * 1024) errs.attachment = 'Attachment must be 10 MB or smaller.';
    if (!fd.get('consent')) errs.consent = 'Please accept the Privacy Policy to continue.';
    setErrors(errs);
    if (Object.keys(errs).length) { formRef.current?.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus(); return; }
    if (file && !file.size) fd.delete('attachment');
    fd.set('type', type); fd.set('consent', 'true'); fd.set('startedAt', String(started.current)); fd.set('idempotencyKey', key.current);
    fd.set('page', window.location.pathname + window.location.search); fd.set('referrer', document.referrer || ''); fd.set('context', serviceParam || ''); fd.set('landing', sessionStorage.getItem('ks-landing') || '');
    const utm = new URLSearchParams(window.location.search); ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => utm.get(k) && fd.set(k, utm.get(k)));
    setState({ kind: 'sending' });
    try {
      await api('/public/enquiries', { method: 'POST', form: fd });
      setState({ kind: 'done' });
      window.dispatchEvent(new CustomEvent('ks-conversion', { detail: { form: type } })); // analytics hook (no PII)
    } catch (err) {
      setErrors(err.body?.error?.fields || {});
      setState({ kind: 'error', msg: err.message });
    }
  }

  if (state.kind === 'done') {
    return (
      <div className={s.done} role="status" data-testid="enquiry-success">
        <p className="overline">Received</p>
        <h2>Thank you — your enquiry has reached our team.</h2>
        <p className="lead">We review every enquiry personally and will reply to the email you provided with next steps.</p>
        <div className={s.actions}><Link href="/" className="btn btn--ghost" data-testid="enquiry-success-home">Back to home</Link>
          <button type="button" className="btn" onClick={() => setType((t) => { setState({ kind: 'idle' }); return t; })} data-testid="enquiry-send-another">Send another enquiry</button></div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.tabs} role="tablist" aria-label="Enquiry type">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={type === t.key} className={s.tab} onClick={() => setType(t.key)} data-testid={`enquiry-tab-${t.key}`}>{t.label}</button>
        ))}
      </div>
      <form ref={formRef} className={s.form} onSubmit={onSubmit} noValidate data-testid={`enquiry-form-${type}`} key={type}>
        <div className={s.hp} aria-hidden="true"><label>Website<input name="website_hp" tabIndex={-1} autoComplete="off" /></label></div>
        {FIELDS[type].map(([n, l, t, req, opts]) => {
          const id = `f-${type}-${n}`; const err = errors[n];
          const common = { id, name: n, 'aria-invalid': Boolean(err), 'aria-describedby': err ? `${id}-err` : undefined, 'data-testid': `enquiry-${n}-input`, className: s.control, required: req };
          return (
            <div key={n} className={`${s.field} ${t === 'textarea' ? s.full : ''}`}>
              <label htmlFor={id} className={s.label}>{l}{req && <span aria-hidden="true"> *</span>}</label>
              {t === 'textarea' ? <textarea {...common} rows={5} />
                : t === 'select' ? (
                  <select {...common} defaultValue={n === 'services' && serviceParam ? SERVICE_OPTS.find((o) => o.toLowerCase().replace(/[^a-z]+/g, '-').startsWith(serviceParam.split('-')[0])) || '' : ''}>
                    <option value="">{req ? 'Select…' : 'Optional'}</option>{opts.map((o) => <option key={o}>{o}</option>)}
                  </select>)
                : <input {...common} type={t} min={t === 'number' ? 1 : undefined} max={t === 'number' ? 100 : undefined} autoComplete={n === 'email' ? 'email' : n === 'name' ? 'name' : n === 'company' ? 'organization' : undefined} />}
              {err && <p id={`${id}-err`} className={s.err}>{String(err)}</p>}
            </div>
          );
        })}
        {type === 'project' && (
          <div className={`${s.field} ${s.full}`}>
            <label htmlFor="f-attachment" className={s.label}>Attachment (optional)</label>
            <input id="f-attachment" name="attachment" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip" className={s.file} data-testid="enquiry-attachment-input" aria-describedby="f-attachment-hint" />
            <p id="f-attachment-hint" className={s.hint}>PDF, Word, Excel, PowerPoint, PNG, JPG or ZIP, up to 10 MB. Stored privately — only our team can access it.</p>
            {errors.attachment && <p className={s.err}>{String(errors.attachment)}</p>}
          </div>
        )}
        <label className={`${s.consent} ${s.full}`}>
          <input type="checkbox" name="consent" data-testid="enquiry-consent-checkbox" aria-invalid={Boolean(errors.consent)} />
          <span>I agree that Kreyszigg Softbizz may use these details to respond to my enquiry, as described in the <Link href="/privacy">Privacy Policy</Link>.</span>
        </label>
        {errors.consent && <p className={`${s.err} ${s.full}`}>{String(errors.consent)}</p>}
        <div className={`${s.full} ${s.submitRow}`}>
          <button type="submit" className="btn" disabled={state.kind === 'sending'} data-testid="enquiry-submit-button">{state.kind === 'sending' ? 'Sending…' : 'Send enquiry'} <span className="btn-arrow" aria-hidden="true">→</span></button>
          <p role="alert" className={s.err} data-testid="enquiry-error">{state.kind === 'error' ? state.msg : ''}</p>
        </div>
      </form>
    </div>
  );
}
