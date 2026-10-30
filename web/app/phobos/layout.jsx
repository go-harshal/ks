import './admin.css';

export const metadata = {
  title: { default: 'Phobos', template: '%s · Phobos' },
  robots: { index: false, follow: false, nocache: true },
};

// Applies saved theme (or OS preference on first visit) before paint, avoiding a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('ks-admin-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-admin-theme',t)}catch(e){document.documentElement.setAttribute('data-admin-theme','light')}})();`;

export default function PhobosLayout({ children }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  );
}
