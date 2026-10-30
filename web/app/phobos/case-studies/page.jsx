'use client';

import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import ContentManager from '@/components/admin/ContentManager';

const FIELDS = [
  { name: 'title', label: 'Title', type: 'text', required: true, full: true },
  { name: 'industry', label: 'Industry', type: 'select', optionsUrl: '/api/v1/public/industries' },
  { name: 'technologies', label: 'Technologies', type: 'text', hint: 'Comma-separated, e.g. Flutter, Node.js, AWS' },
  { name: 'clientDisplay', label: 'Client name on the website', type: 'select', required: true, options: [['confidential', 'Confidential — do not name the client'], ['named', 'Show the client name (permission given)']] },
  { name: 'clientName', label: 'Client name', type: 'text' },
  { name: 'summary', label: 'Short overview (shown on cards)', type: 'textarea', required: true, rows: 2 },
  { name: 'challenge', label: 'The challenge', type: 'textarea', rows: 4 },
  { name: 'approach', label: 'Our approach', type: 'textarea', rows: 4 },
  { name: 'solution', label: 'The solution', type: 'textarea', rows: 4 },
  { name: 'results', label: 'Results (optional)', type: 'textarea', rows: 3, hint: 'Only measurable outcomes the client has approved for publication.' },
  { name: 'resultsVerified', label: 'I confirm these results are verified and approved for publication', type: 'checkbox', full: true },
  { name: 'coverImageId', label: 'Cover image', type: 'image', full: true, hint: 'PNG, JPG or WebP, up to 5 MB.' },
  { name: 'slug', label: 'Web address (slug)', type: 'text', hint: 'Leave blank to create one from the title.' },
  { name: 'seoTitle', label: 'Search title (max 70 characters)', type: 'text' },
  { name: 'seoDescription', label: 'Search description (max 170 characters)', type: 'textarea', rows: 2 },
];
const COLUMNS = [{ key: 'industry', label: 'Industry', render: (r) => (r.industry || '—').replace(/-/g, ' ') }];

export default function CaseStudiesPage() {
  return (
    <AdminShell title="Portfolio & Case Studies">
      <Suspense fallback={null}>
        <ContentManager base="case-studies" label="Case study" plural="Case studies" publicBase="work" fields={FIELDS} columns={COLUMNS}
          intro="Published case studies appear on Our Work right away. Team Members write drafts and submit them for review; Admins publish." />
      </Suspense>
    </AdminShell>
  );
}
