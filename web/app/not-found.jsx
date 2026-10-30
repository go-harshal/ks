import Link from 'next/link';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { getPublic } from '@/lib/api';

export const metadata = { title: 'Page not available', robots: { index: false } };

export default async function NotFound() {
  const [settings, industries] = await Promise.all([getPublic('/settings'), getPublic('/industries')]);
  return (
    <>
      <Header industries={industries || []} />
      <main id="main" className="container" style={{ paddingBlock: 'clamp(72px, 10vw, 160px)', display: 'grid', gap: 24, maxWidth: 900 }} data-testid="not-found-page">
        <p className="overline">404</p>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>This page is not available yet.</h1>
        <p className="lead">
          The page you requested either does not exist or is scheduled for a later build phase. During this design review,
          only the Homepage, a Service page and Hire Developers are complete.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" className="btn" data-testid="not-found-home-link">Back to home</Link>
          <Link href="/hire-developers" className="btn btn--ghost" data-testid="not-found-hire-link">Hire Developers</Link>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
