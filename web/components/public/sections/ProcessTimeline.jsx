import s from './ProcessTimeline.module.css';

/** Seven-stage delivery process (PRD §6.10). `variant="rail"` = horizontal editorial rail, `"stack"` = compact vertical. */
export default function ProcessTimeline({ steps = [], variant = 'rail' }) {
  if (!steps.length) return null;
  return (
    <ol className={variant === 'rail' ? s.rail : s.stack} data-testid="process-timeline">
      {steps.map((step) => (
        <li key={step.order} className={s.step} data-testid={`process-step-${step.order}`}>
          <span className={s.num} aria-hidden="true">{String(step.order).padStart(2, '0')}</span>
          <h3 className={s.title}><span className="visually-hidden">Stage {step.order}: </span>{step.title}</h3>
          <p className={s.desc}>{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
