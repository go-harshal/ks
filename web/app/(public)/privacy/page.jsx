import LegalPage from '@/components/public/sections/LegalPage';

export const metadata = { title: 'Privacy Policy', description: 'How Kreyszigg Softbizz collects, uses and protects personal information submitted through this website.', alternates: { canonical: '/privacy' } };

const SECTIONS = [
  { id: 'who', h: 'Who we are', body: ['This website is operated by Kreyszigg Softbizz (“we”, “us”). This policy explains what personal information we collect through the website and how we use it.'] },
  { id: 'collect', h: 'Information we collect', body: [
    'Information you give us when you submit a form:',
    ['Project enquiries: name, email, company, project type, services, description, budget and timeline (optional), and any attached file.', 'Developer hiring enquiries: name, email, company, role, number of developers, experience, engagement model, duration, requirements and any attached file.', 'Partnership enquiries: name, email, company, website, partnership type, services and requirements, and any attached file.', 'Contact form: name, email, company, subject and message.', 'Newsletter: email address.'],
    'Technical information: the page you submitted from, the referring page, campaign tags in the link (UTM parameters), and the date and time of your consent.',
  ] },
  { id: 'use', h: 'How we use it', body: [['To reply to your enquiry and discuss your requirement.', 'To prepare proposals and, if you become a client, to deliver our services.', 'To send the newsletter if you subscribed (you can unsubscribe at any time).', 'To keep the website secure and prevent spam and abuse.']] },
  { id: 'basis', h: 'Consent', body: ['Forms ask for your consent before submission. We record the version of this policy you accepted and when. You may withdraw consent at any time by contacting us.'] },
  { id: 'sharing', h: 'Who can see it', body: ['Submissions are stored in our private admin system and are visible only to authorised staff, according to their role. Attachments are stored privately and can be downloaded only by signed-in authorised staff. We use service providers for hosting, file storage and email delivery; they process information only on our instructions. We do not sell personal information.'] },
  { id: 'retention', h: 'How long we keep it', body: ['We keep enquiry records for as long as needed to respond and follow up, and then delete or anonymise them according to our retention schedule. Specific retention periods will be confirmed in the final version of this policy.'] },
  { id: 'rights', h: 'Your rights', body: ['Depending on where you live (for example under India’s Digital Personal Data Protection Act or the EU/UK GDPR), you may have the right to access, correct or delete your information, to withdraw consent and to raise a complaint. Contact us to make a request.'] },
  { id: 'security', h: 'Security', body: ['We use encrypted connections (HTTPS), access controls, private file storage and audit logs to protect information. No system is completely secure, but we work to protect your information and act quickly if an issue occurs.'] },
  { id: 'cookies', h: 'Cookies', body: ['See the Cookie Policy for the cookies this website uses and how to change your preferences.'] },
];

export default function PrivacyPage() {
  return <LegalPage testId="privacy" overline="Legal" title="Privacy Policy" sections={SECTIONS} />;
}
