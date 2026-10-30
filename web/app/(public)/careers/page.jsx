import Link from 'next/link';
import ContentSlot from '@/components/public/sections/ContentSlot';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, EmptyState, SectionHead, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Careers — Work with Kreyszigg Softbizz',
  description: 'Open roles at Kreyszigg Softbizz for developers, designers and engineers.',
  alternates: { canonical: '/careers' },
};

const ROLE_AREAS = ['Frontend development', 'Backend development', 'Full-stack development', 'Mobile development', 'UI/UX design', 'DevOps & cloud', 'Quality assurance'];

export default async function CareersPage() {
  const jobs = (await getPublic('/jobs', { revalidate: 0 })) || [];
  return (
    <>
      <PageHero testId="careers-hero" overline="Careers" title="Build software with us." lead="We hire developers, designers and engineers who work on client projects and as dedicated team members inside client organisations." />
      <section className={s.section} aria-labelledby="roles-title" data-testid="careers-roles">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Open roles" title={jobs.length ? `${jobs.length} open ${jobs.length === 1 ? 'role' : 'roles'}.` : 'Current openings.'} />
          {jobs.length === 0 ? (
            <EmptyState testId="careers-empty" title="There are no open roles right now."
              body="New vacancies will be listed here with the job description, employment type and experience needed, along with an application form."
              actions={[{ label: 'Get in touch', href: '/contact?type=contact' }]} />
          ) : (
            <ul className={s.list} data-testid="careers-job-list">
              {jobs.map((j, n) => (
                <li key={j.id}>
                  <Link href={`/careers/${j.slug}`} className={s.listRow} data-testid={`careers-job-${j.slug}`}>
                    <span className={s.num}>{String(n + 1).padStart(2, '0')}</span>
                    <span><span className={s.rowTitle}>{j.title}</span><span className={s.rowText}>{[j.department, j.location, j.workMode, j.employmentType, j.experience].filter(Boolean).join(' · ')}</span></span>
                    <span className={s.arrow} aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className={s.section} aria-labelledby="culture-title" data-testid="careers-culture">
        <div className={`container ${s.split}`}>
          <SectionHead overline="How we work" title="What working here involves." />
          <div className={s.prose}>
            <p>Our work combines two kinds of engagement: delivering projects for clients from discovery to launch, and joining client teams as dedicated developers. Both involve working directly with clients, in structured sprints, with testing and code quality treated as part of the job.</p>
            <ul className={s.chips} aria-label="Role areas">{ROLE_AREAS.map((r) => <li key={r}>{r}</li>)}</ul>
            <ContentSlot testId="careers-culture-slot" title="Culture and benefits" note="Office location, working model, benefits and team photos — to be supplied by the business." />
          </div>
        </div>
      </section>
      <CTABand testId="careers-cta" eyebrow="Hiring for your team?" title="Looking to hire developers instead?" body="See how our dedicated developers and teams work." primary={{ label: 'Hire Developers', href: '/hire-developers' }} secondary={{ label: 'Discuss a project', href: '/contact?type=project' }} />
    </>
  );
}
