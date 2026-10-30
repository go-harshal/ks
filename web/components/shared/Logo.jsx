import Image from 'next/image';
import Link from 'next/link';

/** Supplied brand assets, rendered unaltered. `plate` places the logo on Warm Ivory for dark surfaces. */
export default function Logo({ variant = 'primary', plate = false, priority = false, className = '', testId = 'site-logo' }) {
  const isMark = variant === 'mark';
  const img = (
    <Image
      src={isMark ? '/brand/logo-mark.png' : '/brand/logo-primary.png'}
      alt="Kreyszigg Softbizz"
      width={isMark ? 901 : 401}
      height={isMark ? 901 : 201}
      priority={priority}
      sizes={isMark ? '48px' : '180px'}
      style={{ height: '100%', width: 'auto' }}
    />
  );
  return (
    <Link
      href="/"
      className={className}
      data-testid={testId}
      aria-label="Kreyszigg Softbizz — home"
      style={plate ? { background: '#F5F2EB', padding: '10px 14px', display: 'inline-flex', borderRadius: 2 } : { display: 'inline-flex' }}
    >
      {img}
    </Link>
  );
}
