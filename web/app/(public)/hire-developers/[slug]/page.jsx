import Link from 'next/link';
import { notFound } from 'next/navigation';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, SectionHead, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';

async function load(slug) {
  const cat = await getPublic('/hiring-catalog');
  const c = cat?.categories?.find((x) => x.slug === slug);
  return c ? { c, cat } : null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) return { title: 'Role not found' };
  return { title: `Hire ${d.c.name}`, description: `${d.c.summary} Hire dedicated ${d.c.name.toLowerCase()} from Kreyszigg Softbizz.`, alternates: { canonical: `/hire-developers/${slug}` } };
}

export default async function HireCategoryPage({ params }) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) notFound();
  const { c, cat } = d;
  return (
    <>
      <PageHero
        testId="hire-category-hero"
        overline={<><Link href="/hire-developers" className="text-link">Hire developers</Link> / {c.name}</>}
        title={`Hire ${c.name}.`}
        lead={c.summary}
        aside={<p>Tell us the number of developers, seniority, engagement model and duration. We shortlist candidates and you interview them before anyone joins your team.</p>}
      >
        <Link href={`/contact?type=hiring&context=${encodeURIComponent(c.name)}`} className="btn" data-testid="hire-category-cta">Submit a hiring requirement <span className="btn-arrow" aria-hidden="true">→</span></Link>
      </PageHero>
      <section className={s.section} aria-label="Skills" data-testid="hire-category-skills">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Skills" title="Typical technologies." />
          <ul className={s.chips}>{c.skills.map((k) => <li key={k}>{k}</li>)}</ul>
        </div>
      </section>
      <section className={s.section} aria-label="Experience levels and engagement models" data-testid="hire-category-options">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Options" title="Seniority and engagement." body="Experience ranges are classification guidelines, not a statement of current availability." />
          <div className={s.cards}>
            <div className={s.card}><h3 className={s.h3}>Experience levels</h3>{(cat.levels || []).map((l) => <p key={l.id}><b>{l.name}</b> · {l.range}</p>)}</div>
            <div className={s.card}><h3 className={s.h3}>Engagement models</h3>{(cat.models || []).map((m) => <p key={m.id}>{m.name}</p>)}</div>
          </div>
        </div>
      </section>
      <CTABand testId="hire-category-cta-band" eyebrow="Hiring enquiry" title={`Need ${c.name.toLowerCase()}?`} body="Share the role and we will reply with suitable next steps." primary={{ label: 'Submit a hiring requirement', href: `/contact?type=hiring&context=${encodeURIComponent(c.name)}` }} secondary={{ label: 'All developer roles', href: '/hire-developers' }} />
    </>
  );
}
