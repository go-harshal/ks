'use client';

import { useState } from 'react';
import s from './NewsletterForm.module.css';

/**
 * Newsletter sign-up UI with client validation and explicit consent.
 * Single opt-in (business decision): the address is added immediately; every newsletter has one-click unsubscribe.
 */
export default function NewsletterForm({ tone = 'dark' }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState({ kind: 'idle', msg: '' });

  async function onSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState({ kind: 'error', msg: 'Enter a valid email address.' });
    if (!consent) return setState({ kind: 'error', msg: 'Please confirm you agree to receive emails.' });
    setState({ kind: 'sending', msg: 'Subscribing…' });
    try {
      const res = await fetch('/api/v1/public/newsletter/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, consent: true, page: window.location.pathname, website_hp: e.currentTarget.website_hp?.value || '' }) });
      const body = await res.json().catch(() => null);
      if (!res.ok) return setState({ kind: 'error', msg: body?.error?.message || 'Something went wrong. Please try again.' });
      setEmail(''); setConsent(false);
      return setState({ kind: 'ok', msg: 'You are subscribed. Every email includes a one-click unsubscribe link.' });
    } catch {
      return setState({ kind: 'error', msg: 'Network error. Please try again.' });
    }
  }

  return (
    <form className={`${s.form} ${tone === 'light' ? s.light : ''}`} onSubmit={onSubmit} noValidate data-testid="newsletter-form">
      <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />
      <div className={s.row}>
        <label htmlFor={`nl-email-${tone}`} className="visually-hidden">Email address</label>
        <input
          id={`nl-email-${tone}`}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={s.input}
          aria-describedby={`nl-status-${tone}`}
          data-testid="newsletter-email-input"
        />
        <button type="submit" className={s.submit} data-testid="newsletter-submit-button" disabled={state.kind === 'sending'}>Subscribe</button>
      </div>
      <label className={s.consent}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="newsletter-consent-checkbox" />
        <span>I agree to receive occasional insights. Unsubscribe any time. See the <a href="/privacy">Privacy Policy</a>.</span>
      </label>
      <p id={`nl-status-${tone}`} role="status" aria-live="polite" className={`${s.status} ${s[state.kind] || ''}`} data-testid="newsletter-status">{state.msg}</p>
    </form>
  );
}
