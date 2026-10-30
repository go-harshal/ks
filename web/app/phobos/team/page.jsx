'use client';

import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import ContentManager from '@/components/admin/ContentManager';

const FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', required: true },
  { name: 'title', label: 'Role / job title', type: 'text', required: true },
  { name: 'bio', label: 'Short bio', type: 'textarea', rows: 4 },
  { name: 'photoId', label: 'Photo', type: 'image', full: true, hint: 'Square PNG, JPG or WebP works best, up to 5 MB.' },
  { name: 'linkedin', label: 'LinkedIn URL', type: 'text' },
  { name: 'order', label: 'Display order (lower shows first)', type: 'number' },
  { name: 'isFounder', label: 'Founder — show in the founders row first', type: 'checkbox' },
  { name: 'slug', label: 'Anchor (slug)', type: 'text', hint: 'Leave blank to create one from the name.' },
];
const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'isFounder', label: 'Founder', render: (r) => (r.isFounder ? 'Yes' : '—') },
  { key: 'order', label: 'Order', render: (r) => String(r.order ?? 100) },
];

export default function TeamAdminPage() {
  return (
    <AdminShell title="Team & Founder Profiles">
      <Suspense fallback={null}>
        <ContentManager base="team" label="Profile" plural="Team & founder profiles" publicBase="about#team" fields={FIELDS} columns={COLUMNS}
          intro="Published profiles appear in Our team on the About page and as article bylines. Archive a profile to hide it." />
      </Suspense>
    </AdminShell>
  );
}
