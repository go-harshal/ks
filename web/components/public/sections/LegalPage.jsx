import Link from 'next/link';
import { PageHero, pageStyles as s } from '@/components/public/sections/PageParts';
import { getPublic } from '@/lib/api';

/** Shared legal page frame. Content is a DRAFT reflecting what the site actually does; qualified legal review is required before launch (PRD §12.3). */
export default async function LegalPage({ testId, overline, title, sections, children }) {
  const settings = await getPublic('/settings');
  const email = settings?.contact?.email;
  return (
    <>
      <PageHero testId={testId} overline={overline} title={title} lead="Last updated: draft pending legal review." />
      <section className={s.section}>
        <div className={`container ${s.split}`}>
          <nav aria-label="On this page" className={`${s.toc} ${s.stickyHead}`}>
            {sections.map((x) => <a key={x.id} href={`#${x.id}`}>{x.h}</a>)}
          </nav>
          <div className={s.legal}>
            <p className={s.legalNote} role="note" data-testid={`${testId}-draft-note`}>Draft document. It describes how this website currently handles information and will be finalised after review by a qualified legal adviser.</p>
            {children}
            {sections.map((x) => (
              <section key={x.id} id={x.id} aria-labelledby={`${x.id}-h`}>
                <h2 id={`${x.id}-h`}>{x.h}</h2>
                {x.body.map((b, i) => (Array.isArray(b) ? <ul key={i}>{b.map((li) => <li key={li}>{li}</li>)}</ul> : <p key={i}>{b}</p>))}
              </section>
            ))}
            <h2>Contact</h2>
            <p>Questions about this document: {email ? <a href={`mailto:${email}`} className="text-link">{email}</a> : <Link href="/contact?type=contact" className="text-link">contact us</Link>}.</p>
          </div>
        </div>
      </section>
    </>
  );
}
