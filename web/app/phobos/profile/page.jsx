'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { api } from '@/lib/client';

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [setup, setSetup] = useState(null);
  const [codes, setCodes] = useState(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => Promise.all([api('/auth/me'), api('/auth/sessions')]).then(([m, s]) => { setMe(m.data.user); setSessions(s.data); }).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { setMsg(''); try { const r = await fn(); setMsg(ok); await load(); return r; } catch (e) { setMsg(e.message); return null; } };
  const form = (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); e.currentTarget.reset(); return f; };

  return (
    <AdminShell title="My profile">
      <h1 className="adm-h1">My profile</h1>
      <p role="status" className="adm-sub" data-testid="profile-message">{msg}</p>
      <div className="adm-grid">
        <section className="adm-w span-6" aria-label="Change password"><div className="adm-w-head"><h2 className="adm-w-title">Change password</h2></div>
          <form className="adm-w-body" style={{ display: 'grid', gap: 10 }} onSubmit={(e) => { const f = form(e); run(() => api('/auth/password/change', { method: 'POST', body: f }), 'Password changed. Other sessions were signed out.'); }}>
            <input name="current" type="password" className="adm-input" placeholder="Current password" aria-label="Current password" autoComplete="current-password" required data-testid="profile-current-password" />
            <input name="next" type="password" className="adm-input" placeholder="New password (12+ chars, mixed, number, symbol)" aria-label="New password" autoComplete="new-password" required data-testid="profile-new-password" />
            <button type="submit" className="adm-btn adm-btn--primary" style={{ width: 'fit-content' }} data-testid="profile-change-password-button">Update password</button>
          </form></section>
        <section className="adm-w span-6" aria-label="Two-factor authentication"><div className="adm-w-head"><h2 className="adm-w-title">Two-factor authentication</h2></div>
          <div className="adm-w-body" style={{ display: 'grid', gap: 10 }}>
            {me?.twoFactorEnabled ? (
              <form style={{ display: 'grid', gap: 10 }} onSubmit={(e) => { const f = form(e); run(() => api('/auth/2fa/disable', { method: 'POST', body: f }), 'Two-factor authentication disabled.'); }}>
                <p className="adm-sub">Enabled. Enter your password to turn it off.</p>
                <input name="password" type="password" className="adm-input" aria-label="Password" required data-testid="profile-2fa-disable-password" />
                <button type="submit" className="adm-btn" style={{ width: 'fit-content' }} data-testid="profile-2fa-disable-button">Disable 2FA</button>
              </form>
            ) : setup ? (
              <form style={{ display: 'grid', gap: 10 }} onSubmit={async (e) => { const f = form(e); const r = await run(() => api('/auth/2fa/enable', { method: 'POST', body: f }), 'Two-factor authentication enabled.'); if (r) { setCodes(r.data.recoveryCodes); setSetup(null); } }}>
                <p className="adm-sub">Add this key to your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…), then enter the 6-digit code.</p>
                <code style={{ wordBreak: 'break-all', padding: 10, background: 'var(--a-surface-2)' }} data-testid="profile-2fa-secret">{setup.secret}</code>
                <input name="code" inputMode="numeric" className="adm-input" placeholder="6-digit code" aria-label="Code" required data-testid="profile-2fa-code" />
                <button type="submit" className="adm-btn adm-btn--primary" style={{ width: 'fit-content' }} data-testid="profile-2fa-enable-button">Verify and enable</button>
              </form>
            ) : <button type="button" className="adm-btn" style={{ width: 'fit-content' }} onClick={async () => { const r = await run(() => api('/auth/2fa/setup', { method: 'POST' }), ''); if (r) setSetup(r.data); }} data-testid="profile-2fa-setup-button">Set up 2FA</button>}
            {codes && <div data-testid="profile-recovery-codes"><p className="adm-sub">Save these one-time recovery codes now — they will not be shown again:</p><code>{codes.join('  ')}</code></div>}
          </div></section>
        <section className="adm-w span-12" aria-label="Active sessions"><div className="adm-w-head"><h2 className="adm-w-title">Active sessions</h2></div>
          <div className="adm-w-body"><ul className="adm-list" data-testid="profile-sessions">{sessions.map((s) => (
            <li key={s.id}><span className="grow"><b>{s.userAgent || 'Unknown device'}</b><small>{s.ip} · last active {new Date(s.lastSeenAt).toLocaleString('en-GB')}{s.current ? ' · this device' : ''}</small></span>
              {!s.current && <button type="button" className="adm-btn" onClick={() => run(() => api(`/auth/sessions/${s.id}`, { method: 'DELETE' }), 'Session signed out.')} data-testid={`profile-revoke-session-${s.id}`}>Sign out</button>}</li>))}</ul></div></section>
      </div>
    </AdminShell>
  );
}
