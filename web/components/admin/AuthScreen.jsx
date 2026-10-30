'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/client';

/** Shared screen for /phobos/login, /phobos/forgot, /phobos/invite/[token], /phobos/reset/[token]. */
function Inner({ mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { token } = useParams() || {};
  const [step, setStep] = useState('form');
  const [challenge, setChallenge] = useState('');
  const [invite, setInvite] = useState(null);
  const [msg, setMsg] = useState({ kind: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === 'invite') api(`/auth/invitations/${token}`).then((r) => setInvite(r.data)).catch((e) => setMsg({ kind: 'err', text: e.message }));
  }, [mode, token]);

  const go = () => router.replace(params.get('next')?.startsWith('/phobos') ? params.get('next') : '/phobos');

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true); setMsg({ kind: '', text: '' });
    try {
      if (mode === 'login' && step === 'form') {
        const r = await api('/auth/login', { method: 'POST', body: { email: f.email, password: f.password } });
        if (r.data.twoFactorRequired) { setChallenge(r.data.challenge); setStep('2fa'); } else go();
      } else if (mode === 'login') {
        await api('/auth/2fa/verify', { method: 'POST', body: { challenge, code: f.code } }); go();
      } else if (mode === 'forgot') {
        const r = await api('/auth/password/forgot', { method: 'POST', body: { email: f.email } }); setMsg({ kind: 'ok', text: r.data.message });
      } else {
        if (f.password !== f.confirm) throw new Error('Passwords do not match.');
        if (mode === 'invite') { await api(`/auth/invitations/${token}`, { method: 'POST', body: { password: f.password } }); router.replace('/phobos'); }
        else { await api('/auth/password/reset', { method: 'POST', body: { token, password: f.password } }); setMsg({ kind: 'ok', text: 'Password updated. You can now sign in.' }); setStep('done'); }
      }
    } catch (err) { setMsg({ kind: 'err', text: err.message }); }
    setBusy(false);
  }

  const titles = { login: step === '2fa' ? 'Two-factor verification' : 'Sign in to Phobos', forgot: 'Reset your password', invite: 'Set up your account', reset: 'Choose a new password' };
  const pw = (
    <>
      <label className="adm-kpi-label" htmlFor="password">New password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" className="adm-input" required data-testid="auth-new-password-input" />
      <label className="adm-kpi-label" htmlFor="confirm">Confirm password</label>
      <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="adm-input" required data-testid="auth-confirm-password-input" />
      <p className="adm-sub" style={{ fontSize: '0.8rem' }}>At least 12 characters with upper- and lowercase letters, a number and a symbol.</p>
    </>
  );

  return (
    <div className="adm" style={{ gridTemplateColumns: '1fr', placeItems: 'center', padding: 24 }} data-testid={`auth-${mode}-page`}>
      <form onSubmit={submit} className="adm-w" style={{ width: 'min(420px, 100%)', padding: 28, display: 'grid', gap: 12 }} noValidate>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span className="adm-brand-mark"><img src="/brand/logo-mark.png" alt="" width="26" height="26" /></span>
          <span><span className="adm-brand-name">Kreyszigg Softbizz</span><span className="adm-brand-sub">Phobos admin</span></span>
        </div>
        <h1 className="adm-h1" style={{ fontSize: '1.35rem' }}>{titles[mode]}</h1>
        {mode === 'invite' && invite && <p className="adm-sub">Invitation for <b>{invite.email}</b> ({invite.role.replace('_', ' ')}).</p>}
        {mode === 'login' && step === 'form' && (
          <>
            <label className="adm-kpi-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" className="adm-input" required data-testid="login-email-input" />
            <label className="adm-kpi-label" htmlFor="pw">Password</label>
            <input id="pw" name="password" type="password" autoComplete="current-password" className="adm-input" required data-testid="login-password-input" />
          </>
        )}
        {mode === 'login' && step === '2fa' && (
          <>
            <label className="adm-kpi-label" htmlFor="code">Authenticator or recovery code</label>
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" className="adm-input" required data-testid="login-2fa-code-input" />
          </>
        )}
        {mode === 'forgot' && (<><label className="adm-kpi-label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="adm-input" required data-testid="forgot-email-input" /></>)}
        {(mode === 'invite' || mode === 'reset') && step !== 'done' && pw}
        <p role="alert" style={{ color: msg.kind === 'err' ? 'var(--st-lost)' : 'var(--st-won)', fontSize: '0.86rem', minHeight: '1.2em' }} data-testid="auth-message">{msg.text}</p>
        {step !== 'done' && <button type="submit" className="adm-btn adm-btn--primary" style={{ height: 42, justifyContent: 'center' }} disabled={busy || (mode === 'invite' && !invite)} data-testid="auth-submit-button">{busy ? 'Please wait…' : mode === 'login' ? (step === '2fa' ? 'Verify' : 'Sign in') : mode === 'forgot' ? 'Send reset link' : 'Save password'}</button>}
        <p className="adm-sub" style={{ fontSize: '0.82rem' }}>
          {mode === 'login' ? <Link href="/phobos/forgot" data-testid="forgot-password-link">Forgot your password?</Link> : <Link href="/phobos/login" data-testid="back-to-login-link">Back to sign in</Link>}
        </p>
      </form>
    </div>
  );
}

export default function AuthScreen({ mode }) {
  return <Suspense fallback={null}><Inner mode={mode} /></Suspense>;
}
