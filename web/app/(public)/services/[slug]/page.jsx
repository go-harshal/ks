import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublic, SITE_URL } from '@/lib/api';
import { SERVICE_GROUPS } from '@/lib/nav';
import ProcessTimeline from '@/components/public/sections/ProcessTimeline';
import ContentSlot from '@/components/public/sections/ContentSlot';
import CTABand from '@/components/public/sections/CTABand';
import Testimonials from '@/components/public/sections/Testimonials';
import s from './service.module.css';

const SERVICE_IMG = 'https://images.unsplash.com/photo-1696595883516-76c97aa3a164?auto=format&fit=crop&w=1600&q=80';

export async function generateStaticParams() {
  return SERVICE_GROUPS.flatMap((g) => g.items.map((i) => ({ slug: i.slug })));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const svc = await getPublic(`/services/${slug}`);
  if (!svc) return { title: 'Service not found' };
  return {
    title: svc.seo?.title || svc.name,
    description: svc.seo?.description || svc.summary,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title: `${svc.name} | Kreyszigg Softbizz`, description: svc.summary, url: `/services/${slug}` },
  };
}

export default async function ServicePage({ params }) {
  const { slug } = await params;
  const [svc, steps, settings, all, quotes] = await Promise.all([
    getPublic(`/services/${slug}`),
    getPublic('/process-steps'),
    getPublic('/settings'),
    getPublic('/services'),
    getPublic(`/testimonials?service=${encodeURIComponent(slug)}`, { revalidate: 30 }),
  ]);
  if (!svc) notFound();

  const related = (all || []).filter((x) => x.group === svc.group && x.slug !== svc.slug).slice(0, 3);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: svc.name,
      description: svc.summary,
      provider: { '@type': 'Organization', name: 'Kreyszigg Softbizz', url: SITE_URL },
      url: `${SITE_URL}/services/${slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_URL}/services` },
        { '@type': 'ListItem', position: 3, name: svc.name, item: `${SITE_URL}/services/${slug}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header: dark slab with breadcrumb, offset image below */}
      <section className={`on-dark ${s.head}`} aria-labelledby="svc-title" data-testid="service-hero">
        <div className="container">
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <ol>
              <li><Link href="/" data-testid="breadcrumb-home">Home</Link></li>
              <li><Link href="/services" data-testid="breadcrumb-services">Services</Link></li>
              <li aria-current="page">{svc.name}</li>
            </ol>
          </nav>
          <div className={s.headGrid}>
            <div className={s.headCopy}>
              <p className="overline">{svc.group}</p>
              <h1 id="svc-title" className={s.title}>{svc.name}</h1>
            </div>
            <div className={s.headSide}>
              <p className="lead">{svc.intro || svc.summary}</p>
              <Link href={`/contact?type=project&service=${slug}`} className="btn btn--light" data-testid="service-hero-cta">Request a quote <span className="btn-arrow" aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>
      <div className={`container ${s.imageWrap}`}>
        <div className={s.image}>
          <Image src={SERVICE_IMG} alt="Geometric light and shadow on a textured surface" fill sizes="(max-width: 960px) 100vw, 80vw" style={{ objectFit: 'cover' }} priority />
          <span className="placeholder-tag">Placeholder image</span>
        </div>
      </div>

      {/* Capabilities: two-column numbered definition list */}
      <section className={s.caps} aria-labelledby="caps-title" data-testid="service-capabilities">
        <div className={`container ${s.capsGrid}`}>
          <div className={s.capsHead}>
            <p className="overline">What we deliver</p>
            <h2 id="caps-title" className={s.h2}>Capabilities</h2>
            <p className={s.count}>{String(svc.capabilities?.length || 0).padStart(2, '0')}<span>areas</span></p>
          </div>
          <dl className={s.capList}>
            {(svc.capabilities || []).map((c, i) => (
              <div key={c.title} className={`reveal ${s.cap}`} data-testid={`service-capability-${i + 1}`}>
                <dt><span className={s.capNum}>{String(i + 1).padStart(2, '0')}</span>{c.title}</dt>
                <dd>{c.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Technology strip */}
      {svc.technologies?.length > 0 && (
        <section className={s.tech} aria-labelledby="tech-title" data-testid="service-technologies">
          <div className={`container ${s.techInner}`}>
            <h2 id="tech-title" className={s.techTitle}>Typical technologies</h2>
            <ul className={s.techList}>{svc.technologies.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className={s.techNote}>Final technology choices are made during Planning &amp; Architecture, based on your requirements.</p>
          </div>
        </section>
      )}

      {/* Process (compact vertical) beside related work slot */}
      <section className={s.processSec} aria-labelledby="svc-process-title">
        <div className={`container ${s.processGrid}`}>
          <div className={s.processHead}>
            <p className="overline">How it runs</p>
            <h2 id="svc-process-title" className={s.h2}>Delivery process</h2>
            <ContentSlot testId="slot-service-case-studies" title="Related case studies" note="Verified projects tagged with this service appear here." />
          </div>
          <ProcessTimeline steps={steps || []} variant="stack" />
        </div>
      </section>

      {related.length > 0 && (
        <section className={s.related} aria-labelledby="related-title" data-testid="service-related">
          <div className="container">
            <h2 id="related-title" className={s.relatedTitle}>Related services</h2>
            <ul className={s.relatedList}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/services/${r.slug}`} className={s.relatedLink} data-testid={`related-service-${r.slug}`}>
                    <span>{r.name}</span><span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Testimonials items={quotes || []} />

      <CTABand
        testId="service-cta"
        eyebrow={svc.name}
        title="Discuss your requirements with us."
        body="Describe what you need — a short paragraph is enough. Budget and timeline are optional."
        primary={{ label: 'Request a quote', href: `/contact?type=project&service=${slug}` }}
        secondary={{ label: 'Hire a developer instead', href: '/hire-developers' }}
        meetingUrl={settings?.meeting?.projectUrl}
      />
    </>
  );
}
