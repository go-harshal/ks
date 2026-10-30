import Link from 'next/link';
import { notFound } from 'next/navigation';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';
import w from '../work.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = await getPublic(`/case-studies/${slug}`, { revalidate: 0 });
  if (!c) return { title: 'Case study not found' };
  return { title: c.seoTitle || `${c.title} — Case Study`, description: c.seoDescription || c.summary, alternates: { canonical: `/work/${slug}` }, openGraph: c.coverUrl ? { images: [c.coverUrl] } : undefined };
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const [c, industries] = await Promise.all([getPublic(`/case-studies/${slug}`, { revalidate: 0 }), getPublic('/industries')]);
  if (!c) notFound();
  const industry = (industries || []).find((i) => i.slug === c.industry);
  const blocks = [['The challenge', c.challenge], ['Our approach', c.approach], ['The solution', c.solution], ['Results', c.results]].filter(([, v]) => v);
  return (
    <>
      <PageHero testId="case-study-hero" overline={<><Link href="/work" className="text-link">Our work</Link>{industry ? ` / ${industry.name}` : ''}</>} title={c.title} lead={c.summary} />
      {c.coverUrl && <div className="container" style={{ marginTop: 40 }}><div className={w.detailMedia}><img src={c.coverUrl} alt={`${c.title} — cover image`} data-testid="case-study-cover" /></div></div>}
      <section className={s.section} data-testid="case-study-body">
        <div className={`container ${s.split}`}>
          <dl className={`${w.facts} ${s.stickyHead}`}>
            <div><dt>Client</dt><dd data-testid="case-study-client">{c.client || 'Confidential'}</dd></div>
            {industry && <div><dt>Industry</dt><dd><Link href={`/industries/${industry.slug}`} className="text-link">{industry.name}</Link></dd></div>}
            {c.technologies?.length > 0 && <div><dt>Technology</dt><dd><ul className={s.chips} style={{ marginTop: 6 }}>{c.technologies.map((t) => <li key={t}>{t}</li>)}</ul></dd></div>}
          </dl>
          <div style={{ display: 'grid', gap: 40, maxWidth: '70ch' }}>
            {blocks.map(([h, v]) => <div key={h} className={w.block} data-testid={`case-study-${h.toLowerCase().replace(/[^a-z]+/g, '-')}`}><h2>{h}</h2><p>{v}</p></div>)}
          </div>
        </div>
      </section>
      <CTABand testId="case-study-cta" title="Planning something similar?" body="Tell us what you want to build and we will reply with next steps." primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }} secondary={{ label: 'More case studies', href: '/work' }} />
    </>
  );
}
