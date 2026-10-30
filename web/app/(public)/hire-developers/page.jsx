import Image from 'next/image';
import Link from 'next/link';
import { getPublic } from '@/lib/api';
import CTABand from '@/components/public/sections/CTABand';
import s from './hire.module.css';

export const metadata = {
  title: 'Hire Developers — Dedicated Developers & Teams',
  description:
    'Hire frontend, backend, full-stack, mobile, DevOps, QA and cloud developers from Kreyszigg Softbizz. Monthly, hourly, part-time, dedicated team and contract-to-hire models.',
  alternates: { canonical: '/hire-developers' },
};

const HIRE_IMG = 'https://images.pexels.com/photos/34804021/pexels-photo-34804021.jpeg?auto=compress&cs=tinysrgb&w=1400';

export default async function HireDevelopersPage() {
  const [catalog, settings] = await Promise.all([getPublic('/hiring-catalog'), getPublic('/settings')]);
  const { technologies = [], categories = [], levels = [], models = [], steps = [] } = catalog || {};
  const techGroups = technologies.reduce((acc, t) => { (acc[t.group] ||= []).push(t); return acc; }, {});

  return (
    <>
      {/* Hero: ivory, text left, image right, section index below */}
      <section className={s.hero} aria-labelledby="hire-title" data-testid="hire-hero">
        <div className={`container ${s.heroGrid}`}>
          <div className={s.heroCopy}>
            <p className="overline">Hire developers · Staff augmentation</p>
            <h1 id="hire-title" className={s.title}>Dedicated developers who work as part of your team.</h1>
            <p className="lead">Describe the role you need. We shortlist suitable candidates, you interview them, and the selected developers join your tools, rituals and roadmap.</p>
            <div className={s.actions}>
              <Link href="/contact?type=hiring" className="btn" data-testid="hire-hero-cta">Submit a hiring requirement <span className="btn-arrow" aria-hidden="true">→</span></Link>
              {settings?.meeting?.hiringUrl && <a href={settings.meeting.hiringUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost" data-testid="hire-meeting-cta">Schedule a call</a>}
            </div>
          </div>
          <div className={s.heroImage}>
            <Image src={HIRE_IMG} alt="Abstract close-up of warm-toned light over dark technical surfaces" fill priority sizes="(max-width: 960px) 100vw, 40vw" style={{ objectFit: 'cover' }} />
            <span className="placeholder-tag">Placeholder image</span>
          </div>
        </div>
        <nav aria-label="On this page" className={`container ${s.toc}`}>
          <a href="#categories" data-testid="hire-toc-categories">Developer categories</a>
          <a href="#technologies" data-testid="hire-toc-technologies">Technologies</a>
          <a href="#experience" data-testid="hire-toc-experience">Experience levels</a>
          <a href="#models" data-testid="hire-toc-models">Engagement models</a>
          <a href="#process" data-testid="hire-toc-process">Hiring process</a>
        </nav>
      </section>

      {/* Categories: directory table */}
      <section id="categories" className={s.section} aria-labelledby="cat-title" data-testid="hire-categories">
        <div className="container">
          <div className={s.sectionHead}>
            <h2 id="cat-title" className={s.h2}>Developer categories</h2>
            <p className={s.muted}>{categories.length} roles. Choose one to see a dedicated page.</p>
          </div>
          <ul className={s.directory}>
            {categories.map((c, i) => (
              <li key={c.slug}>
                <Link href={`/hire-developers/${c.slug}`} className={s.dirRow} data-testid={`hire-category-${c.slug}`}>
                  <span className={s.dirNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={s.dirName}>{c.name}</span>
                  <span className={s.dirSummary}>{c.summary}</span>
                  <span className={s.dirSkills}>{c.skills.join(', ')}</span>
                  <span className={s.dirArrow} aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Technologies: dark matrix */}
      <section id="technologies" className={`on-dark ${s.section}`} aria-labelledby="tech-title" data-testid="hire-technologies">
        <div className={`container ${s.techGrid}`}>
          <div>
            <p className="overline">Technology expertise</p>
            <h2 id="tech-title" className={s.h2}>Technologies we hire for</h2>
          </div>
          <div className={s.matrix}>
            {Object.entries(techGroups).map(([group, items]) => (
              <div key={group} className={s.matrixCol} data-testid={`tech-group-${group.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
                <h3 className={s.matrixTitle}>{group}</h3>
                <ul>
                  {items.map((t) => (
                    <li key={t.id}>{t.name}{t.note && <span className={s.techNote}>{t.note}</span>}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience: proportional scale */}
      <section id="experience" className={s.section} aria-labelledby="exp-title" data-testid="hire-experience">
        <div className="container">
          <div className={s.sectionHead}>
            <h2 id="exp-title" className={s.h2}>Experience levels</h2>
            <p className={s.muted}>Classification guidelines used when matching candidates — not a statement of current availability.</p>
          </div>
          <ol className={s.scale}>
            {levels.map((l, i) => (
              <li key={l.id} className={s.level} style={{ '--i': i }} data-testid={`experience-level-${i + 1}`}>
                <span className={s.levelBar} aria-hidden="true" />
                <span className={s.levelRange}>{l.range}</span>
                <h3 className={s.levelName}>{l.name}</h3>
                <p className={s.muted}>{l.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Engagement models: asymmetric two-column list */}
      <section id="models" className={`${s.section} ${s.modelsSec}`} aria-labelledby="models-title" data-testid="hire-models">
        <div className={`container ${s.modelsGrid}`}>
          <div className={s.modelsHead}>
            <p className="overline">Engagement models</p>
            <h2 id="models-title" className={s.h2}>Six ways to engage.</h2>
            <p className={s.muted}>Pricing depends on role, seniority and duration. Share your requirement for a tailored quote.</p>
          </div>
          <dl className={s.models}>
            {models.map((m) => (
              <div key={m.id} className={`reveal ${s.model}`} data-testid={`engagement-model-${m.order}`}>
                <dt>{m.name}</dt>
                <dd>{m.description}</dd>
                <dd className={s.bestFor}><span>Suited to</span> {m.bestFor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Hiring process: large numerals, sticky heading */}
      <section id="process" className={s.section} aria-labelledby="hp-title" data-testid="hire-process">
        <div className={`container ${s.processGrid}`}>
          <div className={s.processHead}>
            <p className="overline">Hiring process</p>
            <h2 id="hp-title" className={s.h2}>From requirement to an embedded developer in six steps.</h2>
          </div>
          <ol className={s.steps}>
            {steps.map((st) => (
              <li key={st.order} className={s.step} data-testid={`hiring-step-${st.order}`}>
                <span className={s.stepNum} aria-hidden="true">{st.order}</span>
                <div>
                  <h3><span className="visually-hidden">Step {st.order}: </span>{st.title}</h3>
                  <p className={s.muted}>{st.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CTABand
        testId="hire-cta"
        eyebrow="Hiring enquiry"
        title="Share the role you need to fill."
        body="Role or technology, number of developers, seniority, engagement model and duration — we reply with next steps."
        primary={{ label: 'Submit a hiring requirement', href: '/contact?type=hiring' }}
        secondary={{ label: 'Discuss a project instead', href: '/contact?type=project' }}
        meetingUrl={settings?.meeting?.hiringUrl}
      />
    </>
  );
}
