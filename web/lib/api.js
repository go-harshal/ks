// Server-side data access to the Express API. Public pages degrade gracefully if the API is unreachable.
const API = process.env.API_INTERNAL_URL || 'http://localhost:8001';

export async function getPublic(path, { revalidate = 60 } = {}) {
  try {
    const res = await fetch(`${API}/api/v1/public${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data ?? null;
  } catch {
    return null;
  }
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://softbizz.kreyszigg.com';
export const SHOW_SLOTS = process.env.NEXT_PUBLIC_SHOW_CONTENT_SLOTS === 'true';
