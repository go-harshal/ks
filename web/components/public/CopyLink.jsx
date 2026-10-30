'use client';

import { useState } from 'react';

export default function CopyLink({ url, className }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={className} onClick={async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { window.prompt('Copy this link', url); } }} data-testid="article-share-copy">
      <span aria-live="polite">{done ? 'Link copied' : 'Copy link'}</span>
    </button>
  );
}
