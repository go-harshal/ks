'use client';

import AdminShell from '@/components/admin/AdminShell';
import CatalogManager from '@/components/admin/CatalogManager';

const FIELDS = [
  { name: 'name', label: 'Service name', required: true, max: 120 },
  { name: 'slug', label: 'Page address (slug)', type: 'slug', required: true },
  { name: 'group', label: 'Menu group', type: 'group', required: true, max: 60, hint: 'Services with the same group sit together in the Services menu. Pick an existing group or type a new one.' },
  { name: 'status', label: 'Visibility', type: 'status' },
  { name: 'priority', label: 'Priority service (listed first in the footer)', type: 'checkbox' },
  { name: 'summary', label: 'Summary', type: 'textarea', required: true, rows: 2, max: 400, hint: 'Shown on the Services list, home page and menu cards.' },
  { name: 'intro', label: 'Intro paragraph', type: 'textarea', rows: 4, max: 1500, hint: 'Shown at the top of the service page. Falls back to the summary.' },
  { name: 'heroImageId', label: 'Hero image', type: 'image', hint: 'Wide landscape image (PNG, JPG or WebP, up to 5 MB).' },
  { name: 'capabilities', label: 'Capabilities', type: 'pairs' },
  { name: 'technologies', label: 'Typical technologies', type: 'lines' },
  { name: 'seo.title', label: 'Search title', max: 70, hint: 'Up to 70 characters. Leave blank to use the service name.' },
  { name: 'seo.description', label: 'Search description', type: 'textarea', rows: 2, max: 170, hint: 'Up to 170 characters. Leave blank to use the summary.' },
];

const INDUSTRY_FIELDS = [
  { name: 'name', label: 'Industry name', required: true, max: 80, hint: 'e.g. “Healthcare & HealthTech”.' },
  { name: 'slug', label: 'Page address (slug)', type: 'slug', required: true },
  { name: 'status', label: 'Visibility', type: 'status' },
  { name: 'intro', label: 'Intro', type: 'textarea', required: true, rows: 3, max: 600, hint: 'Shown on the Industries list and at the top of the industry page.' },
  { name: 'problems', label: 'Common problems', type: 'lines' },
  { name: 'solutions', label: 'Potential solutions', type: 'lines' },
  { name: 'serviceSlugs', label: 'Related services', type: 'checkboxes', optionsFrom: 'services' },
];

export default function ServicesAdminPage() {
  return (
    <AdminShell title="Services Management">
      <div className="adm-page-head"><div><h1 className="adm-h1">Services Management</h1><p className="adm-sub">Edit, add, hide, delete and reorder the services shown in the menu, on the Services page and on each service page.</p></div></div>
      <CatalogManager kind="services" label="service" plural="Services" title="Services" publicHref="/services" fields={FIELDS}
        subtitle="The order here is the order on the website. Click a service to edit it." blank={{ capabilities: [], technologies: [], seo: { title: '', description: '' } }} />
      <div style={{ height: 24 }} />
      <CatalogManager kind="industries" label="industry" plural="Industries" title="Industries" publicHref="/industries" fields={INDUSTRY_FIELDS}
        subtitle="Industry pages under /industries. The first six appear in the Services menu." blank={{ problems: [], solutions: [], serviceSlugs: [] }} />
    </AdminShell>
  );
}
