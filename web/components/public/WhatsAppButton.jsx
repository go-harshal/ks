'use client';

import { usePathname } from 'next/navigation';
import s from './WhatsAppButton.module.css';

// Context-aware prefilled messages (PRD §7.6). Rendered only when a number is configured in Website Settings.
function messageFor(pathname, fallback) {
  if (pathname.startsWith('/hire-developers')) return 'Hello Kreyszigg Softbizz, I would like to hire developers.';
  if (pathname.startsWith('/services/')) {
    const name = pathname.split('/')[2].replace(/-/g, ' ');
    return `Hello Kreyszigg Softbizz, I would like to discuss ${name}.`;
  }
  if (pathname.startsWith('/partnerships')) return 'Hello Kreyszigg Softbizz, I would like to discuss a partnership.';
  if (pathname.startsWith('/careers')) return 'Hello Kreyszigg Softbizz, I have a question about careers.';
  return fallback;
}

export default function WhatsAppButton({ config }) {
  const pathname = usePathname();
  if (!config?.number) return null;
  const href = `https://wa.me/${config.number}?text=${encodeURIComponent(messageFor(pathname, config.defaultMessage))}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={s.fab} aria-label="Chat with us on WhatsApp (opens in a new tab)" data-testid="whatsapp-fab">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" /></svg>
      <span className={s.label}>WhatsApp</span>
    </a>
  );
}
