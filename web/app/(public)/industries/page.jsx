import Link from 'next/link';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';
import { INDUSTRY_COPY } from '@/lib/industries';

export const metadata = {
  title: 'Industries — Software for Your Sector',
  description: 'Software development for startups, retail, education, healthcare, real estate, logistics, travel, manufacturing, media, professional services and food businesses.',
  alternates: { canonical: '/industries' },
};

export default async function IndustriesPage() {
  const industries = (await getPublic('/industries')) || [];
  return (
    <>
      <PageHero testId="industries-hero" overline="Industries" title="Software shaped around how your sector works." lead="Every industry has its own workflows, users and constraints. Choose a sector to see the problems we help with and the kinds of solutions we build." />
      <section className={s.section} aria-label="Industries" data-testid="industries-list">
        <div className="container">
          <ul className={s.list}>
            {industries.map((i, n) => (
              <li key={i.slug}>
                <Link href={`/industries/${i.slug}`} className={s.listRow} data-testid={`industry-link-${i.slug}`}>
                  <span className={s.num}>{String(n + 1).padStart(2, '0')}</span>
                  <span><span className={s.rowTitle}>{i.name}</span><span className={s.rowText}>{i.intro || INDUSTRY_COPY[i.slug]?.intro}</span></span>
                  <span className={s.arrow} aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CTABand testId="industries-cta" title="Working in a different sector?" body="Tell us about your workflow and we will suggest an approach." primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }} secondary={{ label: 'Hire Developers', href: '/hire-developers' }} />
    </>
  );
}
