'use client';

import { useEffect, useState } from 'react';
import { CONSENT_KEY, saveConsent } from './CookieBanner';
import s from './sections/Page.module.css';

export default function CookiePreferences() {
  const [analytics, setAnalytics] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => {
    try { setAnalytics(!!JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')?.analytics); } catch { /* no saved choice */ }
  }, []);
  function save() {
    saveConsent(analytics);
    setStatus(`Saved. Analytics cookies are ${analytics ? 'allowed' : 'off'}.`);
  }
  return (
    <div className={s.prefs} data-testid="cookie-preferences">
      <div className={s.pref}>
        <div><b>Necessary</b><p>Required for the site to work. Always on.</p></div>
        <input type="checkbox" checked disabled aria-label="Necessary cookies (always on)" data-testid="cookie-pref-necessary" />
      </div>
      <div className={s.pref}>
        <div><label htmlFor="pref-analytics"><b>Analytics</b></label><p>Aggregate page and form-submission measurement. No personal details.</p></div>
        <input id="pref-analytics" type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} data-testid="cookie-pref-analytics" />
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={save} data-testid="cookie-pref-save">Save preferences</button>
        <p className={s.status} role="status" data-testid="cookie-pref-status">{status}</p>
      </div>
    </div>
  );
}
