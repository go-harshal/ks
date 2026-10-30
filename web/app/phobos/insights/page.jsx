'use client';

import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import ContentManager from '@/components/admin/ContentManager';

const FIELDS = [
  { name: 'title', label: 'Title', type: 'text', required: true, full: true },
  { name: 'category', label: 'Category', type: 'select', options: ['Software development', 'Mobile apps', 'Web applications', 'UI/UX design', 'Cloud & DevOps', 'Hiring developers', 'Product'] },
  { name: 'authorProfileId', label: 'Author (published team profile)', type: 'select', optionsUrl: '/api/v1/public/team', optionKey: 'id', hint: 'The byline links to this person on the About page.' },
  { name: 'excerpt', label: 'Excerpt (shown on the Insights list)', type: 'textarea', required: true, rows: 2 },
  { name: 'body', label: 'Article', type: 'richtext' },
  { name: 'tags', label: 'Tags', type: 'text', hint: 'Comma-separated' },
  { name: 'featured', label: 'Feature this article at the top of Insights', type: 'checkbox' },
  { name: 'coverImageId', label: 'Cover image', type: 'image', full: true, hint: 'PNG, JPG or WebP, up to 5 MB.' },
  { name: 'slug', label: 'Web address (slug)', type: 'text', hint: 'Leave blank to create one from the title.' },
  { name: 'seoTitle', label: 'Search title (max 70 characters)', type: 'text' },
  { name: 'seoDescription', label: 'Search description (max 170 characters)', type: 'textarea', rows: 2 },
];
const COLUMNS = [
  { key: 'category', label: 'Category' },
  { key: 'readingMinutes', label: 'Read', render: (r) => (r.readingMinutes ? `${r.readingMinutes} min` : '—') },
];

export default function InsightsAdminPage() {
  return (
    <AdminShell title="Blog / Insights">
      <Suspense fallback={null}>
        <ContentManager base="articles" label="Article" plural="Insights articles" publicBase="insights" fields={FIELDS} columns={COLUMNS}
          intro="Published articles appear on Insights straight away. Team Members write drafts and submit them for review; Admins publish." />
      </Suspense>
    </AdminShell>
  );
}
