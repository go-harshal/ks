import NotFoundBody from '@/components/public/NotFoundBody';

export const metadata = { title: 'Page not found', robots: { index: false } };

export default function PublicNotFound() {
  return <NotFoundBody />;
}
