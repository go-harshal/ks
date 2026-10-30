import LegalPage from '@/components/public/sections/LegalPage';
import CookiePreferences from '@/components/public/CookiePreferences';

export const metadata = { title: 'Cookie Policy & Preferences', description: 'The cookies used on the Kreyszigg Softbizz website and how to change your preferences.', alternates: { canonical: '/cookies' } };

const SECTIONS = [
  { id: 'what', h: 'What cookies are', body: ['Cookies and similar browser storage are small pieces of data saved on your device. They help the website work and, with your permission, help us understand which pages are useful.'] },
  { id: 'necessary', h: 'Necessary', body: ['Always on. They remember your cookie choice and keep the admin area’s secure sign-in working. They do not identify you for marketing.'] },
  { id: 'analytics', h: 'Analytics (optional)', body: ['Off unless you allow them. When enabled, they measure page visits and form submissions in aggregate. Form contents and personal details are never sent to analytics.'] },
  { id: 'manage', h: 'Changing your choice', body: ['Use the preferences above at any time. You can also delete cookies in your browser settings.'] },
];

export default function CookiesPage() {
  return (
    <LegalPage testId="cookies" overline="Legal" title="Cookie Policy" sections={SECTIONS}>
      <CookiePreferences />
    </LegalPage>
  );
}
