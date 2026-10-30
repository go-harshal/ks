import Link from 'next/link';
import { notFound } from 'next/navigation';
import ApplyForm from '@/components/public/ApplyForm';
import { PageHero, SectionHead, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic, SITE_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const j = await getPublic(`/jobs/${slug}`, { revalidate: 0 });
  if (!j) return { title: 'Job not found' };
  return { title: `${j.title} — Careers`, description: j.summary, alternates: { canonical: `/careers/${slug}` } };
}

const lines = (t) => (t || '').split('\n').map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

export default async function JobPage({ params }) {
  const { slug } = await params;
  const j = await getPublic(`/jobs/${slug}`, { revalidate: 0 });
  if (!j) notFound();
  const sections = [['Responsibilities', j.responsibilities], ['Requirements', j.requirements], ['Nice to have', j.niceToHave]].filter(([, v]) => lines(v).length);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'JobPosting', title: j.title, description: [j.summary, ...sections.map(([h, v]) => `${h}: ${lines(v).join('; ')}`)].join('\n'),
    datePosted: j.publishedAt, ...(j.closesAt ? { validThrough: j.closesAt } : {}),
    employmentType: { 'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', Contract: 'CONTRACTOR', Internship: 'INTERN' }[j.employmentType],
    hiringOrganization: { '@type': 'Organization', name: 'Kreyszigg Softbizz', sameAs: SITE_URL },
    ...(j.workMode === 'Remote' ? { jobLocationType: 'TELECOMMUTE' } : { jobLocation: { '@type': 'Place', address: j.location } }),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero testId="job-hero" overline={<><Link href="/careers" className="text-link">Careers</Link>{j.department ? ` / ${j.department}` : ''}</>} title={j.title} lead={j.summary}
        aside={<ul className={s.chips} data-testid="job-facts">{[j.location, j.workMode, j.employmentType, j.experience].filter(Boolean).map((x) => <li key={x}>{x}</li>)}{j.closesAt && <li>Closes {new Date(j.closesAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</li>}</ul>}>
        {j.open && <a href="#apply" className="btn" data-testid="job-apply-jump">Apply for this role <span className="btn-arrow" aria-hidden="true">→</span></a>}
      </PageHero>
      {sections.map(([h, v]) => (
        <section key={h} className={s.section} data-testid={`job-${h.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
          <div className={`container ${s.split}`}>
            <SectionHead title={h} />
            <ul className={s.prose} style={{ paddingLeft: 20, margin: 0 }}>{lines(v).map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </section>
      ))}
      <section className={s.section} id="apply" aria-labelledby="apply-title" data-testid="job-apply">
        <div className={`container ${s.split}`}>
          <SectionHead overline="Apply" title="Send your application." body="Attach your CV and tell us a little about yourself. Your details go only to our hiring team." />
          {j.open ? <ApplyForm jobId={j.id} jobTitle={j.title} /> : <p className="lead" data-testid="job-closed">This role is no longer accepting applications. <Link href="/careers" className="text-link">See open roles</Link>.</p>}
        </div>
      </section>
    </>
  );
}
