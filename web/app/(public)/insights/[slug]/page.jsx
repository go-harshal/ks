import Link from 'next/link';
import { notFound } from 'next/navigation';
import CTABand from '@/components/public/sections/CTABand';
import { getPublic, SITE_URL } from '@/lib/api';
import i from '../insights.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = await getPublic(`/articles/${slug}`, { revalidate: 0 });
  if (!a) return { title: 'Article not found' };
  return { title: a.seoTitle || a.title, description: a.seoDescription || a.excerpt, alternates: { canonical: `/insights/${slug}` }, openGraph: { type: 'article', ...(a.coverUrl ? { images: [a.coverUrl] } : {}) } };
}

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const a = await getPublic(`/articles/${slug}`, { revalidate: 0 });
  if (!a) notFound();
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.excerpt, datePublished: a.publishedAt, dateModified: a.updatedAt,
    ...(a.author ? { author: { '@type': 'Person', name: a.author.name, jobTitle: a.author.title, url: `${SITE_URL}/about#team-${a.author.slug}` } } : {}),
    publisher: { '@type': 'Organization', name: 'Kreyszigg Softbizz' }, ...(a.coverUrl ? { image: `${SITE_URL}${a.coverUrl}` } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <article className={`container ${i.article}`} data-testid="article">
        <header className={i.head}>
          <p className="overline"><Link href="/insights" className="text-link">Insights</Link>{a.category ? ` / ${a.category}` : ''}</p>
          <h1 className={i.title}>{a.title}</h1>
          <p className="lead">{a.excerpt}</p>
          <div className={i.byline} data-testid="article-byline">
            {a.author ? (
              <Link href={`/about#team-${a.author.slug}`} className={i.author} data-testid="article-author-link">
                {a.author.photoUrl ? <img src={a.author.photoUrl} alt="" className={i.avatarLg} /> : <span className={i.avatarLg} aria-hidden="true">{a.author.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>}
                <span><b>{a.author.name}</b><small>{a.author.title}</small></span>
              </Link>
            ) : <span><b>Kreyszigg Softbizz</b></span>}
            <small className={i.date}>{fmt(a.publishedAt)} · {a.readingMinutes} min read</small>
          </div>
        </header>
        {a.coverUrl && <div className={i.cover}><img src={a.coverUrl} alt={`${a.title} — cover image`} /></div>}
        {/* Body HTML is sanitised server-side to p/h2/h3/strong/em/ul/ol/li/a/blockquote/br */}
        <div className={i.prose} dangerouslySetInnerHTML={{ __html: a.body }} data-testid="article-body" />
        {a.tags?.length > 0 && <ul className={i.tags} aria-label="Tags">{a.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
      </article>
      <CTABand testId="article-cta" title="Want to talk this through?" body="Tell us about your project or hiring need and we will reply with next steps." primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }} secondary={{ label: 'More insights', href: '/insights' }} />
    </>
  );
}
