import CTABand from '@/components/public/sections/CTABand';
import { PageHero, SectionHead, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';

export const metadata = {
  title: 'Partnerships — White-label, Agency and Technology Partners',
  description: 'Partner with Kreyszigg Softbizz for white-label development, agency collaboration, technology partnerships and referrals.',
  alternates: { canonical: '/partnerships' },
};

const TYPES = [
  ['White-label development', 'We build under your brand for your clients, working to your process and quality standards.'],
  ['Agency partnership', 'Extra design and engineering capacity for agencies when demand exceeds the in-house team.'],
  ['Technology partnership', 'Joint solutions combining your platform or product with our development services.'],
  ['Referral partnership', 'Introduce clients who need software or developers, with an agreed referral arrangement.'],
];

export default async function PartnershipsPage() {
  const settings = await getPublic('/settings');
  return (
    <>
      <PageHero testId="partnerships-hero" overline="Partnerships" title="Work with us as a partner." lead="We collaborate with agencies, technology companies and consultants who need a dependable development partner." />
      <section className={s.section} aria-label="Partnership types" data-testid="partnerships-types">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Ways to partner" title="Four partnership models." body="Terms are agreed per partnership. Tell us what you have in mind." />
          <ul className={s.list}>
            {TYPES.map(([t, d], n) => (
              <li key={t} className={s.listRow} style={{ gridTemplateColumns: '56px minmax(0,1fr)' }} data-testid={`partnership-type-${n + 1}`}>
                <span className={s.num}>{String(n + 1).padStart(2, '0')}</span>
                <span><span className={s.rowTitle}>{t}</span><span className={s.rowText}>{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CTABand testId="partnerships-cta" eyebrow="Partnership enquiry" title="Start a partnership conversation." body="Share your company, the type of partnership and what you would like to achieve." primary={{ label: 'Send a partnership enquiry', href: '/contact?type=partnership' }} secondary={{ label: 'See our services', href: '/services' }} meetingUrl={settings?.meeting?.partnershipUrl} />
    </>
  );
}
