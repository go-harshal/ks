import ProcessTimeline from '@/components/public/sections/ProcessTimeline';
import ContentSlot from '@/components/public/sections/ContentSlot';
import CTABand from '@/components/public/sections/CTABand';
import { PageHero, EmptyState, SectionHead, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'About Us — Software Development & Technology Talent Partner',
  description: 'Kreyszigg Softbizz delivers software development projects and provides dedicated developers and teams on demand.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const [steps, settings, teamData] = await Promise.all([getPublic('/process-steps'), getPublic('/settings'), getPublic('/team', { revalidate: 0 })]);
  const team = teamData || [];
  return (
    <>
      <PageHero
        testId="about-hero"
        overline="About Kreyszigg Softbizz"
        title="A software development and technology talent partner."
        lead="We work with businesses in two ways: we deliver software projects end to end, and we provide developers or complete development teams who work as part of your organisation."
        aside={<><p><b>Project delivery</b> — websites, web and mobile applications, SaaS products and custom software.</p><p><b>Staff augmentation</b> — dedicated developers and teams on monthly, hourly, part-time or contract-to-hire terms.</p></>}
      />

      <section className={s.section} id="story" aria-labelledby="story-title" data-testid="about-story">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Our story" title="Why we exist." />
          <div className={s.prose}>
            <p>Kreyszigg Softbizz was set up to give companies a single, accountable partner for building software — whether they need a complete product delivered or extra engineering capacity for a team they already run.</p>
            <p>Every engagement starts with understanding the business problem before choosing technology, and continues after launch with maintenance and improvement.</p>
            <ContentSlot testId="about-story-slot" title="Founding story" note="Founding year, founders’ background and milestones — to be supplied and verified by the business." />
          </div>
        </div>
      </section>

      <section className={s.section} id="approach" aria-labelledby="approach-title" data-testid="about-approach">
        <div className="container">
          <div className={s.split} style={{ marginBottom: 40 }}>
            <SectionHead overline="Our approach" title="Seven stages, from discovery to continuous improvement." />
            <div className={s.prose}><p>Projects follow a structured delivery process with iterative Agile sprints during development, and testing that covers functionality, integration, usability, security and performance.</p></div>
          </div>
          <ProcessTimeline steps={steps || []} />
        </div>
      </section>

      <section className={s.section} id="team" aria-labelledby="team-title" data-testid="about-team">
        <div className="container">
          <div className={s.split} style={{ marginBottom: team.length ? 40 : 0 }}>
            <SectionHead overline="Our team" title="The people behind the work." />
            {team.length === 0 && (
              <EmptyState testId="about-team-empty" title="Team profiles are on their way."
                body="Founder and team profiles will be published here once they are ready. In the meantime, we are happy to introduce the people who would work on your project."
                actions={[{ label: 'Talk to us', href: '/contact?type=contact' }, { label: 'View careers', href: '/careers' }]} />
            )}
          </div>
          {[['Founders', team.filter((p) => p.isFounder)], ['Team', team.filter((p) => !p.isFounder)]].filter(([, list]) => list.length).map(([group, list]) => (
            <div key={group} className={s.teamGroup}>
              {team.some((p) => p.isFounder) && <p className="overline">{group}</p>}
              <ul className={`${s.team} ${group === 'Founders' ? s.teamFounders : ''}`} data-testid={`about-team-${group.toLowerCase()}`}>
                {list.map((p) => (
                  <li key={p.id} id={`team-${p.slug}`} className={s.person} data-testid={`team-profile-${p.slug}`}>
                    <span className={s.photo}>{p.photoUrl ? <img src={p.photoUrl} alt={p.name} loading="lazy" /> : <span aria-hidden="true">{p.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>}</span>
                    <span className={s.personName}>{p.name}</span>
                    <span className={s.personRole}>{p.title}</span>
                    {p.bio && <p className={s.personBio}>{p.bio}</p>}
                    {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="text-link" data-testid={`team-linkedin-${p.slug}`}>LinkedIn<span className="visually-hidden"> profile of {p.name} (opens in a new tab)</span></a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <CTABand
        testId="about-cta"
        title="Tell us what you are planning."
        body="Share a project or a hiring requirement and we will reply with next steps."
        primary={{ label: "Let's Discuss Your Project", href: '/contact?type=project' }}
        secondary={{ label: 'Hire Developers', href: '/hire-developers' }}
        meetingUrl={settings?.meeting?.projectUrl}
      />
    </>
  );
}
