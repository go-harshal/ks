import Image from 'next/image';
import Link from 'next/link';
import { getPublic } from '@/lib/api';
import { HIRING_CTA, PROJECT_CTA, SERVICE_GROUPS } from '@/lib/nav';
import ProcessTimeline from '@/components/public/sections/ProcessTimeline';
import ContentSlot from '@/components/public/sections/ContentSlot';
import CTABand from '@/components/public/sections/CTABand';
import s from './home.module.css';

export const metadata = {
  title: { absolute: 'Kreyszigg Softbizz — Software Development & Developer Hiring' },
  description:
    'Mobile apps, web applications and custom software delivered end to end — or dedicated developers and teams who join yours. Request a quote from Kreyszigg Softbizz.',
  alternates: { canonical: '/' },
};

const HERO_IMG =
  'https://images.unsplash.com/photo-1536501483244-925da0b87089?auto=format&fit=crop&w=1400&q=80';

const PRINCIPLES = [
  ['Scope before code', 'Every engagement starts with discovery, so goals, users and success criteria are written down before design or development begins.'],
  ['Progress you can see', 'Work is delivered in short sprints with regular demonstrations, rather than a single reveal at the end.'],
  ['Security from the first sprint', 'Access control, data protection and testing are planned into the architecture, not added at launch.'],
  ['Engagements that fit', 'Choose a defined project, a dedicated developer or a full team — and change the model as your needs change.'],
];

export default async function HomePage() {
  const [services, steps, catalog, settings] = await Promise.all([
    getPublic('/services'),
    getPublic('/process-steps'),
    getPublic('/hiring-catalog'),
    getPublic('/settings'),
  ]);

  const byGroup = SERVICE_GROUPS.map((g) => ({
    title: g.title,
    items: (services || []).filter((x) => x.group === g.title),
  })).filter((g) => g.items.length);
  const techGroups = groupBy(catalog?.technologies || [], 'group');

  let n = 0;

  return (
    <>
      {/* 1 — Hero: asymmetric editorial split */}
      <section className={s.hero} aria-labelledby="hero-title" data-testid="home-hero">
        <div className={`container ${s.heroGrid}`}>
          <div className={s.heroCopy}>
            <p className="overline">Software development · Developer hiring</p>
            <h1 id="hero-title" className={s.heroTitle}>
              Software built around your business. <span className={s.heroAccent}>Developers who fit your team.</span>
            </h1>
            <p className="lead">
              Kreyszigg Softbizz designs and builds mobile apps, web applications and custom software — and provides
              dedicated developers and teams for companies that need to move faster.
            </p>
            <div className={s.heroActions}>
              <Link href={PROJECT_CTA.href} className="btn" data-testid="hero-primary-cta">{PROJECT_CTA.label} <span className="btn-arrow" aria-hidden="true">→</span></Link>
              <Link href={HIRING_CTA.href} className="btn btn--ghost" data-testid="hero-secondary-cta">{HIRING_CTA.label}</Link>
            </div>
          </div>
          <div className={s.heroVisual}>
            <div className={s.heroImage}>
              <Image src={HERO_IMG} alt="Abstract architectural facade with repeating geometric structure" fill priority sizes="(max-width: 960px) 100vw, 42vw" style={{ objectFit: 'cover' }} />
              <span className="placeholder-tag">Placeholder image</span>
            </div>
            <ol className={s.paths} aria-label="Two ways to work with us">
              <li>
                <Link href="/services" className={s.path} data-testid="hero-path-build">
                  <span className={s.pathNum}>01</span>
                  <span><strong>Build a product</strong><em>Project delivery from discovery to launch</em></span>
                  <span aria-hidden="true" className={s.pathArrow}>→</span>
                </Link>
              </li>
              <li>
                <Link href="/hire-developers" className={s.path} data-testid="hero-path-hire">
                  <span className={s.pathNum}>02</span>
                  <span><strong>Extend your team</strong><em>Dedicated developers and teams on demand</em></span>
                  <span aria-hidden="true" className={s.pathArrow}>→</span>
                </Link>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* 2 — Trust & credibility: verified proof only */}
      <section className={`container ${s.slotRow}`} aria-label="Credibility">
        <ContentSlot testId="slot-trust" title="Trust & credibility" note="Verified team experience, authorised client logos or project proof (PRD §6.1)." />
      </section>

      {/* 3 — Services: numbered typographic index, grouped */}
      <section className={s.services} aria-labelledby="services-title" data-testid="home-services">
        <div className={`container ${s.servicesGrid}`}>
          <div className={s.servicesIntro}>
            <p className="overline">Our services</p>
            <h2 id="services-title" className={s.h2}>Eleven service lines, one accountable team.</h2>
            <p className="lead">From a first mobile release to modernising an existing platform, each service is delivered through the same seven-stage process.</p>
            <Link href="/services" className="text-link" data-testid="home-all-services-link">View all services <span aria-hidden="true">→</span></Link>
          </div>
          <div className={s.serviceIndex}>
            {byGroup.length === 0 && <p className={s.muted}>Services are loading. Please refresh shortly.</p>}
            {byGroup.map((g) => (
              <div key={g.title} className={`reveal ${s.serviceGroup}`}>
                <p className={s.groupTitle}>{g.title}</p>
                <ul>
                  {g.items.map((svc) => {
                    n += 1;
                    return (
                      <li key={svc.slug}>
                        <Link href={`/services/${svc.slug}`} className={s.serviceRow} data-testid={`home-service-${svc.slug}`}>
                          <span className={s.serviceNum}>{String(n).padStart(2, '0')}</span>
                          <span className={s.serviceName}>{svc.name}</span>
                          <span className={s.serviceSummary}>{svc.summary}</span>
                          <span className={s.serviceArrow} aria-hidden="true">→</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Featured work: real or DEMO-labelled only */}
      <section className={`container ${s.slotRow}`} aria-label="Featured work">
        <ContentSlot testId="slot-featured-work" title="Featured work" note="Published case studies from Portfolio & Case Studies. Demo entries carry a visible DEMO label." />
      </section>

      {/* 5 — Hire developers: offset white panel on ivory */}
      <section className={s.hire} aria-labelledby="hire-title" data-testid="home-hire">
        <div className="container">
          <div className={s.hirePanel}>
            <div className={s.hireHead}>
              <p className="overline">Hire developers</p>
              <h2 id="hire-title" className={s.h2}>Add skilled developers without the long hiring cycle.</h2>
              <p className="lead">Tell us the role, technology, seniority and engagement model. We shortlist candidates; you interview and decide.</p>
              <Link href={HIRING_CTA.href} className="btn" data-testid="home-hire-cta">Explore hiring options <span className="btn-arrow" aria-hidden="true">→</span></Link>
            </div>
            <dl className={s.techList}>
              {Object.entries(techGroups).map(([group, items]) => (
                <div key={group} className={s.techRow}>
                  <dt>{group}</dt>
                  <dd>{items.map((t) => t.name).join(' · ')}</dd>
                </div>
              ))}
            </dl>
            <div className={s.models}>
              <p className={s.groupTitle}>Engagement models</p>
              <ul>{(catalog?.models || []).map((m) => <li key={m.id}>{m.name}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — Why: principles as commitments, not claims */}
      <section className={s.why} aria-labelledby="why-title" data-testid="home-why">
        <div className={`container ${s.whyGrid}`}>
          <div className={s.whyHead}>
            <p className="overline">Why Kreyszigg Softbizz</p>
            <h2 id="why-title" className={s.whyTitle}>How we work, stated plainly.</h2>
          </div>
          <ol className={s.principles}>
            {PRINCIPLES.map(([t, d], i) => (
              <li key={t} className="reveal">
                <span className={s.pNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7 — Process: dark editorial rail */}
      <section className={`on-dark ${s.process}`} aria-labelledby="process-title" data-testid="home-process">
        <div className="container">
          <div className={s.processHead}>
            <p className="overline">Our process</p>
            <h2 id="process-title" className={s.h2}>Seven stages from first conversation to continuous improvement.</h2>
          </div>
          <ProcessTimeline steps={steps || []} />
        </div>
      </section>

      {/* 8 + 9 — Testimonials & Insights: hidden while empty */}
      <section className={`container ${s.slotPair}`} aria-label="Testimonials and insights">
        <ContentSlot testId="slot-testimonials" title="Client testimonials" note="Authorised, attributable feedback only (Testimonials module, permission required)." />
        <ContentSlot testId="slot-insights" title="Latest insights" note="Featured or latest published articles from Blog / Insights." />
      </section>

      {/* 10 — Final CTA */}
      <CTABand
        testId="home-final-cta"
        title="Tell us what you are building."
        body="Share a short description of your project or hiring need. We reply with clear next steps — no obligation."
        primary={PROJECT_CTA}
        secondary={{ label: 'Hire Developers', href: '/contact?type=hiring' }}
        meetingUrl={settings?.meeting?.projectUrl}
      />
    </>
  );
}

function groupBy(arr, key) {
  return arr.reduce((acc, x) => { (acc[x[key]] ||= []).push(x); return acc; }, {});
}
