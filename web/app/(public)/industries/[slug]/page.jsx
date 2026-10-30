import Link from 'next/link';
import { notFound } from 'next/navigation';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, SectionHead, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';
import { INDUSTRY_COPY } from '@/lib/industries';

export function generateStaticParams() {
  return Object.keys(INDUSTRY_COPY).map((slug) => ({ slug }));
}

async function load(slug) {
  const [list, services] = await Promise.all([getPublic('/industries'), getPublic('/services')]);
  const industry = (list || []).find((i) => i.slug === slug);
  if (!industry) return null;
  const fallback = INDUSTRY_COPY[slug] || {};
  const pick = (a, b) => (a?.length ? a : b || []);
  const live = Object.fromEntries((services || []).map((x) => [x.slug, x.name]));
  const copy = {
    intro: industry.intro || fallback.intro || '',
    problems: pick(industry.problems, fallback.problems),
    solutions: pick(industry.solutions, fallback.solutions),
    // only link services that are currently published
    services: pick(industry.serviceSlugs, fallback.services).filter((sl) => live[sl]).map((sl) => [sl, live[sl]]),
  };
  return { industry, copy };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) return { title: 'Industry not found' };
  return { title: `${d.industry.name} Software Development`, description: d.copy.intro, alternates: { canonical: `/industries/${slug}` } };
}

export default async function IndustryPage({ params }) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) notFound();
  const { industry, copy } = d;
  return (
    <>
      <PageHero testId="industry-hero" overline={<><Link href="/industries" className="text-link">Industries</Link> / {industry.name}</>} title={`Software for ${industry.name.replace(' & ', ' and ')}.`} lead={copy.intro} />
      <section className={s.section} aria-label="Common problems and potential solutions" data-testid="industry-detail">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Problems and solutions" title="Where software can help." />
          <div className={s.cards}>
            {copy.problems.length > 0 && <div className={s.card} data-testid="industry-problems">
              <h3 className={s.h3}>Common problems</h3>
              {copy.problems.map((p) => <p key={p}>— {p}</p>)}
            </div>}
            {copy.solutions.length > 0 && <div className={s.card} data-testid="industry-solutions">
              <h3 className={s.h3}>Potential solutions</h3>
              {copy.solutions.map((p) => <p key={p}>— {p}</p>)}
            </div>}
          </div>
        </div>
      </section>
      {copy.services.length > 0 && <section className={s.section} aria-label="Related services" data-testid="industry-services">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Related services" title="Services that fit." />
          <ul className={s.list}>
            {copy.services.map(([sl, name], n) => (
              <li key={sl}><Link href={`/services/${sl}`} className={s.listRow} data-testid={`industry-service-${sl}`}><span className={s.num}>{String(n + 1).padStart(2, '0')}</span><span className={s.rowTitle}>{name}</span><span className={s.arrow} aria-hidden="true">→</span></Link></li>
            ))}
          </ul>
        </div>
      </section>}
      <CTABand testId="industry-cta" title={`Planning something in ${industry.name}?`} body="Describe the problem and we will suggest a practical approach." primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }} secondary={{ label: 'Hire Developers', href: '/hire-developers' }} />
    </>
  );
}
