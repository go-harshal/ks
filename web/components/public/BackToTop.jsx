'use client';

export default function BackToTop({ className = '' }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
      data-testid="back-to-top-button"
      style={{ background: 'none', border: '1px solid #526374', color: '#F5F2EB', width: 40, height: 40, cursor: 'pointer' }}
      aria-label="Back to top"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
