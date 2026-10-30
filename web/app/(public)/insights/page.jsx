import Link from 'next/link';
import { PageHero, EmptyState, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';
import w from '../work/work.module.css';
import i from './insights.module.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Insights — Articles on Software Development and Hiring',
  description: 'Articles from Kreyszigg Softbizz on software development, product delivery and building engineering teams.',
  alternates: { canonical: '/insights' },
};

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default async function InsightsPage({ searchParams }) {
  const { category = '' } = await searchParams;
  const all = (await getPublic('/articles', { revalidate: 0 })) || [];
  const cats = [...new Set(all.map((a) => a.category).filter(Boolean))];
  const shown = category ? all.filter((a) => a.category === category) : all;
  return (
    <>
      <PageHero testId="insights-hero" overline="Insights" title="Notes on building software and teams." lead="Practical articles on planning, building and running software products, and on working with dedicated developers." />
      <section className={s.section} aria-label="Articles" data-testid="insights-list">
        <div className="container" style={{ display: 'grid', gap: 32 }}>
          {all.length === 0 ? (
            <EmptyState testId="insights-empty" title="The first articles are coming soon." body="Subscribe to the newsletter at the bottom of this page to hear when new articles are published." actions={[{ label: 'Contact us', href: '/contact?type=contact' }]} />
          ) : (
            <>
              {cats.length > 1 && (
                <nav aria-label="Filter by topic" className={w.filters} data-testid="insights-category-filters">
                  <Link href="/insights" aria-current={!category ? 'true' : undefined} data-testid="insights-filter-all">All</Link>
                  {cats.map((c) => <Link key={c} href={`/insights?category=${encodeURIComponent(c)}`} aria-current={category === c ? 'true' : undefined} data-testid={`insights-filter-${c.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{c}</Link>)}
                </nav>
              )}
              <ul className={w.grid}>
                {shown.map((a, n) => (
                  <li key={a.id} className={n === 0 && !category ? w.featured : undefined}>
                    <Link href={`/insights/${a.slug}`} className={w.card} data-testid={`insights-card-${a.slug}`}>
                      <span className={w.media}>{a.coverUrl ? <img src={a.coverUrl} alt="" loading="lazy" /> : <span className={w.mediaEmpty} aria-hidden="true">{(a.category || 'Insights').split(' ')[0]}</span>}</span>
                      <span className={w.body}>
                        <span className="overline">{a.category || 'Insights'} · {a.readingMinutes} min read</span>
                        <span className={w.title}>{a.title}</span>
                        <span className={w.summary}>{a.excerpt}</span>
                        <span className={i.meta}>{a.author && <>{a.author.photoUrl && <img src={a.author.photoUrl} alt="" className={i.avatar} />}{a.author.name} · </>}{fmt(a.publishedAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}
