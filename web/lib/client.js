'use client';
// Browser-side API helper: same-origin /api, cookies included, CSRF header from the readable ks_csrf cookie.
export class ApiError extends Error {
  constructor(status, body) { super(body?.error?.message || `Request failed (${status})`); this.status = status; this.body = body; }
}
const csrf = () => (typeof document === 'undefined' ? '' : decodeURIComponent((document.cookie.match(/(?:^|; )ks_csrf=([^;]+)/) || [])[1] || ''));

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (method !== 'GET') headers['x-csrf-token'] = csrf();
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`/api/v1${path}`, { method, headers, credentials: 'same-origin', body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname.startsWith('/phobos') && !/\/phobos\/(login|invite|reset|forgot)/.test(window.location.pathname)) {
      window.location.href = `/phobos/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    throw new ApiError(res.status, data);
  }
  return data;
}
