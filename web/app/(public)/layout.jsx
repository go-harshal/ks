import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import WhatsAppButton from '@/components/public/WhatsAppButton';
import CookieBanner from '@/components/public/CookieBanner';
import Analytics from '@/components/public/Analytics';
import RevealObserver from '@/components/public/RevealObserver';
import { getPublic } from '@/lib/api';

export default async function PublicLayout({ children }) {
  const [settings, industries] = await Promise.all([getPublic('/settings'), getPublic('/industries')]);
  return (
    <>
      <Header industries={industries || []} />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton config={settings?.whatsapp} />
      <CookieBanner />
      <Analytics />
      <RevealObserver />
    </>
  );
}
