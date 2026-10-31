import { SITE_URL } from '@/lib/api';

const API = process.env.API_INTERNAL_URL || 'http://localhost:8001';
const STATIC_ROUTES = [
  '/', '/services', '/hire-developers', '/industries', '/about', '/work',
  '/insights', '/careers', '/partnerships', '/contact', '/privacy', '/terms',
  '/cookies', '/newsletter',
];

async function publicData(path) {
  try {
    const response = await fetch(`${API}/api/v1/public${path}`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const body = await response.json();
    return Array.isArray(body.data) ? body.data : [];
  } catch {
    return [];
  }
}

function entry(path, lastModified) {
  const item = { url: new URL(path, SITE_URL).toString() };
  if (lastModified) {
    const date = new Date(lastModified);
    if (!Number.isNaN(date.getTime())) item.lastModified = date;
  }
  return item;
}

export default async function sitemap() {
  const [services, industries, articles, caseStudies, jobs] = await Promise.all([
    publicData('/services'),
    publicData('/industries'),
    publicData('/articles'),
    publicData('/case-studies'),
    publicData('/jobs'),
  ]);

  const dynamic = [
    ...services.filter((x) => x.slug).map((x) => entry(`/services/${encodeURIComponent(x.slug)}`, x.updatedAt || x.publishedAt)),
    ...industries.filter((x) => x.slug).map((x) => entry(`/industries/${encodeURIComponent(x.slug)}`, x.updatedAt)),
    ...articles.filter((x) => x.slug).map((x) => entry(`/insights/${encodeURIComponent(x.slug)}`, x.updatedAt || x.publishedAt)),
    ...caseStudies.filter((x) => x.slug).map((x) => entry(`/work/${encodeURIComponent(x.slug)}`, x.updatedAt || x.publishedAt)),
    ...jobs.filter((x) => x.slug).map((x) => entry(`/careers/${encodeURIComponent(x.slug)}`, x.updatedAt || x.publishedAt)),
  ];

  return [...STATIC_ROUTES.map((path) => entry(path)), ...dynamic];
}
