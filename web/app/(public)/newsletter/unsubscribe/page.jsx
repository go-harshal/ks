'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function Inner() {
  const token = useSearchParams().get('token') || '';
  const [state, setState] = useState({ kind: 'idle' });
  async function confirm() {
    setState({ kind: 'sending' });
    try {
      const res = await fetch(`/api/v1/public/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, { method: 'POST' });
      const body = await res.json().catch(() => null);
      setState(res.ok ? { kind: 'done', email: body.data.email } : { kind: 'error', msg: body?.error?.message || 'Something went wrong.' });
    } catch { setState({ kind: 'error', msg: 'Network error. Please try again.' }); }
  }
  return (
    <section className="container" style={{ paddingBlock: 'clamp(64px, 10vw, 140px)', maxWidth: 680 }} data-testid="unsubscribe-page">
      <p className="overline">Newsletter</p>
      {state.kind === 'done' ? (
        <>
          <h1 style={{ fontSize: 'var(--fs-h2)', margin: '12px 0 16px' }} data-testid="unsubscribe-done">You have been unsubscribed.</h1>
          <p className="lead">{state.email} will no longer receive the Kreyszigg Softbizz newsletter. You can subscribe again at any time from the website footer.</p>
          <Link href="/" className="btn btn--ghost" data-testid="unsubscribe-home">Back to home</Link>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 'var(--fs-h2)', margin: '12px 0 16px' }}>Unsubscribe from the newsletter?</h1>
          <p className="lead">You will stop receiving newsletter emails. Replies to enquiries you have sent us are not affected.</p>
          {!token ? <p role="alert" data-testid="unsubscribe-error">This link is missing its unsubscribe code. Use the link from your newsletter email.</p> : (
            <button type="button" className="btn" onClick={confirm} disabled={state.kind === 'sending'} data-testid="unsubscribe-confirm-button">{state.kind === 'sending' ? 'Unsubscribing…' : 'Unsubscribe'}</button>
          )}
          {state.kind === 'error' && <p role="alert" style={{ color: 'var(--copper-ink)', marginTop: 16 }} data-testid="unsubscribe-error">{state.msg}</p>}
        </>
      )}
    </section>
  );
}

export default function UnsubscribePage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
