import { Suspense } from 'react';
import EnquiryForm from '@/components/public/EnquiryForm';
import { getPublic } from '@/lib/api';

export const metadata = {
  title: 'Contact Us — Request a Quote or Hire Developers',
  description: 'Tell Kreyszigg Softbizz about your project, hiring requirement or partnership idea. We reply with clear next steps.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const settings = await getPublic('/settings');
  const wa = settings?.whatsapp;
  const email = settings?.contact?.email;
  return (
    <section className="container" style={{ paddingBlock: 'clamp(40px, 6vw, 96px)' }} data-testid="contact-page">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'clamp(40px, 6vw, 96px)', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 24, maxWidth: 440 }}>
          <p className="overline">Contact</p>
          <h1 style={{ fontSize: 'var(--fs-h1)', letterSpacing: '-0.03em' }}>Tell us what you need.</h1>
          <p className="lead">A short description is enough to start. Optional fields stay optional — we will ask follow-up questions when we reply.</p>
          <ul style={{ display: 'grid', gap: 14, borderTop: '1px solid var(--line)', paddingTop: 24 }}>
            {email && <li><span className="overline">Email</span><br /><a className="text-link" href={`mailto:${email}`} data-testid="contact-email-link">{email}</a></li>}
            {wa && <li><span className="overline">WhatsApp</span><br /><a className="text-link" href={`https://wa.me/${wa.number}?text=${encodeURIComponent(wa.defaultMessage)}`} target="_blank" rel="noopener noreferrer" data-testid="contact-whatsapp-link">Chat on WhatsApp ↗</a></li>}
            {settings?.meeting?.projectUrl && <li><span className="overline">Meeting</span><br /><a className="text-link" href={settings.meeting.projectUrl} target="_blank" rel="noopener noreferrer" data-testid="contact-meeting-link">Schedule a meeting ↗</a></li>}
          </ul>
        </div>
        <Suspense fallback={null}><EnquiryForm /></Suspense>
      </div>
    </section>
  );
}
