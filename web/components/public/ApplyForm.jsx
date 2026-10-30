'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import s from './EnquiryForm.module.css';

const FIELDS = [
  ['name', 'Full name', 'text', true, 'name'], ['email', 'Email', 'email', true, 'email'],
  ['phone', 'Phone', 'tel', false, 'tel'], ['location', 'Current location', 'text', false, 'address-level2'],
  ['experience', 'Years of experience', 'text', false], ['linkedin', 'LinkedIn profile URL', 'url', false],
  ['portfolio', 'Portfolio or GitHub URL', 'url', false],
];

export default function ApplyForm({ jobId, jobTitle }) {
  const startedAt = useRef(Date.now());
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ kind: 'idle' });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const errs = {};
    if (!fd.get('name')) errs.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(String(fd.get('email') || ''))) errs.email = 'Enter a valid email address';
    const cv = fd.get('cv');
    if (!cv || !cv.size) errs.cv = 'Please attach your CV';
    else if (cv.size > 5 * 1024 * 1024) errs.cv = 'CV must be 5 MB or smaller';
    if (!fd.get('consent')) errs.consent = 'Please accept the Privacy Policy to continue';
    setErrors(errs);
    if (Object.keys(errs).length) { setState({ kind: 'error', msg: 'Please check the highlighted fields.' }); form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    fd.set('consent', 'true'); fd.set('jobId', jobId); fd.set('startedAt', String(startedAt.current));
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/v1/public/applications', { method: 'POST', body: fd });
      const body = await res.json().catch(() => null);
      if (!res.ok) { setErrors(body?.error?.fields || {}); setState({ kind: 'error', msg: body?.error?.message || 'Something went wrong. Please try again.' }); return; }
      setState({ kind: 'done' });
    } catch {
      setState({ kind: 'error', msg: 'Network error. Please check your connection and try again.' });
    }
  }

  if (state.kind === 'done') {
    return (
      <div className={s.done} role="status" data-testid="apply-success">
        <p className="overline">Application received</p>
        <h2>Thank you for applying for {jobTitle}.</h2>
        <p className="lead">We have emailed you a confirmation. Our hiring team reviews every application and will contact you if your profile matches the role.</p>
        <div className={s.actions}><Link href="/careers" className="btn btn--ghost" data-testid="apply-success-careers">See other roles</Link></div>
      </div>
    );
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate data-testid="apply-form">
      <div className={s.hp} aria-hidden="true"><label>Website<input name="website_hp" tabIndex={-1} autoComplete="off" /></label></div>
      {FIELDS.map(([n, l, t, req, ac]) => {
        const id = `apply-${n}`; const err = errors[n];
        return (
          <div key={n} className={s.field}>
            <label htmlFor={id} className={s.label}>{l}{req && <span aria-hidden="true"> *</span>}</label>
            <input id={id} name={n} type={t} required={req} autoComplete={ac} className={s.control} aria-invalid={Boolean(err)} aria-describedby={err ? `${id}-err` : undefined} placeholder={t === 'url' ? 'https://' : undefined} data-testid={`apply-${n}-input`} />
            {err && <p id={`${id}-err`} className={s.err}>{String(err)}</p>}
          </div>
        );
      })}
      <div className={`${s.field} ${s.full}`}>
        <label htmlFor="apply-cover" className={s.label}>Cover letter (optional)</label>
        <textarea id="apply-cover" name="coverLetter" rows={5} maxLength={5000} className={s.control} data-testid="apply-cover-input" />
      </div>
      <div className={`${s.field} ${s.full}`}>
        <label htmlFor="apply-cv" className={s.label}>CV <span aria-hidden="true">*</span></label>
        <input id="apply-cv" name="cv" type="file" required accept=".pdf,.doc,.docx" className={s.file} aria-invalid={Boolean(errors.cv)} aria-describedby="apply-cv-hint" data-testid="apply-cv-input" />
        <p id="apply-cv-hint" className={s.hint}>PDF or Word, up to 5 MB. Stored privately — only our hiring team can access it.</p>
        {errors.cv && <p className={s.err} data-testid="apply-cv-error">{String(errors.cv)}</p>}
      </div>
      <label className={`${s.consent} ${s.full}`}>
        <input type="checkbox" name="consent" aria-invalid={Boolean(errors.consent)} data-testid="apply-consent-checkbox" />
        <span>I agree that Kreyszigg Softbizz may use these details to assess my application, as described in the <Link href="/privacy">Privacy Policy</Link>.</span>
      </label>
      {errors.consent && <p className={`${s.err} ${s.full}`}>{String(errors.consent)}</p>}
      <div className={`${s.full} ${s.submitRow}`}>
        <button type="submit" className="btn" disabled={state.kind === 'sending'} data-testid="apply-submit-button">{state.kind === 'sending' ? 'Sending…' : 'Submit application'} <span className="btn-arrow" aria-hidden="true">→</span></button>
        <p role="alert" className={s.err} data-testid="apply-error">{state.kind === 'error' ? state.msg : ''}</p>
      </div>
    </form>
  );
}
