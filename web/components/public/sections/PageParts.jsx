import Link from 'next/link';
import s from './Page.module.css';

export function PageHero({ overline, title, lead, aside, testId = 'page-hero', children }) {
  return (
    <section className={s.hero} data-testid={testId}>
      <div className={`container ${s.heroGrid}`}>
        <div>
          <p className="overline">{overline}</p>
          <h1 className={s.title}>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children}
        </div>
        {aside && <div className={s.heroAside}>{aside}</div>}
      </div>
    </section>
  );
}

/** Public empty state used where verified business content has not been supplied yet. */
export function EmptyState({ title, body, actions = [], testId }) {
  return (
    <div className={s.empty} data-testid={testId}>
      <h3>{title}</h3>
      <p>{body}</p>
      {actions.length > 0 && (
        <div className={s.actions}>
          {actions.map((a, i) => (
            <Link key={a.href} href={a.href} className={`btn ${i ? 'btn--ghost' : ''}`} data-testid={`${testId}-action-${i}`}>{a.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SectionHead({ overline, title, body }) {
  return (
    <div className={s.stickyHead}>
      {overline && <p className="overline">{overline}</p>}
      <h2 className={s.h2}>{title}</h2>
      {body && <p className={s.muted}>{body}</p>}
    </div>
  );
}

export { s as pageStyles };
