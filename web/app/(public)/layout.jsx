import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import WhatsAppButton from '@/components/public/WhatsAppButton';
import CookieBanner from '@/components/public/CookieBanner';
import Analytics from '@/components/public/Analytics';
import RevealObserver from '@/components/public/RevealObserver';
import { getPublic } from '@/lib/api';
import { groupServices } from '@/lib/nav';

export default async function PublicLayout({ children }) {
  const [settings, industries, services, catalog] = await Promise.all([getPublic('/settings'), getPublic('/industries'), getPublic('/services'), getPublic('/hiring-catalog')]);
  return (
    <>
      <Header industries={industries || []} serviceGroups={groupServices(services)} />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer settings={settings} services={services} roles={catalog?.categories} />
      <WhatsAppButton config={settings?.whatsapp} />
      <CookieBanner />
      <Analytics />
      <RevealObserver />
    </>
  );
}
