import s from './Testimonials.module.css';

/** Approved client testimonials for a service page. Renders nothing when none are published. */
export default function Testimonials({ items = [], title = 'What clients say' }) {
  if (!items.length) return null;
  return (
    <section className={s.section} aria-labelledby="testimonials-title" data-testid="service-testimonials">
      <div className="container">
        <p className="overline">Testimonials</p>
        <h2 id="testimonials-title" className={s.title}>{title}</h2>
        <ul className={`${s.list} ${items.length === 1 ? s.single : ''}`}>
          {items.map((t) => (
            <li key={t.id} className={s.item} data-testid={`testimonial-${t.id}`}>
              <figure className={s.figure}>
                <span className={s.mark} aria-hidden="true">“</span>
                <blockquote className={s.quote}><p>{t.quote}</p></blockquote>
                <figcaption className={s.caption}><b>{t.name}</b>{(t.role || t.company) && <span>{[t.role, t.company].filter(Boolean).join(', ')}</span>}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
