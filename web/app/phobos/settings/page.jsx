'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { api } from '@/lib/client';

const fmt = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export default function SettingsPage() {
  const [email, setEmail] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api('/admin/system/email').then((r) => setEmail(r.data)).catch((e) => setMsg(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function sendTest() {
    setBusy(true); setMsg('');
    try {
      const r = await api('/admin/system/email/test', { method: 'POST' });
      setMsg(`Test email queued to ${r.data.to}.`);
      setTimeout(load, 2500);
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  return (
    <AdminShell title="Website Settings">
      <div className="adm-page-head"><div><h1 className="adm-h1">Website settings</h1><p className="adm-sub">Email delivery status. Other settings arrive in a later phase.</p></div></div>
      <p role="status" className="adm-sub" data-testid="settings-message">{msg}</p>
      <section className="adm-w" aria-label="Email delivery">
        <div className="adm-w-head">
          <h2 className="adm-w-title">Email delivery</h2>
          <button type="button" className="adm-btn adm-btn--primary" onClick={sendTest} disabled={busy || !email} data-testid="settings-send-test-email">Send me a test email</button>
        </div>
        {email && (
          <div className="adm-w-body" style={{ display: 'grid', gap: 12 }}>
            <p data-testid="settings-email-status">
              <span className={`adm-pill ${email.ok ? 'ok' : 'warn'}`}>{email.driver === 'smtp' ? (email.ok ? 'Connected' : 'Connection problem') : 'Not configured (MOCKED)'}</span>{' '}
              <span className="adm-sub">{email.message}</span>
            </p>
            <dl className="adm-dl">
              <dt>Sends from</dt><dd data-testid="settings-email-from">{email.from}</dd>
              <dt>Enquiry alerts go to</dt><dd data-testid="settings-email-alert-to">{email.alertTo}</dd>
              <dt>Totals</dt><dd data-testid="settings-email-counts">{Object.entries(email.counts).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'No emails yet'}</dd>
            </dl>
            <div className="adm-table-wrap"><table className="adm-table" data-testid="settings-email-recent">
              <thead><tr><th>Email</th><th>To</th><th>Status</th><th>Attempts</th><th>Queued</th></tr></thead>
              <tbody>{email.recent.map((r) => (
                <tr key={r.id} style={{ cursor: 'default' }}>
                  <td><b>{r.subject}</b><small>{r.event}</small></td><td>{r.to}</td>
                  <td>{r.status}{r.lastError && <small title={r.lastError}>{r.lastError.slice(0, 80)}</small>}</td>
                  <td>{r.attempts}</td><td><small>{fmt(r.createdAt)}</small></td>
                </tr>))}</tbody>
            </table></div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
