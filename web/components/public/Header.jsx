'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/shared/Logo';
import { PRIMARY_NAV, PROJECT_CTA, SERVICE_GROUPS } from '@/lib/nav';
import s from './Header.module.css';

export default function Header({ industries = [], serviceGroups = SERVICE_GROUPS }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const megaRef = useRef(null);
  const drawerRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMegaOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  // Close mega menu on outside click / Escape
  useEffect(() => {
    if (!megaOpen) return undefined;
    const onDown = (e) => { if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMegaOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [megaOpen]);

  // Drawer: lock scroll, trap focus, Escape closes
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = drawerRef.current;
    const focusables = () => panel?.querySelectorAll('a, button') || [];
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { setDrawerOpen(false); burgerRef.current?.focus(); }
      if (e.key === 'Tab') {
        const els = focusables();
        const first = els[0]; const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [drawerOpen]);

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className={`${s.header} ${scrolled ? s.scrolled : ''}`} data-testid="site-header">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className={`container ${s.bar}`}>
        <Logo priority className={s.logo} testId="header-logo" />

        <nav aria-label="Primary" className={s.nav}>
          <ul className={s.navList}>
            {PRIMARY_NAV.map((item) =>
              item.mega ? (
                <li key={item.href} ref={megaRef} className={s.megaHost}>
                  <button
                    type="button"
                    className={`${s.navLink} ${isActive(item.href) ? s.active : ''}`}
                    aria-expanded={megaOpen}
                    aria-controls="mega-services"
                    onClick={() => setMegaOpen((v) => !v)}
                    data-testid="nav-services-toggle"
                  >
                    {item.label}
                    <span className={`${s.caret} ${megaOpen ? s.caretOpen : ''}`} aria-hidden="true" />
                  </button>
                  <div id="mega-services" className={`${s.mega} ${megaOpen ? s.megaOpen : ''}`} data-testid="mega-menu">
                    <div className={s.megaInner}>
                      <div className={s.megaIntro}>
                        <p className="overline">Services</p>
                        <p className={s.megaLead}>Service lines across product engineering, design and platform support.</p>
                        <Link href="/services" className="text-link" data-testid="mega-all-services">All services <span aria-hidden="true">→</span></Link>
                      </div>
                      {serviceGroups.map((g) => (
                        <div key={g.title} className={s.megaCol}>
                          <p className={s.megaTitle}>{g.title}</p>
                          <ul>
                            {g.items.map((it) => (
                              <li key={it.slug}>
                                <Link href={`/services/${it.slug}`} className={s.megaLink} data-testid={`mega-link-${it.slug}`}>{it.name}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className={`${s.megaCol} ${s.megaIndustries}`}>
                        <p className={s.megaTitle}>Industries</p>
                        <ul>
                          {industries.slice(0, 6).map((ind) => (
                            <li key={ind.slug}>
                              <Link href={`/industries/${ind.slug}`} className={s.megaLink} data-testid={`mega-industry-${ind.slug}`}>{ind.name}</Link>
                            </li>
                          ))}
                          <li><Link href="/industries" className={s.megaLink} data-testid="mega-all-industries">All industries →</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${s.navLink} ${isActive(item.href) ? s.active : ''}`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>

        <Link href={PROJECT_CTA.href} className={`btn btn--sm ${s.cta}`} data-testid="header-primary-cta">
          {PROJECT_CTA.label}
        </Link>

        <button
          ref={burgerRef}
          type="button"
          className={s.burger}
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setDrawerOpen((v) => !v)}
          data-testid="mobile-menu-toggle"
        >
          <span className={`${s.burgerLines} ${drawerOpen ? s.burgerX : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div
        id="mobile-drawer"
        ref={drawerRef}
        className={`${s.drawer} ${drawerOpen ? s.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!drawerOpen}
        data-testid="mobile-drawer"
      >
        <ul className={s.drawerList}>
          {PRIMARY_NAV.filter((i) => !i.mega).map((item) => (
            <li key={item.href}><Link href={item.href} className={s.drawerLink} data-testid={`drawer-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>{item.label}</Link></li>
          ))}
        </ul>
        <div className={s.drawerServices}>
          <p className="overline">Services</p>
          {serviceGroups.map((g) => (
            <div key={g.title}>
              <p className={s.megaTitle}>{g.title}</p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.slug}><Link href={`/services/${it.slug}`} className={s.drawerSub} data-testid={`drawer-service-${it.slug}`}>{it.name}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href={PROJECT_CTA.href} className="btn" data-testid="drawer-primary-cta">{PROJECT_CTA.label}</Link>
      </div>
    </header>
  );
}
