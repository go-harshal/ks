'use client';

import { useState } from 'react';
import s from './NewsletterForm.module.css';

/**
 * Newsletter sign-up UI with client validation and explicit consent.
 * The subscribe + double opt-in endpoint is delivered in Phase 4c; until then the form says so honestly
 * instead of pretending to subscribe.
 */
export default function NewsletterForm({ tone = 'dark' }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState({ kind: 'idle', msg: '' });

  function onSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState({ kind: 'error', msg: 'Enter a valid email address.' });
    if (!consent) return setState({ kind: 'error', msg: 'Please confirm you agree to receive emails.' });
    setState({ kind: 'info', msg: 'Subscriptions open once email delivery is configured (Phase 4c). Nothing was stored.' });
  }

  return (
    <form className={`${s.form} ${tone === 'light' ? s.light : ''}`} onSubmit={onSubmit} noValidate data-testid="newsletter-form">
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
        <button type="submit" className={s.submit} data-testid="newsletter-submit-button">Subscribe</button>
      </div>
      <label className={s.consent}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="newsletter-consent-checkbox" />
        <span>I agree to receive occasional insights. Unsubscribe any time. See the <a href="/privacy">Privacy Policy</a>.</span>
      </label>
      <p id={`nl-status-${tone}`} role="status" aria-live="polite" className={`${s.status} ${s[state.kind] || ''}`} data-testid="newsletter-status">{state.msg}</p>
    </form>
  );
}
