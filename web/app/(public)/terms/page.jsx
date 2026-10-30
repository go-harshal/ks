import LegalPage from '@/components/public/sections/LegalPage';

export const metadata = { title: 'Terms of Use', description: 'Terms that apply to your use of the Kreyszigg Softbizz website.', alternates: { canonical: '/terms' } };

const SECTIONS = [
  { id: 'scope', h: 'About these terms', body: ['These terms apply to your use of this website. Services we deliver to clients are covered by separate written agreements, which take priority over these terms.'] },
  { id: 'use', h: 'Using the website', body: [['Use the website lawfully and do not try to disrupt it, access restricted areas or submit harmful files.', 'Information you submit through forms must be accurate and must not infringe anyone else’s rights.', 'Do not submit confidential information you are not authorised to share.']] },
  { id: 'content', h: 'Website content', body: ['Content on this website is provided for general information. Descriptions of services, engagement models and experience levels are not offers or guarantees; scope, availability and pricing are agreed in writing for each engagement.'] },
  { id: 'ip', h: 'Intellectual property', body: ['The website design, text and the Kreyszigg Softbizz name and logo belong to us or our licensors. You may not reuse them without permission.'] },
  { id: 'links', h: 'Third-party links', body: ['Links to other websites (for example WhatsApp or meeting-booking tools) are provided for convenience. Their own terms and privacy policies apply.'] },
  { id: 'liability', h: 'Liability', body: ['To the extent permitted by law, we are not liable for losses arising from use of the website or reliance on its general content. Nothing in these terms limits liability that cannot legally be limited.'] },
  { id: 'changes', h: 'Changes and governing law', body: ['We may update these terms. The governing law and jurisdiction will be stated in the final, legally reviewed version.'] },
];

export default function TermsPage() {
  return <LegalPage testId="terms" overline="Legal" title="Terms of Use" sections={SECTIONS} />;
}
