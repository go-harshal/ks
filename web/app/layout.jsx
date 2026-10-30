import '@fontsource/ubuntu/400.css';
import '@fontsource/ubuntu/400-italic.css';
import '@fontsource/ubuntu/500.css';
import '@fontsource/ubuntu/700.css';
import '@/styles/globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://softbizz.kreyszigg.com';
const noindex = process.env.NEXT_PUBLIC_NOINDEX === 'true';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kreyszigg Softbizz — Software Development & Developer Hiring',
    template: '%s | Kreyszigg Softbizz',
  },
  description:
    'Kreyszigg Softbizz builds mobile apps, web applications and custom software, and provides dedicated developers and teams on demand.',
  icons: { icon: '/brand/logo-mark.png', apple: '/brand/logo-mark.png' },
  robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: { siteName: 'Kreyszigg Softbizz', type: 'website', locale: 'en' },
};

export const viewport = { themeColor: '#17232F' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
