import ContentSlot from '@/components/public/sections/ContentSlot';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, EmptyState, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';

export const metadata = {
  title: 'Our Work — Case Studies',
  description: 'Case studies from Kreyszigg Softbizz: the challenge, our approach, the solution and the technology used.',
  alternates: { canonical: '/work' },
};

export default async function WorkPage() {
  const industries = (await getPublic('/industries')) || [];
  return (
    <>
      <PageHero
        testId="work-hero"
        overline="Our work"
        title="Case studies."
        lead="Each case study will cover the challenge, our approach, the solution delivered and the technology used. Results and client feedback appear only where they are verified and authorised."
      />
      <section className={s.section} aria-label="Case studies" data-testid="work-list">
        <div className="container" style={{ display: 'grid', gap: 32 }}>
          <div>
            <p className="overline">Filter by industry</p>
            <ul className={s.chips} style={{ marginTop: 12 }} data-testid="work-industry-filters" aria-label="Industries (filters activate when case studies are published)">
              {industries.map((i) => <li key={i.slug}>{i.name}</li>)}
            </ul>
          </div>
          <EmptyState
            testId="work-empty"
            title="Case studies are being prepared."
            body="We are preparing detailed write-ups of our projects, including confidential ones described without client names. Ask us and we will walk you through relevant work on a call."
            actions={[{ label: 'Discuss your project', href: '/contact?type=project' }, { label: 'See our services', href: '/services' }]}
          />
          <ContentSlot testId="work-slot" title="Portfolio grid" note="Cards: title, industry, short overview, image, technology stack and detail link — managed in Phobos › Portfolio & Case Studies." />
        </div>
      </section>
      <CTABand testId="work-cta" title="Have a similar challenge?" body="Describe what you need to build and we will reply with next steps." primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }} secondary={{ label: 'Hire Developers', href: '/hire-developers' }} />
    </>
  );
}
