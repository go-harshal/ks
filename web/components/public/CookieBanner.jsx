'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import s from './CookieBanner.module.css';

export const CONSENT_KEY = 'ks-consent';
export const CONSENT_VERSION = 1;

export function saveConsent(analytics) {
  const value = { v: CONSENT_VERSION, necessary: true, analytics, at: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('ks-consent-change', { detail: value }));
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
      setOpen(!v || v.v !== CONSENT_VERSION);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;
  const choose = (analytics) => { saveConsent(analytics); setOpen(false); };

  return (
    <div className={s.banner} role="region" aria-label="Cookie consent" data-testid="cookie-banner">
      <p className={s.text}>
        We use necessary cookies to run this site. With your permission we also use analytics cookies to understand
        which pages are useful — never to identify you. <Link href="/cookies" className={s.link} data-testid="cookie-policy-link">Cookie preferences</Link>
      </p>
      <div className={s.actions}>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => choose(false)} data-testid="cookie-reject-button">Necessary only</button>
        <button type="button" className="btn btn--sm" onClick={() => choose(true)} data-testid="cookie-accept-button">Accept analytics</button>
      </div>
    </div>
  );
}
