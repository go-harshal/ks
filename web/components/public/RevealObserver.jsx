'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Adds `.js` to <html> and reveals `.reveal` elements as they enter the viewport. */
export default function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.classList.add('js');
    const els = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-visible')); return undefined; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
