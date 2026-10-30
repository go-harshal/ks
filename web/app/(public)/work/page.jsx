import Link from 'next/link';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, EmptyState, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';
import w from './work.module.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Our Work — Case Studies',
  description: 'Case studies from Kreyszigg Softbizz: the challenge, our approach, the solution and the technology used.',
  alternates: { canonical: '/work' },
};

export default async function WorkPage({ searchParams }) {
  const { industry = '' } = await searchParams;
  const [items, industries] = await Promise.all([getPublic('/case-studies', { revalidate: 0 }), getPublic('/industries')]);
  const all = items || [];
  const names = Object.fromEntries((industries || []).map((i) => [i.slug, i.name]));
  const used = [...new Set(all.map((c) => c.industry).filter(Boolean))];
  const shown = industry ? all.filter((c) => c.industry === industry) : all;
  return (
    <>
      <PageHero testId="work-hero" overline="Our work" title="Case studies."
        lead="Each case study covers the challenge, our approach, the solution delivered and the technology used. Results appear only where they are verified and approved by the client." />
      <section className={s.section} aria-label="Case studies" data-testid="work-list">
        <div className="container" style={{ display: 'grid', gap: 32 }}>
          {all.length === 0 ? (
            <EmptyState testId="work-empty" title="Case studies are being prepared."
              body="We are preparing detailed write-ups of our projects, including confidential ones described without client names. Ask us and we will walk you through relevant work on a call."
              actions={[{ label: 'Discuss your project', href: '/contact?type=project' }, { label: 'See our services', href: '/services' }]} />
          ) : (
            <>
              {used.length > 1 && (
                <nav aria-label="Filter by industry" className={w.filters} data-testid="work-industry-filters">
                  <Link href="/work" aria-current={!industry ? 'true' : undefined} data-testid="work-filter-all">All</Link>
                  {used.map((slug) => <Link key={slug} href={`/work?industry=${slug}`} aria-current={industry === slug ? 'true' : undefined} data-testid={`work-filter-${slug}`}>{names[slug] || slug}</Link>)}
                </nav>
              )}
              <ul className={w.grid}>
                {shown.map((c, i) => (
                  <li key={c.id} className={i === 0 && !industry ? w.featured : undefined}>
                    <Link href={`/work/${c.slug}`} className={w.card} data-testid={`work-card-${c.slug}`}>
                      <span className={w.media}>
                        {c.coverUrl ? <img src={c.coverUrl} alt="" loading="lazy" /> : <span className={w.mediaEmpty} aria-hidden="true">{(names[c.industry] || 'Case study').split(' ')[0]}</span>}
                      </span>
                      <span className={w.body}>
                        <span className="overline">{names[c.industry] || 'Case study'}{c.client ? ` · ${c.client}` : ''}</span>
                        <span className={w.title}>{c.title}</span>
                        <span className={w.summary}>{c.summary}</span>
                        {c.technologies?.length > 0 && <span className={w.tech}>{c.technologies.slice(0, 5).join(' · ')}</span>}
                        <span className={w.more}>Read case study <span aria-hidden="true">→</span></span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
      <CTABand testId="work-cta" title="Have a similar challenge?" body="Describe what you need to build and we will reply with next steps." primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }} secondary={{ label: 'Hire Developers', href: '/hire-developers' }} />
    </>
  );
}
