'use client';

import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import ContentManager from '@/components/admin/ContentManager';
import { SERVICE_GROUPS } from '@/lib/nav';

const SERVICES = SERVICE_GROUPS.flatMap((g) => g.items.map((i) => [i.slug, i.name]));
const FIELDS = [
  { name: 'quote', label: 'Testimonial quote', type: 'textarea', required: true, rows: 4 },
  { name: 'name', label: 'Person’s name', type: 'text', required: true },
  { name: 'role', label: 'Role / job title', type: 'text' },
  { name: 'company', label: 'Company', type: 'text' },
  { name: 'allServices', label: 'Show on every service page', type: 'checkbox', full: true },
  { name: 'serviceSlugs', label: 'Or only on these services', type: 'checkboxes', options: SERVICES },
  { name: 'permissionNote', label: 'Permission note (optional)', type: 'textarea', rows: 2, hint: 'e.g. “Approved by email from the client on…”. Visible only in Phobos.' },
  { name: 'permissionDate', label: 'Permission date (optional)', type: 'date' },
  { name: 'title', label: 'Internal label', type: 'text', hint: 'Leave blank to use “Name — Company”.' },
];
const COLUMNS = [
  { key: 'name', label: 'Person' },
  { key: 'serviceSlugs', label: 'Shown on', render: (r) => (r.allServices ? 'All services' : `${(r.serviceSlugs || []).length} service(s)`) },
  { key: 'permissionNote', label: 'Permission', render: (r) => (r.permissionNote ? 'Noted' : '—') },
];

export default function TestimonialsAdminPage() {
  return (
    <AdminShell title="Testimonials">
      <Suspense fallback={null}>
        <ContentManager base="testimonials" label="Testimonial" plural="Testimonials" publicBase="services" fields={FIELDS} columns={COLUMNS}
          intro="Published testimonials appear on the service pages you choose within a minute. Only publish quotes the client has agreed to share." />
      </Suspense>
    </AdminShell>
  );
}
