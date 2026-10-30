'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Inbox, Briefcase, Layers, Users, PenLine, GraduationCap, UserSquare2, Quote,
  Handshake, Mail, BarChart3, ShieldCheck, Settings, Bell, Sun, Moon, Menu,
} from 'lucide-react';

const MODULES = [
  { label: 'Dashboard', href: '/phobos', icon: LayoutDashboard, ready: true },
  { label: 'Lead Management', href: '/phobos/leads', icon: Inbox, ready: true },
  { label: 'Portfolio & Case Studies', icon: Briefcase },
  { label: 'Services Management', icon: Layers },
  { label: 'Developer Categories', icon: Users },
  { label: 'Blog / Insights', icon: PenLine },
  { label: 'Careers & Applications', icon: GraduationCap },
  { label: 'Team & Founder Profiles', icon: UserSquare2 },
  { label: 'Testimonials', icon: Quote },
  { label: 'Partnerships', icon: Handshake },
  { label: 'Newsletter Subscribers', icon: Mail },
  { label: 'Analytics & Reports', icon: BarChart3 },
  { label: 'User & Role Management', icon: ShieldCheck },
  { label: 'Website Settings', icon: Settings },
];

const SAMPLE_NOTIFS = [
  { t: 'New project enquiry — Sample Company C', at: '4 min ago', unread: true },
  { t: 'Lead SMP-1004 assigned to you', at: '38 min ago', unread: true },
  { t: 'Follow-up overdue — Sample Company H', at: '2 h ago', unread: true },
  { t: 'New newsletter subscription confirmed', at: 'Yesterday', unread: false },
];

export default function AdminShell({ title, children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState('light');
  const [sideOpen, setSideOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState(SAMPLE_NOTIFS);
  const bellRef = useRef(null);

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
    localStorage.setItem('ks-admin-theme', next); // per-user server persistence arrives with auth in Phase 4a
  }
  const unread = notifs.filter((n) => n.unread).length;

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
            if (!m.ready) {
              return (
                <span key={m.label} className="adm-nav-item" aria-disabled="true" title="Built in Phase 4" data-testid={`admin-nav-${slug}`}>
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
          <strong>Design preview.</strong> Sample data only — no login, nothing is saved to the server. Authentication, real data and permissions arrive in Phase 4.
        </p>
        <header className="adm-top">
          <button type="button" className="adm-icon-btn adm-burger" aria-label="Open navigation" onClick={() => setSideOpen((v) => !v)} data-testid="admin-sidebar-toggle"><Menu aria-hidden="true" /></button>
          <p className="adm-crumb">Phobos / <b>{title}</b></p>
          <div className="adm-top-actions">
            <div style={{ position: 'relative' }} ref={bellRef}>
              <button type="button" className="adm-icon-btn" aria-label={`Notifications, ${unread} unread`} aria-expanded={bellOpen} onClick={() => setBellOpen((v) => !v)} data-testid="admin-notification-bell">
                <Bell aria-hidden="true" />
                {unread > 0 && <span className="adm-badge-count" data-testid="admin-unread-count">{unread}</span>}
              </button>
              {bellOpen && (
                <div className="adm-popover" role="dialog" aria-label="Notifications" data-testid="admin-notification-panel">
                  <header>
                    Notifications
                    <button type="button" className="adm-btn" style={{ height: 28 }} onClick={() => setNotifs((n) => n.map((x) => ({ ...x, unread: false })))} data-testid="admin-mark-all-read">Mark all read</button>
                  </header>
                  <ul>
                    {notifs.map((n, i) => (
                      <li key={n.t} className={n.unread ? 'unread' : ''}>
                        <button type="button" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setNotifs((arr) => arr.map((x, j) => (j === i ? { ...x, unread: false } : x)))} data-testid={`admin-notification-${i}`}>
                          {n.t}
                        </button>
                        <small>{n.at}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button type="button" className="adm-icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} data-testid="admin-theme-toggle">
              {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
            <div className="adm-user">
              <span className="adm-avatar" aria-hidden="true">SA</span>
              <span>Sample Super Admin<small>Super Admin</small></span>
            </div>
          </div>
        </header>
        <div className="adm-content">{children}</div>
      </div>
    </div>
  );
}
