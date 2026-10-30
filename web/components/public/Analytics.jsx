'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { CONSENT_KEY } from './CookieBanner';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const hasConsent = () => { try { return !!JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')?.analytics; } catch { return false; } };
const sid = () => { let v = sessionStorage.getItem('ks-sid'); if (!v) { v = crypto.randomUUID(); sessionStorage.setItem('ks-sid', v); } return v; };

function loadGa() {
  if (!GA_ID || window.__ksGa) return window.__ksGa;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
  window.gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  window.__ksGa = new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.async = true;
    sc.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    sc.onload = () => { window.gtag('js', new Date()); window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true }); resolve(); };
    sc.onerror = reject;
    document.head.appendChild(sc);
  });
  return window.__ksGa;
}

/** Consent-gated page views: built-in first-party counter, plus Google Analytics 4 when NEXT_PUBLIC_GA_ID is set.
 *  Sends only path, referrer host, UTM source and a random per-tab id. Never form values. /phobos is excluded. */
function Tracker() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [consent, setConsent] = useState(false);
  const last = useRef('');

  useEffect(() => {
    setConsent(hasConsent());
    const onChange = (e) => {
      const ok = !!e.detail?.analytics;
      setConsent(ok);
      if (!ok && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    };
    window.addEventListener('ks-consent-change', onChange);
    return () => window.removeEventListener('ks-consent-change', onChange);
  }, []);

  useEffect(() => {
    if (!consent || pathname.startsWith('/phobos') || last.current === pathname) return;
    last.current = pathname;
    const landing = !sessionStorage.getItem('ks-landing');
    if (landing) sessionStorage.setItem('ks-landing', pathname);
    const body = JSON.stringify({ consent: true, path: pathname, landing, sid: sid(), referrer: landing ? document.referrer : '', utm: landing ? params.get('utm_source') || '' : '' });
    if (!navigator.sendBeacon?.('/api/v1/public/analytics/pageview', new Blob([body], { type: 'application/json' }))) {
      fetch('/api/v1/public/analytics/pageview', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
    if (GA_ID) {
      Promise.resolve(loadGa()).then(() => {
        window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
        window.gtag('event', 'page_view', { page_path: pathname, page_location: `${window.location.origin}${pathname}`, page_title: document.title });
      }).catch(() => {});
    }
  }, [consent, pathname, params]);

  return null;
}

export default function Analytics() {
  return <Suspense fallback={null}><Tracker /></Suspense>;
}
