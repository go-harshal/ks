import Link from 'next/link';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, SectionHead, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';
import { SERVICE_GROUPS } from '@/lib/nav';

export const metadata = {
  title: 'Services — Software Development Services',
  description: 'Custom software, web and mobile applications, SaaS products, websites, UI/UX design, e-commerce, cloud and DevOps, APIs, maintenance and IT consulting.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = (await getPublic('/services')) || [];
  const bySlug = Object.fromEntries(services.map((x) => [x.slug, x]));
  let n = 0;
  return (
    <>
      <PageHero testId="services-hero" overline="Services" title="Eleven services, one accountable partner." lead="From a first website to a complex SaaS product, and from design through to long-term support." />
      {SERVICE_GROUPS.map((g) => (
        <section key={g.title} className={s.section} aria-label={g.title} data-testid={`services-group-${g.title.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
          <div className={`container ${s.split}`}>
            <SectionHead title={g.title} />
            <ul className={s.list}>
              {g.items.map((i) => {
                n += 1;
                return (
                  <li key={i.slug}>
                    <Link href={`/services/${i.slug}`} className={s.listRow} data-testid={`services-link-${i.slug}`}>
                      <span className={s.num}>{String(n).padStart(2, '0')}</span>
                      <span><span className={s.rowTitle}>{i.name}</span>{bySlug[i.slug]?.summary && <span className={s.rowText}>{bySlug[i.slug].summary}</span>}</span>
                      <span className={s.arrow} aria-hidden="true">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
      <CTABand testId="services-cta" title="Not sure which service fits?" body="Describe the problem and we will recommend an approach." primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }} secondary={{ label: 'Hire Developers', href: '/hire-developers' }} />
    </>
  );
}
