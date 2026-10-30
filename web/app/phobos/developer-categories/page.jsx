'use client';

import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import CatalogManager from '@/components/admin/CatalogManager';

const TABS = [
  { key: 'categories', tab: 'Developer roles', label: 'developer role', plural: 'Developer roles', publicHref: '/hire-developers', subtitle: 'Each role has its own page under Hire Developers.',
    fields: [
      { name: 'name', label: 'Role name', required: true, max: 80, hint: 'e.g. “React Developers”.' },
      { name: 'slug', label: 'Page address (slug)', type: 'slug', required: true },
      { name: 'status', label: 'Visibility', type: 'status' },
      { name: 'summary', label: 'Summary', type: 'textarea', required: true, rows: 3, max: 400 },
      { name: 'skills', label: 'Skills', type: 'lines' },
    ], blank: { skills: [] } },
  { key: 'technologies', tab: 'Technologies', label: 'technology', plural: 'Technologies', subtitle: 'Grouped on the Hire Developers page (Frontend, Backend, Mobile, Database, Cloud, Other…).',
    fields: [
      { name: 'name', label: 'Technology', required: true, max: 60 },
      { name: 'group', label: 'Group', type: 'group', required: true, max: 40 },
      { name: 'note', label: 'Note (optional)', max: 200 },
    ] },
  { key: 'levels', tab: 'Experience levels', label: 'experience level', plural: 'Experience levels', subtitle: 'Guidelines only. They are not a statement of current availability.',
    fields: [
      { name: 'name', label: 'Level name', required: true, max: 60 },
      { name: 'range', label: 'Experience range', required: true, max: 60, hint: 'e.g. “3–5 years”.' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3, max: 500 },
    ] },
  { key: 'models', tab: 'Engagement models', label: 'engagement model', plural: 'Engagement models',
    fields: [
      { name: 'name', label: 'Model name', required: true, max: 80 },
      { name: 'description', label: 'Description', type: 'textarea', required: true, rows: 3, max: 600 },
      { name: 'bestFor', label: 'Best for', max: 300 },
    ] },
  { key: 'hiring-steps', tab: 'Hiring process', label: 'hiring step', plural: 'Hiring process steps', subtitle: 'Shown in this order on the Hire Developers page.',
    fields: [
      { name: 'title', label: 'Step title', required: true, max: 80 },
      { name: 'description', label: 'Description', type: 'textarea', required: true, rows: 3, max: 500 },
    ] },
];

export default function DeveloperCategoriesPage() {
  const [tab, setTab] = useState(TABS[0].key);
  const t = TABS.find((x) => x.key === tab);
  return (
    <AdminShell title="Developer Categories">
      <div className="adm-page-head"><div><h1 className="adm-h1">Developer Categories</h1><p className="adm-sub">Everything shown on the Hire Developers pages: roles, technologies, experience levels, engagement models and the hiring process.</p></div></div>
      <div className="adm-seg" role="tablist" aria-label="Section" style={{ flexWrap: 'wrap' }} data-testid="devcat-tabs">
        {TABS.map((x) => <button key={x.key} type="button" role="tab" aria-selected={tab === x.key} aria-pressed={tab === x.key} onClick={() => setTab(x.key)} data-testid={`devcat-tab-${x.key}`}>{x.tab}</button>)}
      </div>
      <CatalogManager key={t.key} kind={t.key} label={t.label} plural={t.plural} subtitle={t.subtitle} publicHref={t.publicHref} fields={t.fields} blank={t.blank} />
    </AdminShell>
  );
}
