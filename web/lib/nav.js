// Static navigation structure. Service names/slugs mirror the Services module seed; the mega menu
// is fed from the API at runtime when available and falls back to this list.
export const SERVICE_GROUPS = [
  {
    title: 'Product Engineering',
    items: [
      { name: 'Mobile App Development', slug: 'mobile-app-development' },
      { name: 'Web Application Development', slug: 'web-application-development' },
      { name: 'Custom Software Development', slug: 'custom-software-development' },
      { name: 'SaaS Product Development', slug: 'saas-product-development' },
    ],
  },
  {
    title: 'Design & Commerce',
    items: [
      { name: 'Website Design & Development', slug: 'website-design-development' },
      { name: 'UI/UX Design', slug: 'ui-ux-design' },
      { name: 'E-commerce Development', slug: 'ecommerce-development' },
    ],
  },
  {
    title: 'Platform & Support',
    items: [
      { name: 'Cloud Solutions & DevOps', slug: 'cloud-devops' },
      { name: 'API Development & Integration', slug: 'api-development-integration' },
      { name: 'Software Maintenance & Support', slug: 'software-maintenance-support' },
      { name: 'IT Consulting', slug: 'it-consulting' },
    ],
  },
];

/** Group live services (already sorted by admin order) for the menu and lists; falls back to the static list. */
export function groupServices(services) {
  if (!services?.length) return SERVICE_GROUPS;
  const map = new Map();
  for (const sv of services) { if (!map.has(sv.group)) map.set(sv.group, []); map.get(sv.group).push({ name: sv.name, slug: sv.slug }); }
  return [...map].map(([title, items]) => ({ title, items }));
}

export const PRIMARY_NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services', mega: true },
  { label: 'Our Work', href: '/work' },
  { label: 'Hire Developers', href: '/hire-developers' },
  { label: 'Insights', href: '/insights' },
  { label: 'Careers', href: '/careers' },
];

export const PROJECT_CTA = { label: "Let's Discuss Your Project", href: '/contact?type=project' };
export const HIRING_CTA = { label: 'Hire Developers', href: '/hire-developers' };

export const FOOTER = {
  company: [
    { label: 'About', href: '/about' },
    { label: 'Our Work', href: '/work' },
    { label: 'Industries', href: '/industries' },
    { label: 'Partnerships', href: '/partnerships' },
    { label: 'Careers', href: '/careers' },
    { label: 'Insights', href: '/insights' },
  ],
  services: [
    { label: 'Mobile App Development', href: '/services/mobile-app-development' },
    { label: 'Web Application Development', href: '/services/web-application-development' },
    { label: 'Custom Software', href: '/services/custom-software-development' },
    { label: 'UI/UX Design', href: '/services/ui-ux-design' },
    { label: 'E-commerce', href: '/services/ecommerce-development' },
  ],
  hire: [
    { label: 'Frontend Developers', href: '/hire-developers/frontend' },
    { label: 'Backend Developers', href: '/hire-developers/backend' },
    { label: 'Full-Stack Developers', href: '/hire-developers/full-stack' },
    { label: 'Mobile Developers', href: '/hire-developers/mobile' },
    { label: 'DevOps Engineers', href: '/hire-developers/devops' },
    { label: 'QA Engineers', href: '/hire-developers/qa' },
  ],
};

export function slugToKey(s) {
  return s.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}
