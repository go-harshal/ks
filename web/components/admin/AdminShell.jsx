'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Inbox, Briefcase, Layers, Users, PenLine, GraduationCap, UserSquare2, Quote,
  Handshake, Mail, BarChart3, ShieldCheck, Settings, Bell, Sun, Moon, Menu, Volume2, VolumeX, X,
} from 'lucide-react';
import { api } from '@/lib/client';
import { useNotifications, timeAgo } from './useNotifications';

const MODULES = [
  { label: 'Dashboard', href: '/phobos', icon: LayoutDashboard, ready: true },
  { label: 'Lead Management', href: '/phobos/leads', icon: Inbox, ready: true },
  { label: 'Portfolio & Case Studies', href: '/phobos/case-studies', icon: Briefcase, ready: true, perm: ['content.manage', 'content.draft'] },
  { label: 'Services Management', icon: Layers },
  { label: 'Developer Categories', icon: Users },
  { label: 'Blog / Insights', href: '/phobos/insights', icon: PenLine, ready: true, perm: ['content.manage', 'content.draft'] },
  { label: 'Careers & Applications', href: '/phobos/careers', icon: GraduationCap, ready: true, perm: ['content.manage', 'content.draft', 'applications.manage'] },
  { label: 'Team & Founder Profiles', href: '/phobos/team', icon: UserSquare2, ready: true, perm: ['content.manage', 'content.draft'] },
  { label: 'Testimonials', icon: Quote },
  { label: 'Partnerships', icon: Handshake },
  { label: 'Newsletter Subscribers', icon: Mail },
  { label: 'Analytics & Reports', icon: BarChart3 },
  { label: 'User & Role Management', href: '/phobos/users', icon: ShieldCheck, ready: true, perm: 'users.manage' },
  { label: 'Website Settings', href: '/phobos/settings', icon: Settings, ready: true, perm: 'settings.manage' },
];

export default function AdminShell({ title, children }) {
  const pathname = usePathname();
  const [me, setMe] = useState(null);
  useEffect(() => {
    let timer;
    api('/auth/me').then((r) => {
      setMe(r.data.user);
      const idle = r.data.idleMinutes * 60e3;
      const reset = () => { clearTimeout(timer); timer = setTimeout(() => signOut('idle'), idle); };
      ['mousemove', 'keydown', 'click', 'scroll'].forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
      reset();
    }).catch(() => {});
    return () => clearTimeout(timer);
  }, []);
  async function signOut(reason) {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* already signed out */ }
    window.location.href = `/phobos/login${reason === 'idle' ? '?next=/phobos' : ''}`;
  }
  const has = (p) => !!me && (me.permissions.includes('*') || [].concat(p).some((x) => me.permissions.includes(x)));

  const [theme, setTheme] = useState('light');
  const [sideOpen, setSideOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const nt = useNotifications(!!me);

  useEffect(() => { setTheme(document.documentElement.getAttribute('data-admin-theme') || 'light'); }, []);
  useEffect(() => {
    if (!bellOpen) return undefined;
    const close = (e) => { if (!bellRef.current?.contains(e.target)) setBellOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setBellOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [bellOpen]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-admin-theme', next);
    localStorage.setItem('ks-admin-theme', next);
  }
  if (!me) return <div className="adm" style={{ gridTemplateColumns: '1fr', placeItems: 'center' }} data-testid="admin-auth-loading"><p className="adm-sub">Checking your session…</p></div>;

  return (
    <div className="adm" data-testid="admin-shell">
      <aside className={`adm-side ${sideOpen ? 'open' : ''}`} aria-label="Admin navigation" data-testid="admin-sidebar">
        <div className="adm-brand">
          <span className="adm-brand-mark"><img src="/brand/logo-mark.png" alt="" width="26" height="26" /></span>
          <span><span className="adm-brand-name">Kreyszigg</span><span className="adm-brand-sub">Phobos admin</span></span>
        </div>
        <nav className="adm-nav">
          <p className="adm-nav-label">Modules</p>
          {MODULES.map((m) => {
            const Icon = m.icon;
            const slug = m.label.toLowerCase().replace(/[^a-z]+/g, '-');
            if (m.perm && !has(m.perm)) return null;
            if (!m.ready) {
              return (
                <span key={m.label} className="adm-nav-item" aria-disabled="true" title="Built in a later phase" data-testid={`admin-nav-${slug}`}>
                  <Icon aria-hidden="true" />{m.label}<span className="adm-soon">Phase 4</span>
                </span>
              );
            }
            const active = m.href === '/phobos' ? pathname === '/phobos' : pathname.startsWith(m.href);
            return (
              <Link key={m.label} href={m.href} className="adm-nav-item" aria-current={active ? 'page' : undefined} data-testid={`admin-nav-${slug}`} onClick={() => setSideOpen(false)}>
                <Icon aria-hidden="true" />{m.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="adm-main">
        <p className="adm-preview" role="note" data-testid="admin-preview-banner">
          <strong>In progress.</strong> Dashboard, leads, case studies, insights, team profiles, careers, users and notifications use real data. Other modules arrive in later phases.
        </p>
        <header className="adm-top">
          <button type="button" className="adm-icon-btn adm-burger" aria-label="Open navigation" onClick={() => setSideOpen((v) => !v)} data-testid="admin-sidebar-toggle"><Menu aria-hidden="true" /></button>
          <p className="adm-crumb">Phobos / <b>{title}</b></p>
          <div className="adm-top-actions">
            <span className={`adm-live ${nt.live ? 'on' : ''}`} title={nt.live ? 'Live alerts connected' : 'Reconnecting live alerts…'} data-testid="admin-live-indicator">
              <span aria-hidden="true" />{nt.live ? 'Live' : 'Offline'}
            </span>
            <div style={{ position: 'relative' }} ref={bellRef}>
              <button type="button" className="adm-icon-btn" aria-label={`Notifications, ${nt.unread} unread`} aria-expanded={bellOpen} onClick={() => setBellOpen((v) => !v)} data-testid="admin-notification-bell">
                <Bell aria-hidden="true" />
                {nt.unread > 0 && <span className="adm-badge-count" data-testid="admin-unread-count">{nt.unread > 99 ? '99+' : nt.unread}</span>}
              </button>
              {bellOpen && (
                <div className="adm-popover" role="dialog" aria-label="Notifications" data-testid="admin-notification-panel">
                  <header>
                    Notifications
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="adm-icon-btn" style={{ width: 28, height: 28 }} onClick={nt.toggleSound} aria-label={nt.sound ? 'Mute alert sound' : 'Turn on alert sound'} aria-pressed={nt.sound} data-testid="admin-alert-sound-toggle">
                        {nt.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
                      </button>
                      <button type="button" className="adm-btn" style={{ height: 28 }} onClick={nt.markAll} disabled={!nt.unread} data-testid="admin-mark-all-read">Mark all read</button>
                    </span>
                  </header>
                  {nt.desktop === 'default' && (
                    <button type="button" className="adm-desktop-cta" onClick={nt.enableDesktop} data-testid="admin-enable-desktop-alerts">Turn on desktop alerts for when Phobos is in the background</button>
                  )}
                  {nt.desktop === 'denied' && <p className="adm-desktop-note" data-testid="admin-desktop-denied">Desktop alerts are blocked in this browser’s site settings.</p>}
                  <ul data-testid="admin-notification-list">
                    {nt.items.length === 0 && <li><span className="adm-sub">No notifications yet.</span></li>}
                    {nt.items.map((n) => (
                      <li key={n.id} className={n.unread ? 'unread' : ''}>
                        <Link href={n.link || '/phobos/leads'} style={{ color: 'inherit' }} onClick={() => { nt.markRead(n.id); setBellOpen(false); }} data-testid={`admin-notification-${n.id}`}>
                          {n.title}
                        </Link>
                        <small>{timeAgo(n.createdAt)}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button type="button" className="adm-icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} data-testid="admin-theme-toggle">
              {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
            <Link href="/phobos/profile" className="adm-user" data-testid="admin-profile-link">
              <span className="adm-avatar" aria-hidden="true">{me.name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}</span>
              <span>{me.name}<small>{me.role.replace('_', ' ')}</small></span>
            </Link>
            <button type="button" className="adm-btn" onClick={() => signOut()} data-testid="admin-logout-button">Sign out</button>
          </div>
        </header>
        <div className="adm-content">{children}</div>
      </div>

      <div className="adm-toasts" aria-live="polite" aria-atomic="false" data-testid="admin-toast-region">
        {nt.toasts.map((t) => (
          <div key={t.id} className="adm-toast" role="status" data-testid="admin-lead-toast">
            <span className="adm-toast-dot" aria-hidden="true" />
            <div className="adm-toast-body">
              <b>{t.title}</b>
              {t.body && <small>{t.body}</small>}
              <Link href={t.link || '/phobos/leads'} onClick={() => { nt.markRead(t.id); nt.dismiss(t.id); }} data-testid="admin-lead-toast-open">Open lead →</Link>
            </div>
            <button type="button" className="adm-toast-close" aria-label="Dismiss alert" onClick={() => nt.dismiss(t.id)} data-testid="admin-lead-toast-dismiss"><X aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
