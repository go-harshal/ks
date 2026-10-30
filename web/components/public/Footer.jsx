import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import NewsletterForm from '@/components/public/NewsletterForm';
import BackToTop from '@/components/public/BackToTop';
import { FOOTER } from '@/lib/nav';
import s from './Footer.module.css';

export default function Footer({ settings, services, roles }) {
  const svcLinks = services?.length ? [...services].sort((a, b) => Number(!!b.priority) - Number(!!a.priority)).slice(0, 5).map((x) => ({ label: x.name, href: `/services/${x.slug}` })) : FOOTER.services;
  const hireLinks = roles?.length ? roles.slice(0, 6).map((x) => ({ label: x.name, href: `/hire-developers/${x.slug}` })) : FOOTER.hire;
  const year = new Date().getFullYear();
  const email = settings?.contact?.email;
  const wa = settings?.whatsapp;
  const meeting = settings?.meeting;
  const social = settings?.social || [];

  return (
    <footer className={`on-dark ${s.footer}`} data-testid="site-footer">
      <div className={`container ${s.top}`}>
        <div className={s.brand}>
          <Logo plate testId="footer-logo" className={s.logo} />
          <p className={s.intro}>
            Software development and developer hiring for startups, growing businesses and agency partners worldwide.
          </p>
          <div className={s.newsletter}>
            <p className={s.colTitle}>Insights by email</p>
            <NewsletterForm />
          </div>
        </div>

        <nav className={s.cols} aria-label="Footer">
          <div>
            <p className={s.colTitle}>Company</p>
            <ul>{FOOTER.company.map((l) => <li key={l.href}><Link href={l.href} className={s.link} data-testid={`footer-company-${l.label.toLowerCase().replace(/\s+/g, '-')}`}>{l.label}</Link></li>)}</ul>
          </div>
          <div>
            <p className={s.colTitle}>Services</p>
            <ul>{svcLinks.map((l) => <li key={l.href}><Link href={l.href} className={s.link} data-testid={`footer-service-${l.href.split('/').pop()}`}>{l.label}</Link></li>)}</ul>
          </div>
          <div>
            <p className={s.colTitle}>Hire Developers</p>
            <ul>{hireLinks.map((l) => <li key={l.href}><Link href={l.href} className={s.link} data-testid={`footer-hire-${l.href.split('/').pop()}`}>{l.label}</Link></li>)}</ul>
          </div>
          <div>
            <p className={s.colTitle}>Get in Touch</p>
            <ul>
              {email && <li><a href={`mailto:${email}`} className={s.link} data-testid="footer-email">{email}</a></li>}
              {wa && (
                <li>
                  <a href={`https://wa.me/${wa.number}?text=${encodeURIComponent(wa.defaultMessage)}`} target="_blank" rel="noopener noreferrer" className={s.link} data-testid="footer-whatsapp">WhatsApp</a>
                </li>
              )}
              <li><Link href="/contact" className={s.link} data-testid="footer-contact">Contact</Link></li>
              {meeting?.projectUrl && (
                <li><a href={meeting.projectUrl} target="_blank" rel="noopener noreferrer" className={s.link} data-testid="footer-meeting">Schedule a Meeting</a></li>
              )}
            </ul>
          </div>
        </nav>
      </div>

      <div className={`container ${s.bottom}`}>
        <p className={s.copy} data-testid="footer-copyright">© {year} Kreyszigg Softbizz. All rights reserved.</p>
        {social.length > 0 && (
          <ul className={s.social} aria-label="Social profiles">
            {social.map((x) => (
              <li key={x.key}>
                <a href={x.url} target="_blank" rel="noopener noreferrer" aria-label={`${x.label} (opens in a new tab)`} className={s.link} data-testid={`footer-social-${x.key}`}>{x.label}</a>
              </li>
            ))}
          </ul>
        )}
        <ul className={s.legal}>
          <li><Link href="/privacy" className={s.link} data-testid="footer-privacy">Privacy</Link></li>
          <li><Link href="/terms" className={s.link} data-testid="footer-terms">Terms</Link></li>
          <li><Link href="/cookies" className={s.link} data-testid="footer-cookie-preferences">Cookie Preferences</Link></li>
        </ul>
        <BackToTop className={s.top2} />
      </div>
    </footer>
  );
}
