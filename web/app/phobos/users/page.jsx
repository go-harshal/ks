'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { api } from '@/lib/client';

const ROLES = { super_admin: 'Super Admin', admin: 'Admin / Manager', team_member: 'Team Member' };
const fmt = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => Promise.all([api('/admin/users'), api('/admin/invitations')]).then(([u, i]) => { setUsers(u.data); setInvites(i.data); }).catch((e) => setMsg(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const act = async (fn, ok, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setMsg('');
    try { await fn(); setMsg(ok); await load(); } catch (e) { setMsg(e.message); }
  };

  async function invite(e) {
    e.preventDefault();
    const form = e.currentTarget; const f = Object.fromEntries(new FormData(form));
    await act(() => api('/admin/invitations', { method: 'POST', body: f }), `Invitation sent to ${f.email}.`);
    form.reset();
  }

  return (
    <AdminShell title="User & Role Management">
      <div className="adm-page-head"><div><h1 className="adm-h1">Users & roles</h1><p className="adm-sub">Invitation-only access. No public registration.</p></div></div>
      <p role="status" className="adm-sub" data-testid="users-message">{msg}</p>
      <section className="adm-w" aria-label="Invite a user">
        <div className="adm-w-head"><h2 className="adm-w-title">Invite a user</h2></div>
        <form className="adm-filters" onSubmit={invite} data-testid="invite-form">
          <input name="name" className="adm-input" placeholder="Full name" required aria-label="Full name" data-testid="invite-name-input" />
          <input name="email" type="email" className="adm-input" placeholder="Email" required aria-label="Email" data-testid="invite-email-input" />
          <select name="role" className="adm-select" aria-label="Role" defaultValue="team_member" data-testid="invite-role-select">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <button type="submit" className="adm-btn adm-btn--primary" data-testid="invite-submit-button">Send invitation</button>
        </form>
      </section>
      <section className="adm-w" aria-label="Users">
        <div className="adm-table-wrap"><table className="adm-table" data-testid="users-table">
          <thead><tr><th>User</th><th>Role</th><th>Status</th><th>2FA</th><th>Last sign-in</th><th>Actions</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} style={{ cursor: 'default' }} data-testid={`user-row-${u.email}`}>
              <td><b>{u.name}</b><small>{u.email}</small></td>
              <td><select className="adm-select" value={u.role} onChange={(e) => act(() => api(`/admin/users/${u.id}`, { method: 'PATCH', body: { role: e.target.value } }), 'Role updated; their sessions were signed out.', `Change ${u.name}'s role?`)} aria-label={`Role for ${u.name}`} data-testid={`user-role-${u.email}`}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
              <td>{u.status}</td><td>{u.twoFactorEnabled ? 'On' : 'Off'}</td><td><small>{fmt(u.lastLoginAt)}</small></td>
              <td>{u.status === 'active'
                ? <button type="button" className="adm-btn" onClick={() => act(() => api(`/admin/users/${u.id}/deactivate`, { method: 'POST' }), 'User deactivated and signed out.', `Deactivate ${u.name}? They will be signed out immediately.`)} data-testid={`user-deactivate-${u.email}`}>Deactivate</button>
                : <button type="button" className="adm-btn" onClick={() => act(() => api(`/admin/users/${u.id}/reactivate`, { method: 'POST' }), 'User reactivated.')} data-testid={`user-reactivate-${u.email}`}>Reactivate</button>}</td>
            </tr>))}</tbody>
        </table></div>
      </section>
      <section className="adm-w" aria-label="Invitations">
        <div className="adm-w-head"><h2 className="adm-w-title">Invitations</h2></div>
        <div className="adm-table-wrap"><table className="adm-table" data-testid="invitations-table">
          <thead><tr><th>Invitee</th><th>Role</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
          <tbody>{invites.map((i) => (
            <tr key={i.id} style={{ cursor: 'default' }}>
              <td><b>{i.name}</b><small>{i.email}</small></td><td>{ROLES[i.role]}</td><td>{i.status}</td><td><small>{fmt(i.expiresAt)}</small></td>
              <td style={{ display: 'flex', gap: 6 }}>{i.status !== 'accepted' && <>
                <button type="button" className="adm-btn" onClick={() => act(() => api(`/admin/invitations/${i.id}/resend`, { method: 'POST' }), 'Invitation re-sent with a new link.')} data-testid={`invite-resend-${i.email}`}>Resend</button>
                {i.status === 'pending' && <button type="button" className="adm-btn" onClick={() => act(() => api(`/admin/invitations/${i.id}/revoke`, { method: 'POST' }), 'Invitation revoked.', 'Revoke this invitation?')} data-testid={`invite-revoke-${i.email}`}>Revoke</button>}</>}</td>
            </tr>))}</tbody>
        </table></div>
      </section>
    </AdminShell>
  );
}
