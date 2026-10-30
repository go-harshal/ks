import Link from 'next/link';
import s from './CTABand.module.css';

export default function CTABand({ eyebrow = 'Next step', title, body, primary, secondary, meetingUrl, testId = 'cta-band' }) {
  return (
    <section className={`on-dark ${s.band}`} data-testid={testId} aria-labelledby={`${testId}-title`}>
      <div className={`container ${s.inner}`}>
        <div className={s.copy}>
          <p className="overline">{eyebrow}</p>
          <h2 id={`${testId}-title`} className={s.title}>{title}</h2>
        </div>
        <div className={s.side}>
          {body && <p className="lead">{body}</p>}
          <div className={s.actions}>
            {primary && <Link href={primary.href} className="btn btn--light" data-testid={`${testId}-primary`}>{primary.label} <span className="btn-arrow" aria-hidden="true">→</span></Link>}
            {secondary && <Link href={secondary.href} className="btn btn--outline-light" data-testid={`${testId}-secondary`}>{secondary.label}</Link>}
          </div>
          {meetingUrl && (
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className={`text-link ${s.meeting}`} data-testid={`${testId}-meeting`}>Or schedule a meeting <span aria-hidden="true">↗</span></a>
          )}
        </div>
      </div>
    </section>
  );
}
