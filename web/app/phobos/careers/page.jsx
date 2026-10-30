'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import ContentManager from '@/components/admin/ContentManager';

const FIELDS = [
  { name: 'title', label: 'Job title', type: 'text', required: true, full: true },
  { name: 'department', label: 'Department', type: 'text' },
  { name: 'location', label: 'Location', type: 'text', required: true },
  { name: 'workMode', label: 'Work mode', type: 'select', required: true, options: ['On-site', 'Hybrid', 'Remote'] },
  { name: 'employmentType', label: 'Employment type', type: 'select', required: true, options: ['Full-time', 'Part-time', 'Contract', 'Internship'] },
  { name: 'experience', label: 'Experience required', type: 'text', hint: 'e.g. 3–5 years' },
  { name: 'closesAt', label: 'Applications close on (optional)', type: 'date' },
  { name: 'summary', label: 'Role summary', type: 'textarea', required: true, rows: 3 },
  { name: 'responsibilities', label: 'Responsibilities', type: 'textarea', rows: 5, hint: 'One per line.' },
  { name: 'requirements', label: 'Requirements', type: 'textarea', rows: 5, hint: 'One per line.' },
  { name: 'niceToHave', label: 'Nice to have', type: 'textarea', rows: 3, hint: 'One per line.' },
  { name: 'slug', label: 'Web address (slug)', type: 'text', hint: 'Leave blank to create one from the title.' },
];
const COLUMNS = [
  { key: 'location', label: 'Location' },
  { key: 'employmentType', label: 'Type' },
  { key: 'closesAt', label: 'Closes', render: (r) => (r.closesAt ? new Date(r.closesAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Open') },
];

export default function CareersAdminPage() {
  return (
    <AdminShell title="Careers & Applications">
      <nav className="adm-subnav" aria-label="Careers sections">
        <Link href="/phobos/careers" aria-current="page" data-testid="careers-subnav-jobs">Job posts</Link>
        <Link href="/phobos/careers/applications" data-testid="careers-subnav-applications">Applications</Link>
      </nav>
      <Suspense fallback={null}>
        <ContentManager base="jobs" label="Job post" plural="Job posts" publicBase="careers" fields={FIELDS} columns={COLUMNS}
          intro="Published jobs appear on the Careers page with an application form. Closed jobs stop accepting applications automatically." />
      </Suspense>
    </AdminShell>
  );
}
