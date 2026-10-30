import Link from 'next/link';

/** Shared 404 body. The root not-found adds the header/footer; inside (public) the layout already provides them. */
export default function NotFoundBody() {
  return (
    <div className="container" style={{ paddingBlock: 'clamp(72px, 10vw, 160px)', display: 'grid', gap: 24, maxWidth: 900 }} data-testid="not-found-page">
      <p className="overline">404</p>
      <h1 style={{ fontSize: 'var(--fs-h1)' }}>We couldn’t find that page.</h1>
      <p className="lead">The page may have moved or is no longer available. Try one of these instead.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/" className="btn" data-testid="not-found-home-link">Back to home</Link>
        <Link href="/services" className="btn btn--ghost" data-testid="not-found-services-link">Our services</Link>
        <Link href="/hire-developers" className="btn btn--ghost" data-testid="not-found-hire-link">Hire Developers</Link>
      </div>
    </div>
  );
}
