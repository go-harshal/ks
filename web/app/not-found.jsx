import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import NotFoundBody from '@/components/public/NotFoundBody';
import { getPublic } from '@/lib/api';
import { groupServices } from '@/lib/nav';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default async function NotFound() {
  const [settings, industries, services, catalog] = await Promise.all([getPublic('/settings'), getPublic('/industries'), getPublic('/services'), getPublic('/hiring-catalog')]);
  return (
    <>
      <Header industries={industries || []} serviceGroups={groupServices(services)} />
      <main id="main"><NotFoundBody /></main>
      <Footer settings={settings} services={services} roles={catalog?.categories} />
    </>
  );
}
